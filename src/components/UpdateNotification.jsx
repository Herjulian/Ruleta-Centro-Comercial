import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const UpdateNotification = () => {
  // Estado para controlar si mostramos el aviso
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    // Verificamos que estemos dentro de Electron (y no en el navegador normal)
    if (window.electron) {
      
      // 1. Si Electron dice "Descargando...", mostramos un toast informativo
      window.electron.onUpdateAvailable(() => {
        toast.info("⬇️ Descargando nueva versión en segundo plano...");
      });

      // 2. Si Electron dice "Ya se bajó", mostramos el MODAL
      window.electron.onUpdateDownloaded(() => {
        setUpdateReady(true);
      });
    }
  }, []);

  const handleRestart = () => {
    if (window.electron) {
      window.electron.restartApp();
    }
  };

  // Si no hay actualización lista, este componente no renderiza nada (invisible)
  if (!updateReady) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-in">
      <div className="bg-white border-l-4 border-green-500 p-6 rounded-lg shadow-2xl max-w-sm">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">🚀</span>
          <h3 className="text-lg font-bold text-gray-800">¡Actualización Lista!</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Hay una nueva versión de la Ruleta disponible. Se instalará automáticamente al reiniciar.
        </p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => setUpdateReady(false)}
            className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded"
          >
            Después
          </button>
          <button 
            onClick={handleRestart}
            className="px-4 py-2 text-sm bg-green-600 text-white font-bold rounded hover:bg-green-700 shadow-md transition-all"
          >
            Reiniciar Ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;