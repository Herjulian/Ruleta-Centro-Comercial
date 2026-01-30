import { useState, useEffect } from 'react';
import { db } from '../../firebase/config'; 
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import LienzoDecorativo from '../../components/LienzoDecorativo'; 
import { 
    MdSave, MdWallpaper, MdAddPhotoAlternate, MdCheckCircle, 
    MdColorLens, MdEdit, MdZoomIn, MdImage, MdDelete, 
    MdAspectRatio, MdCropFree, MdCancel 
} from "react-icons/md";

export default function Plantillas() {
  const [nombre, setNombre] = useState("");
  const [idEdicion, setIdEdicion] = useState(null); 
  
  const [fondoUrl, setFondoUrl] = useState("");
  const [bgScale, setBgScale] = useState(1); 
  const [bgFit, setBgFit] = useState("cover");
  
  const [headerUrl, setHeaderUrl] = useState(""); 
  const [headerPos, setHeaderPos] = useState({ x: 10, y: 5, w: 60 }); 

  const [elementos, setElementos] = useState([]); 
  const [configRuleta, setConfigRuleta] = useState({
      bordeColor: '#D6006E', centroColor: '#240046', botonColor: '#FFC400',
      pointerUrl: '/assets/img/puntero.png', pointerPos: { x: 42, y: 10 }, pointerSize: 18
  });
  
  const [seleccionado, setSeleccionado] = useState(null); 
  const [guardando, setGuardando] = useState(false);
  const [misDisenos, setMisDisenos] = useState([]);

  const cargarGaleria = async () => {
    try {
        const query = await getDocs(collection(db, "mis_plantillas"));
        const lista = query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMisDisenos(lista.reverse());
    } catch (error) { console.error(error); } 
  };
  useEffect(() => { cargarGaleria(); }, []);

  const editarDiseno = (diseno) => {
      setIdEdicion(diseno.id); 
      setNombre(diseno.nombre);
      setFondoUrl(diseno.fondo);
      setBgScale(diseno.bgScale || 1); 
      setBgFit(diseno.bgFit || "cover");
      setHeaderUrl(diseno.header || "");
      setHeaderPos(diseno.headerPos || { x: 10, y: 5, w: 60 });
      setElementos(diseno.elementos || []);
      setConfigRuleta({ ...diseno.configRuleta, pointerSize: diseno.configRuleta?.pointerSize || 18 });
      toast.info(`Editando: ${diseno.nombre}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
      setIdEdicion(null);
      setNombre(""); setFondoUrl(""); setHeaderUrl(""); setElementos([]); 
      setBgScale(1); setBgFit("cover");
      toast.info("Cancelado.");
  };

  const comprimirImagen = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const MAX = 1920; 
          if(width > height && width > MAX) { height *= MAX/width; width = MAX; }
          else if(height > MAX) { width *= MAX/height; height = MAX; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.90));
        };
      };
    });
  };

  const procesarArchivo = async (e, tipo) => {
    const file = e.target.files[0];
    if(!file) return;
    const toastId = toast.loading("Procesando HD...");
    const imgHD = await comprimirImagen(file);
    
    if (tipo === 'bg') setFondoUrl(imgHD);
    if (tipo === 'header') setHeaderUrl(imgHD);
    if (tipo === 'puntero') setConfigRuleta(prev => ({ ...prev, pointerUrl: imgHD }));
    if (tipo === 'deco') {
        const id = Date.now();
        setElementos([...elementos, { id, src: imgHD, x: 40, y: 40, w: 20 }]);
        setSeleccionado(id);
    }
    toast.update(toastId, { render: "Listo", type: "success", isLoading: false, autoClose: 1000 });
  };

  const duplicarElemento = (id) => {
      const item = elementos.find(e => e.id === id);
      if(item) {
          const nuevo = { ...item, id: Date.now(), x: item.x + 5, y: item.y + 5 };
          setElementos([...elementos, nuevo]);
          setSeleccionado(nuevo.id);
      }
  };

  const cambiarTamanoElemento = (id, nuevoTamano) => {
      setElementos(prev => prev.map(el => el.id === id ? { ...el, w: Number(nuevoTamano) } : el));
  };

  const borrarElemento = (id) => {
      setElementos(prev => prev.filter(e => e.id !== id));
      setSeleccionado(null);
  };

  const actualizarPosicion = (id, pos) => {
     setElementos(prev => prev.map(el => el.id === id ? { ...el, ...pos } : el));
  };

  const guardarDiseno = async () => {
     if(!nombre || !fondoUrl) return toast.warning("Falta nombre o fondo");
     setGuardando(true);
     try {
         const dataTema = {
             nombre, fondo: fondoUrl, 
             bgScale, bgFit,
             header: headerUrl, headerPos, 
             elementos, configRuleta,
             actualizada: new Date()
         };

         if (idEdicion) {
             await updateDoc(doc(db, "mis_plantillas", idEdicion), dataTema);
             toast.success("¡Actualizado!");
         } else {
             await addDoc(collection(db, "mis_plantillas"), { ...dataTema, creada: new Date() });
             toast.success("¡Creado!");
         }

         setNombre(""); setFondoUrl(""); setHeaderUrl(""); setElementos([]); 
         setIdEdicion(null); setBgScale(1); setBgFit("cover");
         cargarGaleria(); 
     } catch (e) { toast.error("Error al guardar"); } 
     finally { setGuardando(false); }
  };

  const aplicarDiseno = async (tema) => {
     const toastId = toast.loading("Aplicando...");
     try {
         await setDoc(doc(db, "configuracion", "general"), { 
             temaActivo: 'custom_v2', datosTema: tema 
         }, { merge: true });
         toast.update(toastId, { render: "¡Aplicado!", type: "success", isLoading: false, autoClose: 2000 });
     } catch (e) { toast.dismiss(toastId); }
  };

  const borrarDiseno = async (e, id) => {
      e.stopPropagation();
      if(!window.confirm("¿Eliminar diseño?")) return;
      await deleteDoc(doc(db, "mis_plantillas", id));
      if (idEdicion === id) cancelarEdicion(); 
      cargarGaleria();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100 overflow-hidden">
        
        {/* EDITOR */}
        <div className="h-[65%] flex border-b-4 border-gray-300 shadow-md z-10 bg-white">
            <div className="w-80 p-4 overflow-y-auto border-r border-gray-200 flex flex-col gap-3">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {idEdicion ? <span className="text-orange-600 flex items-center gap-1"><MdEdit/> Editando</span> : <span className="text-blue-600 flex items-center gap-1"><MdColorLens/> Crear</span>}
                    </h2>
                    {/* BOTÓN CANCELAR MEJORADO */}
                    {idEdicion && (
                        <button onClick={cancelarEdicion} className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-sm">
                            <MdCancel/> Cancelar
                        </button>
                    )}
                </div>
                
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} 
                    className="w-full p-2 border rounded focus:ring-2 ring-blue-500 outline-none text-sm shadow-sm" 
                    placeholder="Nombre del Tema" />

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 shadow-inner">
                    <p className="text-xs font-bold text-gray-500 flex items-center gap-1"><MdWallpaper/> AJUSTES DE FONDO</p>
                    <div className="flex gap-2">
                        <button onClick={() => setBgFit("cover")} className={`flex-1 py-1.5 text-xs rounded border flex items-center justify-center gap-1 transition-all cursor-pointer ${bgFit === 'cover' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                            <MdCropFree/> Rellenar
                        </button>
                        <button onClick={() => setBgFit("contain")} className={`flex-1 py-1.5 text-xs rounded border flex items-center justify-center gap-1 transition-all cursor-pointer ${bgFit === 'contain' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                            <MdAspectRatio/> Ajustar
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <MdZoomIn size={14} className="text-gray-400"/>
                        <input type="range" min="1" max="2.5" step="0.1" value={bgScale} onChange={(e) => setBgScale(Number(e.target.value))} className="w-full h-1 bg-gray-300 rounded appearance-none cursor-pointer"/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="border border-dashed border-gray-400 p-2 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative text-center h-16 flex flex-col justify-center items-center group">
                        <MdWallpaper size={18} className="text-gray-500 group-hover:text-blue-500"/> <span className="font-bold mt-1 text-gray-600 group-hover:text-blue-600">FONDO</span>
                        <input type="file" onChange={e => procesarArchivo(e, 'bg')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                    <div className="border border-dashed border-gray-400 p-2 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative text-center h-16 flex flex-col justify-center items-center group">
                        <MdImage size={18} className="text-gray-500 group-hover:text-blue-500"/> <span className="font-bold mt-1 text-gray-600 group-hover:text-blue-600">HEADER</span>
                        <input type="file" onChange={e => procesarArchivo(e, 'header')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                </div>

                <div className="border border-dashed border-gray-400 p-2 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative text-center text-xs flex items-center justify-center gap-2 group h-10">
                    <MdAddPhotoAlternate size={18} className="text-gray-500 group-hover:text-blue-500"/> <span className="font-bold text-gray-600 group-hover:text-blue-600">AGREGAR OBJETO</span>
                    <input type="file" accept="image/*" onChange={e => procesarArchivo(e, 'deco')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                </div>
                <div className="border border-dashed border-gray-400 p-2 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative text-center text-xs flex items-center justify-center gap-2 group h-10">
                    <span className="text-lg">📍</span> <span className="font-bold text-gray-600 group-hover:text-blue-600">PUNTERO</span>
                    <input type="file" accept="image/*" onChange={e => procesarArchivo(e, 'puntero')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                </div>

                <div className="border p-2 rounded-lg bg-gray-50 flex justify-between items-center text-xs shadow-sm">
                    <span className="font-bold text-gray-500">Colores</span>
                    <div className="flex gap-1">
                        <input type="color" value={configRuleta.bordeColor} onChange={e => setConfigRuleta({...configRuleta, bordeColor: e.target.value})} className="h-7 w-7 rounded cursor-pointer border-2 border-white shadow-sm"/>
                        <input type="color" value={configRuleta.centroColor} onChange={e => setConfigRuleta({...configRuleta, centroColor: e.target.value})} className="h-7 w-7 rounded cursor-pointer border-2 border-white shadow-sm"/>
                        <input type="color" value={configRuleta.botonColor} onChange={e => setConfigRuleta({...configRuleta, botonColor: e.target.value})} className="h-7 w-7 rounded cursor-pointer border-2 border-white shadow-sm"/>
                    </div>
                </div>

                <button onClick={guardarDiseno} disabled={guardando} 
                    className={`mt-auto w-full py-3 font-bold rounded-lg shadow-md flex items-center justify-center gap-2 text-white transition-all transform active:scale-95 cursor-pointer ${idEdicion ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
                    <MdSave size={20}/> {guardando ? "Guardando..." : idEdicion ? "ACTUALIZAR" : "GUARDAR NUEVO"}
                </button>
            </div>

            {/* LIENZO */}
            <div className="flex-1 bg-gray-200 flex items-center justify-center p-4">
                <div 
                    className="relative aspect-[9/16] h-full bg-white shadow-2xl rounded border-4 border-gray-800 overflow-hidden" 
                    onClick={() => setSeleccionado(null)}
                >
                    <LienzoDecorativo 
                        modoEdicion={true}
                        fondo={fondoUrl} 
                        bgScale={bgScale} bgFit={bgFit} 
                        headerUrl={headerUrl} headerPos={headerPos} setHeaderPos={setHeaderPos} 
                        elementos={elementos}
                        configRuleta={configRuleta} setConfigRuleta={setConfigRuleta}
                        onUpdateElemento={actualizarPosicion}
                        setElementoSeleccionado={setSeleccionado} elementoSeleccionado={seleccionado}
                        onDuplicar={duplicarElemento}
                        onBorrar={borrarElemento}
                        onCambiarTamano={cambiarTamanoElemento}
                    />
                </div>
            </div>
        </div>

        {/* GALERÍA */}
        <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                <MdCheckCircle className="text-green-600"/> Galería
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {misDisenos.map((diseno) => (
                    <div key={diseno.id} 
                        className={`group relative bg-white rounded-lg shadow cursor-pointer transition-all border-2 overflow-hidden h-40 flex flex-col ${idEdicion === diseno.id ? 'border-orange-500 ring-2 ring-orange-200' : 'border-transparent hover:border-green-500 hover:shadow-lg'}`}
                        onClick={() => editarDiseno(diseno)} 
                    >
                        <div className="flex-1 bg-gray-800 relative overflow-hidden">
                            <img src={diseno.fondo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <button onClick={(e) => { e.stopPropagation(); aplicarDiseno(diseno); }} className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded shadow hover:scale-105 transition-transform cursor-pointer">USAR</button>
                            </div>
                            <button onClick={(e) => borrarDiseno(e, diseno.id)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-700 cursor-pointer"><MdDelete size={14}/></button>
                        </div>
                        <div className="p-2 bg-white text-center border-t">
                            <p className="font-bold text-sm text-gray-800 truncate">{diseno.nombre}</p>
                            {idEdicion === diseno.id && <p className="text-[10px] text-orange-500 font-bold animate-pulse">EDITANDO...</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}