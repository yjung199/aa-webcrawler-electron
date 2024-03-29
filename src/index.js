const { app, BrowserWindow, nativeTheme, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}
let debug = false;
let mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      devTools: debug,
      enableRemoteModule: true,
    },
  });
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  if (debug) mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow, async () => {
  if (!debug) {
    // Register a 'Control+Shift+I' shortcut listener.
    globalShortcut.register('Control+Shift+I', () => {
      //this will get call for Control+Shift+I.
      return;
    });
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
function sendWindowMessage(targetWindow, message, payload) {
  if (typeof targetWindow === 'undefined') {
    console.log('Target window does not exist');
    return;
  }
  targetWindow.webContents.send(message, payload);
}

// Send online status to renderer.js
let onlineStatusWindow;

app.whenReady().then(() => {
  onlineStatusWindow = new BrowserWindow({
    width: 0,
    height: 0,
    show: false,
    webPreferences: { nodeIntegration: true },
  });
  onlineStatusWindow.loadURL(`file://${__dirname}/online-status.html`);
});

ipcMain.on('online-status-changed', function (event, status) {
  console.log(status);
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('online-status-changed', status);
    console.log('sent');
  });
  mainWindow.webContents.send('online-status-changed', status);
  console.log('sent');
});
