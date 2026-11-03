# TU Y YO

App Android para llevar el presupuesto en pareja: gastos de cada uno y compartidos, deudas (quién pagó cada cuota), ingresos mensuales, metas de ahorro y planes de diversión que les alcanzan sin tocar el ahorro. Colores azul y verde, animaciones y modo oscuro.

## Descargar la APK

**[Descargar TU-Y-YO.apk (última versión)](https://github.com/Andersonf06/tu-y-yo/releases/latest/download/TU-Y-YO.apk)**

1. Abre el enlace desde el celular Android y descarga el archivo.
2. Ábrelo. Si Android lo pide, permite "Instalar apps desconocidas" para el navegador o el administrador de archivos.
3. Instala y abre TU Y YO. Los dos instalan la misma APK; uno crea el presupuesto y el otro toca "Mi pareja ya lo creó".

Cada cambio que se sube a `main` compila una versión nueva en **Releases**. Como todas usan la misma firma, se instalan encima de la anterior sin perder datos.

## Qué hace

- **Inicio**: cuánto les queda libre este mes (ya descontando la meta de ahorro y las cuotas pendientes), a dónde va cada peso, quién le debe a quién y cuánto pagó cada uno, termómetro de diversión, presupuesto por categoría y los últimos 6 meses.
- **Gastos por voz**: tocas el micrófono y dices, por ejemplo, "Camila pagó 85 mil de cine entre los dos" o "veinte mil en taxi ayer, para mí". La app entiende el valor (también "lucas", "palos", "un millón y medio"), la categoría, quién pagó, de quién es el gasto y si fue ayer o antier; tú solo revisas y guardas. "Me pagaron la prima, 2 millones" se anota como ingreso. Usa el reconocimiento de voz del celular (Google).
- **Escanear factura**: toma la foto y la app lee comercio, fecha, total, productos y adivina la categoría. Solo revisas y guardas. La lectura ocurre en el celular (la primera vez descarga el idioma español, necesita internet).
- **Gastos**: cada gasto dice quién pagó y de quién es (de los dos o de uno). Los compartidos se reparten según ingresos, mitad y mitad o un porcentaje propio.
- **Deudas y tarjetas**: tipo (tarjeta, libre inversión, vehículo, vivienda, educativo, préstamo), banco o a quién se le debe, día de pago, cupo de la tarjeta, tasa (E.A. o mensual), plazo y cuotas pagadas.
  - Al registrar un pago, la app separa intereses y abono a capital, descuenta el saldo y muestra cuánto quedan debiendo.
  - Para cada deuda: lo que deben hoy, cuántos meses faltan, en qué mes terminan, intereses que faltan por pagar y cuánto se ahorran si abonan un poco más.
  - Calendario de pagos con estado (al día, vence en X días, vencida) y recordatorio en el celular el día antes y el día del pago.
  - Deudas conjuntas: dice cuánto le toca a cada uno de la cuota y quién ha pagado; si uno paga de más, queda a su favor en "Cuentas claras".
  - Botón para corregir el saldo con el extracto del banco y el historial de pagos de cada deuda.
- **Distribución del presupuesto**: crean sus propias categorías (nombre, color y grupo: necesidad, gusto o ahorro), renombran u ocultan las que vienen, ponen el tope de cada una en pesos o en % del ingreso y ven en vivo cuánto queda sin asignar y cómo van frente a la guía 50/30/20, contando cuotas de deudas y meta de ahorro.
- **Gastos fijos y suscripciones**: arriendo, servicios, Netflix, gimnasio… se anotan una vez y cada mes se marcan como pagados con un toque. Avisos el día que toca pagar y cuánto cuestan las suscripciones al año.
- **Notas y "para hablar juntos"**: cualquier gasto puede llevar una nota o marcarse para conversarlo; aparece en Inicio hasta que digan "ya lo hablamos".
- **Gastos privados**: un gasto personal puede marcarse como privado (por ejemplo, un regalo sorpresa). La pareja ve el valor pero no el detalle. Es discreción en la pantalla, no cifrado.
- **Plata personal**: un monto al mes para cada uno, sin dar explicaciones, con su barra de lo que queda.
- **Patrimonio**: cuentas, ahorros, CDT, cesantías y bienes, menos las deudas; total y por persona.
- **Cita de dinero mensual**: resumen del mes, en qué se fue la plata, cuentas entre los dos, cuatro preguntas para conversar, acuerdos guardados y racha de meses seguidos.
- **Buscador** en todos los gastos y **exportar** todos los movimientos a Excel (CSV).
- **Planes**: "¿Nos lo podemos permitir?", planes de diversión según lo que les queda, consejos de ahorro y metas con fecha estimada.

## Vincular a la pareja (los dos con el mismo control)

Cada uno instala la APK en su celular. Uno toca **Ajustes → Vincular con mi pareja → Crear código** y le pasa a su pareja el código de 6 letras (por ejemplo `K7M-4QP`). La pareja abre la app, toca **Mi pareja ya lo creó** y lo escribe.

- Los dos ven, agregan, editan y borran todo al instante, incluidos los ajustes y presupuestos.
- Cada movimiento queda firmado por quien lo registró ("Lo último de los dos") y la app avisa cuando la pareja agrega o edita algo.
- El código vence en 48 horas, sirve una sola vez y el hogar acepta solo dos personas.
- Si alguno cambia de celular: **Ajustes → Mi pareja cambió de celular** crea un código nuevo y el celular viejo pierde el acceso.

### Firebase (ya configurado)

La app ya viene conectada al proyecto gratuito de Firebase `tu-y-yo-82a7d` (plan Spark, sin tarjeta: no puede generar cobros), con acceso anónimo, Firestore en modo producción y las reglas de `firestore.rules` publicadas. La configuración está en `www/firebase-config.js`.

Si algún día quieres usar otro proyecto:

1. En <https://console.firebase.google.com> crea un proyecto y quédate en el plan **Spark (gratis)**.
2. **Authentication → Método de acceso → Anónimo → Activar.**
3. **Firestore Database → Crear base de datos** (modo producción). En **Reglas**, pega el contenido de [`firestore.rules`](firestore.rules) y publica.
4. **Configuración del proyecto → Tus apps → Web (`</>`)**: registra la app y copia el `firebaseConfig`.
5. En GitHub: **Settings → Secrets and variables → Actions → Variables → New repository variable**, nombre `FIREBASE_CONFIG`, y como valor el config en JSON, por ejemplo:
   `{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}`
6. Vuelve a compilar (pestaña **Actions → Compilar APK → Run workflow**). Desde esa APK, vincular es solo el código de 6 letras.

Si no se configura `FIREBASE_CONFIG`, la app sigue funcionando sola en cada celular y, al vincular, pide pegar el `firebaseConfig` a mano.

## Privacidad y legal

TU Y YO no tiene publicidad, no vende datos y no usa analítica. Los textos legales (Ley 1581 de 2012) están en [`docs/legal`](docs/legal):

- [Política de Tratamiento de Datos](docs/legal/politica-de-privacidad.md)
- [Términos y Condiciones](docs/legal/terminos-y-condiciones.md)
- [Autorización de tratamiento](docs/legal/autorizacion-tratamiento.md)
- [Cómo eliminar tus datos](docs/legal/eliminacion-de-datos.md)
- [Formulario de Seguridad de los datos de Google Play](docs/legal/google-play-seguridad-datos.md)

En la app: **Ajustes → Privacidad y legal** (política, términos, autorizaciones, exportar y **Eliminar mis datos** de este celular o de todo el hogar).

## Desarrollo

```bash
npm ci
npx cap sync android
cd android && ./gradlew assembleDebug
```

El código de la app está en `www/` (HTML, CSS y JavaScript sin compilar). Ver también [SEGURIDAD.md](SEGURIDAD.md).

## Logo y colores

Los archivos están en [`logo/`](logo): `icono.svg` (ícono completo), `simbolo.svg` (solo el símbolo), `simbolo-azul.svg` (versión de un color) y los PNG en 512 y 1024 px.

El símbolo son dos personas, una azul y una verde, que abrazan juntas una moneda de pesos: la plata de los dos. La paleta es para ambos por igual: azul `#3552E8` (confianza), verde `#13B176` (hogar y ahorro), ámbar `#FFB21E` (la moneda) y noche `#0F1B3D` (fondo del ícono y textos).
