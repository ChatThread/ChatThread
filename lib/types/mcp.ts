export type McpServerType = 'http' | 'streamableHttp' | 'sse' | 'stdio' | 'builtin'

export type BuiltinServerType = 'filesystem'

export interface McpServerConfig {
  id: string
  title?: string
  description?: string
  type: McpServerType
  /** Built-in server type (only used when type is 'builtin') */
  builtinType?: BuiltinServerType
  /** Allowed paths for built-in filesystem server */
  allowedPaths?: string[]
  /** Read-only mode for built-in filesystem server */
  readOnly?: boolean
  baseUrl?: string
  /** @deprecated temporary field kept for backward compatibility */
  url?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  headers?: Record<string, string>
  registryUrl?: string
  autoConnect?: boolean
  longRunning?: boolean
  timeoutMs?: number
  provider?: string
  providerUrl?: string
  logoUrl?: string
  tags?: string[]
  createdAt?: number
  updatedAt?: number
}

export interface McpServerStatus {
  id: string
  title?: string
  type: McpServerType
  connected: boolean
  connecting?: boolean
  lastConnectedAt?: number
  lastError?: string
  lastErrorAt?: number
}

export interface McpConnectivityCheckResult {
  ok: boolean
  latencyMs?: number
  error?: string
}
