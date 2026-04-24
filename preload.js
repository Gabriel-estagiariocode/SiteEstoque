const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');

function readDesktopConfig() {
  const configPath = path.join(__dirname, 'desktop-config.json');

  try {
    if (!fs.existsSync(configPath)) {
      return {};
    }

    const raw = fs.readFileSync(configPath, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {
      configError: `Nao foi possivel ler desktop-config.json: ${error.message}`
    };
  }
}

contextBridge.exposeInMainWorld('VeloStockDesktop', {
  config: readDesktopConfig()
});
