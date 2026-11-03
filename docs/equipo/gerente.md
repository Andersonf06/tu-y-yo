# Informe del gerente: visto bueno de TU Y YO v1.1

Fecha: 3 de noviembre de 2026. Versión revisada: commit local `26197b3` (enmienda de `1dde84f`) sobre `076e756`, sin publicar.

## VEREDICTO FINAL: VISTO BUENO

Segunda revisión, sobre `26197b3`. El desarrollador corrigió los 3 contrastes que faltaban. Los medí yo mismo en las pantallas reales de la app, con datos de ejemplo, en Inicio, Gastos, Deudas, Planes, el historial de una deuda, el menú de un gasto fijo, Logros y la vinculación:

| Elemento | Claro | Oscuro | Antes |
|---|---|---|---|
| Pastilla verde (`.pill.ok`, 28 elementos) | 5,13:1 | 6,03:1 | 4,39 en claro |
| Pastilla roja (`.pill.bad`) | 5,17:1 | 4,80:1 | 3,73 en claro |
| Pastilla ámbar (`.pill.warn`) | 4,91:1 | 6,24:1 | bien |
| Inicial "A" (`.av.a`, 11 elementos) | 5,96:1 | 4,53:1 | 3,22 en oscuro |
| Inicial verde "B/C" | 5,16:1 | 7,94:1 | bien |

Todo queda en 4,5:1 o más. La corrección usa `--ok-ink #0A6E44`, `--bad-ink #B4232F` y `.av.a { background: var(--azul-btn) }`.

Pruebas que repetí sobre `26197b3`:

- `t10.py`: 56/56.
- `t-vinc2.py`: 25/25.
- `t-aud3.py` y `t-aud3b.py`: sin XSS y 0 imágenes inyectadas.
- `t-aud2`: 24/24.
- Mi prueba con dos celulares (g2): 30/31. El único fallo es el mismo umbral mal puesto en mi prueba.
- g1: los mismos 3 falsos positivos de antes. La casilla "Discreto" se oculta en los gastos compartidos. El modo vista previa no vuelve a pedir el consentimiento, y g4 confirma que fuera de la vista previa sí lo pide.
- g4: bien.
- `node --check`: bien en todos los `.js`.
- 0 errores de página.
- Capacitor 7.6.10.
- No hay secretos ni archivos pesados en el commit.

No hay regresiones. Lo que sigue es el informe de la primera revisión, que sigue valiendo salvo los contrastes, ya resueltos. Los pendientes del dueño siguen igual: publicar `firestore.rules` en Firebase antes de usar la versión nueva, borrar `hogares/prueba…` y, después, hacer push y generar el APK.

---

## Primera revisión (sobre `1dde84f`): NO APROBADO (falta poco)

Las 6 peticiones del dueño funcionan y no hay bloqueantes técnicos ni legales. Lo único que falta es terminar dos arreglos de contraste de la auditoría de diseño (I1 e I5). Son cambios pequeños de CSS. Con ellos, el visto bueno es inmediato.

**Lo que falta exactamente:**

1. **I5, incompleto.** En modo claro, la pastilla verde (`.pill.ok`) mide **4,39:1** y la roja (`.pill.bad`) **3,73:1**. El mínimo es 4,5:1. Propuesta: `.pill.ok` con texto `#0A6E44` y `.pill.bad` con texto `#B4232F` en claro.
2. **I1, quedó un caso.** En modo oscuro, la inicial blanca de la persona azul (`.av.a`, fondo `--azul` `#6F86FF`) mide **3,22:1**, el mismo problema que tenían los botones. Propuesta: `.av.a { background: var(--azul-btn); }` (con `#4F68F5` da 4,53:1, como los botones ya corregidos).
3. Después de arreglarlo, volver a correr `t-aud2` y la prueba de dos celulares (`g2`) para confirmar que no se rompe nada.

## Cómo verifiqué

No me basé en los informes del equipo. Monté la app (`www/`) con un Firebase simulado que aplica las reglas de `firestore.rules`, y escribí mis propias pruebas con Playwright en Chrome a 390 px, en claro y en oscuro, con **dos celulares a la vez** (persona A y persona B en el mismo hogar). Medí los contrastes sobre los colores que la página pinta de verdad.

| Prueba propia | Resultado |
|---|---|
| g2: dos celulares, las 6 peticiones de punta a punta | 30 de 31 aciertos. El único fallo era un umbral mal puesto en mi prueba (pedía más de 20 gráficas y hay 10), no un defecto de la app |
| g1: regresión en claro y oscuro | Bien, 0 errores de página |
| g3: gasto personal discreto | Bien |
| g4: pedir de nuevo el consentimiento al cambiar la versión legal (sin modo vista previa) | Bien |
| t-aud.py / t-aud2 (pruebas de auditoría técnica) | 21/21 y 24/24 |
| t-aud3 / t-aud3b (XSS) | Sin ejecución de código, 0 imágenes inyectadas |
| `node --check` en app.js, legal.js, recursos.js, voz.js, ocr.js | Sin errores |

## Las 6 peticiones del dueño

| # | Petición | ¿Cumple? | Evidencia |
|---|---|---|---|
| 1 | Solo la pareja puede tocar "Ya lo hablamos" | **Cumple** | `puedeHablar = x => S.modo !== 'nube' \|\| marcoHablar(x) !== yo()`. En g2, quien marcó el tema no ve el botón y la otra persona sí lo ve y lo puede confirmar |
| 2 | Gastos fijos se agregan y se borran libremente | **Cumple** | En g2 se crearon y se borraron fijos desde los dos celulares. La regla permite borrar a cualquier miembro del hogar |
| 3 | Las metas no se suman a los gastos; abonos parciales en fijos bajan lo pendiente | **Cumple** | Los aportes a metas no cambian el total de gastos del mes. Un abono parcial deja el fijo en "parcial" y baja lo pendiente. Queda "pagado" al llegar al 99,5 % |
| 4 | Consentimiento antes de usar, Privacidad y legal en Ajustes, eliminar mis datos, responsable real | **Cumple** | No se entra sin aceptar. Ajustes tiene "Privacidad y legal". "Eliminar el hogar" deja **0 documentos** en la nube. El responsable dice Barrancabermeja y anderson.anderson.hernandez@gmail.com (lo autorizó el dueño). No quedan textos de relleno. Si la versión legal cambia, la app vuelve a pedir el consentimiento (g4) |
| 5 | Borrar y corregir gastos; lista amplia de bancos de Colombia con buscador | **Cumple** | El detalle del gasto tiene "Editar" y "Eliminar gasto", y aviso con "Deshacer". La lista tiene 85 bancos y entidades, y el buscador filtra |
| 6 | Mejores gráficas, animaciones, metas y premios por logros | **Cumple** | Donut con leyenda completa a 390 px, barras y progreso animados, logros que se desbloquean. Con "reducir movimiento" no hay animaciones |

## Auditorías del equipo

| Auditoría | Puntos BLOQUEANTE / IMPORTANTE | Estado |
|---|---|---|
| Técnica | Reglas de Firestore (borrar, tamaños, montos), XSS, validaciones | **Resueltos.** Pruebas propias de reglas y XSS en verde |
| Legal | Consentimiento, responsable real, derechos (Ley 1581 de 2012), eliminar datos, versión de textos | **Resueltos** |
| Diseño I1 (botones oscuros) | Botones a 4,53:1 con `--azul-btn` | **Casi:** falta la inicial "A" en oscuro (3,22:1) |
| Diseño I2 (iniciales verdes) | Claro 5,16:1, oscuro 7,94:1 | **Resuelto** |
| Diseño I3 (leyenda del donut cortada) | Sin nombres cortados a 390 px | **Resuelto** |
| Diseño I4 (zonas de toque) | Ninguna menor de 44 px | **Resuelto** |
| Diseño I5 (pastillas de estado) | Ámbar bien (5,23 claro; 6,23 oscuro). Verde claro 4,39 y roja claro 3,73 | **No resuelto del todo** |
| Diseño I6 (textos) | Revisados en pantalla | **Resuelto** |

## Sin regresiones

Probé de nuevo: vinculación con código, voz, factura (OCR), deudas, distribución con categorías propias, cita, patrimonio, exportar y modo oscuro. Todo funciona igual que antes y no hay errores en la consola.

Empaquetado: `package.json` con Capacitor 7.6.10 y `android/` sincronizado (8 plugins). No hay archivos pesados nuevos ni claves secretas en el commit. La configuración de Firebase del cliente es pública por diseño.

## Riesgos (no bloquean)

- **Tope del aporte en el cliente.** Si se escribe un monto gigante en un aporte a una meta, la app intenta guardarlo y las reglas lo rechazan, pero la persona no ve un mensaje claro. Conviene limitar el campo en la app.
- **Modo vista previa.** Con `TUYYO_PREVIEW` no se vuelve a pedir el consentimiento a quien ya tiene datos. En el APK eso no pasa (g4 lo confirma). Solo afecta a la vista previa web.
- **Llave de firma.** La llave de firma de prueba no sirve para Play Store. Para publicar allá hace falta una llave propia guardada fuera del repositorio.

## Lo que tiene que hacer el dueño

1. **Publicar las reglas nuevas en Firebase:** consola de Firebase → Firestore → Reglas → pegar `firestore.rules` → Publicar. Sin esto, borrar gastos fijos y eliminar el hogar fallan en la nube.
2. Borrar en Firestore el documento de prueba `hogares/prueba…` que quedó de las pruebas anteriores.
3. Cuando el equipo aplique los dos arreglos de contraste de arriba y el gerente dé el visto bueno: hacer push y generar el APK.
4. Si va a publicar en Play Store, crear una llave de firma propia.
