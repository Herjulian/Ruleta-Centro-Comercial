import React from 'react';

// RELACIÓN DE ASPECTO: 9/16 (Vertical tipo celular/Totem)
// Si alguna vez lo necesitas horizontal (TV normal), cambias a aspect-[16/9]
const ASPECT_RATIO_CLASS = "aspect-[9/16]"; 

export default function ContenedorPantalla({ children }) {
  return (
    // 1. FONDO INFINITO: Ocupa toda la ventana real del sistema operativo (negro o gris oscuro)
    <div className="w-screen h-screen bg-gray-900 flex items-center justify-center overflow-hidden">
      
      {/* 2. EL AREA SEGURA (La Pantalla Virtual):
          - Se mantiene siempre 9:16.
          - Crece hasta tocar el borde de arriba/abajo (h-full).
          - Pero nunca se pasa del ancho (max-w-full).
          - Si la pantalla es muy ancha, deja bandas negras a los lados.
          - Si la pantalla es muy alta, deja bandas negras arriba/abajo.
      */}
      <div className={`relative ${ASPECT_RATIO_CLASS} h-full w-auto max-w-full bg-white shadow-2xl overflow-hidden flex flex-col`}>
        {children}
      </div>
      
    </div>
  );
}