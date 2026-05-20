const path = require('node:path');

const { app, BrowserWindow } = require('electron');

const { loadEnvFile } = require('./env');
const { createLocalServer } = require('./local-server');

const APP_NAME = 'VeloStock';
const APP_ID = 'br.com.velostock.app';
const projectRoot = app.isPackaged
  ? path.resolve(__dirname, '..')
  : path.resolve(__dirname, '..', '..');

let mainWindow = null;
let localServer = null;

function getWindowIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app-icon.ico')
    : path.join(projectRoot, 'build', 'app-icon.ico');
}

function createWindow(serverUrl) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#F5F4F0',
    autoHideMenuBar: true,
    title: APP_NAME,
    icon: getWindowIconPath(),
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
  app.setName(APP_NAME);
  app.setAppUserModelId(APP_ID);
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
