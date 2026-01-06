/**
 * MCP Bridge Client - 客户端桥接模块
 * 连接到服务端 WebSocket，接收 MCP 请求并调用本地 MCP 服务器
 */

import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
// 使用 Node.js 内置的 WebSocket (Electron main 进程支持)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WebSocket = globalThis.WebSocket || require('ws')

import type {
  McpBridgeClientConfig,
  McpBridgeMessage,
  McpBridgeRequest,
  CallToolPayload,
  ReadResourcePayload,
  GetPromptPayload,
  ListToolsPayload,
  ListResourcesPayload,
  ListPromptsPayload,
} from '@lib/types/mcp-bridge'
import { mcpManager } from './mcp'

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

interface BridgeEventHandlers {
  onConnect?: () => void
  onDisconnect?: (reason?: string) => void
  onError?: (error: Error) => void
  onStateChange?: (state: ConnectionState) => void
}

class McpBridgeClient {
  private ws: WebSocket | null = null
  private config: McpBridgeClientConfig | null = null
  private state: ConnectionState = 'disconnected'
  private reconnectAttempts = 0
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private handlers: BridgeEventHandlers = {}
  private clientId: string

  constructor() {
    this.clientId = uuidv4()
  }

  /**
   * 配置并连接到服务端
   */
  async connect(config: McpBridgeClientConfig, handlers?: BridgeEventHandlers): Promise<void> {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      requestTimeout: 60000,
      ...config,
    }
    this.handlers = handlers || {}

    await this.doConnect()
  }

  /**
   * 更新认证 token
   */
  updateToken(token: string): void {
    if (this.config) {
      this.config.token = token
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.stopHeartbeat()
    this.clearReconnectTimeout()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.setState('disconnected')
    this.reconnectAttempts = 0
  }

  /**
   * 获取连接状态
   */
  getState(): ConnectionState {
    return this.state
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    // WebSocket.OPEN = 1
    return this.state === 'connected' && this.ws?.readyState === 1
  }

  private async doConnect(): Promise<void> {
    if (!this.config) {
      throw new Error('Bridge not configured')
    }

    this.setState('connecting')

    return new Promise((resolve, reject) => {
      try {
        // 构建 WebSocket URL
        const url = new URL(this.config!.serverUrl)
        if (this.config!.token) {
          url.searchParams.set('token', this.config!.token)
        }

        this.ws = new WebSocket(url.toString())

        this.ws.onopen = () => {
          console.log('[MCP Bridge] Connected to server')
          this.setState('connected')
          this.reconnectAttempts = 0
          this.sendRegister()
          this.startHeartbeat()
          this.handlers.onConnect?.()
          resolve()
        }

        this.ws.onclose = (event) => {
          console.log('[MCP Bridge] Disconnected:', event.reason || 'Unknown reason')
          this.stopHeartbeat()
          this.handlers.onDisconnect?.(event.reason)

          if (this.config?.autoReconnect && this.state !== 'disconnected') {
            this.scheduleReconnect()
          } else {
            this.setState('disconnected')
          }
        }

        this.ws.onerror = (error) => {
          console.error('[MCP Bridge] WebSocket error:', error)
          this.handlers.onError?.(new Error('WebSocket error'))
          reject(error)
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data as string)
        }
      } catch (error) {
        this.setState('disconnected')
        reject(error)
      }
    })
  }

  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state
      this.handlers.onStateChange?.(state)
    }
  }

  private sendRegister(): void {
    const message: McpBridgeMessage = {
      id: uuidv4(),
      type: 'register',
      payload: {
        clientId: this.clientId,
        clientVersion: app.getVersion(),
        capabilities: [
          'list_servers',
          'list_tools',
          'list_resources',
          'list_prompts',
          'call_tool',
          'read_resource',
          'get_prompt',
        ],
      },
      timestamp: Date.now(),
    }
    this.send(message)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    if (this.config?.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        if (this.isConnected()) {
          this.send({
            id: uuidv4(),
            type: 'heartbeat',
            timestamp: Date.now(),
          })
        }
      }, this.config.heartbeatInterval)
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect(): void {
    if (!this.config) return

    const maxAttempts = this.config.maxReconnectAttempts || 10
    if (this.reconnectAttempts >= maxAttempts) {
      console.log('[MCP Bridge] Max reconnect attempts reached')
      this.setState('disconnected')
      return
    }

    this.setState('reconnecting')
    this.reconnectAttempts++

    const delay = this.config.reconnectInterval || 3000
    console.log(`[MCP Bridge] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${maxAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.doConnect().catch((error) => {
        console.error('[MCP Bridge] Reconnect failed:', error)
      })
    }, delay)
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private send(message: McpBridgeMessage | object): void {
    // WebSocket.OPEN = 1
    if (this.ws?.readyState === 1) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data) as McpBridgeMessage

      if (message.type === 'heartbeat') {
        // 心跳响应，不需要处理
        return
      }

      if (message.type === 'request') {
        await this.handleRequest(message as McpBridgeRequest)
      }
    } catch (error) {
      console.error('[MCP Bridge] Error handling message:', error)
    }
  }

  private async handleRequest(request: McpBridgeRequest): Promise<void> {
    const { id, action, payload } = request

    try {
      let result: unknown

      switch (action) {
        case 'list_servers':
          result = await this.handleListServers()
          break

        case 'list_tools':
          result = await this.handleListTools(payload as ListToolsPayload)
          break

        case 'list_resources':
          result = await this.handleListResources(payload as ListResourcesPayload)
          break

        case 'list_prompts':
          result = await this.handleListPrompts(payload as ListPromptsPayload)
          break

        case 'call_tool':
          result = await this.handleCallTool(payload as CallToolPayload)
          break

        case 'read_resource':
          result = await this.handleReadResource(payload as ReadResourcePayload)
          break

        case 'get_prompt':
          result = await this.handleGetPrompt(payload as GetPromptPayload)
          break

        default:
          throw new Error(`Unknown action: ${action}`)
      }

      // 发送成功响应
      this.send({
        id,
        type: 'response',
        payload: result,
        timestamp: Date.now(),
      })
    } catch (error) {
      // 发送错误响应
      this.send({
        id,
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      })
    }
  }

  // ============ 请求处理方法 ============

  private async handleListServers(): Promise<unknown> {
    const statuses = mcpManager.getStatus()
    return statuses.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      connected: s.connected,
    }))
  }

  private async handleListTools(payload: ListToolsPayload): Promise<unknown> {
    const { serverId } = payload
    
    // 确保服务器已连接
    await mcpManager.connect(serverId)
    
    return mcpManager.listTools(serverId)
  }

  private async handleListResources(payload: ListResourcesPayload): Promise<unknown> {
    const { serverId } = payload
    
    await mcpManager.connect(serverId)
    
    return mcpManager.listResources(serverId)
  }

  private async handleListPrompts(payload: ListPromptsPayload): Promise<unknown> {
    const { serverId } = payload
    
    await mcpManager.connect(serverId)
    
    return mcpManager.listPrompts(serverId)
  }

  private async handleCallTool(payload: CallToolPayload): Promise<unknown> {
    const { serverId, toolName, arguments: args } = payload
    
    await mcpManager.connect(serverId)
    
    return mcpManager.callTool(serverId, toolName, args)
  }

  private async handleReadResource(payload: ReadResourcePayload): Promise<unknown> {
    const { serverId, uri } = payload
    
    await mcpManager.connect(serverId)
    
    return mcpManager.readResource(serverId, uri)
  }

  private async handleGetPrompt(payload: GetPromptPayload): Promise<unknown> {
    const { serverId, promptName, arguments: args } = payload
    
    await mcpManager.connect(serverId)
    
    return mcpManager.getPrompt(serverId, promptName, args)
  }
}

// 导出单例
export const mcpBridgeClient = new McpBridgeClient()

// 导出类型
export type { McpBridgeClientConfig, BridgeEventHandlers, ConnectionState }
