// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYHmmhHUaazXwbEbiEHYl0JgNUWKn6fuQ",
  authDomain: "olysacheck.firebaseapp.com",
  databaseURL: "https://olysacheck-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "olysacheck",
  storageBucket: "olysacheck.firebasestorage.app",
  messagingSenderId: "45624836935",
  appId: "1:45624836935:web:0cab6668ebf2aa63c04262",
  measurementId: "G-TXQQPPP7J2"
};

// ═══════════════════════════════════════════════════════════════
//   🛡️ AJOUT SÉCURISÉ : Initialisation robuste de Firebase
// ═══════════════════════════════════════════════════════════════

let app;
let analytics;

try {
  // Vérifier que les dépendances sont bien chargées
  if (typeof initializeApp !== 'function') {
    throw new Error('Firebase SDK (initializeApp) non chargé correctement.');
  }

  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');

  // Analytics n'est disponible que dans un environnement navigateur
  if (typeof window !== 'undefined' && typeof getAnalytics === 'function') {
    analytics = getAnalytics(app);
    console.log('✅ Firebase Analytics initialized');
  } else {
    console.warn('⚠️ Analytics skipped (non-browser environment)');
  }

} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  // Optionnel : envoyer l'erreur à un service de monitoring
}

// ═══════════════════════════════════════════════════════════════
//   Exporter les instances pour les utiliser dans d'autres modules
// ═══════════════════════════════════════════════════════════════
export { app, analytics };