/// <reference types="electron-vite/node" />

import type {
  McpConnectivityCheckResult,
  McpServerConfig,
  McpServerStatus,
} from '@lib/types/mcp'
import type {
  McpBridgeClientConfig,
  ConnectionState,
} from '@lib/types/mcp-bridge'

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.web' {
  const content: string
  export default content
}

declare const __IS_ELECTRON_BUILD__: boolean;

type IpcListener = (...args: any[]) => void

interface MCPBridgeApi {
  listConfigs: () => Promise<McpServerConfig[]>
  upsertConfig: (cfg: McpServerConfig) => Promise<void>
  removeConfig: (id: string) => Promise<void>
  status: () => Promise<McpServerStatus[]>
  connect: (id: string) => Promise<void>
  disconnect: (id: string) => Promise<void>
  restart: (id: string) => Promise<void>
  stop: (id: string) => Promise<void>
  checkConnectivity: (id: string) => Promise<McpConnectivityCheckResult>
  getServerVersion: (id: string) => Promise<string | null>
  listTools: (id: string) => Promise<any[]>
  listResources: (id: string) => Promise<any[]>
  listPrompts: (id: string) => Promise<any[]>
  callTool: (id: string, name: string, args?: Record<string, any>) => Promise<any>
  readResource: (id: string, uri: string) => Promise<any>
  getPrompt: (id: string, name: string, args?: Record<string, any>) => Promise<any>
}

interface McpBridgeApi {
  connect: (config: McpBridgeClientConfig) => Promise<void>
  disconnect: () => Promise<void>
  getState: () => Promise<ConnectionState>
  isConnected: () => Promise<boolean>
  updateToken: (token: string) => Promise<void>
}

declare global {
  interface Window {
    api: {
      send: (channel: string, ...args: any[]) => void
      receive: (channel: string, callback: IpcListener) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
      removeAllListeners: (channel: string) => void
      mcp: MCPBridgeApi
      mcpBridge: McpBridgeApi
    }
  }
}

export {}
