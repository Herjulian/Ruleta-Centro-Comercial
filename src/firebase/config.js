// Archivo: src/firebase/config.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'


//Configuración de Firebase Web
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

//Se inicia la conexión
const app = initializeApp(firebaseConfig);

//inicializamos la base de datos
const db = getFirestore(app);

const PALABRA_SECRETA = "PROYECTO_FLORIDA_SEGURIDAD_2025_TI";

//Exportamosla configuración para usarla en todos los componentes
export { db, PALABRA_SECRETA };

