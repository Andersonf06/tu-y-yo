# Seguridad

## Qué está protegido

- **Datos solo para la pareja.** Cada hogar es un documento en Firestore con la lista de sus miembros. Las reglas (`firestore.rules`) solo dejan leer y escribir a esos miembros; nadie puede listar hogares ajenos y todo lo demás está cerrado.
- **Invitación de un solo uso práctico.** El código de invitación lleva un token aleatorio de 144 bits. Las reglas solo dejan unirse a quien presenta ese token, y como máximo a 2 personas. Un miembro no puede cambiar la lista de miembros ni el token.
- **Validación en el servidor.** Solo se aceptan las colecciones de la app, documentos de 20 campos como máximo y valores (`monto`) numéricos, positivos y acotados.
- **Sin secretos en el repositorio.** La configuración web de Firebase no es secreta (la protegen las reglas) y no se guarda en el código: cada usuario la pega en la app. La llave de firma de la APK vive en los *secrets* de GitHub, nunca en git (`.gitignore` excluye `*.jks`, `.env`, APKs y builds).
- **Interfaz.** Todo texto escrito por los usuarios se escapa antes de mostrarse (un `<script>` se ve como texto). La página tiene Content-Security-Policy que solo permite Firebase, las fuentes y el lector de facturas. Los campos tienen etiquetas, los botones son botones reales y el foco es visible.
- **Fotos de facturas.** Se leen en el celular y no se suben a ningún servidor; solo se guardan el valor, la fecha y los productos.
- **Costos.** Firebase en plan Spark no tiene facturación: si se pasa del límite gratuito deja de responder, no cobra.

## Pendiente para ti

- Mantén el proyecto de Firebase en plan **Spark**. Si algún día pasas a Blaze, configura una alerta y un tope de presupuesto en Google Cloud.
- Pega exactamente las reglas de `firestore.rules`. Sin ellas, Firestore en "modo prueba" queda abierto a cualquiera.
- Comparte el código de invitación solo con tu pareja (por chat privado).
- Guarda la copia de la llave de firma (`tuyyo-firma.jks`) y sus contraseñas en un lugar seguro. Si se pierde, las nuevas APK no podrán instalarse encima de la anterior (habría que desinstalar y volver a conectar).
- El inicio de sesión es anónimo y queda ligado al celular. Si desinstalas la app, tu pareja debe compartirte de nuevo el código; mientras el hogar tenga 2 miembros, nadie más puede entrar, así que en ese caso habría que crear un hogar nuevo.
