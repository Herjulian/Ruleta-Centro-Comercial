import { useEffect, useState } from "react";
import { FaSearch, FaCalendarAlt, FaUser, FaGift, FaFilter, FaFileExcel } from 'react-icons/fa';
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { toast } from "react-toastify";
import ExcelJS from 'exceljs';

// --- FIREBASE IMPORTS ---
import { db } from "../../firebase/config";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function ListInfo() {
  const [historial, setHistorial] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargandoExcel, setCargandoExcel] = useState(false);
  
  // 8 registros por página
  const [itemsPorPagina] = useState(8); 
  
  // --- FILTROS ---
  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");

  // --- 1. CARGAR DATOS ---
  const cargarDatos = async () => {
    try {
      const q = query(collection(db, "historial_juegos"), orderBy("fecha", "desc"));
      const querySnapshot = await getDocs(q);
      const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistorial(lista);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando historial");
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // --- LÓGICA DE AÑOS DINÁMICOS ---
  const aniosDisponibles = [...new Set(historial.map(item => {
      if (!item.fecha_local) return null;
      return new Date(item.fecha_local).getFullYear();
  }))]
  .filter(anio => anio !== null)
  .sort((a, b) => b - a);


  // --- 2. LÓGICA DE FILTRADO AVANZADO ---
  const datosFiltrados = historial.filter((item) => {
    const termino = busqueda.toLowerCase();
    
    // NOTA: Eliminamos la búsqueda por factura (Ya no existe)
    const coincideTexto = (
      item.cedula?.toString().includes(termino) || 
      item.premio?.toLowerCase().includes(termino)
    );

    if (!item.fecha_local) return false;
    const fechaObj = new Date(item.fecha_local);
    
    const mesItem = (fechaObj.getMonth() + 1).toString();
    const anioItem = fechaObj.getFullYear().toString();

    const coincideMes = filtroMes === "" || mesItem === filtroMes;
    const coincideAnio = filtroAnio === "" || anioItem === filtroAnio;

    return coincideTexto && coincideMes && coincideAnio;
  });

  // --- 3. LÓGICA DE PAGINACIÓN ---
  const totalPaginas = Math.ceil(datosFiltrados.length / itemsPorPagina);
  const indexUltimoItem = paginaActual * itemsPorPagina;
  const indexPrimerItem = indexUltimoItem - itemsPorPagina;
  const itemsActuales = datosFiltrados.slice(indexPrimerItem, indexUltimoItem);

  const cambiarPagina = (numero) => setPaginaActual(numero);

  // --- GENERADOR DE PAGINACIÓN ---
  const renderPaginacion = () => {
    const paginas = [];
    if (totalPaginas <= 7) {
        for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
        if (paginaActual <= 4) {
            paginas.push(1, 2, 3, 4, 5, "...", totalPaginas);
        } else if (paginaActual >= totalPaginas - 3) {
            paginas.push(1, "...", totalPaginas - 4, totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
        } else {
            paginas.push(1, "...", paginaActual - 1, paginaActual, paginaActual + 1, "...", totalPaginas);
        }
    }
    return paginas.map((pag, index) => (
        <button
            key={index}
            onClick={() => typeof pag === "number" && cambiarPagina(pag)}
            disabled={pag === "..."}
            // AQUÍ AGREGUÉ 'cursor-pointer'
            className={`w-8 h-8 rounded font-bold text-sm mx-1 transition-all
                ${pag === paginaActual 
                    ? 'bg-blue-600 text-white shadow-lg scale-110 cursor-default' 
                    : pag === "..." 
                        ? 'bg-transparent text-gray-500 cursor-default' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer'}`}
        >
            {pag}
        </button>
    ));
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "---";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-CO", { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // ==========================================
  // EXPORTAR A EXCEL (CON BORDES SOLO AQUÍ)
  // ==========================================
  const descargarExcel = async () => {
    if (datosFiltrados.length === 0) {
      toast.warning("No hay datos para exportar con los filtros actuales.");
      return;
    }

    setCargandoExcel(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Histórico Ganadores', {
        properties: { tabColor: { argb: 'FF6a1b9a' } }
      });

      // 1. Definimos columnas (SIN FACTURA)
      worksheet.columns = [
        { header: 'FECHA REGISTRO', key: 'fecha', width: 25 },
        { header: 'CÉDULA', key: 'cedula', width: 20 },
        { header: 'PREMIO ENTREGADO', key: 'premio', width: 45 },
      ];

      // 2. Estilos del Encabezado
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2e1065' } // Morado oscuro
        };
        cell.font = {
          name: 'Arial',
          color: { argb: 'FFFFFFFF' },
          bold: true,
          size: 11
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        // BORDE DEL ENCABEZADO (SOLO EN EXCEL)
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
      });

      // 3. Insertar datos
      datosFiltrados.forEach((item, index) => {
        const row = worksheet.addRow({
          fecha: formatearFecha(item.fecha_local),
          cedula: item.cedula,
          premio: item.premio
        });

        // Alternar colores (Zebra)
        if (index % 2 === 1) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
            });
        }
        
        // --- AQUÍ ESTÁN LOS BORDES (INTERIORES Y EXTERIORES) ---
        // Al poner borde a TODAS las celdas, se crea la rejilla completa en Excel
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } }, // Negro o Gris Oscuro
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
            
            // Centrar columnas específicas
            if (cell._column.key === 'fecha' || cell._column.key === 'cedula') {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else {
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      
      if (window.electron && window.electron.saveExcel) {
        const resultado = await window.electron.saveExcel(buffer);
        if (resultado.success) toast.success("Excel guardado exitosamente");
        else if (resultado.error) toast.error("Error al guardar el archivo");
      } else {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Reporte_Ganadores.xlsx';
        a.click();
        toast.success("Descarga web iniciada");
      }

    } catch (error) {
      console.error("Error exportando excel:", error);
      toast.error("Error al generar el Excel");
    } finally {
      setCargandoExcel(false);
    }
  };

  return (
    <div className="w-[95%] h-full p-6 flex flex-col animate-fadeIn">
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Tabla de Registro Histórico </h1>
          <p className="text-gray-400 text-sm">Registro histórico inmutable ({datosFiltrados.length} registros)</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
            
            <select 
                className="bg-gray-800 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 w-full sm:w-auto cursor-pointer"
                value={filtroMes}
                onChange={(e) => { setFiltroMes(e.target.value); setPaginaActual(1); }}
            >
                <option value="">Todos los Meses</option>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                {/* ... resto de opciones ... */}
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
            </select>

            <select 
                className="bg-gray-800 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 w-full sm:w-auto cursor-pointer"
                value={filtroAnio}
                onChange={(e) => { setFiltroAnio(e.target.value); setPaginaActual(1); }}
            >
                <option value="">Todos los Años</option>
                {aniosDisponibles.map(anio => (
                    <option key={anio} value={anio}>{anio}</option>
                ))}
            </select>

            <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-500" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Buscar Cédula , Producto..."
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                />
            </div>

            <button
                onClick={descargarExcel}
                disabled={cargandoExcel}
                // AQUÍ AGREGUÉ 'cursor-pointer'
                className={`flex items-center gap-2 px-4 p-3 rounded-lg font-bold text-white transition-all shadow-md cursor-pointer
                  ${cargandoExcel ? 'bg-green-800 cursor-wait' : 'bg-green-600 hover:bg-green-500 hover:shadow-lg hover:scale-105 active:scale-95'}
                `}
                title="Descargar tabla actual a Excel"
            >
                {cargandoExcel ? (
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                    <FaFileExcel className="text-xl" />
                )}
                <span className="hidden sm:inline">Exportar</span>
            </button>

        </div>
      </div>

      {/* --- TABLA DE DATOS (VISUAL: SIN BORDES GRUESOS, ESTILO LIMPIO) --- */}
      <div className="flex-grow overflow-hidden rounded-xl border border-gray-700 shadow-2xl bg-gray-900/50 flex flex-col">
        <div className="overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs font-bold tracking-wider sticky top-0 z-10 shadow-md">
              <tr>
                <th className="p-4 w-48"><div className="flex items-center gap-2"><FaCalendarAlt /> Fecha</div></th>
                <th className="p-4 w-40"><div className="flex items-center gap-2"><FaUser /> Cédula</div></th>
                {/* SIN FACTURA */}
                <th className="p-4"><div className="flex items-center gap-2"><FaGift /> Premio Entregado</div></th>
              </tr>
            </thead>
            {/* VOLVEMOS AL ESTILO LIMPIO 'divide-y' */}
            <tbody className="text-gray-300 divide-y divide-gray-700">
              {itemsActuales.length > 0 ? (
                itemsActuales.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-sm font-mono text-blue-300">{formatearFecha(item.fecha_local)}</td>
                    <td className="p-4 font-bold">{item.cedula}</td>
                    <td className="p-4">
                      <span className={`font-bold text-lg text-white`}>
                            {item.premio}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                    <FaFilter className="text-4xl mb-2 opacity-20" />
                    <p>No se encontraron registros con estos filtros.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- BARRA DE PAGINACIÓN --- */}
      <div className="mt-4 flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 shrink-0">
          <span className="text-sm text-gray-400 pl-2">
             Pág {paginaActual} de {totalPaginas || 1}
          </span>
          
          <div className="flex gap-1">
            <button 
              onClick={() => cambiarPagina(paginaActual - 1)} 
              disabled={paginaActual === 1}
              className={`p-2 rounded bg-gray-700 text-white hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-gray-700 transition-colors cursor-pointer disabled:cursor-default`}
            >
              <IoIosArrowBack />
            </button>

            {renderPaginacion()}

            <button 
              onClick={() => cambiarPagina(paginaActual + 1)} 
              disabled={paginaActual === totalPaginas || totalPaginas === 0}
              className={`p-2 rounded bg-gray-700 text-white hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-gray-700 transition-colors cursor-pointer disabled:cursor-default`}
            >
              <IoIosArrowForward />
            </button>
          </div>
        </div>
    </div>
  );
}