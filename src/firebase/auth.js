// Ruleta/src/firebase/auth.js
import { getAuth, signInAnonymously } from "firebase/auth";

// Instancia de auth (la toma de tu configuración existente)
const auth = getAuth();

export const obtenerTokenSeguro = async () => {
  try {
    // 1. REVISAR SI YA HAY ALGUIEN (Admin o Usuario)
    const usuarioActual = auth.currentUser;

    if (usuarioActual) {
      // ¡Genial! Ya hay un usuario (puede ser el Admin probando o un anónimo previo)
      // Simplemente devolvemos su token.
      // El Admin TIENE permiso para ejecutar la función, así que sirve.
      console.log("Usando credenciales existentes de:", usuarioActual.email || "Anónimo");
      return await usuarioActual.getIdToken(true);
    }

    // 2. SI NO HAY NADIE (Es un cliente nuevo en el kiosco)
    console.log("Nadie logueado, creando identidad anónima...");
    const credencial = await signInAnonymously(auth);
    return await credencial.user.getIdToken(true);

  } catch (error) {
    console.error("Error crítico de seguridad:", error);
    return null;
  }
};