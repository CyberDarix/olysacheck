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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);