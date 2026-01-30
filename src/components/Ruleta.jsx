import { useState, useEffect, useRef } from "react"; 
import { useNavigate } from "react-router-dom";
import PantallaGanador from "./PantallaGanador";
import { toast } from "react-toastify";
import { obtenerTokenSeguro } from '../firebase/auth.js'
import { useTheme } from '../context/ThemeContext'; 

import sonidoRueda from "../assets/sounds/Rueda.mp3";
import sonidoGanador from "../assets/sounds/ganador.mp3";
import LogoDefault from "../assets/img/Logo-Florida.png"; 
import PunteroDefault from "../assets/img/puntero.png"; 

import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

const ANGULO_TEXTO = 90; 

export default function Ruleta() {
  const tema = useTheme();

  // --- CONFIGURACIÓN VISUAL (CON TAMAÑOS Y POSICIONES) ---
  const config = {
      bordeColor: tema?.configRuleta?.bordeColor || "#D6006E",
      centroColor: tema?.configRuleta?.centroColor || "#240046",
      botonColor: tema?.configRuleta?.botonColor || "#FFC400",
      
      // Puntero: Imagen y Tamaño
      punteroUrl: tema?.configRuleta?.pointerUrl || PunteroDefault,
      pointerSize: tema?.configRuleta?.pointerSize || 18, // Default 18%
      
      // Header: Imagen, Posición y Ancho
      headerUrl: tema?.header || LogoDefault,
      headerPos: tema?.headerPos || { x: 50, y: 5, w: 60 } // Default centrado arriba, 60% ancho
  };

  const [premios, setPremios] = useState([]);
  const [rotacion, setRotacion] = useState(0);
  const [premioGanado, setPremioGanado] = useState(null);
  const [fechaGanado, setFechaGanado] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState(null);
  const navigate = useNavigate();

  const audioRuedaRef = useRef(new Audio(sonidoRueda));
  const audioGanadorRef = useRef(new Audio(sonidoGanador));

  useEffect(() => {
    const cargarDatosCloud = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "inventario_premios"));
        const listaPremios = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setPremios(listaPremios);
      } catch (error) { toast.error("Error de conexión"); }
    };
    cargarDatosCloud();
    audioRuedaRef.current.volume = 0.6; 
    audioGanadorRef.current.volume = 1.0; 
  }, []);

  const girarRuleta = async () => {
    if (isSpinning) return; 
    if (premios.length === 0) { toast.error("Cargando premios..."); return; }
    const datosJugador = JSON.parse(localStorage.getItem("jugador_actual"));
    if (!datosJugador) { navigate("/"); return; }
    
    setWinningIndex(null); setPremioGanado(null); setFechaGanado(null);
    audioGanadorRef.current.pause(); audioGanadorRef.current.currentTime = 0;

    let idGanadorCloud = null; let nombreGanadorCloud = "";
    try {
        setIsSpinning(true); 
        const token = await obtenerTokenSeguro();
        const respuesta = await fetch('https://chipper-centaur-5c8453.netlify.app/.netlify/functions/Ejecucion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ cedula: datosJugador.cedula, factura: datosJugador.factura })
        });
        const data = await respuesta.json();

        if (data.status === "AGOTADO") { toast.warn("Premios Agotados"); setIsSpinning(false); return; }
        if (data.error || !data.idGanador) { toast.error("Error en el sorteo"); setIsSpinning(false); return; }
        idGanadorCloud = data.idGanador; nombreGanadorCloud = data.nombrePremio;
    } catch (error) { toast.error("⛔ ERROR DE RED"); setIsSpinning(false); return; }

    const indiceEnRueda = premios.findIndex(p => p.id === idGanadorCloud);
    if (indiceEnRueda === -1) { setIsSpinning(false); return; }

    const numPremios = premios.length; 
    const anguloGajo = 360 / numPremios; 
    const posicionGanador = (indiceEnRueda * anguloGajo);
    const rotacionFinal = rotacion + (5 * 360) + (360 - (posicionGanador + (anguloGajo / 2)) % 360);

    setRotacion(rotacionFinal);
    try { audioRuedaRef.current.currentTime = 0; await audioRuedaRef.current.play(); } catch (e) {}

    setTimeout(() => {
      audioRuedaRef.current.pause(); audioRuedaRef.current.currentTime = 0;
      try { audioGanadorRef.current.play(); } catch (e) {}
      setPremioGanado(nombreGanadorCloud); setFechaGanado(new Date().toLocaleString("es-CO")); setWinningIndex(indiceEnRueda); 
      const nuevosPremios = [...premios];
      if(nuevosPremios[indiceEnRueda].cantidad > 0) nuevosPremios[indiceEnRueda].cantidad -= 1;
      setPremios(nuevosPremios);
      setTimeout(() => { localStorage.removeItem("jugador_actual"); navigate("/"); }, 6000); 
      setIsSpinning(false);
    }, 5000);
  };

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.code === 'Enter') girarRuleta(); };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, premios]); 

  const generarGradiente = () => {
    const num = premios.length;
    const colorPrimario = config.botonColor; const colorSecundario = config.bordeColor; 
    if (num === 0) return `conic-gradient(${colorPrimario} 0deg 360deg)`; 
    let grad = "conic-gradient(";
    premios.forEach((_, index) => {
      const color = index % 2 === 0 ? colorPrimario : colorSecundario;
      const ini = (index * (360 / num)); const fin = ((index + 1) * (360 / num));
      grad += `${color} ${ini}deg ${fin + 0.5}deg, `;
    });
    return grad.slice(0, -2) + ")";
  };

  return (
    <section className="w-full h-full relative flex flex-col justify-between items-center overflow-hidden bg-transparent">
      <style>{`
        @keyframes shadow-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .winner-shadow-effect { animation: shadow-pulse 1.2s infinite ease-in-out; background: linear-gradient(to bottom, transparent 0%, #B71C1C 100%); mix-blend-mode: multiply; }
        .ruleta-gira::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; border: 6px solid rgba(255,255,255,0.15); pointer-events: none; z-index: 50; }
      `}</style>

      {/* --- ENCABEZADO MOVIBLE Y REDIMENSIONABLE --- */}
      <div 
         className="absolute z-20 pointer-events-none" 
         style={{ 
             width: `${config.headerPos.w}%`, // Usa el ancho guardado
             // Usa las coordenadas guardadas
             left: tema?.headerPos ? `${tema.headerPos.x}%` : '50%',
             top: tema?.headerPos ? `${tema.headerPos.y}%` : '5%',
             // Si no hay coords, centramos con transform
             transform: tema?.headerPos ? 'none' : 'translateX(-50%)'
         }}
      >
          <img 
              src={config.headerUrl} 
              alt="Encabezado" 
              className="w-full object-contain drop-shadow-md"
          />
      </div>

     {/* Espacio para empujar la ruleta un poco si es necesario */}
     <div className="w-full h-[10%] shrink-0"></div>

     <div className="flex-1 w-full flex items-center justify-center relative p-2">
       <div className="relative w-full max-w-[90%] aspect-square flex items-center justify-center">
           
           {/* --- PUNTERO CON TAMAÑO DINÁMICO --- */}
           <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 z-30 pointer-events-none drop-shadow-2xl"
                style={{ width: `${config.pointerSize}%` }} // Usa el tamaño guardado
           >
              <img src={config.punteroUrl} className="w-full object-contain filter drop-shadow-lg" />
           </div>

           <div className="w-full h-full rounded-full p-[2%] shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: config.bordeColor }}>
             <div className="w-full h-full rounded-full p-[4%] flex items-center justify-center shadow-inner transition-colors duration-500" style={{ backgroundColor: config.centroColor }}>
               <div className="w-full h-full rounded-full relative overflow-hidden ruleta-gira"
                    style={{ background: generarGradiente(), backgroundColor: config.centroColor, transform: `rotate(${rotacion}deg)`, transition: "transform 5s cubic-bezier(0.1, 0, 0.18, 1)" }}>
                  {premios.map((premio, i) => {
                    const angulo = 360 / premios.length;
                    const rotacionGajo = (i * angulo) + (angulo / 2);
                    const esTextoLargo = premio.nombre.length > 15;
                    const esGanador = !isSpinning && winningIndex === i;
                    return (
                      <div key={i} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ transform: `rotate(${rotacionGajo}deg)` }}>
                        {esGanador && (<div className="absolute top-0 left-1/2 w-[1px] h-[50%] origin-bottom" style={{ transform: "translateX(-50%)" }}><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] winner-shadow-effect" style={{ clipPath: "polygon(50% 50%, 0 0, 100% 0)", top: "-150px" }}></div></div>)}
                        <div className={`absolute left-1/2 flex flex-col justify-start items-center text-center z-10 ${esTextoLargo ? "top-[12%] w-[25%]" : "top-[12%] w-[30%]"}`} 
                             style={{ transform: `translateX(${esTextoLargo ? "-35%" : "-40%"}) rotate(${ANGULO_TEXTO}deg)`, transformOrigin: "center top" }}>
                          <span className="font-extrabold uppercase drop-shadow-sm px-1 break-words whitespace-normal leading-tight" 
                           style={{ fontSize: 'clamp(14px, 2.5cqw, 32px)', color: "#FFFFFF", textShadow: '1px 1px 2px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {premio.cantidad > 0 ? premio.nombre : "AGOTADO"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
               </div>
             </div>
           </div>
           
           <div onClick={girarRuleta} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] rounded-full border-[4px] shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform z-40" style={{ backgroundColor: config.botonColor, borderColor: '#FFFFFF' }}>
              <div className="w-[80%] h-[80%] rounded-full shadow-inner border-2 border-white/50" style={{ backgroundColor: config.botonColor }}></div>
           </div>
       </div>
     </div>

     <div className="w-full h-[12%] flex items-center justify-center shrink-0 pb-4">
       <div onClick={() => navigate("/")} className="h-[70%] aspect-square bg-white rounded-full flex items-center justify-center text-3xl cursor-pointer hover:bg-gray-200 shadow-2xl border-4 active:scale-90 transition-all" style={{ borderColor: config.bordeColor, color: config.bordeColor }}>&times;</div>
     </div>

     {premioGanado && (<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn"><PantallaGanador premio={premioGanado} fecha={fechaGanado} /></div>)}
    </section>
  );
}