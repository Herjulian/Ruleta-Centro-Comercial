import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Logo from '../assets/img/Logo-web.png';
import PantallaCarga from "../components/PantallaCarga";

// --- FIREBASE IMPORTS ---
import { db } from "../firebase/config";
import { signInAnonymously } from "firebase/auth"
// Importamos Auth de Firebase
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

// Inicializamos Auth
const auth = getAuth();

export default function Inicio() {
  const [rol, setRol] = useState("");
  
  // Credenciales Administrador
  const [adminEmail, setAdminEmail] = useState(""); 
  const [password, setPassword] = useState("");
  
  // Estados Usuario
  const [cedula, setCedula] = useState("");
  
  const [isActive, setIsActive] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingFirebase, setLoadingFirebase] = useState(false); 
  const navigate = useNavigate();

  // --- VALIDACIÓN DE CÉDULA ---
  const validarCedula = (cc) => {
    const regex = /^[0-9]+$/; 
    if (!regex.test(cc)) return false;
    if (cc.length < 6 || cc.length > 10) return false; 
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ============================================================
    // LÓGICA JUGADOR (USUARIO)
    // ============================================================
    if (rol === "usuario") {
      if (!validarCedula(cedula.trim())) {
        toast.warn("Ingresa una Cédula válida (6 a 10 números)", { position: "top-center" });
        return;
      }
      setLoadingFirebase(true);

      try {
        if(!auth.currentUser){
           await signInAnonymously(auth);
        }
  
        // Guardar sesión temporal
        localStorage.setItem("jugador_actual", JSON.stringify({
          cedula: cedula.trim(),
        }));

        toast.success("¡Buena suerte.!");
        navigate("/Ruleta");

      } catch (error) {
        toast.error("Error de conexión.");
      } finally {
        setLoadingFirebase(false);
      }
    }

    // ============================================================
    // LÓGICA ADMINISTRADOR
    // ============================================================
    if (rol === "administrador") {
      if (!adminEmail || !password) {
        toast.warn("Completa correo y contraseña");
        return;
      }

      setLoadingFirebase(true);

      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, password);
        
        const user = userCredential.user;
        localStorage.setItem("admin_token", user.accessToken);
        localStorage.setItem("admin_email", user.email);

        toast.success("Bienvenido Administrador");
        navigate("/Informacion");

      } catch (error) {
        console.error("Error login:", error.code);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
           toast.error("Correo o contraseña incorrectos");
        } else if (error.code === 'auth/too-many-requests') {
           toast.error("Cuenta bloqueada temporalmente por muchos intentos fallidos");
        } else {
           toast.error("Error de inicio de sesión");
        }
      } finally {
        setLoadingFirebase(false);
      }
    }
  };

  // --- EFECTOS VISUALES ---
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      setIsActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsActive(false), 30000);
    };
    window.addEventListener("click", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  useEffect(() => {
    const handleInitialInteraction = () => {
      setIsInitialLoading(false);
      window.removeEventListener("click", handleInitialInteraction);
      window.removeEventListener("keydown", handleInitialInteraction);
    };
    window.addEventListener("click", handleInitialInteraction);
    window.addEventListener("keydown", handleInitialInteraction);
    return () => {
      window.removeEventListener("click", handleInitialInteraction);
      window.removeEventListener("keydown", handleInitialInteraction);
    };
  }, []);

  return isInitialLoading ? <PantallaCarga /> : isActive ? (
    <section className="flex justify-center items-center min-h-screen w-full overflow-hidden"> 
      
      <div className="bg-blue-100 border-4 border-black rounded-[3rem] p-10 w-[90%] max-w-2xl text-center shadow-2xl flex flex-col gap-8">
        
        <div className="flex justify-center">
          <div className="w-64 mx-auto animate-bounce-slow"> 
            <img src={Logo} alt="Logo" className="w-full h-auto object-contain drop-shadow-lg" />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          
          <div className="flex flex-col text-left">
              <label className="font-bold text-xl ml-2 mb-1 text-black">¿Quién eres?</label>
              <select
                className="w-full p-4 text-xl bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 text-black shadow-sm appearance-none cursor-pointer"
                value={rol}
                onChange={(e) => {
                  setRol(e.target.value);
                  setPassword("");
                  setAdminEmail(""); 
                  setCedula("");
                }}>
                <option value="">Selecciona tu Rol</option>
                <option value="usuario">Cliente / Jugador</option>
                <option value="administrador">Administrador</option>
              </select>
          </div>

          {/* FORMULARIO ADMINISTRADOR */}
          {rol === "administrador" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex flex-col text-left">
                <label className="block font-bold text-xl ml-2 mb-1 text-black">Correo:</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full p-4 text-xl border-2 border-black rounded-xl focus:outline-none bg-white text-black"
                  placeholder="admin@laflorida.com"
                />
              </div>
              <div className="flex flex-col text-left">
                <label className="block font-bold text-xl ml-2 mb-1 text-black">Contraseña:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 text-xl border-2 border-black rounded-xl focus:outline-none bg-white text-black"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {/* FORMULARIO USUARIO */}
          {rol === "usuario" && (
            <div className="flex flex-col gap-5 animate-fadeIn">
              <div className="flex flex-col text-left">
                <label className="block font-bold text-xl ml-2 mb-1 text-black">Cédula de Ciudadanía:</label>
                <input
                  type="number"
                  placeholder="Ej: 1098765432"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full p-4 text-2xl border-2 border-black rounded-xl focus:outline-none bg-white text-black font-mono tracking-wider"
                />
              </div>

            </div>
          )}

          {rol && (
            <div className="mt-4">
              <button
                type="submit"
                disabled={loadingFirebase}
                className={`w-full bg-green-600 hover:bg-green-500 text-white font-black text-2xl border-b-8 border-green-800 rounded-2xl p-4 shadow-lg active:border-b-0 active:translate-y-2 transition-all cursor-pointer
                  ${loadingFirebase ? 'opacity-50 cursor-wait' : ''}`}>
                {loadingFirebase ? "Verificando..." : (rol === "administrador" ? "INGRESAR AL SISTEMA" : "¡JUGAR AHORA!")}
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  ) : <PantallaCarga /> ;
}