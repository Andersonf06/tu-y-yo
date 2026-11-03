# Desarrollo e ingeniería — entrega v1.1

Agente de desarrollo. Implementa lo pedido por el dueño y los requisitos de `abogado.md`, `innovacion.md` (P1) y `diseno.md` (urgente y P1). **No se hizo push**: queda en commits locales para el visto bueno del gerente.

## Lo pedido por el dueño

| # | Pedido | Qué quedó | Dónde |
|---|---|---|---|
| 1 | «Ya lo hablamos» solo lo puede marcar la otra persona | El gasto guarda `revisarPor`. Quien lo marcó ve «Esperando a {pareja}» y no tiene botón (ni en Inicio, ni en el detalle, ni en la cita); la acción también se bloquea en código. La otra persona confirma y queda `habladoPor` + `habladoEn`. Avisos: «X quiere hablar de…» y «X marcó como hablado…». En un solo celular cualquiera lo confirma. Gastos viejos sin `revisarPor` usan `por`. | `app.js`: `marcoHablar`, `puedeHablar`, `filaHablar`, `case 'hablado'`, `avisarPareja` |
| 2 | Gastos fijos: eliminar y agregar cualquiera | Cada fila tiene **Pagar/Abonar** y **⋯** (también los pendientes): Ver pagos del mes, Editar, Este mes no aplica, Eliminar con confirmación + **Deshacer** 6 s. «Agregar gasto fijo» siempre visible. | `filaFijo`, `vistaMenuFijo`, `vistaPagosFijo`, `case 'saltarFijo'` |
| 3 | Metas no se suman a gastos; pagos parciales de fijos | Aportes fuera de `gastado`; sección **«Ahorro del mes · no es gasto»** en Gastos, leyenda «no es gasto» en el donut. Categorías del grupo «Ahorro e inversión» cuentan como ahorro. **Abonos parciales**: «¿Cuánto pagaste?» (todo lo pendiente / un abono, cambiar el total solo de ese mes), fila «$450.000 de $1.200.000» con barra y chip «Parcial · faltan…». Un fijo solo queda pagado al completar el total (0,5 % de tolerancia). El libre del mes descuenta lo que falta de los fijos (`fijosPend`). Gasto «pagado con el ahorro de una meta» (`metaId`): baja la meta y no castiga el libre. Eliminar una meta con historial la **archiva** (no borra aportes) y se puede restaurar. Aportes editables y borrables. | `estadoFijo`, `formPagoFijo`, `calcular`, `estadoMeta`, `case 'borrar'` |
| 4 | Seguridad, derechos de datos, políticas | Todo `abogado.md` §B (ver abajo). | `legal.js`, `app.js`, `firestore.rules` |
| 5 | Eliminar y corregir gastos; todos los bancos | Tocar un gasto abre su **detalle** (fecha, quién pagó, de quién, quién registró/editó, fijo, deuda, meta, origen, nota) con **Editar** y **Eliminar**; botón **⋯** de 44 px en cada fila y deslizar a la izquierda. Eliminar muestra **Deshacer** (recrea el mismo id) y avisa a la pareja «X eliminó: …». **85 entidades** de Colombia (bancos de la Superfinanciera, compañías de financiamiento, cooperativas financieras, billeteras/SEDPE, FNA, ICETEX, cajas de compensación, fintech, almacén, familiar…) en Deudas y ahora también en Cuentas; se puede escribir cualquier otra. | `vistaGasto`, `itemGasto`, `BANCOS` |
| 6 | Mejores gráficas, animaciones, metas y premios | Íconos de trazo por categoría; donut 200 px interactivo (tocar arco o leyenda); barras de presupuesto de 12 px con **marca de «hoy»** y estado «Van rápido»; gráfica de 6 meses ingresos/gastos + **línea de ahorro acumulado**; **«Camino a cero deudas»** (curva con un punto por cada deuda que terminan); anillos de metas de 104 px con hitos 25/50/75 y pastillas; aporte sugerido, ritmo atrasado/adelantado y reparto por persona; ilustraciones en estados vacíos. **Logros**: 16 insignias, niveles y XP, rachas con comodín semanal, retos del mes (5), pantalla de logros con filtros, botón trofeo con punto, celebración con medalla que gira y lluvia de monedas, hitos de metas con confeti. Respeta «reducir movimiento». | `grafico6Meses`, `curvaDeudas`, `anilloMeta`, `LOGROS`, `evaluarLogros`, `vistaLogros`, `styles.css` |

## Abogado (§B)

1. `legal.js` integrado antes de `app.js`; textos solo desde `window.LEGAL`.
2. **Autorización** al empezar y al unirse: casilla obligatoria sin marcar con enlaces a política y términos; casilla de terceros para quien crea. Registro `{version, fecha, persona, mayorEdad, terceros}` en `localStorage tuyyo:consentimiento` y en `cfg.consentimientos.a|b`. Si cambia `LEGAL.version`, se vuelve a pedir al abrir (no se puede cerrar tocando afuera; opción «No acepto: eliminar mis datos»).
3. **Ajustes → Privacidad y legal**: política, términos, mis autorizaciones, exportar, eliminar mis datos, contacto y versión.
4. **Eliminar mis datos** (escribiendo ELIMINAR): «solo este celular» (deja de sincronizar, `currentUser.delete()`, borra caché de Firestore y todas las claves `tuyyo:*`) y «todo el hogar» (borra las 8 colecciones, la invitación y el documento del hogar).
5. Avisos al crear el código, al unirse, en el código («solo con tu pareja…») y al reinvitar.
6. «Privado» → **«Discreto»** con los textos exactos.
7. `LEGAL.noAsesoria` en el veredicto, la estrategia, los consejos y la curva de deudas; «Estimado. El saldo oficial es el del extracto de tu banco.» en deudas con intereses.
8. Notificaciones **sin nombres ni montos** por defecto («Tienes un pago próximo / Abre TU Y YO para ver el detalle.»), con la opción «Mostrar nombres y montos» (por celular).
9. Explicación previa del micrófono y de la cámara/galería, una sola vez.
10. Aviso antes de exportar.
11. Nada nuevo sale del celular: sin analítica ni servidores nuevos.

## Innovación y diseño atendidos

- H1 (abono marcaba pagado), H2 (fijo pendiente sin editar/borrar), H3 (`revisarPor`), H4 (`metaId`), H5 (`fijosPend` en el libre), H6 (archivar metas), H7 (ver/editar aportes), H8 (detalle + deshacer), H10 (aviso en selector de deuda), H11 (la voz reconoce un fijo por su nombre y lo asocia), H12 (plata personal sin fijos). Nuevo campo `origen` (`manual|voz|factura|fijo`) para los logros.
- Diseño: tokens nuevos, íconos de categoría, ⋯ + deslizar + deshacer, corrección del recorte de dinero en Ajustes (y columna bajo 380 px), hero «Empiecen por lo que entra cada mes» sin ingresos, «Cuentas claras» oculta hasta el primer gasto compartido, «Pagar»/«Abonar», íconos por tipo de deuda, donut interactivo, barras con «hoy», gráficas nuevas, logros, banner de vincular con «Ahora no» (7 días), `.cats` a 104 px y botones de distribución de 44 px.

## Archivos tocados

- `www/app.js` (lógica y vistas), `www/styles.css` (bloque v1.1 al final), `www/index.html` (carga `legal.js` y `recursos.js`).
- `www/recursos.js` (nuevo): ilustraciones e insignias generadas desde `docs/equipo/ilustraciones` e `insignias`.
- `firestore.rules`, `README.md`, `SEGURIDAD.md`.

## Reglas de Firestore: publicar en la consola

Un solo cambio, en `match /hogares/{hid}`:

```
allow delete: if signedIn() && request.auth.uid in resource.data.members;
```

(antes `allow delete: if false;`). Sin publicarla, «Eliminar mis datos → todo el hogar» borra las colecciones pero falla al borrar el documento del hogar. `logros`, `reto` y `consentimientos` viven dentro de `cfg` y usan la rama de actualización que ya existía; `montosMes` y `saltos` caben en el límite de 30 campos. Plan Spark, sin costo.

## Pruebas

- `node --check` de todos los `.js`: sin errores.
- Vista previa (Playwright, 390×844, claro y oscuro): **56 de 56** comprobaciones, 0 errores de página. Autorización, logro con celebración, eliminar mis datos, donut, «Ya lo hablamos», abono parcial y pago completo de un fijo, «no aplica», eliminar fijo y gasto con deshacer, corregir valor, ahorro del mes, aportes editables, pagar con ahorro de meta, archivar meta, reto, logros y filtro, curva de deudas, 85 bancos, permisos, aviso de exportar y notificaciones sin montos.
- Cálculo del libre: gasto con ahorro de meta no lo cambia; gasto normal lo baja exacto; abonar un fijo pendiente no lo cambia (ya estaba descontado).
- **Dos celulares** con Firebase simulado que aplica las reglas (incluida la nueva de borrado): **24 de 24**. Autorización de los dos en `cfg.consentimientos`, logro «Somos equipo» en la nube, quien marca no ve «Ya lo hablamos» y la pareja sí, avisos en ambos sentidos, abono parcial de Camila visible para Andrés, aviso de borrado a la pareja, «todo el hogar» deja 0 documentos y sin invitaciones, y el otro celular pierde el acceso.
- Usuario de la versión anterior: se le pide la autorización al abrir, no se puede saltar, y no se le celebran de golpe los logros viejos.
- Capturas: `docs/equipo/capturas/final-*.png` (6, optimizadas).

## Lo que no se hizo (o queda para después)

- No se compiló la APK aquí (la red del contenedor bloquea Google/Gradle): la compila GitHub Actions al hacer push.
- H9 (historial de ingresos fijos por mes), reordenar Inicio con «Ver más del mes» y la pantalla especial de «¡Meta cumplida!» con el desglose por persona (hoy se celebra con la insignia de oro).
- La racha «meses dentro del plan» se calcula para el logro pero no se muestra como contador.
- No se subió `versionName`; el gerente decide el número de versión al publicar.

## Correcciones de auditoría (2026-11-03)

### Técnica (`auditoria-tecnica.md`)

| Hallazgo | Estado | Cómo |
|---|---|---|
| **B1** XSS por color de categoría, `plazo`, `metaAhorroPct` | **Corregido** | `limpiarCfg()` y `limpiarDoc()` sanean todo lo que llega de la nube o del almacenamiento: colores solo `^#[0-9a-fA-F]{6}$`, ids `^[A-Za-z0-9_-]{1,60}$`, números con `Number.isFinite` y límites (`metaAhorroPct` 0–90, `pctA` 0–100, ingresos, mesada, presupuestos, `plazo`, `dia`, `tasa`, `cuota`, `cupo`, `saldo…`, `ratioA` 0–1), fechas `AAAA-MM-DD`, enumeraciones (`a`/`b`/`ambos`), `montosMes`, `saltos`, `items`, `logros`, `consentimientos` y `reto`. `refrescarCats` vuelve a validar color e id. Al guardar la distribución también se validan color, id y grupo. Además se envolvieron en `esc()` los valores citados (`p.col`, `k.c`, `k.id`, `CAT.deudas.c`, `plazo`, `metaAhorroPct`). `t-aud3.py`: `window.__xss` indefinido y 0 `<img src=x>`. Prueba extra `t-aud3b.py` (todos los campos numéricos y de enumeración envenenados, en todas las pestañas): indefinido, 0 errores. |
| **B2** `@capacitor/android` 7.4.4 (GHSA-rvm3-566m-v7fv) | **Corregido** | `@capacitor/android`, `core` y `cli` 7.6.10, `npm install` y `npx cap sync android`. `npm audit --omit=dev`: 0 vulnerabilidades. |
| **I1** Reglas sin tipos | **Corregido** | `firestore.rules`: `cfgOk()` (números en `metaAhorroPct`/`pctA`; mapas y listas en `nombres`, `ingresos`, `mesada`, `presupuestos`, `categorias`, `logros`, `consentimientos`) en crear y actualizar el hogar, y `numerosOk()` (número o nulo) en las subcolecciones. Lo que la app ya escribe sigue pasando. **Hay que publicarlas en la consola.** |
| **I2** Consentimientos y logros pisaban el mapa completo | **Corregido** | `Store.guardarCamposCfg()` escribe por ruta: `cfg.consentimientos.<a|b>` y `cfg.logros.<id>` (un solo `update` con todos los logros nuevos). Además Ajustes y Distribución ahora envían solo las claves de `cfg` que cambiaron (menor 5). |
| M1 Autoría solo en el cliente | Documentado | Aceptable entre los dos miembros; queda anotado. |
| M2 Borrado del hogar con escrituras en curso | **Corregido** | `eliminarHogar` hace dos pasadas por las colecciones antes de borrar el hogar. |
| M3 uid muerto en `members` | Pendiente | Requiere una regla nueva («quitarse a sí mismo»); se propone para la siguiente versión. |
| M4 Invitaciones de la pareja | Pendiente (riesgo bajo) | No se pueden listar por reglas; vencen en 48 h. |
| M5 Ajustes reemplazaba `cfg` | **Corregido** | Ver I2. |
| M6 `:has()` / `color-mix()` en WebView viejos | Pendiente | Degradación visual sin romper la app. |
| M7 CSP con `unsafe-inline` | Pendiente | Hay que probar el OCR en un celular antes de quitarlo. |
| M8 Dependencias de desarrollo | Pendiente | No entran en la APK. |
| M9 Tamaño del repositorio | **Corregido** | Se sacaron del repositorio todas las capturas; quedan 6 finales optimizadas (268 KB en total) y `.gitignore` ignora las demás. |

### Diseño (`auditoria-diseno.md`)

| Hallazgo | Estado |
|---|---|
| I1 Botones en oscuro 3,22:1 | **Corregido**: `--azul-btn` (#4F68F5 en oscuro) en botones principales y chip activo. |
| I2 Inicial verde ilegible | **Corregido**: texto `#06281B` sobre verde (avatares, cuentas claras, historial, vincular). |
| I3 Leyenda del donut cortada | **Corregido**: una columna (dos desde 520 px), nombres sin recortar, 44 px de alto. |
| I4 Objetivos táctiles < 44 px | **Corregido**: segmentos, chips, flechas de mes, botones de aviso y de filas, casillas y enlaces de la autorización. |
| I5 Pastillas con poco contraste | **Corregido**: `--ok-ink`/`--warn-ink`, 12 px; montos en verde de «Lo último» y «no es gasto». |
| I6 Marcador de correo visible | **Corregido**: ya hay correo real; además la fila Contacto se oculta si el texto tuviera `[`. |
| I7 Inicio muy larga | Pendiente para la siguiente versión (el auditor lo permite). |
| M1 «y» del logo, M3 chips con pista de deslizar, M4 botón eliminar, M2 distribución a 360 px | **Corregidos** con el CSS propuesto. |
| M5–M7 | Pendientes (opcionales). |

### Legal (`auditoria-legal.md`)

| Hallazgo | Estado |
|---|---|
| B-1 Contacto y ciudad | **Corregido**: Anderson Hernández, persona natural, Barrancabermeja (Santander), Colombia; anderson.anderson.hernandez@gmail.com, en `docs/legal/*` y `www/legal.js`. No queda ningún `[` en los textos. |
| I-1 Texto del micrófono | **Corregido** en la app, la política y la autorización: Google puede procesar el audio en sus servidores; TU Y YO no graba ni guarda audio. |
| I-2 Permisos del celular | **Corregido**: sección «Permisos del celular» (cámara, micrófono, notificaciones, internet) en la política, y tabla de permisos en `google-play-seguridad-datos.md`. |
| I-3 Datos nuevos | **Corregido**: progreso y logros, registro de autorizaciones y conversaciones pendientes. `LEGAL.version` = `2026-11-03`: la app vuelve a pedir la autorización a todos. |
| M-1 Ícono de Discreto | **Corregido**: ojo tachado. |
| M-2 Nivel «Libres financieramente» | **Corregido**: «Dueños de sus finanzas». |
| M-3 Borrado del registro de autorización | **Corregido**: la política lo dice. |
| M-4 «Persona 2» al unirse | **Corregido**: el aviso espera la configuración y usa el nombre real («Ya estás vinculado con Andrés»). |

`www/legal.js` se regenera desde `docs/legal/*.md` con el mismo formato que antes (comprobado: sin cambios, el conversor reproducía byte a byte el archivo original).

### Pruebas de la ronda

- `node --check` de todos los `.js`: OK.
- Vista previa claro y oscuro (`t10.py`): **56/56**, 0 errores de página.
- Dos celulares con el modelo de reglas actualizado (`cfgOk`, `numerosOk` y rutas anidadas en `update`), `t-vinc2.py`: **25/25** (nuevo: el aviso al unirse usa el nombre real).
- Auditoría técnica: `t-aud.py` **21/21**, `t-aud2.py` **24/24**, `t-aud3.py` `window.__xss` indefinido, `t-aud3b.py` indefinido.
  - En `t-aud2.py` y `t-vinc2.py` se corrigió el Firebase simulado: solo aplicaba un nivel de ruta en `update` (`cfg.x`) y no `cfg.consentimientos.b`, que Firestore sí aplica.
- Usuario existente con la versión anterior (`t12.py`): se le pide aceptar la versión `2026-11-03`, que queda registrada.

### Contraste pedido por el gerente (`gerente.md`)

`.pill.ok` en claro `#0A6E44`, `.pill.bad` con `--bad-ink` (`#B4232F` claro / `#F2707F` oscuro), y la persona azul (`.av.a` e íconos con fondo azul) sobre `--azul-btn`. Medido con Playwright (`t-contraste.py`) en Inicio, Gastos, Deudas, Planes, historial de deuda, menú de fijo, Logros y Vincular. Mínimos en claro: verde 5,13:1, roja 5,17:1, ámbar 4,91:1, inicial A 5,96:1, inicial B 5,16:1. En oscuro: verde 6,03:1, roja 4,80:1, ámbar 6,24:1, inicial A 4,53:1, inicial B 7,94:1. Se volvieron a correr `t10.py` (56/56), `t-vinc2.py` (25/25) y `t-aud3.py` (`window.__xss` indefinido).

## Ajuste del dueño (2026-11-03): nada programado se descuenta antes de pagar

- "Les quedan libres" = ingresos − gastos registrados (sin lo pagado con ahorro de metas) − aportes registrados. Ya no resta por adelantado fijos pendientes, cuotas del mes ni la meta de ahorro no aportada.
- Lo programado se muestra aparte en la tarjeta principal: "Tienen $X programado por pagar (fijos, cuotas, ahorro): si lo pagan todo, quedarían $Y".
- "¿Nos lo podemos permitir?" responde con lo libre confirmado, pero avisa cuando la compra dejaría sin cubrir lo programado.
- Pruebas: t-prog.py (el libre baja exactamente el valor del fijo solo al confirmar el pago), t10.py 56/56, t-vinc2.py 25/25, t-aud3.py sin XSS.
