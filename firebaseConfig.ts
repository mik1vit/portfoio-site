// FIX: Changed to a namespace import to handle potential module resolution issues.
import * as firebaseApp from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Конфигурация вашего проекта Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDrbTjXIqwCJ95dB6DsJziPjx6HP_zhN5A",
  authDomain: "mydevelopersite-4dfa6.firebaseapp.com",
  projectId: "mydevelopersite-4dfa6",
  storageBucket: "mydevelopersite-4dfa6.appspot.com",
  messagingSenderId: "41198735821",
  appId: "1:41198735821:web:fd4c4d544cf6244dd83484"
};

// Инициализация Firebase
const app = firebaseApp.initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
