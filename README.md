# TU Y YO

App Android para llevar el presupuesto en pareja: gastos de cada uno y compartidos, deudas (quién pagó cada cuota), ingresos mensuales, metas de ahorro y planes de diversión que les alcanzan sin tocar el ahorro. Colores lila, animaciones y modo oscuro.

## Descargar la APK

Ve a **Releases** (a la derecha en GitHub) y descarga `TU-Y-YO.apk` en el celular. Ábrela e instala. Si Android lo pide, permite "Instalar apps desconocidas" para el navegador o el administrador de archivos.

Cada vez que se sube un cambio a `main`, GitHub Actions compila una APK nueva y la publica en Releases.

## Qué hace

- **Inicio**: cuánto les queda libre este mes (ya descontando la meta de ahorro y las cuotas pendientes), a dónde va cada peso, quién le debe a quién y cuánto pagó cada uno, termómetro de diversión, presupuesto por categoría y los últimos 6 meses.
- **Escanear factura**: toma la foto y la app lee comercio, fecha, total, productos y adivina la categoría. Solo revisas y guardas. La lectura ocurre en el celular (la primera vez descarga el idioma español, necesita internet).
- **Gastos**: cada gasto dice quién pagó y de quién es (de los dos o de uno). Los compartidos se reparten según ingresos, mitad y mitad o un porcentaje propio.
- **Deudas y tarjetas**: tipo (tarjeta, libre inversión, vehículo, vivienda, educativo, préstamo), banco o a quién se le debe, día de pago, cupo de la tarjeta, tasa (E.A. o mensual), plazo y cuotas pagadas.
  - Al registrar un pago, la app separa intereses y abono a capital, descuenta el saldo y muestra cuánto quedan debiendo.
  - Para cada deuda: lo que deben hoy, cuántos meses faltan, en qué mes terminan, intereses que faltan por pagar y cuánto se ahorran si abonan un poco más.
  - Calendario de pagos con estado (al día, vence en X días, vencida) y recordatorio en el celular el día antes y el día del pago.
  - Deudas conjuntas: dice cuánto le toca a cada uno de la cuota y quién ha pagado; si uno paga de más, queda a su favor en "Cuentas claras".
  - Botón para corregir el saldo con el extracto del banco y el historial de pagos de cada deuda.
- **Gastos fijos y suscripciones**: arriendo, servicios, Netflix, gimnasio… se anotan una vez y cada mes se marcan como pagados con un toque. Avisos el día que toca pagar y cuánto cuestan las suscripciones al año.
- **Notas y "para hablar juntos"**: cualquier gasto puede llevar una nota o marcarse para conversarlo; aparece en Inicio hasta que digan "ya lo hablamos".
- **Gastos privados**: un gasto personal puede marcarse como privado (por ejemplo, un regalo sorpresa). La pareja ve el valor pero no el detalle. Es discreción en la pantalla, no cifrado.
- **Plata personal**: un monto al mes para cada uno, sin dar explicaciones, con su barra de lo que queda.
- **Patrimonio**: cuentas, ahorros, CDT, cesantías y bienes, menos las deudas; total y por persona.
- **Cita de dinero mensual**: resumen del mes, en qué se fue la plata, cuentas entre los dos, cuatro preguntas para conversar, acuerdos guardados y racha de meses seguidos.
- **Buscador** en todos los gastos y **exportar** todos los movimientos a Excel (CSV).
- **Planes**: "¿Nos lo podemos permitir?", planes de diversión según lo que les queda, consejos de ahorro y metas con fecha estimada.

## Compartir entre los dos celulares (Firebase gratis)

La app funciona sola en un celular desde el primer momento. Para que los dos vean lo mismo en vivo:

1. Entra a <https://console.firebase.google.com> y crea un proyecto. Quédate en el plan **Spark (gratis)**: no pide tarjeta, así que no puede generar cobros.
2. **Authentication → Método de acceso → Anónimo → Activar.**
3. **Firestore Database → Crear base de datos** (modo producción). En la pestaña **Reglas**, borra lo que haya, pega el contenido de [`firestore.rules`](firestore.rules) y publica.
4. **Configuración del proyecto → Tus apps → Web (`</>`)**, registra la app y copia el bloque `firebaseConfig`.
5. En la app: **Ajustes → Conectar con mi pareja**, pega el bloque y toca **Crear nuestro hogar**. Lo que ya tenías en el celular se sube.
6. Comparte el código que aparece. Tu pareja instala la APK, toca **Mi pareja ya lo creó** y lo pega.

## Desarrollo

```bash
npm ci
npx cap sync android
cd android && ./gradlew assembleDebug
```

El código de la app está en `www/` (HTML, CSS y JavaScript sin compilar). Ver también [SEGURIDAD.md](SEGURIDAD.md).
