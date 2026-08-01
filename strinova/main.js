const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const CONFIG_FILE_PATH = path.join(__dirname, 'js', 'character_layout_config.js');
const CONFIG_BACKUP_PATH = `${CONFIG_FILE_PATH}.bak`;
const MAX_CONFIG_BYTES = 512 * 1024;

function isTrustedLocalRenderer(event) {
  const senderUrl = event?.senderFrame?.url || event?.sender?.getURL?.() || '';
  return senderUrl.startsWith('file://');
}

function validateCharacterLayoutContent(content) {
  if (typeof content !== 'string' || !content.trim()) {
    return 'Contenido inválido.';
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_CONFIG_BYTES) {
    return 'El archivo de configuración supera el tamaño permitido.';
  }
  if (content.includes('\0')) {
    return 'El contenido contiene caracteres no permitidos.';
  }
  if (!/^\s*window\.CHARACTER_LAYOUT_CONFIG\s*=\s*\{/u.test(content)) {
    return 'El contenido no corresponde a CHARACTER_LAYOUT_CONFIG.';
  }
  return null;
}

function saveCharacterLayoutConfig(content) {
  const validationError = validateCharacterLayoutContent(content);
  if (validationError) return { ok: false, message: validationError };

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      fs.copyFileSync(CONFIG_FILE_PATH, CONFIG_BACKUP_PATH);
    }
    fs.writeFileSync(CONFIG_FILE_PATH, content, 'utf8');
    return {
      ok: true,
      path: CONFIG_FILE_PATH,
      backupPath: fs.existsSync(CONFIG_BACKUP_PATH) ? CONFIG_BACKUP_PATH : null,
    };
  } catch (error) {
    console.error('No se pudo guardar character_layout_config.js.', error);
    return {
      ok: false,
      message: `No se pudo guardar el archivo: ${error.message}`,
    };
  }
}

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

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, targetUrl) => {
    if (!targetUrl.startsWith('file://')) event.preventDefault();
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('save-character-layout-config', async (event, content) => {
  if (!isTrustedLocalRenderer(event)) {
    return { ok: false, message: 'Origen no autorizado.' };
  }
  return saveCharacterLayoutConfig(content);
});

ipcMain.handle('get-character-layout-config-path', async (event) => {
  if (!isTrustedLocalRenderer(event)) {
    return { ok: false, message: 'Origen no autorizado.' };
  }
  return { ok: true, path: CONFIG_FILE_PATH };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
