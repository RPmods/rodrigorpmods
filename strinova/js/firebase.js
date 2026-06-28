var db = null;

(function exposeRpmodsServicesInitializer() {
  function initRpmodsServices() {
  const injectedConfig = window.RPMODS_SERVICES_CONFIG || window.RPMODS_FIREBASE_CONFIG || null;
  const serviceConfig = injectedConfig && typeof injectedConfig === "object" ? injectedConfig : null;

  function hasValidServiceConfig(config) {
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
      console.warn("RPmods Services no está disponible. El modo online quedará desactivado.");
      window.db = null;
      return;
    }

    if (!hasValidServiceConfig(serviceConfig)) {
      console.warn("RPmods Services no pudo iniciarse porque falta la configuración del entorno.");
      window.db = null;
      return;
    }

    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(serviceConfig);
    db = firebase.database();
    window.db = db;
    window.firebase = firebase;
    console.log("RPmods Services conectado");
  } catch (error) {
    db = null;
    window.db = null;
    console.error("No se pudo inicializar RPmods Services.", error);
  }

    return window.db || null;
  }

  window.initRpmodsServices = initRpmodsServices;
  initRpmodsServices();
})();
