import { BrowserWindow, shell, app, nativeTheme } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { registerWindowIPC, removeWindowIPC } from '@lib/window/ipc-events'
import appIcon from '@resources/build/icons/png/icon256.png?asset'

export function createAppWindow(): void {
  // 根据系统主题设置背景色
  const backgroundColor = nativeTheme.shouldUseDarkColors ? '#171719' : '#ffffff'
  
  const mainWindow = new BrowserWindow({
    width: 1080,
    height: 800,
    show: false,
    backgroundColor: backgroundColor,
    transparent: true, // 添加透明支持
    icon: appIcon,
    frame: false,
    titleBarStyle: 'hiddenInset',
    title: 'ChatThread',
    maximizable: true,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
    },
  })

  // mainWindow.webContents.openDevTools()

  // 等待页面完全加载完成后再显示窗口
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 监听主题变化
  nativeTheme.on('updated', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const newBackgroundColor = nativeTheme.shouldUseDarkColors ? '#171719' : '#ffffff'
    mainWindow.setBackgroundColor(newBackgroundColor)
  })

  // Register IPC events for the main window.
  registerWindowIPC(mainWindow)

  mainWindow.on('close', ()=>{
    removeWindowIPC()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // Some build outputs place the index.html under renderer/app/index.html
    // Choose whichever file exists so Electron won't try to load a missing file.
    const defaultHtml = join(__dirname, '../renderer/index.html')
    const altHtml = join(__dirname, '../renderer/app/index.html')
    const htmlToLoad = existsSync(defaultHtml) ? defaultHtml : altHtml
    mainWindow.loadFile(htmlToLoad)
  }
}
