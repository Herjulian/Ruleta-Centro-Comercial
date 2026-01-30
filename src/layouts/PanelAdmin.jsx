import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Logo from '../assets/img/Logo-web.png';
import { MdExitToApp, MdPalette, MdInfo, MdEditSquare } from "react-icons/md"; 

// --- FIREBASE IMPORTS ---
import { getAuth, signOut } from "firebase/auth";
import { toast } from "react-toastify";

export default function PanelAdmin() {
  const navigate = useNavigate();
  const auth = getAuth(); 

  const cerrarSesion = async () => {
    try {
        await signOut(auth);
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");
        toast.info("Sesión cerrada correctamente");
        navigate("/");
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        localStorage.removeItem("admin_token");
        navigate("/");
    }
  };

  // --- AQUÍ ESTABA EL ERROR: FALTABA ESTA DEFINICIÓN ---
  // Esta función define los estilos de los botones (activo vs inactivo)
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 w-full text-lg p-4 rounded-lg font-bold transition-all duration-200 ${
      isActive 
      ? 'bg-blue-600 text-white shadow-lg' 
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;
  // -----------------------------------------------------

  return (
    <section className='flex w-screen h-screen bg-gray-100'>
      
      {/* BARRA LATERAL */}
      <aside className='flex flex-col w-72 h-screen bg-gray-900 shadow-2xl flex-shrink-0'>
        
        {/* Logo */}
        <div className='p-6 border-b border-gray-700'>
          <img src={Logo} alt="Logo" className="w-36 h-auto mx-auto object-contain" />
          <p className='font-bold text-white text-xl text-center mt-4'>Administrador</p>
        </div>

        {/* Navegación */}
        <nav className='flex-grow p-6 space-y-4'>
          
          <NavLink to="/Informacion" className={linkClass}>
            <MdInfo size={24} />
            <span>Información</span>
          </NavLink>

          <NavLink to="/Actualizar" className={linkClass}>
            <MdEditSquare size={24} />
            <span>Premios</span>
          </NavLink>

          {/* Opción Plantillas / Personalizar */}
          {/* Si decidiste usar el nombre "Personalizar" en la ruta, cambia el "to" aquí */}
          <NavLink to="/Plantillas" className={linkClass}>
            <MdPalette size={24} /> 
            <span>Diseño</span>
          </NavLink>
          
        </nav>

        {/* Botón Salir */}
        <div className='p-6 border-t border-gray-700'>
          <div 
            onClick={cerrarSesion}
            className='flex items-center justify-center gap-3 text-yellow-400 p-4 bg-gray-800 rounded-lg cursor-pointer transition-all duration-300 hover:bg-yellow-400 hover:text-gray-900 group'
          >
            <MdExitToApp size={28} />
            <span className='font-bold text-lg'>Salir</span>
          </div>
        </div>

      </aside>

      {/* Contenido Principal */}
      <main className='flex-grow h-screen overflow-y-auto p-8 bg-gray-100'>
        <Outlet />
      </main>
      
    </section>
  );
}