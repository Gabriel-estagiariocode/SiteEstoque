const path = require('node:path');

const { app, BrowserWindow } = require('electron');

const { loadEnvFile } = require('./env');
const { createLocalServer } = require('./local-server');

const projectRoot = path.resolve(__dirname, '..');

let mainWindow = null;
let localServer = null;

function createWindow(serverUrl) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#F5F4F0',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadURL(serverUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function bootstrap() {
  loadEnvFile(projectRoot);
  localServer = await createLocalServer(projectRoot);
  createWindow(localServer.url);
}

app.whenReady().then(bootstrap).catch(error => {
  console.error('Falha ao iniciar o Electron:', error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && localServer) {
    createWindow(localServer.url);
  }
});

app.on('before-quit', () => {
  if (localServer?.server) {
    localServer.server.close();
  }
});
