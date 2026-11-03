# Auditoría técnica y de seguridad — TU Y YO v1.1

Auditor técnico y de seguridad. Alcance: corrección del código, seguridad, reglas de Firestore, rendimiento, compatibilidad con Android/WebView e integridad de los datos entre los dos celulares.
Base revisada: commits locales `076e756` y `ec33739` comparados con `origin/main`. Cambian `www/app.js` (+974), `styles.css`, `index.html`, `legal.js`, `recursos.js` y `firestore.rules`. También revisé `docs/equipo/desarrollo.md`.
Fecha: 2026-11-02.

## Veredicto: **NO APRUEBA** (2 bloqueantes, ambos de corrección rápida)

Lo funcional está sólido: todas las pruebas pasan y no encontré errores de lógica en los 6 puntos del dueño. No apruebo por dos razones de seguridad: una vía de inyección de código entre celulares (XSS) y una dependencia con una vulnerabilidad crítica publicada. Con esas dos correcciones, y volviendo a correr las pruebas, cambia a APRUEBA.

---

## BLOQUEANTES

### B1. XSS almacenado por campos que no son texto libre (color de categoría, `plazo`, `metaAhorroPct`)
- **Dónde:** `www/app.js:67` (`refrescarCats` copia `x.c` de `cfg.categorias` sin validarlo). El color se inserta sin escapar en `app.js:623` (`stroke="${p.col}"`), `app.js:637` (`background:${… k.c}`), `app.js:683` (`style="background:${p.col}"`) y `app.js:1289` (`CAT.deudas?.c`). Con el mismo patrón, se concatenan sin `esc()` los campos `d.plazo` (`app.js:923`, `' de ' + d.plazo`) y `S.cfg.metaAhorroPct` (`app.js:650` y `app.js:1290`).
- **Por qué importa:** las reglas de Firestore no validan el tipo de `cfg` ni de esos campos. La pareja, o cualquier celular vinculado con la app modificada o con una llamada REST, puede guardar un "color" con comillas y HTML. Ese código corre dentro del WebView del otro celular, donde hay complementos de Capacitor: Filesystem, Share y Camera.
- **Reproducido** (`scratchpad/t-aud3.py`): pongo `cfg.categorias = [{id:'mercado', c:'#123456"…><img src=x onerror="window.__xss=7">'}]` y recargo. Resultado: `window.__xss = 7`, con un `<img src=x>` inyectado en el DOM. Los textos libres sí están bien escapados: envenené todos los campos de texto de todas las colecciones y recorrí todas las pantallas sin que se ejecutara nada (ver Pruebas).
- **Corrección exacta:**
  1. En `refrescarCats` (`app.js:67`): `c: /^#[0-9a-fA-F]{6}$/.test(x.c) ? x.c : (b?.c || '#8C8399')`.
  2. Sanear los tipos al recibir datos de la nube. En `app.js:202`, después de `Object.assign`, forzar números: `metaAhorroPct = Math.min(90, Math.max(0, Number(cfg.metaAhorroPct) || 0))`, hacer lo mismo con `pctA`, `ingresos.a/b` y `mesada.a/b`, y limpiar `presupuestos` dejando solo valores numéricos.
  3. En `app.js:216`, normalizar por colección los campos numéricos que se pintan: `plazo`, `cuotasPrevias`, `dia`, `tasa`, `cuota`, `saldoInicial`, `cupo` (con `Number(...) || null`).
  4. Como defensa adicional, envolver en `esc()` los valores de las líneas citadas.

### B2. `@capacitor/android` 7.4.4 tiene una vulnerabilidad crítica publicada
- **Dónde:** `package.json`, en `@capacitor/android`, `@capacitor/core` y `@capacitor/cli` 7.4.4.
- **Qué es:** GHSA-rvm3-566m-v7fv, *"remote content can be loaded at the app origin via the internal HTTP proxy path"*. Afecta las versiones `>=7.0.0 <7.6.9` y la detecta `npm audit --omit=dev` como **critical**.
- **Corrección:** subir `@capacitor/android`, `@capacitor/core` y `@capacitor/cli` a `7.6.10`, que es compatible dentro de la serie 7. Luego correr `npm install`, `npx cap sync android` y volver a compilar en GitHub Actions. No requiere cambios en el código de la app.

---

## IMPORTANTES

### I1. Las reglas no fijan los tipos de `cfg` ni de los campos numéricos
- **Dónde:** `firestore.rules`, en la actualización del hogar (rama 1, `cfg` libre) y en la validación de subcolecciones, que solo controla `monto` y `por`.
- **Riesgo:** es la causa de fondo de B1, y además un dato mal formado puede dejar la app del otro celular en `NaN`.
- **Corrección (defensa en profundidad):**
  - En la rama 1 del `update` del hogar, agregar `&& (!('metaAhorroPct' in request.resource.data.cfg) || request.resource.data.cfg.metaAhorroPct is number)`, y lo mismo para `pctA`.
  - En `match /{col}/{docId}`, agregar para `plazo`, `cuota`, `saldoInicial`, `dia` y `tasa`: `(!('plazo' in request.resource.data) || request.resource.data.plazo is number || request.resource.data.plazo == null)`.
  - Lo principal sigue siendo el saneamiento en el cliente (B1). Las reglas solo complementan.

### I2. Consentimiento de las dos personas: se escribe el mapa completo y pueden pisarse
- **Dónde:** `app.js:1689`, `Store.guardarCampoCfg('consentimientos', { ...(S.cfg.consentimientos || {}), [p]: … })`.
- **Escenario:** si las dos personas aceptan casi a la vez, por ejemplo justo después de vincularse o al actualizar las dos a v1.1, la última escritura reemplaza todo el mapa y se pierde el registro de la otra persona. Es la prueba legal de la autorización (Ley 1581).
- **Corrección:** escribir solo el campo de cada persona: `this.hogar.update({ ['cfg.consentimientos.' + p]: rec })`, o pasar a `guardarCampoCfg` la ruta `'consentimientos.' + p`. Hacer lo mismo con `logros` (`app.js:1854`), usando `'logros.' + k` por cada logro nuevo.

---

## MENORES

1. **"Ya lo hablamos" y la autoría solo se protegen en el cliente.**
   - `revisarPor`, `habladoPor` y `por` son campos que el propio cliente escribe (`app.js:817-818`, `2175` y `2359`). La regla solo exige que `por ∈ {a,b}`.
   - Un miembro con la app modificada podría marcar como hablado lo que él mismo pidió.
   - Entre dos miembros de confianza es aceptable. Si se quiere en el servidor, la regla debería guardar el uid de quien marca en lugar de `a/b`.
   - Basta con dejarlo documentado.
2. **Borrado del hogar con escrituras en curso.**
   - `eliminarHogar` (`app.js:305-317`) borra las subcolecciones y después el hogar.
   - Si la pareja escribe justo en medio, puede quedar un documento huérfano que ya nadie puede leer ni borrar, porque `isMember` falla sin el hogar.
   - Corrección: volver a consultar cada subcolección justo antes de `ref.delete()`, o borrar el hogar en dos pasadas.
3. **"Eliminar solo este celular" deja un uid muerto en `members`.**
   - `borrarEsteCelular` (`app.js:318`) borra la cuenta anónima, pero el hogar sigue con 2 miembros.
   - La pareja tiene que usar "Mi pareja cambió de celular" para invitar de nuevo.
   - Sugerencia: antes de borrar la cuenta, quitarse de `members` con una regla nueva del tipo "un miembro puede quitarse a sí mismo", o mostrar el aviso a la pareja.
4. **Las invitaciones creadas por la pareja no se borran en "todo el hogar".**
   - Solo se borra la invitación guardada en el celular propio (`app.js:313-314`).
   - Las demás vencen en 48 h y solo exponen el id de un hogar ya inexistente, así que el riesgo es bajo.
5. **Ajustes y Distribución reemplazan todo `cfg`.**
   - `guardarCfg` (`app.js:293-295`, llamado en `2403` y `2489`) envía `cfg` completo.
   - Si la pareja cambió otra clave en ese mismo instante, se pierde. La ventana es pequeña porque `S.cfg` está vivo.
   - Corrección: `update` por ruta (`cfg.presupuestos`, `cfg.categorias`, `cfg.nombres`, etc.).
6. **Compatibilidad con WebView antiguos.**
   - `:has()` (`styles.css:266`, `270` y `546`) necesita Chrome 105 o superior, y `color-mix()` (14 usos) necesita Chrome 111 o superior.
   - Con `minSdk 23` y un WebView sin actualizar, se pierden el estado "seleccionado" de los segmentos y categorías y los fondos de las píldoras. La app no se rompe.
   - Sugerencia: agregar reglas `@supports not selector(:has(*))` o usar clases `.on`, y un color de respaldo antes de cada `color-mix()`.
7. **CSP con `'unsafe-inline'` y `'unsafe-eval'` en `script-src`** (`index.html:8`).
   - Ya venía así y lo necesitan Tesseract y el estilo de la app.
   - Agrava cualquier XSS, así que B1 tiene prioridad.
   - Se puede quitar `'unsafe-inline'` de `script-src` porque no hay `<script>` inline en la APK. Hay que probar el OCR después del cambio.
8. **Dependencias de desarrollo** (`@capacitor/assets` → `sharp`/libvips): `npm audit` reporta 2 críticas y 3 altas, pero solo están en el equipo de compilación y no entran en la APK. Conviene actualizarlas cuando haya tiempo.
9. **Tamaño del repositorio.** `docs/equipo/capturas` pesa 48 MB y tiene 53 archivos versionados. El gerente debe decidir si se sacan del commit antes del push, por ejemplo con `.gitignore` y `git rm --cached`.

---

## Pruebas ejecutadas (todas desde cero, sobre los commits auditados)

| Suite | Resultado |
|---|---|
| `node --check` de `app.js`, `ocr.js`, `voz.js`, `legal.js`, `recursos.js` y `firebase-config.js` | OK |
| Vista previa del desarrollador `t10.py` (claro y oscuro) | **56 / 56**, 0 errores de página |
| Dos celulares con Firebase simulado y modelo de reglas `t-vinc2.py` | **24 / 24**; los denegados esperados son 403 para el tercero y para el celular sin acceso |
| Auditoría `t-aud.py` (nueva) | **21 / 21** |
| ↳ XSS: todos los textos de todas las colecciones y los nombres envenenados con `<img onerror>`, recorriendo Inicio, Gastos, Deudas, Planes, detalles, Ajustes, Distribución, Cuentas, Cita, Logros, Legal y el buscador | no se ejecuta nada y no queda `<img src=x>` |
| ↳ Monto 9.999.999.999 | se guarda y se muestra bien; más de 10.000 millones se rechaza |
| ↳ Sin ingresos (Inicio, Distribución, Cita) | sin `NaN` ni `Infinity` |
| ↳ Reloj en 31-ene-2027, 29-feb-2028 y 31-dic-2026, con gasto fijo del día 31 y 3 meses hacia adelante | sin `NaN`, `Invalid` ni `undefined`; calendario de deudas correcto |
| ↳ `prefers-reduced-motion` | no hay confeti; 0 errores |
| Celular de la pareja tras "todo el hogar" (`t-aud2.py`) | vuelve a la bienvenida con la conexión borrada. Correcto |
| **XSS por color de categoría** (`t-aud3.py`) | **FALLA**: `window.__xss = 7` (ver B1) |
| `npm audit --omit=dev` | **1 crítica** en `@capacitor/android` (ver B2) |
| Búsqueda de secretos en el repositorio | solo la configuración web de Firebase, que no es secreta. La llave de firma pública está documentada en `SEGURIDAD.md` |

**Reglas de Firestore** (`firestore.rules`):
- Solo un miembro puede borrar el hogar (`resource.data.members`).
- Nadie puede entrar como tercer miembro: el tamaño de `members` debe ser menor que 2 y la lista solo se concatena con el uid propio.
- Un código vencido o inexistente devuelve 403 al leerse.
- Listar hogares o invitaciones está prohibido, y el resto de rutas está cerrado.
- **Pendiente:** publicar en la consola de Firebase la nueva regla de borrado del hogar. Hoy el Firebase real todavía tiene `allow delete: if false`, así que "todo el hogar" fallaría en el último paso.

**Integridad entre los dos celulares:**
- Los abonos parciales, "Ya lo hablamos", los avisos y el borrado se sincronizan bien en la simulación.
- El riesgo de que una escritura pise a otra se concentra en I2 y en el menor 5.
