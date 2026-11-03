# Auditoría legal — TU Y YO v1.1

**Auditor legal** · 2 de noviembre de 2026 · Alcance: toda la app, **solo en lo legal** (Ley 1581 de 2012 y Decreto 1377 de 2013, Ley 1480 de 2011, Ley 527 de 1999 y requisitos de Google Play).

**Revisado:** commits `076e756` y `ec33739`, `docs/equipo/desarrollo.md`, `www/app.js`, `www/legal.js`, `firestore.rules`, `AndroidManifest.xml`, `docs/legal/*`. Lo comparé con `docs/equipo/abogado.md`.

## Cómo lo verifiqué

Corrí una simulación de dos celulares con Firebase falso, que aplica las mismas reglas, incluida la nueva de borrado del hogar. El código es el real, no la vista previa. Resultado: **23 de 23 comprobaciones superadas** y 0 errores de página. Las capturas están en `scratchpad/audleg/` (01 a 05).

| Requisito (abogado.md §B) | Resultado |
|---|---|
| Autorización antes de usar, al **crear**: casilla sin marcar; no avanza sin marcarla; casilla de datos de la pareja | Cumple |
| Autorización al **unirse**, sin casilla de terceros | Cumple |
| Registro con versión y fecha **por persona**, en el celular y en `cfg.consentimientos.a` y `.b` en la nube | Cumple (`{version:'2026-11-02', fecha ISO, persona, mayorEdad, terceros}`) |
| Usuario existente: se le pide al abrir, no se puede cerrar con Atrás y tiene la opción "No acepto: eliminar mis datos" | Cumple |
| Ajustes → Privacidad y legal: política, términos, mis autorizaciones, exportar, eliminar, contacto y versión | Cumple (la política se muestra completa) |
| Eliminar mis datos, "todo el hogar" | Cumple: la nube queda en 0 documentos, sin invitaciones, y el otro celular pierde el acceso |
| Eliminar mis datos, borrado local | Cumple: no quedan claves `tuyyo:*` |
| Aviso antes de vincular, al unirse, en el código y al reinvitar | Cumple |
| "Privado" cambiado a **"Discreto"**, con texto honesto | Cumple ("No es secreto: queda guardado en el hogar compartido.") |
| "No es asesoría financiera" en veredicto, estrategia, consejos y curva de deudas; "Estimado…" en deudas | Cumple |
| Notificaciones sin nombres ni montos por defecto, con opción por celular | Cumple (revisión de código: `T0`/`B0` con `montos=false` por defecto) |
| Explicación previa del micrófono y la cámara | Cumple, pero hay un texto impreciso: ver I-1 |
| Aviso antes de exportar | Cumple |
| "Dejar de sincronizar": aviso de que los datos siguen en la nube | Cumple |
| Regla `allow delete` del hogar solo para miembros | Cumple en `firestore.rules`. **Falta publicarla en la consola de Firebase** |
| Sin servidores nuevos ni analítica | Cumple |
| Promesas engañosas (ganancias, seguridad absoluta) | No hay. La política dice "Ningún sistema es 100 % seguro" |

## Hallazgos

### BLOQUEANTE

**B-1. Falta el canal de contacto del responsable.** Ocurre en `www/legal.js` (`contacto` y política), en `docs/legal/*.md` y en Ajustes → Privacidad y legal → Contacto, que hoy muestra al usuario **"[CORREO DE CONTACTO]"**. La política también tiene `[CIUDAD]`.

- **Por qué bloquea:** la política debe identificar al responsable con su domicilio, dirección, correo y teléfono (art. 13 del Decreto 1377 de 2013, compilado en el art. 2.2.2.25.3.1 del Decreto 1074 de 2015). Debe existir además un canal real para consultas y reclamos, con respuesta en 10 y 15 días hábiles (arts. 14 y 15 de la Ley 1581). Google Play también exige un contacto en la política.
- **Corrección:** el dueño entrega un correo del proyecto (no el personal) y la ciudad. Luego se reemplazan los marcadores en `docs/legal/*.md` y en `www/legal.js` (`contacto`, `politica`, `terminos`, `eliminacion`).
- **Comprobar después:** que en la app no quede ningún `[`.

### IMPORTANTE

**I-1. El texto del micrófono es impreciso.** Está en `www/app.js`, en `case 'dictar'` (línea ~2118). Hoy dice: "El reconocimiento lo hace el servicio de voz de Google **en tu celular**…".

- **Riesgo:** el servicio de voz de Google puede enviar el audio a sus servidores para convertirlo en texto, así que afirmar que todo ocurre en el celular no es exacto. Eso choca con el principio de transparencia (art. 4 lit. e Ley 1581), con la información veraz (art. 23 Ley 1480) y con la divulgación destacada de Google Play.
- **Reemplazar por:** "Usaremos el micrófono solo mientras dictas. El dictado lo hace el servicio de voz de Google de tu celular, que puede enviar el audio a Google para convertirlo en texto. A TU Y YO solo llega el texto: la app no graba ni guarda audio."
- **En la política** (sección 4, punto "Voz"), cambiar a: "el dictado usa el servicio de reconocimiento de voz de Google del celular, que puede procesar el audio en servidores de Google conforme a su propia política. A la app solo llega el texto; TU Y YO no graba ni guarda audio."

**I-2. La política no informa los permisos de Android ni las notificaciones.** Afecta a `docs/legal/politica-de-privacidad.md`, a `www/legal.js` (politica) y a `docs/legal/google-play-seguridad-datos.md`. Ninguno menciona cámara, micrófono ni notificaciones.

- **Riesgo:** falta de transparencia sobre el acceso al dispositivo (art. 12 Ley 1581) y riesgo de rechazo en la revisión de permisos de Play.
- **Corrección:** agregar a la política una sección **"Permisos del celular"**:
  - "**Cámara y fotos:** solo cuando escaneas una factura; la foto se procesa en el celular y no se sube."
  - "**Micrófono:** solo mientras dictas (ver Voz)."
  - "**Notificaciones:** recordatorios locales de pagos; por defecto no muestran nombres ni montos."
  - "**Internet:** para sincronizar con tu pareja y descargar una vez el lector de facturas."
  - "Puedes quitar cualquier permiso en los ajustes de Android; la app sigue funcionando sin él."
- **En el formulario de Play:** declarar los mismos tres permisos y su finalidad.

**I-3. La política no menciona los datos nuevos de la v1.1.** Afecta a `docs/legal/politica-de-privacidad.md` (sección "Datos que tratamos") y a `www/legal.js`.

- **Riesgo:** la v1.1 trata datos que el aviso no informa: logros, nivel y XP, rachas y retos; el registro de la autorización de cada persona, que la pareja ve en "Mis autorizaciones"; y las marcas "para hablar" y "hablado" con su fecha. Eso choca con el principio de finalidad (art. 4 lit. b Ley 1581).
- **Agregar:** "**Progreso y logros:** insignias, nivel, rachas y retos que la app calcula con lo que registran; se guardan en el hogar compartido. **Registro de autorizaciones:** versión y fecha en que cada uno aceptó; ambos pueden verlo. **Conversaciones pendientes:** quién marcó un gasto para hablar, quién lo confirmó y cuándo."
- **Al cambiar estos textos:** subir `LEGAL.version` (por ejemplo a `2026-11-03`), para que la app vuelva a pedir la aceptación.

### MENOR

**M-1. El ícono de "Discreto" es un candado.** Está en `www/app.js:829` (`ICON.lock`). El candado sugiere seguridad o cifrado, que no existen. Cambiarlo por un ícono de "ojo tachado".

**M-2. El nivel "Libres financieramente" puede leerse como una promesa de resultado.** Está en `www/app.js:1760` (`NIVELES`). Renombrar a **"Dueños de sus finanzas"** (art. 30 Ley 1480: publicidad engañosa; riesgo bajo).

**M-3. Prueba de la autorización al revocar.** "Eliminar mis datos" borra también el registro local de la autorización. Es correcto con la supresión. Recomiendo que la política diga: "Al eliminar tus datos también se borra el registro de tu autorización."

**M-4. Fuera de mi área.** Al unirse, el aviso dice "Ya estás vinculado con **Persona 2**", porque el nombre se lee antes de cargar la configuración. Lo dejo anotado para el auditor técnico.

## Pendientes del dueño

1. **Correo del proyecto y ciudad**, para B-1.
2. **Publicar la regla nueva de `firestore.rules`** en la consola de Firebase (Firestore → Reglas → Publicar). Sin ella, "todo el hogar" no borra el documento del hogar.
3. Borrar el documento de prueba `hogares/prueba…` en Firestore.
4. **Antes de Google Play:**
   - Consultar la marca en SIPI.
   - Publicar la política y la página de eliminación con una URL pública (sirve el repositorio o GitHub Pages).
   - Llenar "Seguridad de los datos" con I-2 incluido.

## Veredicto

**NO APRUEBA**, por ahora. La implementación cumple los 11 requisitos del memo y pasó las 23 pruebas, pero queda un bloqueante: la app muestra "[CORREO DE CONTACTO]" donde la ley exige un canal real de contacto (B-1). Esto lo resuelve el dueño con un dato.

Con B-1 resuelto, I-1, I-2 e I-3 corregidos y `LEGAL.version` subida, el veredicto pasa a **APRUEBA** sin repetir la auditoría completa. Basta con revisar que no quede ningún `[` en los textos y que el texto del micrófono sea el nuevo.
