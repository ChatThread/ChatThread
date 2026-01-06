/**
 * MCP Bridge Protocol Types
 * 用于服务端和客户端之间的 MCP 操作通信
 */

// MCP 桥接操作类型
export type McpBridgeAction =
  | 'list_servers'      // 列出可用的 MCP 服务器
  | 'list_tools'        // 列出指定服务器的工具
  | 'list_resources'    // 列出指定服务器的资源
  | 'list_prompts'      // 列出指定服务器的提示
  | 'call_tool'         // 调用工具
  | 'read_resource'     // 读取资源
  | 'get_prompt'        // 获取提示

// 消息类型
export type McpBridgeMessageType = 'request' | 'response' | 'error' | 'heartbeat' | 'register'

// 基础消息结构
export interface McpBridgeMessage {
  id: string                        // 请求唯一 ID (UUID)
  type: McpBridgeMessageType        // 消息类型
  action?: McpBridgeAction          // 操作类型 (request 时必填)
  payload?: unknown                 // 请求参数或响应数据
  error?: string                    // 错误信息 (error 类型时必填)
  timestamp: number                 // 时间戳
}

// 请求消息
export interface McpBridgeRequest extends McpBridgeMessage {
  type: 'request'
  action: McpBridgeAction
  payload: McpBridgeRequestPayload
}

// 响应消息
export interface McpBridgeResponse extends McpBridgeMessage {
  type: 'response'
  payload: unknown
}

// 错误消息
export interface McpBridgeError extends McpBridgeMessage {
  type: 'error'
  error: string
}

// 心跳消息
export interface McpBridgeHeartbeat extends McpBridgeMessage {
  type: 'heartbeat'
}

// 注册消息 (客户端连接时发送)
export interface McpBridgeRegister extends McpBridgeMessage {
  type: 'register'
  payload: {
    clientId: string
    clientVersion: string
    capabilities: string[]
  }
}

// ============ 请求 Payload 类型 ============

export type McpBridgeRequestPayload =
  | ListServersPayload
  | ListToolsPayload
  | ListResourcesPayload
  | ListPromptsPayload
  | CallToolPayload
  | ReadResourcePayload
  | GetPromptPayload

// 列出服务器
export interface ListServersPayload {
  // 无参数
}

// 列出工具
export interface ListToolsPayload {
  serverId: string
}

// 列出资源
export interface ListResourcesPayload {
  serverId: string
}

// 列出提示
export interface ListPromptsPayload {
  serverId: string
}

// 调用工具
export interface CallToolPayload {
  serverId: string
  toolName: string
  arguments?: Record<string, unknown>
}

// 读取资源
export interface ReadResourcePayload {
  serverId: string
  uri: string
}

// 获取提示
export interface GetPromptPayload {
  serverId: string
  promptName: string
  arguments?: Record<string, unknown>
}

// ============ 响应 Payload 类型 ============

// MCP 服务器信息
export interface McpServerInfo {
  id: string
  title?: string
  type: string
  connected: boolean
  tools?: McpToolInfo[]
  resources?: McpResourceInfo[]
  prompts?: McpPromptInfo[]
}

// MCP 工具信息
export interface McpToolInfo {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

// MCP 资源信息
export interface McpResourceInfo {
  name: string
  uri: string
  description?: string
  mimeType?: string
}

// MCP 提示信息
export interface McpPromptInfo {
  name: string
  description?: string
  arguments?: Array<{
    name: string
    description?: string
    required?: boolean
  }>
}

// 工具调用结果
export interface CallToolResult {
  content: Array<{
    type: string
    text?: string
    data?: string
    mimeType?: string
  }>
  isError?: boolean
}

// 资源读取结果
export interface ReadResourceResult {
  contents: Array<{
    uri: string
    mimeType?: string
    text?: string
    blob?: string
  }>
}

// 提示获取结果
export interface GetPromptResult {
  description?: string
  messages: Array<{
    role: string
    content: {
      type: string
      text?: string
    }
  }>
}

// ============ 桥接客户端配置 ============

export interface McpBridgeClientConfig {
  serverUrl: string               // WebSocket 服务器 URL
  token?: string                  // 认证 token
  autoReconnect?: boolean         // 是否自动重连
  reconnectInterval?: number      // 重连间隔 (ms)
  maxReconnectAttempts?: number   // 最大重连次数
  heartbeatInterval?: number      // 心跳间隔 (ms)
  requestTimeout?: number         // 请求超时 (ms)
}

export const DEFAULT_BRIDGE_CONFIG: Partial<McpBridgeClientConfig> = {
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  requestTimeout: 60000,
}

// 连接状态类型
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
