// Desktop shell for SDE Tracker.
//
// How it works:
//  1. Starts the bundled Next.js server (the same app as `npm run dev`, built in
//     standalone mode) on 127.0.0.1:31780, using Electron's own Node runtime.
//  2. Opens a window on it. The port is fixed on purpose: your progress lives in this
//     origin's IndexedDB, so a different port would look like an empty app.
//  3. LeetCode / takeuforward / YouTube links open in your normal browser, where you're
//     logged in. The floating timer is a small always-on-top window of the same app.
//  4. Checks GitHub Releases for updates, downloads them in the background and asks
//     to restart when one is ready.

const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');

const PORT = 31780;
const ORIGIN = `http://127.0.0.1:${PORT}`;
// `npm run desktop:dev` points this at `next dev` instead of the bundled server.
const DEV_URL = process.env.ELECTRON_START_URL;
const BASE_URL = DEV_URL || ORIGIN;

let mainWindow = null;
let floatWindow = null;
let server = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(start);
}

function logFile() {
  return path.join(app.getPath('userData'), 'server.log');
}

function startServer() {
  const dir = path.join(process.resourcesPath, 'server');
  const out = fs.openSync(logFile(), 'a');
  server = spawn(process.execPath, [path.join(dir, 'server.js')], {
    cwd: dir,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', NODE_ENV: 'production', PORT: String(PORT), HOSTNAME: '127.0.0.1' },
    stdio: ['ignore', out, out],
    windowsHide: true,
  });
  server.on('exit', code => { server = null; if (code) fs.appendFileSync(logFile(), `\nserver exited with ${code}\n`); });
}

function waitForServer(timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const ping = () => {
      const req = http.get(`${BASE_URL}/favicon.ico`, res => { res.resume(); resolve(); });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) reject(new Error('The app server did not start. See ' + logFile()));
        else setTimeout(ping, 150);
      });
      req.setTimeout(2000, () => req.destroy());
    };
    ping();
  });
}

function isAppUrl(url) {
  return url.startsWith(BASE_URL);
}

/** Anything that isn't the app itself opens in the user's normal browser. */
function guardNavigation(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url) && !isAppUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });
}

const webPreferences = {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
};

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 500,
    backgroundColor: '#000000',
    title: 'SDE Tracker',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences,
  });
  guardNavigation(mainWindow);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (floatWindow) floatWindow.close();
  });
  mainWindow.loadURL(BASE_URL);
}

function openFloat() {
  if (floatWindow) { floatWindow.showInactive(); return; }
  floatWindow = new BrowserWindow({
    width: 300,
    height: 400,
    minWidth: 240,
    minHeight: 220,
    alwaysOnTop: true,
    backgroundColor: '#000000',
    title: 'Timer',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: false,
    webPreferences,
  });
  // Above normal always-on-top windows too, so a full-screen-ish browser can't cover it.
  floatWindow.setAlwaysOnTop(true, 'floating');
  guardNavigation(floatWindow);
  floatWindow.on('closed', () => {
    floatWindow = null;
    mainWindow?.webContents.send('float:closed');
  });
  floatWindow.loadURL(`${BASE_URL}/?float=1`);
}

function setupIpc() {
  ipcMain.handle('desktop:open-external', (_e, url) => {
    if (typeof url === 'string' && /^https:\/\//.test(url)) { shell.openExternal(url); return true; }
    return false;
  });
  ipcMain.on('float:open', () => openFloat());
  ipcMain.on('float:close', () => floatWindow?.close());
  ipcMain.on('main:focus', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  // The float's "Solved" / "Didn't get it" open the log form in the main window.
  ipcMain.on('float:finish', (_e, outcome) => {
    if (!mainWindow) return;
    mainWindow.webContents.send('session:finish', outcome === 'stuck' ? 'stuck' : 'solved');
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    floatWindow?.close();
  });
}

function setupUpdates() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch {
    return;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', err => fs.appendFileSync(logFile(), `\nupdate error: ${err?.message ?? err}\n`));
  autoUpdater.on('update-downloaded', async info => {
    const { response } = await dialog.showMessageBox(mainWindow ?? undefined, {
      type: 'info',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update ready',
      message: `SDE Tracker ${info.version} is ready to install.`,
      detail: 'Restart now, or it installs the next time you close the app. Your progress is kept.',
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  check();
  setInterval(check, 6 * 60 * 60 * 1000);
}

async function start() {
  Menu.setApplicationMenu(null);
  setupIpc();
  if (!DEV_URL) startServer();
  try {
    await waitForServer();
  } catch (err) {
    dialog.showErrorBox('SDE Tracker could not start', String(err?.message ?? err));
    app.quit();
    return;
  }
  createMainWindow();
  setupUpdates();
}

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (server) server.kill(); });
