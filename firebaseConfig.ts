// FIX: The original named import for 'firebase/app' was causing errors. Switched to a namespace import as a workaround for potential bundler or module resolution issues.
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
// Проверяем, инициализировано ли уже приложение, чтобы избежать ошибок при горячей перезагрузке
// FIX: Use functions from the imported namespace.
const app = firebaseApp.getApps().length === 0 ? firebaseApp.initializeApp(firebaseConfig) : firebaseApp.getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
