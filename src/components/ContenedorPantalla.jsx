import { useTheme } from '../context/ThemeContext'; // <--- IMPORTANTE
import LienzoDecorativo from './LienzoDecorativo'; // <--- REUSAMOS TU COMPONENTE

export default function ContenedorPantalla({ children }) {
  const tema = useTheme(); // Leemos el tema actual
  
  return (
    <div className="w-screen h-screen bg-gray-900 flex items-center justify-center overflow-hidden">
        
        {/* CONTENEDOR MAESTRO 9:16 (Celular Vertical) */}
        <div className="relative aspect-[9/16] h-full max-w-full bg-white shadow-2xl overflow-hidden">
            
            {/* CAPA 1: EL TEMA PERSONALIZADO (Fondo + Decos) */}
            {tema ? (
                <div className="absolute inset-0 z-0">
                    <LienzoDecorativo 
                        modoEdicion={false} // IMPORTANTE: Modo lectura (no se mueven)
                        fondo={tema.fondo}
                        elementos={tema.elementos}
                        bgScale={tema.bgScale || 1}
                        // Pasamos config vacía porque el puntero lo maneja la Ruleta, no el fondo
                        configRuleta={{ pointerPos: {x:0, y:0} }} 
                    />
                </div>
            ) : (
               // CAPA 1 DEFAULT: Si no hay tema, ponemos un fondo por defecto o blanco
               <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-900 to-black"></div>
            )}

            {/* CAPA 2: EL CONTENIDO (La Ruleta o el Login) */}
            <div className="relative z-30 w-full h-full">
                {children}
            </div>

        </div>
    </div>
  );
}