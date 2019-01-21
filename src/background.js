'use strict'

import { app, protocol, BrowserWindow, Tray, Menu } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const path = require('path')
const electronContextMenu = require('electron-context-menu')
const services = require("./services"); 

const isDevelopment = process.env.NODE_ENV !== 'production'
const appIconPath = path.join(__static, 'icon.png');

services.init();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = undefined
let tray = undefined

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })
function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ 
    width: 1200, 
    height: 600, 
    minWidth: 640,
    minHeight: 480,
    icon: appIconPath,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  })

  createProtocol('app');

  if (isDevelopment || process.env.IS_TEST) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {

    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.setTitle('COOPER Quick ' + app.getVersion());

  // win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

function createTray () {
  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: ()=>{ win.show() }
    },
    {
      label: 'Hide',
      click: ()=>{ win.hide() }
    },
    { 
      label: 'Quit',
      accelerator: 'Command+Q',
      selector: 'terminate:',
      click: ()=>{ app.quit() }
    }
  ]);
  
  tray = new Tray(appIconPath)
  tray.setContextMenu(contextMenu);  
  // tray.on('right-click', showWindow)
  // tray.on('double-click', showWindow)
  // tray.on('click', showWindow)
}

electronContextMenu({});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }
  createWindow()
  // createTray()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
