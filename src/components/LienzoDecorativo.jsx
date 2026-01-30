import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { MdDelete, MdContentCopy, MdPhotoSizeSelectLarge, MdCheckCircle } from "react-icons/md";

// --- MENÚ FLOTANTE ---
const MenuFlotante = ({ w, onChangeW, onDup, onDel, onApply, soloTamano = false }) => (
    <div 
        className="no-drag absolute -top-20 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-2 flex flex-col items-center gap-2 z-[60] animate-fadeIn border-2 border-blue-500/20 select-auto min-w-[140px]"
        // IMPORTANTE: Detenemos propagación aquí también para que el slider no cierre el menú
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={(e) => e.stopPropagation()}
    >
        {/* Fila 1: Tamaño */}
        <div className="flex items-center gap-2 w-full px-2">
            <MdPhotoSizeSelectLarge size={16} className="text-blue-500"/>
            <input 
                type="range" min="5" max="100" 
                value={w || 20} 
                onChange={(e) => onChangeW(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-400"
            />
        </div>
        
        <div className="w-full h-[1px] bg-gray-100 my-1"></div>

        {/* Fila 2: Botones de Acción */}
        <div className="flex justify-between w-full gap-2">
            {!soloTamano && (
                <>
                    <button onClick={onDup} className="flex-1 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex justify-center items-center" title="Duplicar">
                        <MdContentCopy size={18}/>
                    </button>
                    <button onClick={onDel} className="flex-1 p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm flex justify-center items-center" title="Borrar">
                        <MdDelete size={18}/>
                    </button>
                </>
            )}
            
            {/* BOTÓN CHECK (APLICAR) */}
            <button onClick={onApply} className="flex-1 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm flex justify-center items-center ring-1 ring-green-200" title="Aplicar Cambios">
                <MdCheckCircle size={20}/>
            </button>
        </div>
        
        {/* Triángulo indicador abajo */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-blue-500/20"></div>
    </div>
);

// --- COMPONENTES INTERNOS ---

const ElementoArrastrable = ({ item, seleccionado, onUpdate, setSeleccionado, onDup, onDel, onSize }) => {
    const nodeRef = useRef(null);
    const esSeleccionado = seleccionado === item.id;

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            cancel=".no-drag"
            defaultPosition={{x:0, y:0}}
            position={{ 
                 x: (item.x / 100) * document.getElementById('lienzo-trabajo')?.offsetWidth || 0, 
                 y: (item.y / 100) * document.getElementById('lienzo-trabajo')?.offsetHeight || 0 
            }}
            onStop={(e, d) => {
                const parent = document.getElementById('lienzo-trabajo');
                onUpdate(item.id, { x: (d.x / parent.offsetWidth) * 100, y: (d.y / parent.offsetHeight) * 100 });
            }}
            onStart={() => setSeleccionado(item.id)}
        >
            <div 
                ref={nodeRef} 
                className="absolute z-30 cursor-move group" 
                style={{ width: `${item.w}%` }}
                // --- CORRECCIÓN CLAVE: EVITA QUE EL CLIC PASE AL FONDO ---
                onClick={(e) => e.stopPropagation()} 
            >
               <div className={`relative transition-all duration-200 ${esSeleccionado ? 'ring-2 ring-blue-500 ring-offset-2 rounded shadow-lg scale-105' : 'hover:ring-1 hover:ring-blue-300'}`}>
                   <img src={item.src} className="w-full h-auto pointer-events-none" />
               </div>
               
               {esSeleccionado && (
                   <MenuFlotante 
                       w={item.w} 
                       onChangeW={(v) => onSize(item.id, v)} 
                       onDup={() => onDup(item.id)} 
                       onDel={() => onDel(item.id)} 
                       onApply={(e) => { e.stopPropagation(); setSeleccionado(null); }} 
                   />
               )}
            </div>
        </Draggable>
    );
};

const HeaderArrastrable = ({ url, pos, setPos, seleccionado, setSeleccionado }) => {
    const nodeRef = useRef(null);
    const esSeleccionado = seleccionado === 'HEADER';
    const ancho = pos.w || 60; 

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            cancel=".no-drag"
            position={{
                x: (pos.x / 100) * document.getElementById('lienzo-trabajo')?.offsetWidth || 0,
                y: (pos.y / 100) * document.getElementById('lienzo-trabajo')?.offsetHeight || 0
            }}
            onStop={(e, d) => {
                const parent = document.getElementById('lienzo-trabajo');
                setPos(prev => ({ ...prev, x: (d.x / parent.offsetWidth) * 100, y: (d.y / parent.offsetHeight) * 100 }));
            }}
            onStart={() => setSeleccionado('HEADER')}
        >
            <div 
                ref={nodeRef} 
                className="absolute z-40 cursor-move" 
                style={{ width: `${ancho}%` }}
                // --- CORRECCIÓN CLAVE ---
                onClick={(e) => e.stopPropagation()} 
            >
                <div className={`relative transition-all ${esSeleccionado ? 'ring-2 ring-yellow-400 ring-offset-2 rounded bg-black/5' : ''}`}>
                    <img src={url} className="w-full object-contain pointer-events-none drop-shadow-lg" />
                </div>
                {esSeleccionado && (
                    <MenuFlotante 
                        soloTamano 
                        w={ancho} 
                        onChangeW={(val) => setPos(prev => ({...prev, w: Number(val)}))} 
                        onApply={(e) => { e.stopPropagation(); setSeleccionado(null); }}
                    />
                )}
            </div>
        </Draggable>
    );
};

const PunteroArrastrable = ({ config, setConfig, seleccionado, setSeleccionado }) => {
    const nodeRef = useRef(null);
    const esSeleccionado = seleccionado === 'PUNTERO';
    const ancho = config.pointerSize || 18;

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            cancel=".no-drag"
            position={{
                x: (config.pointerPos.x / 100) * document.getElementById('lienzo-trabajo')?.offsetWidth || 0,
                y: (config.pointerPos.y / 100) * document.getElementById('lienzo-trabajo')?.offsetHeight || 0
            }}
            onStop={(e, d) => {
                 const parent = document.getElementById('lienzo-trabajo');
                 setConfig(prev => ({ ...prev, pointerPos: { x: (d.x / parent.offsetWidth) * 100, y: (d.y / parent.offsetHeight) * 100 } }));
            }}
            onStart={() => setSeleccionado('PUNTERO')}
        >
             <div 
                ref={nodeRef} 
                className="absolute z-50 cursor-move" 
                style={{ width: `${ancho}%` }}
                // --- CORRECCIÓN CLAVE ---
                onClick={(e) => e.stopPropagation()} 
             >
                 <div className={`relative ${esSeleccionado ? 'ring-2 ring-red-400 ring-offset-2 rounded-full' : ''}`}>
                    <img src={config.pointerUrl} className="w-full drop-shadow-xl pointer-events-none" />
                 </div>
                 {esSeleccionado && (
                    <MenuFlotante 
                        soloTamano 
                        w={ancho} 
                        onChangeW={(val) => setConfig(prev => ({...prev, pointerSize: Number(val)}))} 
                        onApply={(e) => { e.stopPropagation(); setSeleccionado(null); }}
                    />
                 )}
             </div>
        </Draggable>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function LienzoDecorativo({ 
  modoEdicion = false,
  fondo, bgScale = 1, bgFit = 'cover',
  headerUrl, headerPos, setHeaderPos, 
  elementos = [],      
  configRuleta, setConfigRuleta,
  onUpdateElemento,    
  setElementoSeleccionado, elementoSeleccionado,
  onDuplicar, onBorrar, onCambiarTamano 
}) {

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900 shadow-xl select-none" id="lienzo-trabajo">
      
      {/* 1. FONDO */}
      {fondo && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none flex items-center justify-center">
            <img 
                src={fondo} 
                className="w-full h-full transition-transform duration-100" 
                style={{ objectFit: bgFit, transform: `scale(${bgScale})` }} 
                alt="Fondo" 
            />
        </div>
      )}

      {/* 2. ENCABEZADO */}
      {headerUrl && (
          modoEdicion ? (
            <HeaderArrastrable url={headerUrl} pos={headerPos} setPos={setHeaderPos} seleccionado={elementoSeleccionado} setSeleccionado={setElementoSeleccionado}/>
          ) : (
            <div className="absolute z-40" style={{ width: `${headerPos?.w || 60}%`, left: `${headerPos?.x || 10}%`, top: `${headerPos?.y || 5}%` }}>
                 <img src={headerUrl} className="w-full object-contain drop-shadow-lg" />
            </div>
          )
      )}

      {/* 3. ELEMENTOS */}
      {elementos.map((item) => {
        if (!modoEdicion) {
          return (
            <img key={item.id} src={item.src} className="absolute z-20 pointer-events-none"
              style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%` }} />
          );
        }
        return (
            <ElementoArrastrable 
                key={item.id} item={item} seleccionado={elementoSeleccionado} 
                onUpdate={onUpdateElemento} setSeleccionado={setElementoSeleccionado}
                onDup={onDuplicar} onDel={onBorrar} onSize={onCambiarTamano}
            />
        );
      })}

      {/* 4. MOCKUP RULETA */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative w-[90%] aspect-square rounded-full border-4 border-dashed border-white/20 flex items-center justify-center" style={{ borderColor: configRuleta?.bordeColor }}>
             <span className="text-white/30 text-xs font-bold">ZONA RULETA</span>
          </div>
      </div>

      {/* 5. PUNTERO */}
      {modoEdicion ? (
          <PunteroArrastrable config={configRuleta} setConfig={setConfigRuleta} seleccionado={elementoSeleccionado} setSeleccionado={setElementoSeleccionado}/>
      ) : (
          <div className="absolute z-50" style={{ width: `${configRuleta.pointerSize || 18}%`, left: `${configRuleta.pointerPos.x}%`, top: `${configRuleta.pointerPos.y}%` }}>
             <img src={configRuleta.pointerUrl} className="w-full drop-shadow-xl" />
          </div>
      )}
    </div>
  );
}