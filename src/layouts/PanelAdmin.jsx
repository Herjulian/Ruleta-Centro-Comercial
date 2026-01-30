import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Logo from '../assets/img/Logo-web.png';
import { MdExitToApp } from "react-icons/md";

// --- NUEVAS IMPORTACIONES PARA FIREBASE ---
import { getAuth, signOut } from "firebase/auth";
import { toast } from "react-toastify";

export default function PanelAdmin() {
  const navigate = useNavigate();
  const auth = getAuth(); // Obtenemos la instancia de autenticación

  const cerrarSesion = async () => {
    try {
        // 1. Cierra la sesión real en los servidores de Google
        await signOut(auth);
        
        // 2. Borra los rastros locales
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");

        // 3. Notifica y saca al usuario
        toast.info("Sesión cerrada correctamente");
        navigate("/");
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        // Si falla Firebase, igual lo sacamos localmente por seguridad
        localStorage.removeItem("admin_token");
        navigate("/");
    }
  };

  return (
    // El layout principal ahora es un flex-row
    <section className='flex w-screen h-screen text-white'>
      
      {/* BARRA LATERAL */}
      <aside className='flex flex-col w-72 h-screen bg-gray-900 shadow-2xl flex-shrink-0'>
        
        {/* Logo y Título */}
        <div className='p-6 border-b border-gray-700'>
          <img src={Logo} alt="Logo" className="w-36 h-auto mx-auto" />
          <p className='font-bold text-xl text-center mt-4'>Panel de Administrador</p>
        </div>

        {/* Navegación */}
        <nav className='flex-grow p-6 space-y-4'>
          <NavLink
            to="/Informacion"
            className={({ isActive }) =>
              `block w-full text-lg p-4 rounded-lg font-bold transition-all duration-200 ${
                isActive 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            Información
          </NavLink>

          <NavLink
            to="/Actualizar"
            className={({ isActive }) =>
              `block w-full text-lg p-4 rounded-lg font-bold transition-all duration-200 ${
                isActive 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            Actualizar Recompensas
          </NavLink>
          {/* --- NUEVA OPCIÓN: PLANTILLAS --- */}
          <NavLink to="/Plantillas" className={linkClass}>
            <MdPalette size={24} /> {/* Icono de Paleta */}
            <span>Plantillas</span>
          </NavLink>
          
        </nav>

        {/* Botón Salir */}
        <div className='p-6 border-t border-gray-700'>
          <div 
            onClick={cerrarSesion}
            className='flex items-center justify-center gap-3 text-yellow-400 p-4 bg-gray-800 rounded-lg cursor-pointer transition-all duration-300 hover:bg-yellow-400 hover:text-gray-900 group'
          >
            <MdExitToApp size={30} />
            <span className='font-bold text-lg'>Cerrar Sesión</span>
          </div>
        </div>

      </aside>

      {/* Contenido Principal */}
      <main className='flex-grow h-screen overflow-y-auto p-8'>
        <Outlet />
      </main>
      
    </section>
  );
}