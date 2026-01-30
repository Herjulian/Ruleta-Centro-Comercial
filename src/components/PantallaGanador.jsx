import { useEffect } from 'react';

// --- ¡NUEVO! Pequeño hook para cargar la fuente de Google ---
// (Esto asegura que tengamos una fuente "gruesa" y moderna)
const useGoogleFont = (fontFamily) => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@800;900&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [fontFamily]);
};

export default function PantallaGanador({ premio, fecha }) {
  // Usamos la fuente "Poppins" en su versión más "gruesa" (900)
  useGoogleFont('Poppins');

  return (
    // Ya no hay imagen de fondo, el fondo es el backdrop-blur de Ruleta.jsx
    <div className="relative flex flex-col items-center justify-center text-center">
      
      {/* Estilo para la fuente Poppins */}
      <style>{`
        .font-poppins { font-family: 'Poppins', sans-serif; }
      `}</style>

      {/* --- RECREACIÓN DEL "HAZ GANADO" --- */}
      
      {/* "HAZ" (El cuadro amarillo de arriba) */}
      <div className="bg-yellow-400 px-10 py-2 rounded-lg -mb-8 z-10 shadow-lg">
        <span 
          className="font-poppins text-7xl font-black text-white" 
          // Sombra de texto rosa para imitar el borde
          style={{ textShadow: '4px 4px 0px #D6006E' }} 
        >
          HAZ
        </span>
      </div>

      {/* "GANADO" (El cuadro morado de abajo) */}
      <div 
        className="px-12 py-8 rounded-lg shadow-2xl" 
        style={{ backgroundColor: COLOR_FONDO_OSCURO, /* Usamos tu color morado */ }}
      >
        <span 
          className="font-poppins text-9xl font-black text-white" 
          style={{ textShadow: '6px 6px 0px rgba(0,0,0,0.2)' }}
        >
          GANADO
        </span>
      </div>

      {/* --- FIN DE LA RECREACIÓN --- */}

      {/* El premio y la fecha, ahora integrados abajo */}
      <div className="mt-10">
        <p 
          className="text-6xl font-black text-white drop-shadow-lg animate-pulse"
          style={{ color: COLOR_AMARILLO /* Usamos tu color amarillo */ }}
        >
          {premio}
        </p>
        <p className="text-3xl text-gray-300 mt-2 drop-shadow-lg">
          {fecha}
        </p>
      </div>

    </div>
  );
}

// Definimos tus colores aquí para que el componente los use
const COLOR_AMARILLO = "#FFC400"; 
const COLOR_FONDO_OSCURO = "#240046"; 
const COLOR_ROSA = "#D6006E";