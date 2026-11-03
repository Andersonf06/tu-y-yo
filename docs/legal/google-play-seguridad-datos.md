# Respuestas para el formulario "Seguridad de los datos" de Google Play

Respuestas para la sección Seguridad de los datos de Play Console, según el funcionamiento actual de TU Y YO. Revísalas si la app cambia.

## Preguntas generales

| Pregunta | Respuesta |
|---|---|
| ¿Tu app recopila o comparte alguno de los tipos de datos del usuario requeridos? | **Sí** (cuando la pareja se vincula, los datos se envían a Firebase). |
| ¿Todos los datos del usuario que recopila tu app se encriptan en tránsito? | **Sí** (HTTPS/TLS hacia Firebase). |
| ¿Proporcionas una forma para que los usuarios soliciten que se borren sus datos? | **Sí**: en la app (Ajustes → Privacidad y legal → Eliminar mis datos) y por web (enlace a `docs/legal/eliminacion-de-datos.md` del repositorio o la página que publiques). |
| URL de eliminación de cuenta | `https://github.com/Andersonf06/tu-y-yo/blob/main/docs/legal/eliminacion-de-datos.md` |
| URL de la política de privacidad | `https://github.com/Andersonf06/tu-y-yo/blob/main/docs/legal/politica-de-privacidad.md` |

## Tipos de datos

Para todos los tipos: **recopilado** = sí (solo si se vinculan; sin vincular se queda en el celular), **compartido con terceros** = no (Google Firebase es proveedor de servicio: no cuenta como "compartido"), **procesamiento efímero** = no, **obligatorio u opcional** = como se indica.

| Categoría de Play | Tipo | Finalidad | ¿Opcional? |
|---|---|---|---|
| Información personal | Nombre (nombre o apodo de cada miembro) | Funcionalidad de la app | Obligatorio para usar la app |
| Información financiera | Otra información financiera (ingresos, gastos, deudas, metas, cuentas) | Funcionalidad de la app | El usuario decide qué registra |
| Fotos y videos | Fotos (facturas) | — | **No se recopila**: se procesa en el dispositivo y no sale de él |
| Audio | Grabaciones de voz | — | **No se recopila**: el reconocimiento lo hace el servicio del sistema; la app recibe solo texto |
| IDs del dispositivo u otros | ID de usuario anónimo de Firebase | Funcionalidad de la app, seguridad | Obligatorio para vincular |
| Actividad en la app | Otro contenido generado por el usuario (notas, acuerdos de la cita de dinero) | Funcionalidad de la app | Opcional |

**No se recopila:** ubicación, contactos, correo, teléfono, historial web, identificadores de publicidad, datos de salud como categoría (los gastos de salud son información financiera ingresada por el usuario), compras, mensajes ni diagnósticos o analítica.

## Prácticas de seguridad que puedes declarar

- Datos encriptados en tránsito: **sí**.
- El usuario puede solicitar el borrado: **sí**.
- Revisión de seguridad independiente: **no** (no declarar).
- Cumple la política de Familias: **no aplica** (app para mayores de 18).

## Clasificación de contenido y público objetivo

- Público objetivo: **18 años o más**.
- Categoría sugerida: Finanzas.

## Declaración de app financiera (Play Console → Contenido de la app → Funciones financieras)

Marcar **"Mi app no ofrece funciones financieras reguladas"** o la opción equivalente a "seguimiento y presupuesto personal". La app no presta servicios bancarios, de préstamos, de pagos ni de inversión.


## Permisos declarados (con su finalidad)

| Permiso | Finalidad | ¿Sale del celular? |
|---|---|---|
| Cámara / fotos | Escanear facturas para llenar un gasto | No: la foto se procesa en el celular |
| Micrófono | Dictar gastos | El servicio de voz de Google puede procesar el audio; a la app solo llega el texto y no se guarda audio |
| Notificaciones | Recordatorios locales de pagos, sin nombres ni montos por defecto | No |
