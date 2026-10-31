# TU Y YO

App Android para llevar el presupuesto en pareja: gastos de cada uno y compartidos, deudas (quién pagó cada cuota), ingresos mensuales, metas de ahorro y planes de diversión que les alcanzan sin tocar el ahorro. Colores lila, animaciones y modo oscuro.

## Descargar la APK

Ve a **Releases** (a la derecha en GitHub) y descarga `TU-Y-YO.apk` en el celular. Ábrela e instala. Si Android lo pide, permite "Instalar apps desconocidas" para el navegador o el administrador de archivos.

Cada vez que se sube un cambio a `main`, GitHub Actions compila una APK nueva y la publica en Releases.

## Qué hace

- **Inicio**: cuánto les queda libre este mes (ya descontando la meta de ahorro y las cuotas pendientes), a dónde va cada peso, quién le debe a quién y cuánto pagó cada uno, termómetro de diversión, presupuesto por categoría y los últimos 6 meses.
- **Escanear factura**: toma la foto y la app lee comercio, fecha, total, productos y adivina la categoría. Solo revisas y guardas. La lectura ocurre en el celular (la primera vez descarga el idioma español, necesita internet).
- **Gastos**: cada gasto dice quién pagó y de quién es (de los dos o de uno). Los compartidos se reparten según ingresos, mitad y mitad o un porcentaje propio.
- **Deudas**: saldo, cuota, meses que faltan, cuánto ha pagado cada uno y qué deuda conviene liquidar primero (bola de nieve o tasa más alta).
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
