import { ipcRenderer } from 'electron'

import type { McpConnectivityCheckResult, McpServerConfig, McpServerStatus } from '@lib/types/mcp'
import type { McpBridgeClientConfig, ConnectionState } from '@lib/types/mcp-bridge'

const api = {
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args)
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => func(...args))
  },
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args)
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },

  // MCP helpers
  mcp: {
    listConfigs: (): Promise<McpServerConfig[]> => ipcRenderer.invoke('mcp:list-configs'),
    upsertConfig: (cfg: McpServerConfig): Promise<void> => ipcRenderer.invoke('mcp:upsert-config', cfg),
    removeConfig: (id: string): Promise<void> => ipcRenderer.invoke('mcp:remove-config', id),
    status: (): Promise<McpServerStatus[]> => ipcRenderer.invoke('mcp:status'),
    connect: (id: string): Promise<void> => ipcRenderer.invoke('mcp:connect', id),
    disconnect: (id: string): Promise<void> => ipcRenderer.invoke('mcp:disconnect', id),
    restart: (id: string): Promise<void> => ipcRenderer.invoke('mcp:restart', id),
    stop: (id: string): Promise<void> => ipcRenderer.invoke('mcp:stop', id),
    checkConnectivity: (id: string): Promise<McpConnectivityCheckResult> =>
      ipcRenderer.invoke('mcp:check-connectivity', id),
    getServerVersion: (id: string): Promise<string | null> => ipcRenderer.invoke('mcp:get-server-version', id),
    listTools: (id: string): Promise<any[]> => ipcRenderer.invoke('mcp:list-tools', id),
    listResources: (id: string): Promise<any[]> => ipcRenderer.invoke('mcp:list-resources', id),
    listPrompts: (id: string): Promise<any[]> => ipcRenderer.invoke('mcp:list-prompts', id),
    callTool: (id: string, name: string, args?: Record<string, any>): Promise<any> => ipcRenderer.invoke('mcp:call-tool', id, name, args),
    readResource: (id: string, uri: string): Promise<any> => ipcRenderer.invoke('mcp:read-resource', id, uri),
    getPrompt: (id: string, name: string, args?: Record<string, any>): Promise<any> => ipcRenderer.invoke('mcp:get-prompt', id, name, args),
  },

  // MCP Bridge - 连接服务端 WebSocket
  mcpBridge: {
    connect: (config: McpBridgeClientConfig): Promise<void> => ipcRenderer.invoke('mcp-bridge:connect', config),
    disconnect: (): Promise<void> => ipcRenderer.invoke('mcp-bridge:disconnect'),
    getState: (): Promise<ConnectionState> => ipcRenderer.invoke('mcp-bridge:get-state'),
    isConnected: (): Promise<boolean> => ipcRenderer.invoke('mcp-bridge:is-connected'),
    updateToken: (token: string): Promise<void> => ipcRenderer.invoke('mcp-bridge:update-token', token),
  },
}

export default api
