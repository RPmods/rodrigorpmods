const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const CONFIG_FILE_PATH = path.join(__dirname, 'js', 'character_layout_config.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    fullscreenable: true,
    autoHideMenuBar: true,
    backgroundColor: '#090a10',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('save-character-layout-config', async (_event, content) => {
  if (typeof content !== 'string' || !content.trim()) {
    return { ok: false, message: 'Contenido inválido.' };
  }
  fs.writeFileSync(CONFIG_FILE_PATH, content, 'utf8');
  return { ok: true, path: CONFIG_FILE_PATH };
});

ipcMain.handle('get-character-layout-config-path', async () => ({ ok: true, path: CONFIG_FILE_PATH }));

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
