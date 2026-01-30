import { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore"; 
import { db } from "../firebase/config"; 

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [temaActual, setTemaActual] = useState(null);

  useEffect(() => {
    // Escuchamos en tiempo real el documento de configuración
    const unsub = onSnapshot(doc(db, "configuracion", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Si hay un tema custom activo, lo guardamos
        if (data.temaActivo === 'custom_v2' && data.datosTema) {
            setTemaActual(data.datosTema);
        } else {
            setTemaActual(null); // Volver al default
        }
      }
    }, (error) => {
        console.error("Error leyendo tema:", error);
    });
    return () => unsub();
  }, []);

  return (
    <ThemeContext.Provider value={temaActual}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);