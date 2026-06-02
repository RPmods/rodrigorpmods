const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('draftSimulatorFiles', {
  saveCharacterLayoutConfig: (content) => ipcRenderer.invoke('save-character-layout-config', content),
  getCharacterLayoutConfigPath: () => ipcRenderer.invoke('get-character-layout-config-path'),
});
