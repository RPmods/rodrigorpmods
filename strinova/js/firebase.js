var db = null;

(function initFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyBbGRaA5lKaSJLb5fZap0i-067cjvVR1dE",
    authDomain: "draftsimulator-cc68d.firebaseapp.com",
    databaseURL: "https://draftsimulator-cc68d-default-rtdb.firebaseio.com",
    projectId: "draftsimulator-cc68d",
    storageBucket: "draftsimulator-cc68d.appspot.com",
    messagingSenderId: "861506841358",
    appId: "1:861506841358:web:94b8d344f50938fd1b055f"
  };

  try {
    if (!window.firebase) {
      console.warn("Firebase SDK no está disponible. El modo online quedará desactivado.");
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
