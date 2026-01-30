import { useState } from 'react';
import { db } from '../../firebase/config';
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { THEMES } from '../../config/themes';
import { MdCheckCircle } from "react-icons/md";

export default function Plantillas() {
  const [loading, setLoading] = useState(false);

  const cambiarTema = async (themeId) => {
    setLoading(true);
    try {
      const configRef = doc(db, "configuracion", "general");
      
      // Verificamos si existe el documento, si no, lo creamos (seguridad)
      const docSnap = await getDoc(configRef);
      
      if (!docSnap.exists()) {
        await setDoc(configRef, { temaActivo: themeId });
      } else {
        await updateDoc(configRef, { temaActivo: themeId });
      }

      toast.success(`¡Tema ${THEMES[themeId].nombre} aplicado con éxito!`);
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar la plantilla");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Galería de Temas</h1>
      <p className="text-gray-600 mb-6">Selecciona una plantilla para cambiar la apariencia de la ruleta en todas las pantallas.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.values(THEMES).map((tema) => (
          <div 
            key={tema.id}
            onClick={() => cambiarTema(tema.id)}
            className="group relative cursor-pointer bg-white rounded-2xl shadow-xl overflow-hidden hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-blue-500"
          >
            {/* Cabecera de Color (Preview) */}
            <div 
              className="h-32 w-full flex items-center justify-center"
              style={{ backgroundColor: tema.previewColor }}
            >
               <span className="text-white text-4xl font-bold opacity-30">Aa</span>
            </div>

            {/* Cuerpo de la Tarjeta */}
            <div className="p-6">
               <h3 className="text-xl font-bold text-gray-800 mb-2">{tema.nombre}</h3>
               <div className="flex gap-2 mt-2">
                  {/* Muestras de colores */}
                  <div className="w-6 h-6 rounded-full" style={{ background: tema.colors.bg }}></div>
                  <div className="w-6 h-6 rounded-full" style={{ background: tema.colors.primary }}></div>
                  <div className="w-6 h-6 rounded-full" style={{ background: tema.colors.secondary }}></div>
               </div>
            </div>

            {/* Overlay de cargando */}
            {loading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {/* Icono de Selección (Opcional: podrías hacerlo dinámico leyendo el estado actual) */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow-md">
               <MdCheckCircle size={30} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}