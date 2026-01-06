import { BrowserWindow, ipcMain, shell } from 'electron'
import os from 'os'
import { mcpManager } from '@lib/main/mcp'
import { mcpBridgeClient } from '@lib/main/mcp-bridge'

const handleIPC = (channel: string, handler: (...args: any[]) => void) => {
  ipcMain.handle(channel, handler)
}

const removeHandleIPC = (channel: string) => {
  ipcMain.removeHandler(channel)
}

export const registerWindowIPC = (mainWindow: BrowserWindow) => {

  // Hide the menu bar
  mainWindow.setMenuBarVisibility(false)

  // Register window IPC
  handleIPC('init-window', () => {
    const { width, height } = mainWindow.getBounds()
    const minimizable = mainWindow.isMinimizable()
    const maximizable = mainWindow.isMaximizable()
    const platform = os.platform()

    return { width, height, minimizable, maximizable, platform }
  })

  handleIPC('is-window-minimizable', () => mainWindow.isMinimizable())
  handleIPC('is-window-maximizable', () => mainWindow.isMaximizable())
  handleIPC('window-minimize', () => mainWindow.minimize())
  handleIPC('window-maximize', () => mainWindow.maximize())
  handleIPC('window-close', () => mainWindow.close())
  handleIPC('window-maximize-toggle', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  handleIPC('open-new-window', (_e, url) => {
    const newWindow = new BrowserWindow({ 
      width: 800,
      height: 600,
     })
    newWindow.loadURL(url)
  })

  // Note: loopback-based OAuth handlers were removed in favor of deeplink (custom protocol)

  const webContents = mainWindow.webContents
  handleIPC('web-undo', () => webContents.undo())
  handleIPC('web-redo', () => webContents.redo())
  handleIPC('web-cut', () => webContents.cut())
  handleIPC('web-copy', () => webContents.copy())
  handleIPC('web-paste', () => webContents.paste())
  handleIPC('web-delete', () => webContents.delete())
  handleIPC('web-select-all', () => webContents.selectAll())
  handleIPC('web-reload', () => webContents.reload())
  handleIPC('web-force-reload', () => webContents.reloadIgnoringCache())
  handleIPC('web-toggle-devtools', () => webContents.toggleDevTools())
  handleIPC('web-actual-size', () => webContents.setZoomLevel(0))
  handleIPC('web-zoom-in', () => webContents.setZoomLevel(webContents.zoomLevel + 0.5))
  handleIPC('web-zoom-out', () => webContents.setZoomLevel(webContents.zoomLevel - 0.5))
  handleIPC('web-toggle-fullscreen', () => mainWindow.setFullScreen(!mainWindow.fullScreen))
  handleIPC('web-open-url', (_e, url) => shell.openExternal(url))

  // MCP: configs
  handleIPC('mcp:list-configs', () => mcpManager.listConfigs())
  handleIPC('mcp:upsert-config', (_e, cfg) => mcpManager.upsertConfig(cfg))
  handleIPC('mcp:remove-config', (_e, id) => mcpManager.removeConfig(id))
  handleIPC('mcp:status', () => mcpManager.getStatus())
  // MCP: connection
  handleIPC('mcp:connect', (_e, id) => mcpManager.connect(id))
  handleIPC('mcp:disconnect', (_e, id) => mcpManager.disconnect(id))
  handleIPC('mcp:restart', (_e, id) => mcpManager.restartServer(id))
  handleIPC('mcp:stop', (_e, id) => mcpManager.stopServer(id))
  handleIPC('mcp:check-connectivity', (_e, id) => mcpManager.checkConnectivity(id))
  handleIPC('mcp:get-server-version', (_e, id) => mcpManager.getServerVersion(id))
  // MCP: operations
  handleIPC('mcp:list-tools', (_e, id) => mcpManager.listTools(id))
  handleIPC('mcp:list-resources', (_e, id) => mcpManager.listResources(id))
  handleIPC('mcp:list-prompts', (_e, id) => mcpManager.listPrompts(id))
  handleIPC('mcp:call-tool', (_e, id, name, args) => mcpManager.callTool(id, name, args))
  handleIPC('mcp:read-resource', (_e, id, uri) => mcpManager.readResource(id, uri))
  handleIPC('mcp:get-prompt', (_e, id, name, args) => mcpManager.getPrompt(id, name, args))

  // MCP Bridge: 用于连接服务端 WebSocket
  handleIPC('mcp-bridge:connect', (_e, config) => mcpBridgeClient.connect(config))
  handleIPC('mcp-bridge:disconnect', () => mcpBridgeClient.disconnect())
  handleIPC('mcp-bridge:get-state', () => mcpBridgeClient.getState())
  handleIPC('mcp-bridge:is-connected', () => mcpBridgeClient.isConnected())
  handleIPC('mcp-bridge:update-token', (_e, token) => mcpBridgeClient.updateToken(token))
}


export const removeWindowIPC = () => {
  // Register window IPC
  removeHandleIPC('init-window')
  removeHandleIPC('is-window-minimizable')
  removeHandleIPC('is-window-maximizable')
  removeHandleIPC('window-minimize')
  removeHandleIPC('window-maximize')
  removeHandleIPC('window-close')
  removeHandleIPC('window-maximize-toggle')
  removeHandleIPC('open-new-window')
  removeHandleIPC('web-undo')
  removeHandleIPC('web-redo')
  removeHandleIPC('web-cut')
  removeHandleIPC('web-copy')
  removeHandleIPC('web-paste')
  removeHandleIPC('web-delete')
  removeHandleIPC('web-select-all')
  removeHandleIPC('web-reload')
  removeHandleIPC('web-force-reload')
  removeHandleIPC('web-toggle-devtools')
  removeHandleIPC('web-actual-size')
  removeHandleIPC('web-zoom-in')
  removeHandleIPC('web-zoom-out')
  removeHandleIPC('web-toggle-fullscreen')
  removeHandleIPC('web-open-url')
  // loopback oauth handlers (removed)

  // MCP
  removeHandleIPC('mcp:list-configs')
  removeHandleIPC('mcp:upsert-config')
  removeHandleIPC('mcp:remove-config')
  removeHandleIPC('mcp:status')
  removeHandleIPC('mcp:connect')
  removeHandleIPC('mcp:disconnect')
  removeHandleIPC('mcp:restart')
  removeHandleIPC('mcp:stop')
  removeHandleIPC('mcp:check-connectivity')
  removeHandleIPC('mcp:get-server-version')
  removeHandleIPC('mcp:list-tools')
  removeHandleIPC('mcp:list-resources')
  removeHandleIPC('mcp:list-prompts')
  removeHandleIPC('mcp:call-tool')
  removeHandleIPC('mcp:read-resource')
  removeHandleIPC('mcp:get-prompt')

  // MCP Bridge
  removeHandleIPC('mcp-bridge:connect')
  removeHandleIPC('mcp-bridge:disconnect')
  removeHandleIPC('mcp-bridge:get-state')
  removeHandleIPC('mcp-bridge:is-connected')
  removeHandleIPC('mcp-bridge:update-token')
}
