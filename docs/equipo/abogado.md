# Memo legal para el equipo de TU Y YO

**De:** Agente abogado experto · **Fecha:** 2 de noviembre de 2026 · **Alcance:** revisión de toda la app solo en lo legal: protección de datos (Ley 1581 de 2012), consumidor (Ley 1480 de 2011), comercio electrónico (Ley 527 de 1999) y requisitos de Google Play.

**Archivos revisados:** `www/app.js`, `www/index.html`, `www/ocr.js`, `www/voz.js`, `firestore.rules`, `android/app/src/main/AndroidManifest.xml`, `README.md`, `SEGURIDAD.md`.

**Entregables listos:**
- `docs/legal/politica-de-privacidad.md`
- `docs/legal/terminos-y-condiciones.md`
- `docs/legal/autorizacion-tratamiento.md`
- `docs/legal/eliminacion-de-datos.md`
- `docs/legal/google-play-seguridad-datos.md`
- `www/legal.js`: `window.LEGAL` con `version`, `politica`, `terminos`, `autorizacion`, `avisoVincular`, `eliminacion`, `noAsesoria` y `contacto`, en HTML simple. El archivo se genera desde los .md: si cambia un texto, se cambia el .md y se regenera.

---

## A. Hallazgos legales (toda la app)

Prioridad: **Alta** = bloquea la publicación o genera riesgo de sanción o de rechazo en Google Play; **Media** = debe corregirse antes de publicar; **Baja** = recomendable.

| # | Prioridad | Dónde | Riesgo | Cambio exacto |
|---|---|---|---|---|
| 1 | Alta | Bienvenida (`vistaBienvenida`, botones "Empezar nuestro presupuesto" y "Mi pareja ya lo creó") | Se tratan datos sin **autorización previa, expresa e informada** (art. 9 Ley 1581; arts. 5 y 7 Decreto 1377). | Antes de `formAjustes(true)` y antes de `formUnirme()`, mostrar la pantalla de autorización con `LEGAL.autorizacion`, la casilla obligatoria **sin marcar**, enlaces a política y términos, y el botón "Aceptar y continuar" deshabilitado hasta marcarla. Aplica a **los dos caminos**: quien se une también debe aceptar. |
| 2 | Alta | Toda la app | No queda **prueba de la autorización** (art. 8 lit. b Ley 1581; art. 7 Decreto 1377). | Guardar por persona `{version, fecha ISO, persona:'a'|'b', mayorEdad:true, terceros:bool}` en `localStorage` (`tuyyo:consentimiento`) y, si están vinculados, en `cfg.consentimientos[a|b]`. Si `LEGAL.version` es más nueva que la aceptada, volver a pedir la aceptación. |
| 3 | Alta | Ajustes | No hay acceso permanente a la política ni a los términos, ni forma de ejercer derechos. | Agregar la sección **Ajustes → Privacidad y legal** con: Política de tratamiento de datos, Términos y condiciones, Mis autorizaciones (versión y fecha), Exportar mis datos, **Eliminar mis datos** y el contacto `LEGAL.contacto`. |
| 4 | Alta | Ajustes (solo existe "Dejar de sincronizar en este celular") y `firestore.rules` (`hogares/{hid}`: `allow delete: if false`) | No hay **supresión** (art. 8 lit. e Ley 1581). Google Play exige borrar la cuenta y sus datos **dentro de la app y por web**. | Botón **Eliminar mis datos** con dos opciones: (a) "Solo este celular": borra `localStorage`, desvincula y llama `auth.currentUser.delete()`; (b) "Todo el hogar": borra todos los documentos de las colecciones del hogar, sus invitaciones y el documento del hogar, luego (a). Pedir confirmación escribiendo ELIMINAR. Cambiar la regla a `allow delete: if signedIn() && request.auth.uid in resource.data.members;`. Publicar el enlace web `docs/legal/eliminacion-de-datos.md`. |
| 5 | Alta | Formulario de gasto: casilla "Privado: mi pareja ve el valor pero no el detalle (ideal para regalos sorpresa)"; ícono con `title="Privado"`; hoja `editarGasto` con "marcó este gasto como privado"; aviso "un gasto personal" | Llamarlo "privado" sugiere confidencialidad que no existe: el dato está en el hogar compartido y sin cifrar. Es información engañosa (art. 23 Ley 1480; principio de transparencia, art. 4 Ley 1581). | Renombrar a **"Discreto"**. Texto de la casilla: **"Discreto: tu pareja ve el valor pero no el detalle en su pantalla. No es secreto: queda guardado en el hogar compartido."** Cambiar `title="Privado"` por `title="Discreto"` y el texto de la hoja por **"{nombre} marcó este gasto como discreto: ves el valor ({monto}), no el detalle."** |
| 6 | Alta | Vincular (`vistaVincular`, `formUnirme`, `vistaCodigo`) | El usuario debe saber, antes de compartir, que la otra persona verá y editará todo, incluidos sus datos. | Antes de "Crear código" y antes de "Vincularme", mostrar `LEGAL.avisoVincular` con el botón "Entiendo, continuar". En `vistaCodigo` agregar: **"Comparte este código solo con tu pareja: con él se puede ver y editar todo el presupuesto."** |
| 7 | Alta | Configuración inicial: campos "Tu pareja" e "Ingreso mensual 2" | Se registran datos de un **tercero** sin su autorización. | En la autorización inicial de quien crea el presupuesto, segunda casilla obligatoria: **"Si escribo datos de mi pareja, declaro que cuento con su autorización."** Cuando la pareja se une, ella da su propia autorización (hallazgo 1). |
| 8 | Media | "¿Nos lo podemos permitir?" ("Sí, se lo pueden dar.", "Mejor esperar un poco."), "Estrategia sugerida", "Consejos para que crezcan los ahorros", "Planes que les alcanzan", intereses e "Intereses por pagar", "Termina", "Si abonan X más…" | Pueden leerse como **asesoría financiera** o como cifras exactas. | Debajo de cada veredicto, de la tarjeta de estrategia y de la sección de consejos, agregar en letra pequeña `LEGAL.noAsesoria`: **"Cálculo orientativo con los datos que ustedes registraron. No es asesoría financiera."** En Deudas, junto a intereses y fecha de fin: **"Estimado. El saldo oficial es el del extracto de tu banco."** |
| 9 | Media | "Mi pareja cambió de celular" (`reinvitar`) | Un miembro puede sacar al otro. Tras una separación, el expulsado pierde acceso a datos que él mismo aportó. | En la confirmación agregar: **"La otra persona dejará de ver el hogar en su celular. Úsalo solo si tu pareja cambió de celular o están de acuerdo."** La política ya prevé que el expulsado pida la supresión o una copia por correo. |
| 10 | Media | Notificaciones locales (`programarRecordatorios`): "Se acerca el pago de Visa Oro", "Bancolombia · Cuota de $300.000…" | Muestran datos financieros en la **pantalla de bloqueo** sin que el usuario lo sepa. | Por defecto, notificación sin montos ni banco: título **"Tienes un pago próximo"** y cuerpo **"Abre TU Y YO para ver el detalle."** En Ajustes, opción "Mostrar montos en las notificaciones" (apagada). En Android, usar visibilidad privada si el plugin lo permite. |
| 11 | Media | Micrófono (`escuchar`) y cámara (`tomarFoto`) | Google Play pide informar el uso de permisos sensibles. El audio lo procesa Google. | Antes del primer permiso de micrófono, mostrar una vez: **"Usaremos el micrófono solo mientras dictas. El reconocimiento lo hace el servicio de voz de Google en tu celular; a TU Y YO solo llega el texto y no guardamos audio."** Para la cámara: **"La foto se lee en tu celular para llenar el gasto y no se sube a internet."** |
| 12 | Media | Exportar (`exportarCSV`) | El archivo sale del control de la app: incluye datos de los dos y puede compartirse por chat. | Antes de exportar, mostrar: **"El archivo incluye movimientos de los dos. Compártelo solo con quien quieras."** |
| 13 | Media | Datos en la nube después de desinstalar | Que los datos queden indefinidamente en la nube sin saberlo vulnera el principio de finalidad y temporalidad. | Ya está en la política (sección 10). En "Dejar de sincronizar" agregar: **"Los datos del hogar siguen en la nube para tu pareja. Para borrarlos usa Eliminar mis datos."** |
| 14 | Media | Edad | La app no verifica la edad (art. 7 Ley 1581, menores). | Ya cubierto con la casilla "Soy mayor de 18 años" (hallazgo 1). En Google Play, público objetivo **18+**. |
| 15 | Media | `index.html`: Google Fonts, `cdn.jsdelivr.net` y `tessdata.projectnaptha.com` | Terceros que reciben la IP del celular. | Ya informado en la política (sección 6). Recomendación técnica opcional: empaquetar las fuentes y el idioma del OCR en la APK para no depender de terceros. |
| 16 | Baja | Nombre y marca "TU Y YO" | Puede existir una marca registrada igual o parecida en la clase 9 o 36. | Antes de publicar en Play, consultar en SIPI de la SIC (sipi.sic.gov.co) y, si está libre, considerar registrar la marca. |
| 17 | Baja | Firestore: documento de prueba `hogares/prueba…` | Es un dato de prueba sin información personal. | Borrarlo desde la consola de Firebase. |
| 18 | Baja | `README.md` y `SEGURIDAD.md` | Faltan enlaces a la política y los términos. | Agregar enlaces a `docs/legal/`. |

**RNBD:** no aplica. Están obligadas a inscribirse en el Registro Nacional de Bases de Datos las sociedades y entidades sin ánimo de lucro con activos totales superiores a 100.000 UVT, y las personas jurídicas públicas (Decreto 090 de 2018). Una persona natural con este proyecto **no está obligada**, pero **sí debe cumplir la Ley 1581**: política, autorización, derechos y seguridad.

**Transferencia internacional:** Firebase (Google LLC, EE. UU.) es un **encargado**, así que se trata de una **transmisión**. Estados Unidos está en la lista de países con nivel adecuado de la SIC (Circular Externa 005 de 2017, numeral 3.2). Además, la autorización expresa del titular cubre la excepción del art. 26 lit. a. La Circular Externa 003 de 2025 de la SIC recomienda las cláusulas modelo de la RIPD para países sin nivel adecuado; no es obligatoria en este caso.

**Datos sensibles:** la app no los pide. Los gastos de salud que registre el usuario son opcionales, y así se informa (art. 6 Ley 1581).

---

## B. Requisitos obligatorios para el desarrollador

1. **Integrar `www/legal.js`** en `index.html` antes de `app.js`. Mostrar los textos con `innerHTML` solo desde `window.LEGAL`: son constantes del paquete, no datos del usuario.
2. **Pantalla de autorización** al empezar y al unirse:
   - Casilla obligatoria sin marcar, más la casilla de terceros para quien crea.
   - Enlaces que abren la política y los términos.
   - Guardar el registro `{version, fecha, persona, mayorEdad, terceros}` en el celular y en `cfg.consentimientos`.
   - Volver a pedirla cuando cambie `LEGAL.version`.
3. **Ajustes → Privacidad y legal:** política, términos, mis autorizaciones, exportar, eliminar mis datos, contacto y la versión de los textos.
4. **Eliminar mis datos:**
   - Opción "solo este celular": local, desvincular y `currentUser.delete()`.
   - Opción "todo el hogar": colecciones `gastos`, `deudas`, `metas`, `aportes`, `ingresos`, `fijos`, `cuentas` y `citas`, las invitaciones del hogar y el documento del hogar.
   - Confirmar escribiendo ELIMINAR.
   - Ajustar `firestore.rules` para permitir que un miembro borre el hogar. Publicar las reglas nuevas en la consola de Firebase.
5. **Avisos al vincular** (antes de crear el código y antes de unirse) y al **reinvitar**.
6. **Renombrar "Privado" a "Discreto"** con los textos del hallazgo 5.
7. **Aviso de no asesoría financiera** en veredictos, estrategia, consejos y proyecciones de deudas.
8. **Notificaciones sin montos** por defecto, con opción para mostrarlos.
9. **Explicación previa** de los permisos de micrófono y cámara (una sola vez).
10. **Aviso antes de exportar.**
11. Nada de lo anterior debe enviar datos a servidores nuevos ni agregar analítica.

---

## C. Pendientes del dueño

1. Crear un **correo de contacto** del proyecto (no personal) y reemplazar `[CORREO DE CONTACTO]` en `docs/legal/*.md`, y regenerar `www/legal.js`.
2. Reemplazar `[CIUDAD]` en la política.
3. Publicar la política y la página de eliminación con URL pública: sirven los enlaces de GitHub del repositorio público, o GitHub Pages.
4. Antes de Google Play:
   - Llenar el formulario Seguridad de los datos con `docs/legal/google-play-seguridad-datos.md`.
   - Declarar el público 18+.
   - Revisar la marca en SIPI.
5. Borrar el documento de prueba en Firestore.
6. Si algún día se agregan analítica, publicidad, pagos o inicio de sesión con correo, **actualizar la política y la versión**.

---

## D. Fuentes

- Ley 1581 de 2012 (arts. 4, 5, 6, 7, 8, 9, 14, 15 y 26): https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981
- Decreto 1377 de 2013: https://sidn.ramajudicial.gov.co/SIDN/NORMATIVA/TEXTOS_COMPLETOS/5_DECRETOS/DECRETOS%202013/Decreto%201377%20de%202013%20(Por%20el%20cual%20se%20reglamenta%20parcialmente%20la%20Ley%201581%20de%202012).pdf
- Protección de datos, guía oficial (Supersociedades): https://supersociedades.gov.co/web/guest/ley-de-proteccion-de-datos
- Circular Externa 005 de 2017, SIC, lista de países con nivel adecuado: https://normas.cra.gov.co/gestor/docs/circular_superindustria_0005_2017.htm
- Circular Externa 003 de 2025, SIC, cláusulas modelo RIPD: https://sedeelectronica.sic.gov.co/sites/default/files/normativa/Circular%20Externa%20003%20de%202025.pdf
- Decreto 090 de 2018 (RNBD): https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=85039 y resumen en https://www.asuntoslegales.com.co/consultorio/y-en-que-termino-el-registro-nacional-de-bases-de-datos-2601424
- Ley 1480 de 2011, Estatuto del Consumidor: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306
- Ley 527 de 1999, mensajes de datos: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=4276
- Google Play, eliminación de cuentas: https://support.google.com/googleplay/android-developer/answer/13327111
- Google, anuncio sobre el control de datos: https://android-developers.googleblog.com/2023/04/giving-people-more-control-over-their-data.html
