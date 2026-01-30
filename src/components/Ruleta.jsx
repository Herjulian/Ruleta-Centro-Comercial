import { useState, useEffect, useRef } from "react"; 
import { useNavigate } from "react-router-dom";
import PantallaGanador from "./PantallaGanador";
import { toast } from "react-toastify";
import { obtenerTokenSeguro } from '../firebase/auth.js'
// Assets
import sonidoRueda from "../assets/sounds/Rueda.mp3";
import sonidoGanador from "../assets/sounds/ganador.mp3";
import LogoLaFlorida from "../assets/img/Logo-Florida.png";
import PunteroPalma from "../assets/img/puntero.png"; 

// --- FIREBASE IMPORTS ---
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { getAuth, signOut} from 'firebase/auth'

const COLOR_ROSA = "#D6006E"; 
const COLOR_AMARILLO = "#FFC400"; 
const ANGULO_TEXTO = 90; 

export default function Ruleta() {
  const [premios, setPremios] = useState([]);
  const [rotacion, setRotacion] = useState(0);
  const [premioGanado, setPremioGanado] = useState(null);
  const [fechaGanado, setFechaGanado] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState(null);
  const navigate = useNavigate();

  const audioRuedaRef = useRef(new Audio(sonidoRueda));
  const audioGanadorRef = useRef(new Audio(sonidoGanador));

  // --- LÓGICA DE CARGA Y JUEGO (INTACTA) ---
  useEffect(() => {
    const cargarDatosCloud = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "inventario_premios"));
        const listaPremios = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setPremios(listaPremios);
      } catch (error) {
        console.error("Error cargando premios:", error);
        toast.error("Error de conexión");
      }
    };
    cargarDatosCloud();

    audioRuedaRef.current.volume = 0.6; 
    audioGanadorRef.current.volume = 1.0; 
    return () => {
      audioRuedaRef.current.pause();
      audioGanadorRef.current.pause();
    };
  }, []);

  const girarRuleta = async () => {
    if (isSpinning) return; 
    if (premios.length === 0) { toast.error("Cargando premios..."); return; }

    const datosJugador = JSON.parse(localStorage.getItem("jugador_actual"));
    if (!datosJugador) { navigate("/"); return; }
    
    setWinningIndex(null); 
    setPremioGanado(null);
    setFechaGanado(null);
    audioGanadorRef.current.pause();
    audioGanadorRef.current.currentTime = 0;

    let idGanadorCloud = null;
    let nombreGanadorCloud = "";

    try {
        setIsSpinning(true); 
        const token = await obtenerTokenSeguro();
        const respuesta = await fetch('https://stunning-jalebi-aec2a8.netlify.app/.netlify/functions/Ejecucion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ cedula: datosJugador.cedula, factura: datosJugador.factura })
        });
        const data = await respuesta.json();

        if (data.status === "AGOTADO") {
            toast.warn("Premios Agotados");
            setIsSpinning(false);
            return;
        }
        if (data.error || !data.idGanador) {
            toast.error("Error en el sorteo");
            setIsSpinning(false);
            return;
        }
        idGanadorCloud = data.idGanador;
        nombreGanadorCloud = data.nombrePremio;

    } catch (error) {
        console.error("Error crítico:", error);
        toast.error("⛔ ERROR DE RED", { autoClose: 3000 });
        setIsSpinning(false);
        return; 
    }

    const indiceEnRueda = premios.findIndex(p => p.id === idGanadorCloud);
    if (indiceEnRueda === -1) {
        toast.error("Error visual: Premio no encontrado");
        setIsSpinning(false);
        return;
    }

    const numPremios = premios.length; 
    const anguloGajo = 360 / numPremios; 
    const mitadGajo = anguloGajo / 2;    
    const posicionGanador = (indiceEnRueda * anguloGajo);
    const vueltas = 5; 
    const rotacionFinal = rotacion + (vueltas * 360) + (360 - (posicionGanador + mitadGajo) % 360);

    setRotacion(rotacionFinal);

    try {
        audioRuedaRef.current.currentTime = 0;
        await audioRuedaRef.current.play();
    } catch (error) { console.error(error); }

    setTimeout(() => {
      audioRuedaRef.current.pause();      
      audioRuedaRef.current.currentTime = 0;
      try { audioGanadorRef.current.play(); } catch (e) {}

      const fecha = new Date();
      setPremioGanado(nombreGanadorCloud); 
      setFechaGanado(fecha.toLocaleString("es-CO")); 
      setWinningIndex(indiceEnRueda); 
      
      const nuevosPremios = [...premios];
      if(nuevosPremios[indiceEnRueda].cantidad > 0) {
          nuevosPremios[indiceEnRueda].cantidad -= 1;
      }
      setPremios(nuevosPremios);

      setTimeout(() => {
          localStorage.removeItem("jugador_actual"); 
          navigate("/");
      }, 6000); 
      setIsSpinning(false);
    }, 5000);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Enter') girarRuleta();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, premios]); 

  const generarGradiente = () => {
    const num = premios.length;
    if (num === 0) return "conic-gradient(#FFC400 0deg 360deg)"; 
    let grad = "conic-gradient(";
    premios.forEach((_, index) => {
      const color = index % 2 === 0 ? COLOR_AMARILLO : COLOR_ROSA;
      const ini = (index * (360 / num));
      const fin = ((index + 1) * (360 / num));
      grad += `${color} ${ini}deg ${fin + 0.5}deg, `;
    });
    return grad.slice(0, -2) + ")";
  };

  // --- RENDERIZADO (AQUÍ ESTÁ EL CAMBIO VISUAL) ---
  return (
    // 1. Usamos w-full h-full para llenar el contenedor padre.
    // 2. justify-between distribuye Header, Cuerpo y Footer automáticamente.
    <section className="w-full h-full relative flex flex-col justify-between items-center overflow-hidden bg-transparent">
      
      <style>{`
        @keyframes shadow-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .winner-shadow-effect { animation: shadow-pulse 1.2s infinite ease-in-out; background: linear-gradient(to bottom, transparent 0%, #B71C1C 100%); mix-blend-mode: multiply; }
        .ruleta-gira::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; border: 6px solid rgba(255,255,255,0.15); pointer-events: none; z-index: 50; }
      `}</style>

      {/* --- HEADER: Altura relativa (15%) --- */}
      <div className="w-full h-[15%] flex items-center justify-center z-20 shrink-0 pt-4">
          <img 
              src={LogoLaFlorida} 
              alt="La Florida" 
              // object-contain asegura que el logo nunca se deforme
              className="h-full w-auto object-contain max-h-[120px]"
          />
      </div>

     {/* --- CUERPO PRINCIPAL: Ocupa todo el espacio sobrante (flex-1) --- */}
     <div className="flex-1 w-full flex items-center justify-center relative p-2">
       
       {/* CONTENEDOR CUADRADO DE LA RULETA */}
       {/* aspect-square asegura que sea un círculo perfecto. Max-w limita el ancho. */}
       <div className="relative w-full max-w-[90%] aspect-square flex items-center justify-center">
           
           {/* PUNTERO: Posicionado RELATIVO al cuadrado de la ruleta */}
           {/* -top-[12%] significa que sube un 12% del tamaño de la ruleta */}
           <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 z-30 w-[18%] pointer-events-none drop-shadow-2xl">
              <img src={PunteroPalma} className="w-full object-contain filter drop-shadow-lg" />
           </div>

           {/* Borde Externo */}
           <div className="w-full h-full rounded-full p-[2%] shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center bg-[#D6006E]">
             <div className="w-full h-full rounded-full p-[4%] flex items-center justify-center shadow-inner bg-[#240046]">
               
               {/* Disco Giratorio */}
               <div className="w-full h-full rounded-full relative overflow-hidden ruleta-gira bg-[#240046]"
                    style={{
                      background: generarGradiente(),
                      transform: `rotate(${rotacion}deg)`,
                      transition: "transform 5s cubic-bezier(0.1, 0, 0.18, 1)",
                      willChange: "transform"
                    }}>
                  {premios.map((premio, i) => {
                    const angulo = 360 / premios.length;
                    const rotacionGajo = (i * angulo) + (angulo / 2);
                    const colorTexto = i % 2 === 0 ? "#C2185B" : "white"; 
                    const esGanador = !isSpinning && winningIndex === i;
                    
                    const esAgotado = premio.cantidad === 0;
                    const esTextoLargo = premio.nombre.length > 15;
                    const esTextoMedio = premio.nombre.length > 8 && premio.nombre.length <= 15;
                    const esMultilinea = esTextoLargo || esTextoMedio;
                    const alineacionX = esMultilinea ? "-35%" : "-40%";

                    return (
                      <div key={i} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ transform: `rotate(${rotacionGajo}deg)` }}>
                        {esGanador && (
                          <div className="absolute top-0 left-1/2 w-[1px] h-[50%] origin-bottom" style={{ transform: "translateX(-50%)" }}>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] winner-shadow-effect" style={{ clipPath: "polygon(50% 50%, 0 0, 100% 0)", top: "-150px" }}></div>
                          </div>
                        )}
                        
                        {/* TEXTO GAJO */}
                        <div 
                           className={`absolute left-1/2 flex flex-col justify-start items-center text-center z-10 
                             ${esTextoLargo ? "top-[12%] w-[25%]" : "top-[12%] w-[30%]"} 
                           `}
                           style={{ 
                               transform: `translateX(${alineacionX}) rotate(${ANGULO_TEXTO}deg)`,
                               transformOrigin: "center top"
                           }}
                        >
                          <span className={`font-extrabold uppercase drop-shadow-sm px-1 break-words whitespace-normal leading-tight`} 
                           style={{ 
                               // Cálculo dinámico de fuente basado en viewport (container query idealmente, pero clamp funciona bien)
                               fontSize: 'clamp(14px, 2.5cqw, 32px)', 
                               color: colorTexto, 
                               textShadow: '1px 1px 0px rgba(0,0,0,0.15)',
                               display: '-webkit-box',
                               WebkitLineClamp: '2', 
                               WebkitBoxOrient: 'vertical',
                               overflow: 'hidden'
                           }}>
                            {premio.cantidad > 0 ? premio.nombre : "AGOTADO"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
               </div>
             </div>
           </div>
           
           {/* Hub Central (Botón) */}
           <div onClick={girarRuleta} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] rounded-full bg-gradient-to-b from-[#f8ba00] to-[#FFB300] border-[4px] border-[#FFA000] shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform z-40">
              <div className="w-[80%] h-[80%] rounded-full bg-[#FFC107] shadow-inner border-2 border-[#FFA000]"></div>
           </div>
       </div>
     </div>

     {/* --- FOOTER: Altura relativa (12%) --- */}
     <div className="w-full h-[12%] flex items-center justify-center shrink-0 pb-4">
        {/* El botón ahora es responsivo usando aspect-square y porcentaje de altura */}
        <div onClick={() => navigate("/")} className="h-[70%] aspect-square bg-white rounded-full flex items-center justify-center text-3xl text-[#D6006E] cursor-pointer hover:bg-gray-200 shadow-2xl border-4 border-[#D6006E] active:scale-90 transition-all">
           &times;
        </div>
     </div>

     {/* MODAL GANADOR (Se ajusta al contenedor padre automáticamente por ser absolute inset-0) */}
     {premioGanado && (
       <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
           <PantallaGanador premio={premioGanado} fecha={fechaGanado} />
       </div>
     )}
    </section>
  );
}