// auth.js
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    mensaje.textContent = `Bienvenido, ${user.email}`;
    mensaje.style.color = "green";

    // Redirigir a tu dashboard
    window.location.href = "dashboard.html";
  } catch (error) {
    mensaje.textContent = "Error: " + error.message;
    mensaje.style.color = "red";
  }
});