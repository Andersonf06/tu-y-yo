# Autorización para el tratamiento de datos personales (pantalla inicial)

Texto para mostrar **antes** de usar la app y antes de unirse a un hogar. La casilla debe venir **sin marcar** y ser obligatoria para continuar (Ley 1581 de 2012, art. 9; Decreto 1377 de 2013, arts. 5 y 7: autorización previa, expresa e informada, obtenida por un medio que permita consultarla después).

---

**Antes de empezar**

TU Y YO guarda lo que ustedes registren: nombres, ingresos, gastos, deudas, metas y cuentas. Lo usamos solo para mostrarles su presupuesto y, si se vinculan, para compartirlo entre los dos. No hay publicidad, no vendemos datos y no es asesoría financiera.

- Si se vinculan, los datos se guardan en Google Firebase, con servidores en Estados Unidos, y **tu pareja verá y podrá editar todo lo del hogar**.
- Las fotos de facturas se leen en el celular y no se suben. Del dictado solo llega el texto.
- Puedes consultar, corregir, exportar o eliminar tus datos cuando quieras en Ajustes → Privacidad y legal, o escribiendo a [CORREO DE CONTACTO].
- Registrar gastos de salud u otros datos sensibles es opcional.

☐ **Soy mayor de 18 años, leí y acepto la [Política de Tratamiento de Datos] y los [Términos y Condiciones], y autorizo el tratamiento de mis datos para estas finalidades, incluida su transmisión a Google Firebase en Estados Unidos.** *(obligatoria)*

☐ **Si escribo datos de mi pareja, declaro que cuento con su autorización.** *(obligatoria solo para quien crea el presupuesto)*

[ Aceptar y continuar ]

---

## Aviso al vincular (antes de crear o usar el código)

**Al vincularse, todo se comparte**

Tú y tu pareja verán y podrán editar todos los gastos, deudas, metas, cuentas, notas y ajustes del hogar. Los gastos discretos solo ocultan el detalle en la pantalla; no son secretos. Comparte el código solo con tu pareja.

[ Entiendo, continuar ]

## Qué guardar como prueba de la autorización

Por cada persona, guarda: `{ version: '2026-11-02', fecha: <ISO>, persona: 'a'|'b', mayorEdad: true, terceros: true|false }`. Guárdalo en el celular y, si están vinculados, en el hogar (`cfg.consentimientos.a` / `cfg.consentimientos.b`). Si cambia la versión, la app debe pedir aceptar de nuevo.
