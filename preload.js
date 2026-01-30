/* eslint-env node */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', { // <--- DEJAMOS 'electron' (NO 'electronAPI')
  appVersion: '2.1.0',
  
  // --- TUS FUNCIONES ANTIGUAS (Para que no se rompa nada) ---
  onUpdateAvailable: (callback) => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', callback),
  restartApp: () => ipcRenderer.send('restart_app'),

  // --- LO NUEVO (Para el Excel) ---
  saveExcel: (buffer) => ipcRenderer.invoke('dialog:saveExcel', buffer)
});