import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createAppWindow } from './app'
import { mcpManager } from './mcp'
import { mcpBridgeClient } from './mcp-bridge'

// Custom protocol scheme to open the Electron app from a webpage
const PROTOCOL_SCHEME = 'chatthread'

function handleDeepLink(url: string) {
  try {
    const win = BrowserWindow.getAllWindows()[0]
    if (win && !win.isDestroyed()) {
      win.show()
      win.focus()
      win.webContents.send('protocol-url', url)
    } else {
      // create window and then send the url shortly after
      createAppWindow()
      setTimeout(() => {
        const w = BrowserWindow.getAllWindows()[0]
        if (w && !w.isDestroyed()) w.webContents.send('protocol-url', url)
      }, 500)
    }
  } catch (e) {
    console.error('handleDeepLink error', e)
  }
}

// Set app user model id for windows
electronApp.setAppUserModelId('com.example.chatthread')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Create app window
  // Register custom protocol as default client so links like `chatmagic://...` open this app
  try {
    // On packaged apps this will register the protocol handlers for the OS
    app.setAsDefaultProtocolClient(PROTOCOL_SCHEME)
  } catch (e) {
    console.warn('setAsDefaultProtocolClient failed', e)
  }

  createAppWindow()

  // Auto-connect MCP servers configured with autoConnect
  try {
    const cfgs = mcpManager.listConfigs()
    cfgs.filter(c => c.autoConnect).forEach(c => {
      mcpManager.connect(c.id).catch(() => {})
    })
  } catch {}

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createAppWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  mcpManager.shutdown().catch(() => {})
  mcpBridgeClient.disconnect()
})

// In this file, you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// macOS: open-url is emitted when the app is asked to open a resource
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

// Ensure single instance and handle protocol URLs on second-instance (Windows/Linux)
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv = []) => {
    // On Windows the protocol URL is passed in argv
    const url = (argv as string[]).find(a => typeof a === 'string' && a.startsWith(`${PROTOCOL_SCHEME}://`))
    if (url) handleDeepLink(url)
  })
}

// Handle protocol URL passed on initial launch (Windows)
try {
  const possible = process.argv.find(a => typeof a === 'string' && a.startsWith(`${PROTOCOL_SCHEME}://`))
  if (possible) {
    // If app already ready, handle immediately. Otherwise, defer until ready.
    if (app.isReady()) handleDeepLink(possible)
    else app.once('ready', () => handleDeepLink(possible))
  }
} catch (e) {}
