# Política de Tratamiento de Datos Personales de TU Y YO

**Versión:** 2026-11-03 · **Vigente desde:** 3 de noviembre de 2026

Esta política explica qué datos personales trata la aplicación TU Y YO, para qué, dónde se guardan y cómo puedes ejercer tus derechos. Se expide en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas colombianas sobre protección de datos personales.

## 1. Responsable del tratamiento

- **Responsable:** Anderson Hernández, persona natural, domiciliado en Barrancabermeja (Santander), Colombia.
- **Correo para consultas, reclamos y solicitudes:** anderson.anderson.hernandez@gmail.com
- **Aplicación:** TU Y YO (Android), código fuente público en github.com/Andersonf06/tu-y-yo.

## 2. Qué es TU Y YO

Es una aplicación gratuita para que una pareja organice su presupuesto: ingresos, gastos, deudas, metas de ahorro y planes. No muestra publicidad, no vende ni alquila datos, no hace perfiles comerciales y no usa herramientas de analítica o seguimiento.

## 3. Datos que se tratan

Todos los datos los escriben, dictan o fotografían los propios usuarios. La app no consulta bancos, centrales de riesgo ni otras fuentes.

- **Identificación básica:** nombre o apodo de cada miembro de la pareja.
- **Datos financieros personales:** ingresos mensuales, ingresos extra, gastos (valor, fecha, descripción, categoría, quién pagó, de quién es el gasto, notas), gastos fijos y suscripciones, deudas (tipo, banco o acreedor, saldo, cuota, tasa, día de pago, cupo, pagos e intereses), metas de ahorro y aportes, cuentas, ahorros, inversiones y bienes con su valor, presupuestos por categoría, plata personal y acuerdos de la "cita de dinero".
- **Datos de uso del hogar:** quién registró o editó cada movimiento y en qué momento.
- **Identificador técnico:** un identificador anónimo que Google Firebase asigna a cada celular cuando la pareja se vincula. No se pide correo, teléfono ni contraseña.
- **Fotos de facturas:** se procesan **solo en el celular** para leer el texto. La foto **no se sube** ni se guarda en la nube; solo se guardan el valor, la fecha, el comercio y los productos que el usuario confirma.
- **Voz:** el dictado usa el servicio de reconocimiento de voz de Google del celular, que puede procesar el audio en servidores de Google conforme a su propia política. A la app solo llega el texto; **TU Y YO no graba ni guarda audio**.
- **Progreso y logros:** insignias, nivel y puntos (XP), rachas y retos que la app calcula con lo que registran; se guardan en el hogar compartido.
- **Registro de autorizaciones:** versión y fecha en que cada uno aceptó esta política; ambos pueden verlo en Ajustes → Privacidad y legal → Mis autorizaciones.
- **Conversaciones pendientes:** quién marcó un gasto «para hablar juntos», quién confirmó que ya lo hablaron y cuándo.

**Datos sensibles:** la app no pide datos sensibles (art. 5 Ley 1581). Sin embargo, algunos gastos que el usuario registre voluntariamente (por ejemplo, de salud) podrían revelar información de ese tipo. Registrarlos es **facultativo**: nadie está obligado a anotar ese tipo de gastos.

**Datos de la otra persona:** quien empieza el presupuesto puede escribir el nombre y los ingresos de su pareja. Quien lo hace declara contar con la autorización de esa persona. Cuando la pareja se vincula desde su celular, da su propia autorización.

**Menores de edad:** la app está dirigida a **mayores de 18 años**. No se recogen datos de niños, niñas ni adolescentes de forma intencional.

## Permisos del celular

- **Cámara y fotos:** solo cuando escaneas una factura; la foto se procesa en el celular y no se sube.
- **Micrófono:** solo mientras dictas (ver «Voz»).
- **Notificaciones:** recordatorios locales de pagos; por defecto no muestran nombres ni montos.
- **Internet:** para sincronizar con tu pareja y descargar una vez el lector de facturas.
- Puedes quitar cualquier permiso en los ajustes de Android; la app sigue funcionando sin él.

## 4. Para qué se usan los datos (finalidades)

1. Mostrar el presupuesto, los gastos, las deudas, las metas y los cálculos de la app (cuánto queda libre, intereses estimados, fecha estimada de pago, sugerencias de distribución).
2. Compartir la información entre los dos miembros de la pareja cuando deciden vincularse.
3. Enviar recordatorios locales en el celular (vencimientos de deudas y gastos fijos), si el usuario los activa.
4. Proteger la información, evitar accesos no autorizados y atender solicitudes de los titulares.

Los datos **no** se usan para publicidad, perfiles comerciales, estudios de crédito ni se entregan a terceros con fines comerciales.

## 5. Dónde se guardan

- **En el celular:** mientras no haya vinculación, los datos se guardan solo en el almacenamiento interno de la app.
- **En la nube (si se vinculan):** en Google Firebase (Cloud Firestore y Firebase Authentication), servicio de Google LLC, con servidores en Estados Unidos (ubicación "nam5"). Google actúa como **encargado** del tratamiento. Las reglas de seguridad solo permiten que los dos miembros del hogar lean y escriban su información.

## 6. Transferencia y transmisión internacional

El uso de Firebase implica una **transmisión internacional** de datos a Estados Unidos, país incluido por la Superintendencia de Industria y Comercio en su lista de países con nivel adecuado de protección (Circular Externa 005 de 2017, Título V de la Circular Única). Además, al vincularse el usuario autoriza de forma **expresa e inequívoca** esta transmisión (art. 26, literal a, Ley 1581 de 2012).

Al usar funciones de la app el celular también se conecta a proveedores técnicos que no reciben tus datos financieros, pero sí ven la dirección IP del celular:
- **Google Fonts:** tipografías.
- **jsDelivr** y **projectnaptha (tessdata):** descarga única del motor de lectura de facturas y del idioma español.
- **Reconocimiento de voz de Google:** se usa solo si dictas; está regulado por la política de privacidad de Google.

## 7. Seguridad

- Las reglas de la base de datos solo dejan entrar a los dos miembros del hogar.
- Solo pueden entrar dos personas. El código de vinculación tiene 6 caracteres, vence en 48 horas y se borra al usarse.
- Las comunicaciones con Firebase van cifradas (HTTPS).
- No hay contraseñas que se puedan filtrar.

**Advertencia importante:** quien tenga el celular desbloqueado puede ver la app. Los "gastos discretos" ocultan el detalle **solo en la pantalla** de la pareja, pero **no son secretos ni están cifrados**: la información queda guardada en el hogar compartido. Ningún sistema es 100 % seguro; ante un incidente que afecte tus datos se informará a la Superintendencia de Industria y Comercio y a los titulares afectados.

## 8. Derechos de los titulares

Como titular tienes derecho a (art. 8 Ley 1581):
1. **Conocer, actualizar y rectificar** tus datos. Puedes hacerlo directamente en la app.
2. **Pedir prueba de la autorización** que diste.
3. **Ser informado** sobre el uso que se da a tus datos.
4. **Presentar quejas ante la Superintendencia de Industria y Comercio** (www.sic.gov.co), después de agotar el trámite de consulta o reclamo ante el responsable.
5. **Revocar la autorización y pedir la supresión** de tus datos.
6. **Acceder gratis** a tus datos personales.

## 9. Cómo ejercer tus derechos

- **Desde la app:** Ajustes → Privacidad y legal. Ahí puedes ver esta política, exportar tus movimientos y usar **Eliminar mis datos**.
- **Por correo:** escribe a anderson.anderson.hernandez@gmail.com con tu nombre, la solicitud, el código o nombre del hogar si lo conoces, y un medio de respuesta.

**Plazos legales:**
- **Consultas:** se responden en máximo **10 días hábiles**. Si no es posible, se te avisará el motivo y la nueva fecha, que no superará **5 días hábiles** adicionales (art. 14 Ley 1581).
- **Reclamos** (corrección, actualización, supresión o incumplimiento): se responden en máximo **15 días hábiles**. Si no es posible, se te avisará el motivo y la nueva fecha, que no superará **8 días hábiles** adicionales. Si el reclamo está incompleto, se te pedirá completarlo en 5 días; si pasan 2 meses sin respuesta, se entiende que desististe (art. 15 Ley 1581).

## 10. Conservación y supresión

- Los datos se conservan mientras uses la app y mientras el hogar exista.
- Si usas **Eliminar mis datos**, se borran los datos del celular y, si estás vinculado, los del hogar compartido en la nube. Esto también los borra para tu pareja, y la app pide confirmación antes de hacerlo.
- Al eliminar tus datos también se borra el registro de tu autorización.
- Si solo desinstalas la app, los datos del hogar en la nube **no se borran automáticamente**: tu pareja los sigue viendo. Para borrarlos usa la opción de la app o escribe al correo de contacto.
- Las copias que Google conserva por razones técnicas se eliminan según sus plazos de servicio.

## 11. Cambios a esta política

Si esta política cambia de forma sustancial, la app lo avisará y pedirá aceptar la nueva versión antes de seguir. La versión y la fecha de aceptación de cada persona quedan registradas.

## 12. Ley aplicable

Esta política se rige por las leyes de la República de Colombia.
