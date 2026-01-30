// src/config/themes.js

// Si tienes imágenes específicas, impórtalas aquí. 
// Por ahora usaré rutas relativas asumiendo que están en public/assets
// O puedes usar URLs externas para probar.

export const THEMES = {
  default: {
    id: 'default',
    nombre: "Original (La Florida)",
    previewColor: "#D6006E", // Color principal para mostrar en la tarjeta
    colors: {
      bg: "#240046", // Fondo morado
      primary: "#D6006E", 
      secondary: "#FFC400",
      text: "#ffffff"
    },
    images: {
      background: "/assets/img/Fondo-Ruleta.png", // Asegúrate de tener esta imagen
      logo: "/assets/img/Logo-Florida.png",
      puntero: "/assets/img/puntero.png"
    }
  },
  navidad: {
    id: 'navidad',
    nombre: "Especial Navidad",
    previewColor: "#b91c1c", // Rojo oscuro
    colors: {
      bg: "#0f172a", // Azul noche
      primary: "#dc2626", // Rojo navidad
      secondary: "#16a34a", // Verde pino
      text: "#fef2f2"
    },
    images: {
      background: "/assets/img/bg-navidad.png", // Tendrás que subir esta imagen
      logo: "/assets/img/Logo-Navidad.png",
      puntero: "/assets/img/puntero-reno.png"
    }
  },
  halloween: {
    id: 'halloween',
    nombre: "Halloween",
    previewColor: "#ea580c", // Naranja
    colors: {
      bg: "#1c1917", // Negro casi puro
      primary: "#ea580c", // Naranja calabaza
      secondary: "#7c3aed", // Morado bruja
      text: "#ffedd5"
    },
    images: {
      background: "/assets/img/bg-halloween.png",
      logo: "/assets/img/Logo-Halloween.png",
      puntero: "/assets/img/puntero-calabaza.png"
    }
  }
};