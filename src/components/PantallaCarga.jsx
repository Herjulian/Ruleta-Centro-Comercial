import Img from '../assets/img/Carga-Ruleta.png';

export default function PantallaCarga() {
    return (
        // w-screen h-screen: Ocupa toda la pantalla
        // flex items-center justify-center: Centra lo de adentro PERFECTAMENTE (Horizontal y Vertical)
        // overflow-hidden: Corta cualquier pixel rebelde
        <div className="w-screen h-screen  flex items-center justify-center overflow-hidden">
            
            {/* Imagen con animación de pulso suave para que se vea viva */}
            <img 
                className="w-[40vh] h-[40vh] object-contain animate-pulse" 
                src={Img} 
                alt="Cargando..." 
            />
            
        </div>
    );
}