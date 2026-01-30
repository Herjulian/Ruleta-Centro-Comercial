import { useEffect, useState } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importaciones de componentes
import Inicio from './views/Inicio';
import Ruleta from './components/Ruleta'; // Asegúrate de haber limpiado el CSS de este archivo como hablamos
import ProtectRutas from './components/ProtectRutas';
import PanelAdmin from './layouts/PanelAdmin';
import Actualizar from './views/Administrador/Actualizar';
import ListInfo from './views/Administrador/ListInfo';
import UpdateNotification from './components/UpdateNotification';
import AccesoDenegado from './components/AccesoDenegado';
import Plantillas from './views/Administrador/Plantillas';
// --- NUEVO IMPORT ---
// Importamos el marco maestro que controla el tamaño de pantalla
import ContenedorPantalla from './components/ContenedorPantalla'; 
// (Si también vas a implementar los Temas pronto, aquí importarías el ThemeProvider)

function App() {
  // Estado para saber si estamos en Electron
  const [esAutorizado, setEsAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    // LÓGICA DE SEGURIDAD:
    if (window.electron) {
      setEsAutorizado(true);
    } else {
      setEsAutorizado(false);
    }
    setVerificando(false);
  }, []);

  // Mientras verifica (milisegundos), mostramos pantalla negra
  // Nota: Al quitar w-screen de aquí, asegúrate que este div ocupe todo si quieres
  if (verificando) return <div className="bg-black h-screen w-screen fixed top-0 left-0 z-50"></div>;

  // SI NO ES ELECTRÓN, BLOQUEAMOS LA ENTRADA 🛑
  if (!esAutorizado) {
    return <AccesoDenegado />;
  }

  // SI ES ELECTRÓN, MOSTRAMOS LA APP ✅
  return (
    /* AQUÍ ESTÁ LA MAGIA:
       Envolvemos todo el Router dentro del ContenedorPantalla.
       Esto fuerza a que TODA la app respete la proporción 9:16 (vertical)
       y se centre automáticamente con bandas negras si es necesario.
    */
    <ContenedorPantalla>
      <HashRouter>
        <UpdateNotification />
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/Ruleta" element={<Ruleta />} />

          <Route path='/' element={<PanelAdmin />}>
              <Route path='Informacion' element={<ProtectRutas><ListInfo/></ProtectRutas>} />
              <Route path='actualizar' element={<Actualizar />} />
              <Route path='Plantillas' element={<Plantillas />} />
          </Route>
        </Routes>
        
        {/* ToastContainer debe estar dentro para que las alertas se vean dentro del marco */}
        <ToastContainer 
            position="top-center" 
            autoClose={3000}
            theme="colored"
        />
      </HashRouter>
    </ContenedorPantalla>
  );
}

export default App;