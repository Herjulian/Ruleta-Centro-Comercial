/* eslint-env node */

// 1. AQUÍ AGREGUÉ 'dialog' que faltaba
const { app, BrowserWindow, ipcMain, dialog } = require('electron'); 
const path = require('path');
const { autoUpdater } = require('electron-updater');
// 2. AQUÍ AGREGUÉ 'fs' (File System) para poder escribir el archivo en el disco
const fs = require('fs');

// Módulos para el servidor HTTP interno (Kiosco)
const serve = require('serve-static');
const finalhandler = require('finalhandler');
const http = require('http');

// --- Detectar desarrollo vs producción ---
const isDev = process.env.NODE_ENV === 'development';

// --- Variables Globales ---
let win; 
let httpServer; 
const PORT = 3000; 

// --- CONFIGURACIÓN DEL AUTO UPDATER ---
autoUpdater.logger = require("console");
autoUpdater.autoDownload = true; 

function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true, // Kiosco mode
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, 
    },
  });

  // 1. Lógica de Carga para Desarrollo
  if (isDev) {
    win.loadURL("http://localhost:5173");
  }
  // 2. Lógica de Carga para Producción (Servidor Interno)
  else {
    const servePath = path.join(__dirname, 'dist');
    const serveStatic = serve(servePath);

    const startServerAndLoad = (port) => {
      httpServer = http.createServer((req, res) => {
        serveStatic(req, res, finalhandler(req, res));
      });

      httpServer.listen(port, () => {
        console.log(`Servidor Kiosco escuchando en puerto ${port}`);
        win.loadURL(`http://localhost:${port}`);
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Puerto ${port} ocupado, probando siguiente...`);
          startServerAndLoad(port + 1);
        } else {
          console.error('Error fatal del servidor:', err);
          app.quit();
        }
      });
    };

    startServerAndLoad(PORT);
  }

  // --- EVENTOS DE ACTUALIZACIÓN ---
  win.once('ready-to-show', () => {
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
  });

  win.on('closed', () => {
    if (httpServer && httpServer.listening) {
      httpServer.close();
    }
    win = null;
  });
}

// --- LISTENERS DE LA ACTUALIZACIÓN ---
autoUpdater.on('update-available', () => {
  if(win) win.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  if(win) win.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

// ==========================================
// NUEVO: MANEJADOR PARA GUARDAR EXCEL
// ==========================================
ipcMain.handle('dialog:saveExcel', async (event, buffer) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Guardar Reporte de Ganadores',
    defaultPath: path.join(app.getPath('downloads'), 'Reporte_Ganadores.xlsx'), // Sugiere carpeta Descargas
    buttonLabel: 'Guardar Archivo',
    filters: [
      { name: 'Archivos de Excel', extensions: ['xlsx'] }
    ]
  });

  if (filePath) {
    // Escribimos el archivo usando fs
    try {
      fs.writeFileSync(filePath, Buffer.from(buffer));
      return { success: true, path: filePath };
    } catch (e) {
      console.error(e);
      return { canceled: true, error: e.message };
    }
  } else {
    return { canceled: true };
  }
});


// --- INICIO DE LA APP ---
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});