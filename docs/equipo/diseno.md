# TU Y YO · Diseño y marketing

Especificación del agente de Marketing y Diseño para el desarrollador. Revisé la app completa desde diseño visual, experiencia de uso, gráficas, animaciones, ilustraciones y textos. No cubre lo legal ni las reglas de negocio.

**Material de apoyo**
- Capturas de todas las pantallas en `docs/equipo/capturas/`: `light-*` y `dark-*` son la app actual; `prototipo-*` son las propuestas.
- Prototipo funcional en `docs/equipo/prototipos/graficas-y-logros.html`. Las gráficas se pueden tocar e incluye un botón para probar el desbloqueo de un logro.
- Galería de recursos en `docs/equipo/prototipos/galeria.html`.
- Ilustraciones en `docs/equipo/ilustraciones/*.svg` e insignias en `docs/equipo/insignias/*.svg`.

**Identidad que se respeta**
- Logo: dos personas que abrazan una moneda.
- Colores: azul `#3552E8`, verde `#13B176`, ámbar `#FFB21E` y noche `#0F1B3D`.
- Tipografía: Bricolage Grotesque para títulos y cifras, Figtree para texto.
- Debe verse neutral: igual de cercana para hombres y mujeres.

**Tokens nuevos** (se añaden al `:root` de `styles.css` y a los dos bloques oscuros):

```css
--ambar-logo: #FFB21E;              /* moneda, hitos, logros (igual en claro y oscuro) */
--deuda: #7A5C99;                   /* deudas en gráficas */
--e-out: cubic-bezier(.2,.8,.2,1);  /* entradas y crecimientos */
--e-pop: cubic-bezier(.3,1.5,.5,1); /* celebraciones */
--oro: #E39A00; --plata: #9AA6B8; --bronce: #B8743E;
```

---

## 1. Hallazgos en toda la app (por prioridad)

### P1: arreglar primero

| # | Pantalla (captura) | Problema | Cambio exacto |
|---|---|---|---|
| 1 | Gastos, lista (`light-03-gastos`, `light-09-editar-gasto`) | Editar o borrar un gasto no se descubre: toda la fila es un botón sin ninguna señal de que se puede tocar. | Añadir a la derecha de cada fila un botón `⋯` de 44×44 px con `aria-label="Opciones de {gasto}"`. Al tocarlo se abre una hoja con **Editar**, **Duplicar** y **Eliminar** (en rojo). Al deslizar la fila a la izquierda (umbral de 72 px) aparecen dos acciones de 76 px de ancho: Editar (`--azul`) y Eliminar (`--bad`). Eliminar no pide confirmación: borra y muestra el aviso «Gasto eliminado · **Deshacer**» durante 5 s. Si se toca Deshacer, el gasto vuelve con su mismo id. |
| 2 | Inicio, Gastos y fijos (`light-02`, `light-03`) | Los íconos de categoría son una letra dentro de un cuadrado de color («D», «H», «R»). Se ven genéricos y se repiten: Deudas y Diversión salen ambas con «D». | Usar un set de íconos de trazo de 24 px (anexo A) dentro de la misma caja de 42×42 px con radio 14. Fondo: el color de la categoría al 16 % (`color-mix(in srgb, {c} 16%, transparent)`). Ícono: el color pleno de la categoría. Las categorías propias eligen ícono de la lista o, si no eligen, llevan su inicial. |
| 3 | Ajustes (`light-16-ajustes`) | Los ingresos mensuales se cortan («$4.500.00(»): `.input.money` mide 26 px dentro de una fila de dos columnas. | `.row .input.money { font-size: 18px; padding-inline: 12px; min-width: 0 }`. En pantallas de menos de 380 px de ancho, `.row { flex-direction: column }` para esa pareja de campos. |
| 4 | Estados vacíos (`light-20`, `21`, `22`) | Inicio, Deudas y Metas repiten el mismo ícono de recibo. La gráfica de 6 meses aparece en blanco, sin explicar por qué. | Usar las ilustraciones nuevas (mapa en la sección 3), a 200×133 px y centradas, con su título y un botón principal. Cuando hay menos de 2 meses con datos, la gráfica de 6 meses muestra `primer-mes.svg` y el texto «Su historia empieza este mes. Vuelvan en 30 días para ver la tendencia.» |
| 5 | Inicio de una pareja nueva (`light-20-vacio-inicio`) | Sin ingresos, la tarjeta principal dice «$0 · Configura una meta de ahorro en ajustes», que no es el siguiente paso real. «Cuentas claras» muestra $0 y 0 %. | Si los ingresos son 0, la tarjeta principal pasa a modo bienvenida: «Empiecen por lo que entra cada mes», con el botón «Agregar ingresos» que abre Ajustes con el foco en el ingreso 1. «Cuentas claras» se oculta hasta que exista al menos un gasto compartido. |

### P2: mejora clara

| # | Pantalla | Problema | Cambio exacto |
|---|---|---|---|
| 6 | Gastos fijos (`light-03`) | El botón «Pagado» parece un estado, no una acción. | Cambiar el texto del botón a **Pagar**. Si el fijo admite abonos parciales: **Abonar** cuando ya tiene algo pagado, y la línea de estado «Pagado $120.000 de $210.000» con una minibarra de 4 px. El estado sigue en el chip. |
| 7 | Deudas (`light-04`) y Planes (`light-05`) | Todas las deudas llevan el ícono de tarjeta y todos los planes, el de corazón. | Deudas: un ícono por tipo (tarjeta, carro, casa, birrete, persona, bolsa). Planes: un ícono por plan (café, bici, museo, dado, tv, canasta, olla, ticket, música, cubiertos, mochila, maleta). Anexo A. |
| 8 | Inicio, «¿A dónde va cada peso?» | El donut es pequeño (150 px), no se puede tocar y su leyenda ocupa 8 filas. | Ver la sección 2.1: 200 px, interactivo, y la leyenda pasa a chips. |
| 9 | Inicio | Son unas 11 tarjetas seguidas y lo importante queda abajo. | Orden nuevo: principal → Pagos que se acercan → Para hablar juntos → Presupuesto → Donut → Cuentas claras → Lo último. Patrimonio, Plata personal, Termómetro y 6 meses van debajo de un botón «Ver más del mes» que guarda su estado en `localStorage`. |
| 10 | Aviso de vincular | El aviso «Vincula a tu pareja…» ocupa 56 px de forma permanente. | Añadir el botón «Ahora no». Al tocarlo, el aviso se oculta 7 días (en `localStorage`). |
| 11 | Aviso flotante | Tapa los botones que están sobre la barra inferior (se ve en varias capturas). | Mostrarlo 12 px sobre el botón +, ocultarlo a los 2,4 s y, en acciones destructivas, que lleve botón (Deshacer). |
| 12 | Formulario de gasto (`light-07`) | «Ropa y cuidado» y «Hogar y servicios» se parten en dos líneas. | `.cats { grid-template-columns: repeat(auto-fill, minmax(104px,1fr)) }` y el ícono de 16 px reemplaza al punto de color. |
| 13 | Distribución (`light-17`) | «Ocultar» y «Eliminar» son objetivos táctiles de unos 30 px. | Mínimo 44×44 px: `padding: 12px 6px`. |
| 14 | Metas (`light-05`) | El anillo de 64 px no muestra hitos y no hay celebración al avanzar. | Ver la sección 2.5. |
| 15 | Bienvenida (`light-01`) | Correcta, pero no transmite el beneficio. | Bajo el logo, 3 viñetas animadas de 24 px: «Cada gasto, de los dos», «Deudas bajo control», «Ahorro que crece». Cada una entra 80 ms después de la anterior. |

### P3: pulido

- **Modo oscuro (`dark-*`):** está bien en general. Las píldoras ámbar «En 1 día» deben usar `--warn` del tema oscuro para mantener contraste de 4,5:1.
- **Avatares A y C:** además del color, llevan la inicial, lo cual está bien. En «Lo último de los dos» se mantienen.
- **Cifras:** todas las columnas de montos deben llevar `font-variant-numeric: tabular-nums`. Hoy falta en `.pago-row small`.

---

## 2. Gráficas mejoradas

Reglas comunes para las cinco gráficas:
- Todo se dibuja con SVG inline y colores tomados de los tokens.
- Las animaciones duran 600–1.300 ms con `var(--e-out)` y solo se reproducen cuando cambia la pestaña o el mes, nunca en cada redibujo. La app ya tiene la variable `nuevaVista` para eso.
- Con `prefers-reduced-motion: reduce` cada gráfica aparece directamente en su estado final.
- Cada gráfica lleva `role="img"` y un `aria-label` que resume sus datos.

### 2.1 Donut interactivo «¿A dónde va cada peso?»
- **Tamaño y trazo:** caja de 200×200, radio 80, grosor 22 y separación de 2 px entre segmentos.
- **Centro:** etiqueta de 12 px en `--muted`, monto de 24 px/800 en Bricolage con conteo animado de 600 ms desde el valor anterior, y debajo un porcentaje de 12 px.
- **Al tocar un segmento o su chip:** el segmento crece a grosor 30 (transición de 200 ms), los demás bajan a opacidad 0,35 y el centro muestra el nombre, el monto y el «% del ingreso». Un segundo toque vuelve al total.
- **Entrada:** cada segmento se dibuja con `stroke-dasharray` desde 0, 70 ms después del anterior.
- **Leyenda:** se reemplaza por chips con un cuadrito de color de 9 px. El chip seleccionado lleva `aria-pressed=true` y borde `--ink`.

### 2.2 Barras de presupuesto con el ritmo del mes
- **Pista:** 12 px de alto, radio 99, fondo `--surface-2`. El relleno crece desde la izquierda con `scaleX` en 900 ms, 60 ms después de la barra anterior.
- **Marcador «hoy»:** línea de 2 px en `--ink` al 55 % de opacidad, que sobresale 4 px arriba y abajo de la pista, situada en `left = díaDelMes / díasDelMes`. Solo la primera barra lleva la etiqueta «hoy» (11 px, `--muted`), debajo de la pista.
- **Estado** (texto de 12 px/700 al final de la línea):
  - «Quedan $X» en `--ok` si va a buen ritmo.
  - «Van rápido» en `--warn` si el gasto supera el ritmo del mes en más de 15 puntos.
  - «Se pasaron $X» en `--bad` cuando superan el tope; en ese caso el relleno también se pinta en `--bad`.

### 2.3 Últimos 6 meses: ingresos, gastos y ahorro
- **Caja:** 340×180 con 3 líneas guía en `--line`.
- **Barras por mes:**
  - Ingreso: 16 px de ancho, color `--surface-2` con borde `--line`.
  - Gasto: 16 px pegado al ingreso. El mes actual en `--azul` pleno; los anteriores en `color-mix(--azul 55%)`.
  - Ambas crecen con `scaleY` en 800 ms, 60 ms después del mes anterior.
- **Línea de ahorro acumulado:** 3 px en `--verde`, con puntos de 3 px y el último de 5 px. Se traza en 1,2 s a partir de los 300 ms. El último punto lleva la etiqueta «$X ahorrados».
- **Interacción:** al tocar un mes aparece un tooltip con ingreso, gasto y ahorro.

### 2.4 Curva de bajada de deudas (pantalla Deudas, debajo del total)
- **Datos:** la suma mes a mes del saldo de todas las deudas activas, usando la simulación que ya existe para cada una, hasta llegar a cero.
- **Trazo:** línea de 3 px en `--deuda` con un área en degradado de `--deuda` al 35 % hasta transparente. Se dibuja en 1,4 s.
- **Marcas:**
  - Punto «Hoy $X» al inicio.
  - Un punto `--ambar-logo` cada vez que se termina de pagar una deuda, con la etiqueta «{deuda} pagada · {mes}».
  - Punto final `--verde` de 7 px con «$0 · {mes año}».
- **Encabezado:** «Así baja su deuda · libres en {mes año}».

### 2.5 Anillo de metas con hitos
- **Tamaño y trazo:** 120 px, radio 50, grosor 12, con degradado de `--azul` a `--verde` y bordes redondeados. Se llena en 1,3 s.
- **Hitos:** puntos de 4,5 px a 25, 50 y 75 %, en `--ambar-logo` si ya se alcanzaron y en `--surface` con borde `--line` si no.
- **Píldoras:** debajo, «25 % · 50 % · 75 % · 100 %», en `--verde-soft` las alcanzadas.
- **Centro:** «60 %» a 24 px/800 y «logrado».
- **Al cruzar un hito con un aporte:** el punto hace pop (escala de 0,6 a 1 en 450 ms con `--e-pop`), salen 8 monedas y aparece el aviso «¡Llegaron al 50 % de {meta}!». Al 100 % se abre el desbloqueo de la sección 4.

---

## 3. Ilustraciones de estados vacíos (`docs/equipo/ilustraciones/`)

Son SVG originales que reutilizan la pareja del logo y usan `var(--token, #fallback)`, así que funcionan en claro y en oscuro si se insertan inline.

| Archivo | Dónde va | Título · texto · botón |
|---|---|---|
| `sin-movimientos.svg` | Inicio y lista de Gastos | «Aún no hay movimientos» · «Escaneen una factura o díganla en voz alta.» · **Anotar gasto** |
| `sin-deudas.svg` | Deudas | «Sin deudas registradas» · «Agreguen tarjetas o créditos para ver cuándo terminan.» · **Agregar deuda** |
| `sin-metas.svg` | Metas | «¿Para qué ahorran juntos?» · «Un viaje, un fondo de emergencia, la cuota inicial…» · **Crear meta** |
| `sin-fijos.svg` | Gastos fijos | «Sus pagos de cada mes en un solo lugar» · «Arriendo, servicios, Netflix…» · **Agregar fijo** |
| `sin-resultados.svg` | Buscador | «Nada coincide» · «Prueben otra palabra, un valor o una categoría.» |
| `primer-mes.svg` | Gráfica de 6 meses | «Su historia empieza este mes» |

Entrada de las ilustraciones: suben 8 px mientras aparecen, en 450 ms. La moneda hace un pequeño salto (`translateY -4px`) a los 1,2 s, una sola vez.

---

## 4. Logros y premios

**Dónde viven**
- En la cabecera, un botón de trofeo de 42×42 px junto a Ajustes, con un punto ámbar de 8 px cuando hay un logro nuevo sin ver.
- En Planes, arriba de la cita, la tarjeta «Nivel N · nombre» con barra de XP y el botón «Ver logros».

**Pantalla Logros** (hoja inferior completa; ver `capturas/prototipo-light.png`)
- **Encabezado:** «Nivel 4 · Socios del ahorro», «620 / 1.000 XP» y una barra de 10 px con degradado de `--azul` a `--verde`. Debajo: «Siguiente nivel: {nombre}».
- **Rejilla de 3 columnas** con tarjetas de radio 18 y fondo `--surface-2`:
  - Medalla de 64×72 px, nombre de 12 px/600 y estado de 11 px en `--muted`.
  - Las bloqueadas van en gris con `filter: grayscale(1)` y opacidad 0,45.
  - Al tocar una medalla se ve su condición y la fecha en que se logró.
- **Filtros en chips:** Todos · De los dos · Míos · Por lograr.

**Insignias** (`docs/equipo/insignias/{id}.svg`, de 100×112 con anillo metálico, disco noche, cintas azul y verde, y glifo blanco). Los archivos se llaman igual que los 16 logros de `innovacion.md`, sección 2.3, y tienen el mismo metal.

| id (archivo) | Nombre | Metal |
|---|---|---|
| `primer_paso` | Primer paso | Bronce |
| `equipo` | Somos equipo | Bronce |
| `bitacora_7` | Una semana al día | Bronce |
| `bitacora_30` | Mes impecable | Plata |
| `factura_magica` | Ojo de águila | Bronce |
| `a_viva_voz` | A viva voz | Bronce |
| `cuentas_claras` | Cuentas claras | Bronce |
| `cita_1` | Primera cita de dinero | Bronce |
| `cita_3` | Constantes | Plata |
| `cita_6` | Socios de vida | Oro |
| `en_presupuesto` | Dentro del plan | Plata |
| `ahorradores` | Ahorradores | Plata |
| `fijos_al_dia` | Nada pendiente | Plata |
| `meta_cumplida` | Meta cumplida | Oro |
| `adios_deuda` | Libres de esta deuda | Oro |
| `abono_extra` | Le ganamos a los intereses | Bronce |
| `bloqueada` | Medalla genérica por desbloquear | — |

Si Innovación agrega un logro, se reutiliza el glifo más cercano y se cambia el metal en el degradado `m-{id}`.

**Animación de desbloqueo** (ver `capturas/prototipo-desbloqueo.png`)
1. El fondo pasa a `rgba(8,14,32,.6)` en 250 ms.
2. La tarjeta (de hasta 320 px, radio 28) entra con un pop de escala 0,7 a 1 en 550 ms con `--e-pop`.
3. La medalla de 120 px entra girando (`rotateY(180deg) scale(.6)` hasta la posición normal) en 900 ms, a partir de los 150 ms.
4. Al mismo tiempo salen 26 monedas de 18 px con degradado radial dorado. Vuelan en direcciones al azar entre 120 y 300 px, giran hasta ±360° y se desvanecen en 1,4 s.
5. El celular vibra con el patrón `[30, 40, 60]` usando Haptics, o `navigator.vibrate` como respaldo.
6. Textos: rótulo «LOGRO DE ORO DESBLOQUEADO» (11 px, espaciado 0,12em, `--oro`), título «¡Meta cumplida!» y el texto «Andrés y Camila… +150 XP para los dos». Botón **¡Lo logramos!**.
7. A la pareja le aparece el mismo desbloqueo la próxima vez que abra la app.
8. Con movimiento reducido no salen monedas ni hay giro; solo aparece la tarjeta.

---

## 5. Microinteracciones

| Momento | Qué pasa |
|---|---|
| Guardar gasto | La hoja se cierra. Un check verde de 52 px hace pop (450 ms, `--e-pop`) y su trazo se dibuja en 450 ms. El celular vibra 10 ms (LIGHT). El monto del mes cuenta hasta el valor nuevo en 800 ms. La fila nueva entra con un resplandor de `--azul-soft` que se apaga en 1,2 s. |
| Abono o cuota de deuda | El anillo de la deuda avanza en 900 ms y «Deben hoy» cuenta hacia abajo. Si queda en 0: confeti de monedas y el logro Cazadeudas. |
| Pago o abono de un fijo | La minibarra de pagado crece. Si se completa, el chip pasa a «Pagado» con un pop y la fila baja al final de la lista en 400 ms. |
| Aporte a meta | El anillo crece. Al cruzar un hito se aplica la sección 2.5; al 100 %, la sección 4. |
| «Ya lo hablamos» | Solo lo ve la pareja de quien marcó el gasto. Al tocarlo, el botón pasa a «✓ Ya lo hablamos» en `--ok`, la fila se va hacia la derecha (+30 px, opacidad 0, 600 ms tras 900 ms de espera) y la lista se reacomoda. El aviso dice «Listo, lo conversaron». |
| Eliminar | La fila se colapsa en 250 ms y aparece el aviso con Deshacer (5 s). |
| Vincular | Las dos personas del logo, que estaban separadas, se juntan (360 ms) y la moneda cae entre ellas (la animación de bienvenida actual reutilizada). |

Todo lo anterior respeta `prefers-reduced-motion`: sin desplazamientos ni confeti; los cambios de valor ocurren al instante.

---

## 6. Textos de marketing

### Mensajes de ánimo
Rotan en la tarjeta principal y en los avisos, sin repetirse dos días seguidos.

1. «Cada peso que anotan hoy es una decisión más fácil mañana.»
2. «Hablar de plata también es cuidarse.»
3. «Van por buen camino: este mes gastaron menos que el anterior.» (solo cuando sea cierto)
4. «Un aporte pequeño hoy es un viaje juntos mañana.»
5. «Las cuentas claras mantienen el cariño.»
6. «Una deuda menos, un respiro más.»
7. «15 minutos de cita de dinero valen más que un mes de suposiciones.»
8. «Lo nuestro crece cuando lo cuidamos los dos.»
9. «¡Racha de {n} días registrando! Sigan así.»
10. «Ahorrar no es dejar de vivir: es elegir juntos en qué.»

### Ficha de Google Play
- **Título** (≤30): `TU Y YO: Finanzas en pareja` (27)
- **Descripción corta** (≤80): `Gastos, deudas y metas de los dos, en un solo lugar y sincronizados al instante.` (79)
- **Descripción larga:**

> TU Y YO es la app para manejar la plata en pareja sin peleas ni hojas de cálculo.
>
> • Anoten gastos en segundos: escaneando la factura o diciéndolo en voz alta.
> • Vean quién pagó qué y a quién le toca, con cuentas claras automáticas.
> • Controlen deudas y tarjetas: banco, cuota, intereses y la fecha en que terminan.
> • Gastos fijos y suscripciones con recordatorios para no olvidar ningún pago.
> • Repartan el ingreso por categorías con la guía 50/30/20 y vean cuánto queda.
> • Metas de ahorro con hitos, logros y premios para celebrar juntos.
> • Cita de dinero mensual: un resumen y cuatro preguntas para ponerse de acuerdo.
>
> Vincúlense con un código de 6 letras: los dos ven y editan todo en vivo. Gratis, sin publicidad.

- **Capturas sugeridas** (1080×1920, con titular de 64 px sobre un fondo de color noche):
  1. Inicio: «Sepan a dónde va cada peso»
  2. Voz y escáner: «Dígalo o escanéelo: listo»
  3. Deudas con curva: «Vean el día en que terminan sus deudas»
  4. Logros: «Celebren cada meta juntos»
  5. Vincular: «Los dos, en tiempo real»

---

## Anexo A · Íconos (trazo de 2 px, viewBox de 24, puntas redondeadas)

- **Categorías:**
  - mercado = carrito
  - hogar = casa
  - transporte = bus
  - comida = tenedor y cuchillo
  - diversión = ticket
  - salud = corazón con pulso
  - ropa = camiseta
  - mascotas = huella
  - educación = libro abierto
  - regalos = regalo
  - deudas = tarjeta
  - otros = tres puntos
- **Deudas:** tarjeta, carro, casa, birrete, persona, bolsa.
- **Planes:** café, bici, museo (columnas), dado, tv, canasta, olla, ticket, nota musical, cubiertos, mochila, maleta.

Deben ser trazos originales en el mismo estilo de los íconos de la app (`ICON` en `app.js`), sin copiar sets de terceros.
