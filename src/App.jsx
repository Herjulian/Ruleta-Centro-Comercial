import { useEffect, useState } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importaciones de componentes
import Inicio from './views/Inicio';
import Ruleta from './components/Ruleta';
import ProtectRutas from './components/ProtectRutas';
import PanelAdmin from './layouts/PanelAdmin';
import Actualizar from './views/Administrador/Actualizar';
import ListInfo from './views/Administrador/ListInfo';
import UpdateNotification from './components/UpdateNotification';
import AccesoDenegado from './components/AccesoDenegado';
import Plantillas from './views/Administrador/Plantillas';
import ContenedorPantalla from './components/ContenedorPantalla'; 
import { ThemeProvider } from './context/ThemeContext'; // Asegúrate de importar esto si usas temas

function App() {
  const [esAutorizado, setEsAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    if (window.electron) {
      setEsAutorizado(true);
    } else {
      setEsAutorizado(false);
    }
    setVerificando(false);
  }, []);

  if (verificando) return <div className="bg-black h-screen w-screen fixed top-0 left-0 z-50"></div>;

  if (!esAutorizado) {
    return <AccesoDenegado />;
  }

  return (
    // 1. Envuelve todo en el ThemeProvider para que los colores funcionen en todos lados
    <ThemeProvider>
      <HashRouter>
        <UpdateNotification />
        
        <Routes>
          {/* RUTA 1: INICIO (LOGIN)
             Aquí SÍ usamos el ContenedorPantalla para que se vea vertical en la TV 
          */}
          <Route path="/" element={
             <ContenedorPantalla>
                <Inicio />
             </ContenedorPantalla>
          } />

          {/* RUTA 2: RULETA
             Aquí TAMBIÉN usamos el ContenedorPantalla 
          */}
          <Route path="/Ruleta" element={
             <ContenedorPantalla>
                <Ruleta />
             </ContenedorPantalla>
          } />

          {/* RUTA 3: PANEL ADMIN
             ¡OJO AQUÍ! NO usamos ContenedorPantalla. 
             Dejamos que el PanelAdmin use el 100% de la pantalla horizontalmente.
          */}
          <Route path='/' element={<PanelAdmin />}>
              <Route path='Informacion' element={<ProtectRutas><ListInfo/></ProtectRutas>} />
              <Route path='actualizar' element={<Actualizar />} />
              <Route path='Plantillas' element={<Plantillas />} />
          </Route>
        </Routes>
        
        <ToastContainer 
            position="top-center" 
            autoClose={3000}
            theme="colored"
        />
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;