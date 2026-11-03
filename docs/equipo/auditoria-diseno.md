# Auditoría de diseño y experiencia de uso — v1.1

Auditor de diseño y UX. Alcance: lo visual, la usabilidad, las gráficas, las animaciones, la accesibilidad y los textos de la interfaz. No toqué archivos de la app.

## Cómo se revisó

- **Vista previa:** generada desde `www/` (ocr, voz, legal, recursos, app) con los datos de ejemplo y con un hogar vacío.
- **Recorrido:** Playwright en **390×844 y 360×740**, en **claro y oscuro**, por **32 estados**: bienvenida, autorización, Inicio, donut seleccionado, Gastos, detalle de gasto, menú de fijo, "¿Cuánto pagaste?", Deudas, pago de deuda, historial de deuda, Planes, cita, Logros, Ajustes, Privacidad y legal, Eliminar mis datos, Distribución, menú +, los formularios de gasto, deuda, meta y fijo, voz, explicación de cámara, vincular, y los cuatro estados vacíos.
- **Medición automática en cada estado:**
  - scroll horizontal
  - texto o campos recortados
  - contraste WCAG (4,5:1, o 3:1 en texto grande)
  - objetivos táctiles menores de 44 px
  - animaciones activas con "reducir movimiento"
- **Errores:** 0 errores de página en los 4 recorridos.
- **Capturas:** `docs/equipo/capturas/auditoria-{390c|390o|360c|360o}-*.png`, 57 en total.

## Cumplimiento de los 6 puntos del dueño (lado visual y de uso)

| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 1 | "Ya lo hablamos" solo la pareja | Cumple: el botón aparece en "Para hablar juntos" y en la cita. Quien lo marcó ve "Esperando a…" (la lógica de dos celulares la validó desarrollo). | `auditoria-390c-inicio.png`, `-cita.png` |
| 2 | Agregar y borrar fijos | Cumple: cada fila tiene **Pagar** y **⋯**, y el menú incluye Editar, Ver pagos, No aplica y **Eliminar** con nota de que los pagos se conservan. "Agregar gasto fijo" está siempre visible. | `-gastos.png`, `-menu-fijo.png` |
| 3 | Abonos parciales | Cumple: la hoja "¿Cuánto pagaste?" muestra total, ya pagado y falta, con "Todo lo pendiente" o "Un abono". | `-pagar-fijo.png` |
| 4 | Legal visible | Cumple: autorización antes de usar, Ajustes → Privacidad y legal, y Eliminar mis datos escribiendo ELIMINAR. | `-consent.png`, `-legal.png`, `-eliminar-datos.png` |
| 5 | Editar y borrar gastos; bancos | Cumple: el detalle del gasto tiene **Editar** (botón principal) y **Eliminar gasto**, y cada fila tiene **⋯**. Los bancos tienen autocompletar en deuda y cuenta. | `-detalle-gasto.png`, `-form-deuda.png` |
| 6 | Gráficas, animaciones, metas y premios | Cumple: donut interactivo, barras con la rayita de "hoy", 6 meses con ahorro acumulado, "Camino a cero deudas", anillos de metas, pantalla Logros con 16 insignias, niveles y rachas, e ilustraciones en los estados vacíos. | `-inicio.png`, `-deudas.png`, `-logros.png`, `-vacio-*.png` |

- **Identidad:** se respeta el logo de la pareja con la moneda, la paleta azul, verde, ámbar y noche, y Bricolage Grotesque con Figtree.
- **Neutralidad:** nada se ve femenino ni masculino. Los avatares son letras sobre azul y verde, y las ilustraciones usan la pareja del logo.
- **Reducir movimiento:** con `prefers-reduced-motion: reduce` no queda ninguna animación activa (medido con `document.getAnimations()`). El confeti y la lluvia de monedas se saltan (`reduceMov()`).

---

## BLOQUEANTE

Ninguno.

## IMPORTANTE (corregir antes de publicar)

**I1. Botones principales en modo oscuro con poco contraste (3,22:1).** En oscuro `--azul` es `#6F86FF` y el texto es blanco. Afecta a Aceptar y continuar, Guardar gasto, Registrar pago, Calcular, Escanear, Crear código, el chip "Todos" activo y otros. Captura: `auditoria-390o-consent.png`, `-390o-form-gasto.png`.
```css
/* dentro de los dos bloques oscuros (@media dark y [data-theme="dark"]) */
--azul-btn: #4F68F5;          /* fondo de botón: blanco sobre él = 4,7:1 */
/* y en todos los temas */
:root { --azul-btn: var(--azul); }
.btn:not(.soft):not(.ghost):not(.danger), .chip[aria-pressed="true"], .seg-activo { background: var(--azul-btn); }
```
Alternativa sin token nuevo: en oscuro `.btn:not(.soft):not(.ghost):not(.danger){ color:#0B1226 }`, que da 6,3:1.

**I2. Iniciales de la persona verde ilegibles.** La "C" blanca sobre verde tiene 3,07:1 en claro y **1,99:1 en oscuro**. Afecta a la cabecera, "Lo último", "Cuentas claras", el historial de deuda y la vinculación. Captura: `auditoria-390o-inicio.png`.
```css
.av.b, .act-row .av.b, .balance .av[style*="--verde"] { color: #06281B; }  /* 7,8:1 sobre #2FD08E, 4,9:1 sobre #10A86E */
```
La regla más simple es dar texto oscuro (`#06281B`) a todo avatar o insignia con fondo verde.

**I3. Leyenda del donut con nombres cortados.** En 390 px la cuadrícula de dos columnas de 150 px deja "Hog…", "Deu…", "Aho…" y "Sin a…". El dato principal de la gráfica no se lee. Captura: `auditoria-390c-inicio.png` (segunda columna).
```css
.legend { grid-template-columns: 1fr; }            /* una fila por categoría */
.legend .ley { min-height: 44px; }                 /* de paso cumple el área táctil (hoy 40 px) */
@media (min-width: 520px) { .legend { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
```

**I4. Objetivos táctiles menores de 44 px en controles frecuentes.**
- Selectores segmentados (quién pagó, de quién es, tipo de pago, reparto, $/%, E.A./Mensual): 37 px.
- Chips de filtro de Gastos y Logros: 37 px.
- Flechas de mes: 36×36. Botón "Opciones" del aviso: 80×35. "Pagar" en las filas: 66×40.
- Casillas "Marcar para hablarlo juntos" y "Es una suscripción": 24 px de alto.
- Enlaces a la política y a los términos dentro de la autorización: 20 px.

Capturas: `-form-gasto.png`, `-gastos.png`, `-consent.png`.
```css
.seg label, .chip { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
.month .icon-btn, .icon-btn { width: 44px; height: 44px; }
.banner .btn, .pago-row .btn { min-height: 44px; }
.check { min-height: 44px; align-items: center; }
.check input { margin-top: 0; }
.consent .link, .check .link { padding: 6px 0; margin: -6px 0; }  /* agranda el área sin mover el texto */
```

**I5. Pastillas de estado de 11 px con contraste bajo.** "Vence en 1 día" y "Van rápido" (ámbar) tienen 3,46:1. "Quedan $… mil", "Al día · próxima…", "Pagado…" y "no es gasto" (verde) tienen 4,37:1. Son el código de estado de toda la app. Captura: `auditoria-390c-deudas.png`.
```css
:root { --ok-ink: #0B7A4B; --warn-ink: #8A5200; }          /* claro: 5,6:1 y 6,1:1 sobre su fondo */
/* oscuro */ --ok-ink: #3CCB8C; --warn-ink: #F2AE3D;
.pill { font-size: 12px; }
.pill.ok { color: var(--ok-ink); } .pill.warn { color: var(--warn-ink); }
```
Los montos en verde de "Lo último" (`$300.000`, `+$450.000`, 4,37:1) también deben usar `--ok-ink`.

**I6. Marcador de texto visible en la interfaz.** "Contacto [CORREO DE CONTACTO]" aparece en Privacidad y legal y en el texto de autorización. Se ve sin terminar. Captura: `auditoria-390c-legal.png`.
- Antes de publicar: completar el dato (pendiente del dueño, ver abogado.md).
- Mientras tanto: ocultar la fila Contacto si `LEGAL.contacto` contiene `[`.

**I7. Inicio demasiado larga.** Con datos de ejemplo mide **7.400 px**, unas 9 pantallas, con 13 tarjetas. Lo clave (libre, pagos próximos, para hablar) queda bien arriba, pero el presupuesto por categoría y los 6 meses quedan muy abajo. Captura: `auditoria-390c-inicio.png`.
- **Propuesta (de diseno.md, pendiente según desarrollo.md):** dejar en Inicio, en este orden, la tarjeta principal, Pagos que se acercan, Para hablar juntos, ¿A dónde va cada peso?, Presupuesto por categoría (solo las 4 más cercanas al tope) y Lo último. Debajo, un botón **"Ver más del mes"** que despliegue Cuentas claras, Plata personal, Patrimonio, Termómetro y 6 meses.
- **En el hogar vacío:** ocultar Termómetro, Presupuesto y 6 meses hasta que haya un ingreso o un gasto (`auditoria-390c-vacio-inicio.png` muestra tres tarjetas en cero).

## MENOR

- **M1. "y" del logotipo verde en claro (2,85:1, 26 y 56 px).** Es decorativa y de logotipo, pero queda por debajo de 3:1. Recomendado: en claro `.brand .y, .welcome .logo span { color:#0E9A63 }`, que da 3,4:1.
- **M2. Nombres recortados en Distribución a 360 px.** "Hogar y servicios" y "Ropa y cuidado" no caben en el campo de 98 px. Recomendado:
  ```css
  @media (max-width: 380px) { .dist-fila { grid-template-columns: 34px minmax(0,1fr); } .dist-monto { grid-column: 2; } }
  ```
- **M3. Chips de filtro que se salen por la derecha sin aviso.** "De Camila" y "De Sam" quedan a medias en 360 px. Está bien que deslicen, pero falta la pista visual. Recomendado: `.chips { mask-image: linear-gradient(90deg,#000 88%,transparent); }`.
- **M4. Botón "Eliminar…" rosado con texto rojo a 4,37:1.** Afecta a Eliminar gasto, Eliminar gasto fijo y Eliminar definitivamente. Recomendado: `.btn.danger { color:#B4232F }` en claro.
- **M5. Hoja de Logros.** Las insignias bloqueadas en gris se distinguen bien de las ganadas. Falta el contador "3 de 16" en la cabecera de la hoja y no solo como pastilla. Opcional.
- **M6. Deudas vacío.** La tarjeta principal "Lo que deben hoy $0 · Sin deudas activas" repite la ilustración de abajo. Recomendado: ocultar la tarjeta principal cuando no hay deudas.
- **M7. Planes vacío.** "Planes que les alcanzan" se muestra sin ingresos. Recomendado: mostrarlo solo cuando el libre o el tope de diversión sea mayor que 0.

## Lo que está bien y no hay que tocar

- **Detalle de gasto:** la jerarquía es clara, con Editar como botón principal y Eliminar como secundario en rojo. La hoja de pago de fijo y de deuda muestra antes y después ("Quedarán debiendo").
- **Estados vacíos:** las ilustraciones son originales y coherentes con el logo.
- **Gráficas:** el donut interactivo con su tarjeta de detalle y las barras con la rayita de "hoy" y su leyenda explicativa funcionan bien.
- **Logros:** la pantalla de logros es clara y motivadora.
- **Modo oscuro:** cuidado en general.
- **Dimensiones:** no hay scroll horizontal en ninguna pantalla de 360 o 390 px.

## Veredicto

**APRUEBA.** No hay bloqueantes y los 6 puntos del dueño se ven y se usan bien. Pido que la ronda de correcciones aplique **I1 a I6**, que son CSS y textos de bajo riesgo, antes de publicar. I7 puede ir en la siguiente versión.
