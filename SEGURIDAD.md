# Seguridad

## Qué está protegido

- **Datos solo para la pareja.** Cada hogar es un documento en Firestore con la lista de sus miembros. Las reglas (`firestore.rules`) solo dejan leer y escribir a esos miembros; nadie puede listar hogares ajenos y todo lo demás está cerrado.
- **Vinculación con código corto.** El código de 6 caracteres (887 millones de combinaciones) apunta a una invitación que vence en 48 horas, no se puede listar y se borra al usarse. Solo un miembro del hogar puede crearla y solo con el token secreto real del hogar (144 bits). Para entrar hay que presentar ese token, y el hogar acepta máximo 2 personas.
- **Mismo control para los dos.** Ambos miembros leen y escriben todo, incluidos los ajustes. Ninguno puede agregar a un tercero. "Mi pareja cambió de celular" deja al miembro solo con un token nuevo; el celular anterior pierde el acceso de inmediato.
- **Autoría.** Cada documento guarda quién lo creó (`por`) y quién lo editó; las reglas solo aceptan los valores `a` o `b`.
- **Validación en el servidor y en el cliente.** Solo se aceptan las colecciones de la app, documentos de 30 campos como máximo, `monto` numérico y acotado, campos numéricos de deudas, metas y cuentas como número, y la configuración con sus tipos. Además la app sanea todo lo que llega de la nube (colores `#RRGGBB`, ids, números y enumeraciones) antes de pintarlo, para que un dato manipulado no pueda inyectar código.
- **Sin secretos en el repositorio.** La configuración web de Firebase no es secreta (la protegen las reglas); igual no se guarda en el código: GitHub Actions la incluye al compilar desde la variable `FIREBASE_CONFIG`. La llave de firma de la APK vive en los *secrets* de GitHub, nunca en git (`.gitignore` excluye `*.jks`, `.env`, APKs y builds).
- **Interfaz.** Todo texto escrito por los usuarios se escapa antes de mostrarse (un `<script>` se ve como texto). La página tiene Content-Security-Policy que solo permite Firebase, las fuentes y el lector de facturas. Los campos tienen etiquetas, los botones son botones reales y el foco es visible.
- **Voz.** El dictado usa el reconocimiento de voz del celular (Google); a la app solo llega el texto, que se interpreta en el teléfono. No se guarda audio.
- **Fotos de facturas.** Se leen en el celular y no se suben a ningún servidor; solo se guardan el valor, la fecha y los productos.
- **Tus datos, tu decisión.** Al empezar y al unirse se pide una autorización expresa (casilla sin marcar) que queda registrada con su versión en el celular y en el hogar. **Ajustes → Privacidad y legal → Eliminar mis datos** borra este celular (incluida la cuenta anónima) o todo el hogar en la nube; las reglas permiten que cualquiera de los dos miembros borre el hogar. Las notificaciones no muestran nombres ni montos salvo que se active la opción. Ver [`docs/legal`](docs/legal).
- **Costos.** Firebase en plan Spark no tiene facturación: si se pasa del límite gratuito deja de responder, no cobra.

## Firma de la APK

La APK se firma con `android/app/firma-publica.jks`, una llave cuya contraseña está en el repositorio. Sirve para instalar la app directamente y actualizarla encima sin perder datos. No es privada: si algún día publicas en Google Play, crea una llave privada y guárdala en los secretos del repositorio (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`); el flujo de compilación ya la usa si existe.

## Lo que se probó

- Simulación con cuatro celulares (dos navegadores por persona) y una base que aplica las mismas reglas: crear código, unirse, ver y editar datos del otro, avisos, cambiar de celular, y un tercero que intenta entrar con un código usado (rechazado).
- Reglas verificadas contra el proyecto real de Firebase con 16 pruebas: la pareja lee, escribe, se une con el código y cambia ajustes; un tercero recibe 403 al leer, escribir, listar o unirse; montos negativos y colecciones desconocidas se rechazan. Quedó un documento de prueba `hogares/prueba…` sin datos personales que puedes borrar desde la consola.

## Pendiente para ti

- **Publica las reglas nuevas** de `firestore.rules` en la consola de Firebase (Firestore → Reglas → Publicar). Cambió una línea: `allow delete` del hogar ahora permite que un miembro lo borre (necesario para «Eliminar mis datos → todo el hogar»), y ahora también se validan los tipos de la configuración (`cfgOk`) y de los campos numéricos (`numerosOk`). Sigue en plan Spark, sin costo.

- Mantén el proyecto de Firebase en plan **Spark**. Si algún día pasas a Blaze, configura una alerta y un tope de presupuesto en Google Cloud.
- Pega exactamente las reglas de `firestore.rules`. Sin ellas, Firestore en "modo prueba" queda abierto a cualquiera.
- Comparte el código de invitación solo con tu pareja (por chat privado).
- Guarda la copia de la llave de firma (`tuyyo-firma.jks`) y sus contraseñas en un lugar seguro. Si se pierde, las nuevas APK no podrán instalarse encima de la anterior (habría que desinstalar y volver a conectar).
- El inicio de sesión es anónimo y queda ligado al celular. Si alguno desinstala la app o cambia de celular, el otro usa **Ajustes → Mi pareja cambió de celular** para darle un código nuevo.
