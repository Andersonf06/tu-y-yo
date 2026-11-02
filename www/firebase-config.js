/* Configuración del proyecto Firebase de la app (no es secreta: la protegen las reglas de firestore.rules).
   GitHub Actions la reemplaza al compilar con la variable del repositorio FIREBASE_CONFIG.
   Si queda en null, la app pide pegar la configuración al vincular. */
window.TUYYO_FIREBASE = null;
