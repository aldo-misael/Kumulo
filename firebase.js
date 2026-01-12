// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCcW22IiGJVQPUNXAfJ9KNE4VbA3DLJCj4",
    authDomain: "kumulo-da82e.firebaseapp.com",
    projectId: "kumulo-da82e",
    storageBucket: "kumulo-da82e.firebasestorage.app",
    messagingSenderId: "542165859884",
    appId: "1:542165859884:web:89d945dae07e0c048d5b89"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Auth
const auth = getAuth(app);

// 👇 Exportar db para que script.js lo pueda importar
export { db, auth };
