const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  isDesktop: true
});
