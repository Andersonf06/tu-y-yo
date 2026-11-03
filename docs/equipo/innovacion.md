# Innovación — TU Y YO

Especificación funcional del agente de innovación. Alcance: funciones, flujos, motivación y gamificación. No cubre diseño visual ni temas legales.

Revisé `www/app.js` (1.883 líneas) y `www/voz.js` completos. Todo lo que se propone aquí se calcula con datos que la app ya guarda, o con campos nuevos pequeños indicados como **NUEVO**. No hace falta ningún servidor pago: todo corre en el celular y en el Firestore actual.

---

## 1. Hallazgos funcionales de toda la app (priorizados)

### P1 — Arreglar antes de publicar

| # | Hallazgo | Dónde | Cambio exacto |
|---|---|---|---|
| H1 | **Un abono parcial marca el gasto fijo como pagado.** `estadoFijo()` toma el primer gasto con `fijoId` del mes (`S.gastos.find`). Si pagan $100.000 de un arriendo de $1.200.000, la fila sale "Pagado". | `estadoFijo` (l. 850) | Usar el modelo de abonos de la sección 4: `pagado = suma`, `pendiente = total − pagado` y estado `pagado` solo cuando `pagado ≥ total`. |
| H2 | **Un gasto fijo pendiente no se puede editar ni borrar desde su fila.** El botón "Editar" solo aparece después de pagarlo. Antes, la fila solo ofrece "Pagado". Eliminar está escondido dentro del formulario de edición. | `filaFijo` (l. 870) | Cada fila siempre lleva: **Pagar** (total o parcial), **⋯** (Editar, Ver pagos del mes, Saltar este mes, Eliminar) y un **Deshacer** de 6 s al eliminar. Ver sección 4. |
| H3 | **Cualquiera puede marcar "Ya lo hablamos", incluido quien lo pidió.** El gasto guarda `revisar: true`, pero no quién lo marcó. | `case 'hablado'` (l. 1570), formulario de gasto (l. 1712), tarjeta de Inicio (l. 554) | Guardar `revisarPor`. Solo la otra persona ve el botón. Ver sección 5. |
| H4 | **Gastar lo ahorrado en una meta cuenta doble.** Ahorran $3.000.000 para el viaje (aportes) y luego registran el viaje como gasto. Ese mes el gasto se dispara, el "libre" queda negativo y la meta sigue mostrando $3.000.000 ahorrados. | `calcular`, `estadoMeta`, formulario de gasto | **NUEVO** campo de gasto `metaId`, con la casilla "Lo pagamos con el ahorro de una meta" y un selector de meta. Ver sección 3.4. |
| H5 | **"Les quedan libres" no descuenta los gastos fijos que faltan por pagar.** Solo descuenta la meta de ahorro y las cuotas de deudas pendientes. Al principio del mes el libre se ve inflado, porque el arriendo todavía no se ha pagado. | `calcular` (l. 337–338) | Agregar `fijosPend = Σ pendiente de los fijos activos del mes actual` y restarlo en `libreReal`, igual que `cuotasPend`. La nota del hero pasa a decir "Ya descontamos la meta de ahorro, las cuotas y los fijos que faltan". |
| H6 | **Borrar una meta borra también todos sus aportes.** Eso cambia el ahorro de meses pasados (el hero, la cita de dinero, la gráfica de 6 meses) y borraría logros. | `case 'borrar'` (l. 1618) | Cambiar "Eliminar meta" por **"Archivar meta"** (**NUEVO** campo `estado: 'activa'\|'cumplida'\|'archivada'`). Las metas archivadas salen de la lista pero su historial se conserva. "Eliminar definitivamente" queda solo para metas sin aportes. |

### P2 — Alto valor

| # | Hallazgo | Cambio exacto |
|---|---|---|
| H7 | Los aportes a metas no se pueden editar ni borrar uno por uno. Si alguien se equivoca de valor, la única salida es borrar la meta entera. | En la tarjeta de la meta, agregar **"Ver aportes"** con la lista de aportes del más nuevo al más viejo (quién, cuánto, fecha). Tocar un aporte abre su edición con Eliminar y Deshacer. Reusar `pedirBorrar` con `col=aportes`. |
| H8 | Para editar o borrar un gasto hay que tocar la fila sin ninguna pista, y el borrado no tiene deshacer. | Ver sección 6. |
| H9 | Si suben el ingreso en Ajustes, cambian todos los meses pasados, porque `calcular()` usa siempre `cfg.ingresos` actual. | **NUEVO** `cfg.ingresosHist = { 'AAAA-MM': {a, b} }`. Al guardar Ajustes con otro ingreso, se guarda una foto en el mes actual. `calcular(mes)` usa la foto más reciente que sea ≤ `mes`; si no hay ninguna, usa `cfg.ingresos`. |
| H10 | Un gasto en la categoría "Deudas" sin `deudaId` (por ejemplo, dictado por voz sin nombrar la deuda) no baja el saldo de ninguna deuda y no avisa. | Si `categoria === 'deudas'`, hay deudas activas y no se eligió ninguna, mostrar el selector resaltado con el aviso "Elige qué deuda pagaste para descontarla". Si solo hay una deuda activa, preseleccionarla. |
| H11 | Pagar con voz una deuda o un gasto fijo crea un gasto suelto. "Pagué la luz", con la luz registrada como gasto fijo, no queda como pago del fijo. | En `entenderFrase`: si el texto contiene el nombre de un fijo activo (como ya se hace con las categorías propias), poner `fijoId` y el formulario en modo pago de fijo. |
| H12 | La plata personal cuenta los gastos fijos personales (por ejemplo, el gimnasio de uno). Ese tope se agota con gastos que no son "sin dar explicaciones". | `plataPersonal()`: excluir los gastos con `fijoId`. Dejarlo como opción en Ajustes: "Incluir mis gastos fijos personales en mi plata personal" (apagado por defecto). |

### P3 — Pulido

- **H13.** La cita de dinero solo se puede abrir para el mes que se está viendo. Agregar "Citas anteriores" (lista de `S.citas` con fecha y acuerdos), para recordar lo que acordaron.
- **H14.** La exportación CSV no incluye deudas, pagos de deudas con interés y capital, ni gastos fijos. Agregar columnas `Deuda`, `Interés`, `Capital` y `Gasto fijo`.
- **H15.** El presupuesto por categoría es de "usar o perder". Opción por categoría **"El sobrante pasa al mes siguiente"** (como YNAB): `tope efectivo = tope + máx(0, tope_mes_anterior − gastado_mes_anterior)`.
- **H16.** No hay aviso cuando una categoría llega al 80% o al 100% de su tope. Mostrar un toast al guardar el gasto que cruza el umbral ("Comida fuera llegó al 82% de su tope") y una notificación local en el celular de quien lo registró.
- **H17.** La voz entiende un solo gasto por frase. "30 mil de taxi y 20 mil de almuerzo" queda como un solo gasto de $50.000. Si hay dos o más montos unidos por "y", ofrecer "Encontré 2 gastos" con una tarjeta por cada uno.

---

## 2. Logros y premios

### 2.1 Principios (de la investigación)

- **Funciona:** en un estudio de City, University of London con 331 personas durante 4 semanas, quienes usaron una app de ahorro con insignias, tablas de posiciones y barras de progreso ahorraron cerca de 20% más frente a su meta que quienes usaron la versión sin juego. El estudio no separa qué elemento produjo el efecto ni mide resultados a largo plazo.
- **Para parejas, en equipo y no en competencia:** Qapital (*Dream Team*) y Honeydue funcionan con metas compartidas. Aquí no hay tabla de posiciones entre los dos. Todos los logros de pareja suman a un **nivel común**, y los individuales son reconocimientos, nunca un ranking.
- **Rachas con perdón:** una racha que se pierde por un solo día desmotiva. Cada racha diaria incluye **1 comodín por semana**, que se gasta solo.
- **Premios simbólicos:** insignia, nivel y celebración. Nada de dinero real ni sorteos. Los sorteos al estilo Long Game requieren un permiso de juego de azar y no aplican aquí.
- **Ahorro protegido:** las metas son "bolsillos" mentales, como el Colchón de Nequi o las Cajitas de Nu. La app solo lleva la cuenta; no mueve plata real.

### 2.2 Dónde se guardan

**NUEVO** `cfg.logros = { [idLogro]: { en: timestamp, por: 'a'|'b'|'ambos' } }`, en el documento del hogar. No requiere cambiar las reglas de Firestore.

- **Cálculo:** la función `evaluarLogros()` corre en cada `pintar()` solo si cambió la cantidad de documentos. Compara los logros cumplidos con `cfg.logros` y escribe únicamente los nuevos, en **una sola** actualización de `cfg` y sin reescribir los anteriores.
- **Celebración:** cada logro nuevo se celebra una vez en cada celular. Se guarda `localStorage tuyyo:logrosVistos` para no repetir la celebración.

### 2.3 Lista de logros (15)

`mesCerrado` = un mes anterior al actual. "Racha de N días" = N días seguidos con al menos un movimiento (gasto, ingreso extra o aporte con `fecha` ese día), con un comodín por semana.

| id | Nombre | Descripción | Condición exacta | Nivel | Tipo | XP |
|---|---|---|---|---|---|---|
| `primer_paso` | Primer paso | Registraron su primer gasto | `S.gastos.length ≥ 1` | Bronce | Pareja | 10 |
| `equipo` | Somos equipo | Se vincularon los dos | `S.modo === 'nube' && S.members.length === 2` | Bronce | Pareja | 10 |
| `bitacora_7` | Una semana al día | Registraron algo 7 días seguidos | racha diaria ≥ 7 | Bronce | Pareja | 10 |
| `bitacora_30` | Mes impecable | 30 días seguidos registrando | racha diaria ≥ 30 | Plata | Pareja | 25 |
| `factura_magica` | Ojo de águila | Escanearon 5 facturas | gastos con `origen === 'factura'` ≥ 5 (**NUEVO** `origen`: `'manual'\|'voz'\|'factura'\|'fijo'`) | Bronce | Individual (quien más escaneó) | 10 |
| `a_viva_voz` | A viva voz | 10 gastos dictados | gastos con `origen === 'voz'` ≥ 10 | Bronce | Individual | 10 |
| `cuentas_claras` | Cuentas claras | Saldaron cuentas entre los dos | existe un gasto con `categoria === 'ajuste'` | Bronce | Pareja | 10 |
| `cita_1` | Primera cita de dinero | Hicieron su primera cita de dinero | `S.citas.some(c => c.hecho)` | Bronce | Pareja | 10 |
| `cita_3` | Constantes | 3 citas de dinero seguidas | `rachaCitas() ≥ 3` | Plata | Pareja | 25 |
| `cita_6` | Socios de vida | 6 citas de dinero seguidas | `rachaCitas() ≥ 6` | Oro | Pareja | 50 |
| `en_presupuesto` | Dentro del plan | Cerraron un mes sin pasarse en ninguna categoría con tope | hay un `mesCerrado` con ≥ 3 categorías con tope y `porCat[k] ≤ tope[k]` en todas | Plata | Pareja | 25 |
| `ahorradores` | Ahorradores | Cumplieron la meta de ahorro de un mes | hay un `mesCerrado` con `metaAhorro > 0 && ahorro ≥ metaAhorro` | Plata | Pareja | 25 |
| `fijos_al_dia` | Nada pendiente | Pagaron completos todos los gastos fijos de un mes | hay un `mesCerrado` con ≥ 2 fijos activos y `estadoFijo(f, m).estado === 'pagado'` en todos (excepto los saltados) | Plata | Pareja | 25 |
| `meta_cumplida` | Meta cumplida | Llegaron al 100% de una meta | alguna meta con `ahorrado ≥ objetivo > 0` | Oro | Pareja | 50 |
| `adios_deuda` | Libres de esta deuda | Terminaron de pagar una deuda | alguna deuda con `saldoInicial > 0 && estadoDeuda(d).saldo === 0` | Oro | Pareja | 50 |

Los hitos de cada meta (25/50/75%) **no** son logros de la lista: se celebran dentro de la meta (sección 3) y suman 5 XP cada uno, guardados como `cfg.logros['meta_<id>_<hito>']`.

`abono_extra` ("Le ganamos a los intereses", un pago con `abono === true`, Bronce, 10 XP) queda como logro 16 si hay espacio.

### 2.4 Niveles de pareja (XP)

- **XP total** = Σ XP de los logros desbloqueados + 5 por cada hito de meta + 10 por cada cita de dinero hecha + 1 por cada día con movimiento en los últimos 90 días (tope de 90).
- **Nivel:** `n = máx k tal que 25·k·(k+1) ≤ XP`, más 1. Umbrales: N2 = 50 XP, N3 = 150, N4 = 300, N5 = 500, N6 = 750.
- **Nombres:** 1 Recién organizados · 2 Buen equipo · 3 Ahorradores · 4 Estrategas · 5 Imparables · 6 o más Libres financieramente.
- **Presentación:** barra de progreso al siguiente nivel en la pantalla Logros y una línea en el hero de Planes: "Nivel 3 · Ahorradores · faltan 40 XP".

### 2.5 Rachas visibles

1. **Registro diario** (pareja): días seguidos con movimiento, con 1 comodín por semana.
2. **Citas de dinero** (ya existe `rachaCitas()`): meses seguidos.
3. **Meses dentro del plan:** meses cerrados seguidos que cumplen la condición de `en_presupuesto`.

### 2.6 Retos de pareja (opcionales, mensuales)

Se activan desde Planes → "Elegir un reto del mes", uno a la vez. **NUEVO** `cfg.reto = { id, mes, inicio: 'AAAA-MM-DD' }`. Al terminar, el reto da +20 XP y la insignia `reto_<id>` (Bronce).

| id | Reto | Cómo se mide |
|---|---|---|
| `sin_domicilios` | Una semana sin domicilios | 7 días desde `inicio` sin gastos de categoría `comida` cuya descripción contenga `domicilio\|rappi\|ifood\|didi food`, y con ese gasto total = 0 |
| `cocina_casa` | Cocinemos en casa | En el mes, `comida` ≤ 50% de lo gastado en `comida` el mes anterior |
| `diversion_tope` | Diversión con tope | En el mes, `diversion` ≤ su tope (el tope debe existir) |
| `ahorro_hormiga` | Ahorro hormiga | ≥ 4 aportes de cualquier valor en el mes, en semanas distintas |
| `cero_impulso` | Cero compras impulsivas | Ningún gasto marcado "para hablar juntos" en el mes (se mide al cerrar el mes) |

---

## 3. Metas

### 3.1 Los aportes NO son gastos (confirmado)

En `calcular()`:
- `gastado = sum(g)`, donde `g` solo contiene gastos.
- `ahorro = sum(aportes del mes)` se calcula aparte.
- `libre = ingresos − gastado − ahorro`.

Los aportes no entran en `gastado`, ni en `porCat`, ni en `pagadoPor`, ni en el balance de "cuentas claras". **Esto está bien y se mantiene.**

**Cómo mostrarlos aparte:**
- **Hero de Inicio:** "Ahorrado" sigue como dato independiente de "Gastado".
- **Pestaña Gastos:** debajo de la lista, una sección propia **"Ahorro del mes"** con los aportes (quién, meta, valor), separada de los gastos y con su propio total. Nunca mezclados en la misma lista.
- **Donut "¿A dónde va cada peso?":** el segmento "Ahorro" se mantiene con su color propio y la leyenda "no es gasto".
- **Cita de dinero:** "Ahorramos" va en su propia fila (ya está así).

### 3.2 Hitos 25/50/75/100%

- `pct = ahorrado / objetivo`, con `ahorrado = Σ aportes − Σ usado` (sección 3.4).
- Al cruzar un hito por primera vez, se escribe `cfg.logros['meta_<id>_<25|50|75|100>']`, se celebra y se avisa a la pareja: "¡Van en el 50% de Viaje a Cartagena!".
- El anillo de la meta muestra marcas en 25, 50 y 75.

### 3.3 Aporte mensual sugerido

- **Con fecha límite:**
  - `mesesRest = máx(1, mesesEntre(mesActual, mesLímite) + 1)`
  - `sugerido = ceil(falta / mesesRest / 1000) · 1000`
- **Sin fecha:** `sugerido = redondear a mil(máx(0, libreReal) · 0,3)`, con mínimo $20.000.
- **Ritmo:** `esperado = objetivo · (mesesTranscurridos / mesesTotales)`.
  - Si `ahorrado < esperado · 0,9`, mostrar "Van atrasados: aporten **$X** este mes para ponerse al día".
  - Si van por encima, mostrar "Van adelantados 🎯" con un ícono, no emoji.
- **División entre los dos:** "A cada uno le toca: Andrés $X · Camila $Y", según `ratioA()`.
- **Aporte rápido:** el botón "Aportar" se abre con el monto sugerido ya escrito.

### 3.4 Usar el ahorro de una meta (corrige H4)

- **Formulario de gasto:** casilla "Lo pagamos con el ahorro de una meta" y selector de metas con saldo > 0. El gasto se guarda con **NUEVO** `metaId`.
- **`calcular()`:**
  - `financiado = Σ monto de los gastos del mes con metaId`
  - `libre = ingresos − (gastado − financiado) − ahorro`
  - El gasto sigue apareciendo en su categoría, para ver en qué se fue la plata, pero no castiga el libre del mes.
- **`estadoMeta()`:**
  - `usado = Σ gastos con metaId === m.id`
  - `ahorrado = aportes − usado`
  - Estados: `'cumplida'` al llegar al 100%; `'usada'` si se cumplió y luego `usado ≥ 90%`. En ese caso se ofrece "Archivar meta: ¡la disfrutaron!".

### 3.5 Celebración al cumplir una meta

Confeti de monedas, la pantalla "¡Meta cumplida!" con el total, quién aportó cuánto y cuántos meses tardaron, el logro `meta_cumplida` y el botón "Crear la siguiente meta".

---

## 4. Gastos fijos con abonos parciales

### 4.1 Modelo

```
fijo: { id, nombre, monto, dia, categoria, pagadoPor, tipo, suscripcion, activo,
        montosMes?: { 'AAAA-MM': monto },   // NUEVO: cambiar el total solo de un mes (ej. servicios variables)
        saltos?: ['AAAA-MM'] }              // NUEVO: "este mes no aplica"
pago (abono) = gasto normal con fijoId = fijo.id y fecha dentro del mes
```

```js
function estadoFijo(f, mes) {
  const pagos  = S.gastos.filter(x => x.fijoId === f.id && mesDe(x.fecha) === mes);
  const total  = f.montosMes?.[mes] ?? f.monto;
  const pagado = sum(pagos);
  const pendiente = Math.max(0, total - pagado);
  const saltado = (f.saltos || []).includes(mes);
  const estado = saltado ? 'saltado'
               : pagado >= total * 0.995 ? 'pagado'
               : pagado > 0 ? 'parcial'
               : (vencido ? 'vencido' : 'pendiente');
  return { pagos, total, pagado, pendiente, estado, ... };
}
```

- **Fijo pagado:** solo cuando `pagado ≥ total` (con tolerancia de 0,5% para redondeos).
- **Recordatorios:** solo si `pendiente > 0`.
- **Libre del mes:** `fijosPend` (H5) usa `pendiente`.
- **Logros:** `fijos_al_dia` usa `estado === 'pagado'`.

### 4.2 Interfaz

**Fila del fijo** (en Gastos y en "Pagos que se acercan"):
- Nombre, "**$450.000 de $1.200.000**", barra fina de progreso y chip de estado: Pendiente, Vence en N días, Parcial · faltan $750.000, Pagado o No aplica este mes.
- Botones: **Pagar** y **⋯**.

**Hoja "¿Cuánto pagaste?"** (al tocar Pagar):
- Selector **"Todo lo pendiente ($750.000)"** o **"Un abono"**. Por defecto está en "Todo".
- Valor: se llena con el pendiente; en "Un abono" queda vacío.
- ¿Quién pagó?, fecha y nota opcional.
- **"Cambiar el total de este mes"**: enlace pequeño para servicios que varían. Guarda `montosMes[mes]`.
- Al guardar se crea el gasto con `fijoId` y se muestra "Abono registrado. Faltan $X" o "¡Arriendo pagado completo!".

**Menú ⋯:**
- **Ver pagos del mes:** historial con cada abono (fecha, quién, valor). Tocar un abono permite editarlo o eliminarlo, con Deshacer.
- **Editar gasto fijo**.
- **Este mes no aplica / Sí aplica**: activa o quita el mes en `saltos`.
- **Eliminar gasto fijo:** pide confirmación en la misma fila ("¿Eliminar Netflix? Los pagos ya registrados se quedan en tus gastos") y luego muestra el toast **Deshacer** por 6 s. Se puede borrar cualquier fijo, incluidos los de los datos de ejemplo.

**Agregar:** el botón "+ Agregar gasto fijo o suscripción" va siempre al final de la lista y también en el menú +. No hay límite práctico (sugerido: 60).

---

## 5. "Para hablar juntos"

- **Al marcar** (casilla del formulario): guardar `revisar: true, revisarPor: yo()`.
- **Registros antiguos** sin `revisarPor`: se usa `x.por`.
- **Quién ve el botón "Ya lo hablamos"** (tarjeta de Inicio, cita de dinero y detalle del gasto):
  - Si `S.modo !== 'nube'` (un solo celular), el botón siempre está visible.
  - Si no, se ve solo cuando `(x.revisarPor || x.por) !== yo()`.
  - Quien lo marcó ve el chip **"Esperando a Camila"**, sin botón.
- **Al tocar "Ya lo hablamos":** se borra `revisar`, se guarda `habladoPor: yo()` y `habladoEn: Date.now()`, y llega un aviso a quien lo marcó ("Camila marcó como hablado: Pedido Amazon").
- **Quitar la marca:** quien la puso solo puede quitarla editando el gasto y desmarcando la casilla. No aparece un botón directo para no saltarse la conversación.
- **Regla de Firestore opcional** para hacer cumplir lo anterior: la persona `a` es `members[0]`. Permitir quitar `revisar` solo si el rol de `request.auth.uid` es distinto de `resource.data.revisarPor`, o si ese rol es quien lo creó y está editando todo el documento. Queda como recomendación para el desarrollador.

---

## 6. Editar y borrar gastos (hacerlo evidente)

1. **Detalle del gasto:** al tocar una fila se abre primero un detalle de solo lectura (valor, categoría, quién pagó, de quién es, nota, productos de la factura) con dos botones grandes y visibles: **Editar** y **Eliminar**. Hoy se abre directamente el formulario, con "Eliminar" al fondo.
2. **Deslizar en la lista:** a la izquierda muestra Eliminar en rojo; a la derecha, Editar. Con teclado o lector de pantalla, el detalle sigue siendo la forma accesible.
3. **Deshacer:** al eliminar no hay segunda confirmación. Sale el toast **"Gasto eliminado · Deshacer"** por 6 s. Deshacer vuelve a crear el documento con el **mismo id y los mismos datos** (`Store.poner(col, id, copia)`). Aplica igual a aportes, ingresos extra, abonos de fijos y pagos de deudas. En los pagos de deuda, el saldo vuelve solo, porque se calcula.
4. **Corrección rápida del valor:** en el detalle, tocar el monto lo vuelve editable ahí mismo. Al terminar, "Guardar".
5. **Aviso a la pareja:** "Andrés eliminó: Mercado · $120.000" (hoy solo se avisa al agregar o editar).

---

## 7. Cinco ideas más (alto impacto, bajo costo, sin servidores)

1. **Reparto de la quincena** (como el *Payday Divvy* de Qapital): al anotar un ingreso extra o confirmar "Llegó el sueldo", la app propone repartirlo en metas (según el aporte sugerido), fijos pendientes y plata personal. Un toque crea los aportes.
2. **Ahorro de redondeo** (como el *Round-up* de Qapital): opción en Ajustes, "Redondear cada gasto a los $1.000 siguientes y anotar la diferencia como aporte a ___". Solo registra el aporte; no mueve plata real, igual que el resto de la app.
3. **Resumen del domingo:** notificación local semanal ("Esta semana: $480.000 en gastos, 2 pagos esta semana, van en el 60% del viaje"), con un toque que lleva a Planes. Usa el plugin `local-notifications`, que ya está instalado.
4. **Acceso directo "Dictar gasto"** en el ícono de la app (mantener presionado el ícono en Android). Es un *shortcut* estático en el manifiesto que abre la hoja de voz: registrar un gasto en 3 segundos es lo que más retiene usuarios.
5. **Sobrantes que ruedan** (H15) junto con el **"¿Nos lo podemos permitir?"**, que ya considera el sobrante acumulado: le da sentido a gastar menos este mes.

---

## Fuentes

- [City, University of London — Turning long-term savings goals into a game (2022)](https://www.bayes.city.ac.uk/news-and-events/news/2022/january/turning-long-term-savings-goals-into-a-game-can-increase-consumer-financial-well-being)
- [Money Crashers — Qapital review (reglas, Dream Team, Payday Divvy)](https://www.moneycrashers.com/qapital-review/)
- [Fast Company — Long Game: ahorro con sorteos](https://www.fastcompany.com/3065837/the-long-game-wants-to-make-saving-money-as-fun-as-buying-a-lottery-ticket)
- [Bankrate — Gamification helps people save more](https://www.bankrate.com/banking/savings/gamification-helps-people-save-more-money-savings)
- [Noticias RCN — Cómo funciona el Colchón de Nequi](https://www.noticiasrcn.com/economia/nequi-asi-funciona-el-colchon-para-guardar-plata-y-no-gastarla-891934)
- [Portafolio — Cajitas de ahorro de Nu Colombia](https://www.portafolio.co/mis-finanzas/ahorro/cajitas-de-ahorro-y-otras-novedades-de-la-nueva-cuenta-de-nu-para-gestionar-su-dinero-596646)
- [La República — Mujeres lideraron metas de ahorro en Nequi](https://www.larepublica.co/finanzas/nequi-informo-que-las-mujeres-lideraron-metas-de-ahorro-en-2021-a-traves-de-la-app-3314294)
- [YNAB vs Monarch (2026)](https://waypointbudget.com/blog/ynab-vs-monarch-money)
- [NerdWallet — Honeydue](https://www.nerdwallet.com/finance/learn/honeydue-app-review) · [The College Investor — Zeta](https://thecollegeinvestor.com/24184/zeta-review/)
