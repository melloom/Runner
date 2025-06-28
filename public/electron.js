const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: '3D Runner Game',
    show: false, // Don't show until ready
    frame: true, // Keep browser frame for windowed app
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    fullscreen: false, // Don't start in fullscreen
    autoHideMenuBar: false, // Show menu bar
    webSecurity: false // Allow loading local assets
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.center(); // Center the window on screen
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Game',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-game');
          }
        },
        {
          label: 'Pause/Resume',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.send('toggle-pause');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Game',
      submenu: [
        {
          label: 'Controls',
          submenu: [
            { label: 'Move Left: ← or A', enabled: false },
            { label: 'Move Right: → or D', enabled: false },
            { label: 'Jump: ↑ or W or Space', enabled: false },
            { label: 'Slide: ↓ or S', enabled: false },
            { type: 'separator' },
            { label: 'Toggle Fullscreen: F11', enabled: false },
            { label: 'Exit Fullscreen: ESC', enabled: false }
          ]
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About 3D Runner Game',
          click: () => {
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About 3D Runner Game',
              message: '3D Runner Game',
              detail: 'A 3D third-person endless runner game built with React and Three.js\n\nVersion 2.0 Enhanced Edition\n\nUse arrow keys or WASD to control your character!\n\nPress F11 to toggle fullscreen\nPress ESC to exit fullscreen'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.on('quit-app', () => {
  app.quit();
});

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
}); 