// Используем стандартные именованные импорты для всех модулей Firebase для обеспечения согласованности и надежности.
import { initializeApp, getApps, getApp } from "firebase/app";
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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
