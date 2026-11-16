// The only bridge between the web app and Electron. The page gets `window.desktop`
// and nothing else (no Node, no fs).
const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, cb) {
  const handler = (_e, ...args) => cb(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  openExternal: url => ipcRenderer.invoke('desktop:open-external', url),
  openFloat: () => ipcRenderer.send('float:open'),
  closeFloat: () => ipcRenderer.send('float:close'),
  focusMain: () => ipcRenderer.send('main:focus'),
  finishFromFloat: outcome => ipcRenderer.send('float:finish', outcome),
  onFinish: cb => subscribe('session:finish', cb),
  onFloatClosed: cb => subscribe('float:closed', cb),
  publishStatus: status => ipcRenderer.invoke('homebase:publish', status),
});
