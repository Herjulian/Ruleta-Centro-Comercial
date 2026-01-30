import { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaBoxOpen } from 'react-icons/fa'; // Eliminamos FaLock
import { toast } from "react-toastify";

// --- FIREBASE IMPORTS ---
import { db } from "../../firebase/config";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

export default function Actualizar() {
  const [premios, setPremios] = useState([]);
  
  // Estados del Formulario
  const [nuevoPremio, setNuevoPremio] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [estado, setEstado] = useState("Predeterminado");
  
  // MANTENEMOS EL ESTADO INTERNO, PERO OCULTO A LA VISTA
  // Esto es necesario para no borrar la configuración si editas el nombre del premio
  const [hastamalcro, setHastamalcro] = useState(0); 
  
  const [editId, setEditId] = useState(null);

  // Estados de Control Visual
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [modalDeleteVisible, setModalDeleteVisible] = useState(false);
  const [premioParaBorrar, setPremioParaBorrar] = useState(null);

  const premiosCollection = collection(db, "inventario_premios");

  // --- CARGAR DATOS ---
  const cargarPremiosCloud = async () => {
    try {
      const data = await getDocs(premiosCollection);
      setPremios(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      toast.error("Error conectando con la nube");
    }
  };

  useEffect(() => { cargarPremiosCloud(); }, []);

  // --- RESETEAR FORMULARIO ---
  const resetForm = () => {
    setNuevoPremio("");
    setCantidad(1);
    setEstado("Predeterminado");
    setHastamalcro(0); // Siempre nace limpio (0)
    setEditId(null);
    setModalFormVisible(false);
  };

  // --- ABRIR MODAL PARA CREAR ---
  const abrirCrear = () => {
    resetForm(); 
    setModalFormVisible(true);
  }

  // --- ABRIR MODAL PARA EDITAR ---
  const prepararEdicion = (premio) => {
    setNuevoPremio(premio.nombre);
    setCantidad(premio.cantidad);
    setEstado(premio.estado);
    
    // RECUPERAMOS EL VALOR OCULTO (Para no perderlo al guardar)
    // Si tú lo pusiste en 1 desde Firebase, aquí lo recordamos en memoria,
    // pero NO lo mostramos en el formulario.
    setHastamalcro(premio.Hastamalcro || 0); 
    
    setEditId(premio.id);
    setModalFormVisible(true);
  };

  // --- GUARDAR / ACTUALIZAR ---
  const agregarPremio = async (e) => {
    e.preventDefault();
    if (!nuevoPremio.trim()) return toast.warn("Nombre obligatorio");

    const dataPremio = {
      nombre: nuevoPremio.trim(),
      cantidad: Number(cantidad) || 0,
      estado: estado,
      // Enviamos el valor oculto (0 si es nuevo, o el que tenga si es editado)
      Hastamalcro: Number(hastamalcro) 
    };

    try {
      if (editId !== null) {
        await updateDoc(doc(db, "inventario_premios", editId), dataPremio);
        toast.success("Premio actualizado");
      } else {
        const existe = premios.some(p => p.nombre.toLowerCase() === nuevoPremio.trim().toLowerCase());
        if (existe) return toast.warn("Este premio ya existe");
        
        await addDoc(premiosCollection, dataPremio);
        toast.success("Premio creado");
      }
      cargarPremiosCloud();
      resetForm();
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };
  
  // --- BORRAR ---
  const confirmarEliminar = async () => {
    if (!premioParaBorrar) return;
    try {
      await deleteDoc(doc(db, "inventario_premios", premioParaBorrar.id));
      toast.success("Premio eliminado");
      cargarPremiosCloud();
      setModalDeleteVisible(false);
    } catch (error) {
      toast.error("Error eliminando");
    }
  };

  return (
    <div className="w-full min-h-screen p-8 animate-fadeIn relative">
      
      {/* --- ENCABEZADO --- */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FaBoxOpen /> Inventario de Premios
            </h1>
            <p className="text-gray-400 text-sm mt-1">Panel de Control</p>
        </div>
        <button 
            onClick={abrirCrear}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
        >
            <FaPlus /> Nuevo Item
        </button>
      </div>

      {/* --- GRID DE PREMIOS (SIN RASTROS VISUALES) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {premios.map((p) => (
            // Eliminada la lógica de borde rojo. Ahora todos son iguales.
            <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-xl flex flex-col justify-between hover:border-blue-500 transition-colors group relative overflow-hidden">
                
                {/* ELIMINADO EL INDICADOR "TARGET" */}

                <div className="mb-4">
                    <h3 className="text-xl font-bold text-white truncate mb-1" title={p.nombre}>{p.nombre}</h3>
                    <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                        <span>Stock: <strong className={p.cantidad === 0 ? "text-red-500" : "text-green-400"}>{p.cantidad}</strong></span>
                        {/* ELIMINADA LA REFERENCIA VISUAL AL CÓDIGO INTERNO */}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border ${p.estado === 'Excluir' ? 'border-red-500 text-red-400' : 'border-gray-600 text-gray-300'}`}>
                        {p.estado}
                    </span>
                </div>

                <div className="flex gap-3 mt-2">
                    <button 
                        onClick={() => prepararEdicion(p)}
                        className="flex-1 bg-gray-700 hover:bg-blue-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 transition-colors cursor-pointer"
                    >
                        <FaEdit /> Editar
                    </button>
                    <button 
                        onClick={() => { setPremioParaBorrar(p); setModalDeleteVisible(true); }}
                        className="bg-gray-700 hover:bg-red-600 text-white w-10 rounded-lg flex justify-center items-center transition-colors cursor-pointer"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* --- MODAL FORMULARIO (SIN INPUT SECRETO) --- */}
      {modalFormVisible && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-600 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative animate-scaleIn">
                
                <button onClick={resetForm} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl cursor-pointer">
                    <FaTimes />
                </button>

                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    {editId ? "Editar Configuración" : "Nuevo Item"}
                </h2>

                <form onSubmit={agregarPremio} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Nombre</label>
                        <input 
                            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:border-blue-500 outline-none" 
                            type="text" 
                            value={nuevoPremio} 
                            onChange={(e) => setNuevoPremio(e.target.value)} 
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-bold text-gray-400 mb-1">Cantidad</label>
                            <input 
                                className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:border-blue-500 outline-none" 
                                type="number" 
                                min="0"
                                value={cantidad} 
                                onChange={(e) => setCantidad(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* ELIMINADO EL SELECTOR DE "PARAMETRIZACIÓN INTERNA" */}
                    {/* El valor se mantiene en memoria (state) pero no se ve ni se edita aquí */}

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Estado Visual</label>
                        <select 
                            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:border-blue-500 outline-none"
                            value={estado} 
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            <option value="Predeterminado">Visible</option>
                            <option value="Excluir">Oculto / Excluido</option>
                        </select>
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg mt-4 transition-colors cursor-pointer">
                        {editId ? "Guardar Cambios" : "Crear Premio"}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL CONFIRMACIÓN BORRAR --- */}
      {modalDeleteVisible && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl text-center max-w-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar este premio?</h3>
                <p className="text-gray-600 mb-6">Si lo borras, desaparecerá de la ruleta inmediatamente.</p>
                <div className="flex justify-center gap-3">
                    <button onClick={() => setModalDeleteVisible(false)} className="cursor-pointer px-4 py-2 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300">Cancelar</button>
                    <button onClick={confirmarEliminar} className="cursor-pointer px-4 py-2 bg-red-600 rounded-lg font-bold text-white hover:bg-red-700">Sí, Eliminar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}