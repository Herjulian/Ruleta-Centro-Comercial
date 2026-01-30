export default function AccesoDenegado() {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-black text-white text-center p-10">
      <h1 className="text-6xl font-bold text-red-600 mb-4">⛔ ACCESO DENEGADO</h1>
      <p className="text-2xl text-gray-400">
        Esta aplicación es de uso exclusivo para terminales autorizadas.
      </p>
      <p className="mt-8 text-sm text-gray-600 font-mono">Error: 403 Forbidden - Environment Check Failed</p>
    </div>
  );
}