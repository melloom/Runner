const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Game controls
  onNewGame: (callback) => ipcRenderer.on('new-game', callback),
  onTogglePause: (callback) => ipcRenderer.on('toggle-pause', callback),
  
  // App controls
  quit: () => ipcRenderer.send('quit-app'),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  
  // App info
  appVersion: process.env.npm_package_version || '1.0.0'
}); 