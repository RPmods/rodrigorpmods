var db = null;

(function initFirebase() {
  const injectedConfig = window.RPMODS_FIREBASE_CONFIG || null;
  const firebaseConfig = injectedConfig && typeof injectedConfig === "object" ? injectedConfig : null;

  function hasValidFirebaseConfig(config) {
    return Boolean(
      config &&
      typeof config.apiKey === "string" &&
      config.apiKey.trim() &&
      !config.apiKey.includes("__") &&
      typeof config.authDomain === "string" &&
      config.authDomain.trim() &&
      typeof config.databaseURL === "string" &&
      config.databaseURL.trim() &&
      typeof config.projectId === "string" &&
      config.projectId.trim() &&
      typeof config.appId === "string" &&
      config.appId.trim()
    );
  }

  try {
    if (!window.firebase) {
      console.warn("Firebase SDK no está disponible. El modo online quedará desactivado.");
      window.db = null;
      return;
    }

    if (!hasValidFirebaseConfig(firebaseConfig)) {
      console.warn(
        "Firebase no fue inicializado: falta js/firebase-env.js o contiene variables sin configurar. " +
        "En GitHub Pages usa el workflow con Repository Secrets. En local crea js/firebase-env.js a partir de js/firebase-env.example.js."
      );
      window.db = null;
      return;
    }

    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    db = firebase.database();
    window.db = db;
    window.firebase = firebase;
    console.log("Firebase conectado");
  } catch (error) {
    db = null;
    window.db = null;
    console.error("No se pudo inicializar Firebase.", error);
  }
})();
