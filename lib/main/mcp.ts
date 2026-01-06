import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

import type { McpConnectivityCheckResult, McpServerConfig, McpServerStatus } from '@lib/types/mcp'
import { createBuiltinServer, BUILTIN_SERVERS } from './mcp-servers'

type ClientEntry = {
  client: Client
  disconnect?: () => Promise<void> | void
}

type ListToolsResponse = Awaited<ReturnType<Client['listTools']>>
type ToolList = ListToolsResponse['tools']
type ListResourcesResponse = Awaited<ReturnType<Client['listResources']>>
type ResourceList = ListResourcesResponse['resources']
type ListPromptsResponse = Awaited<ReturnType<Client['listPrompts']>>
type PromptList = ListPromptsResponse['prompts']
type CallToolResponse = Awaited<ReturnType<Client['callTool']>>
type ReadResourceResponse = Awaited<ReturnType<Client['readResource']>>
type GetPromptResponse = Awaited<ReturnType<Client['getPrompt']>>

const CLIENT_INFO = {
  name: 'ChatThread',
  version: (() => {
    try {
      return app?.getVersion?.() ?? '0.0.0'
    } catch {
      return '0.0.0'
    }
  })(),
}

class MCPManager {
  private configsPath: string
  private configs: McpServerConfig[] = []
  private clients = new Map<string, ClientEntry>()
  private pendingConnections = new Map<string, Promise<ClientEntry>>()
  private statuses = new Map<string, McpServerStatus>()

  constructor() {
    const base = app.getPath('userData')
    const dir = join(base, 'mcp')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    this.configsPath = join(dir, 'servers.json')
    this.load()
  }

  private load() {
    try {
      if (existsSync(this.configsPath)) {
        const raw = readFileSync(this.configsPath, 'utf-8')
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          this.configs = parsed.map((cfg) => this.normalizeConfig(cfg))
        }
      }
    } catch {
      this.configs = []
    }

    this.configs.forEach((cfg) => this.ensureStatus(cfg))
  }

  private save() {
    try {
      const payload = this.configs.map((cfg) => ({ ...cfg, url: cfg.baseUrl ?? cfg.url }))
      writeFileSync(this.configsPath, JSON.stringify(payload, null, 2), 'utf-8')
    } catch {
      /* noop */
    }
  }

  private normalizeConfig(config: any): McpServerConfig {
    const normalized: McpServerConfig = {
      id: config.id,
      title: config.title,
      description: config.description,
      type: (config.type as McpServerConfig['type']) || (config.command ? 'stdio' : 'http'),
      builtinType: config.builtinType,
      allowedPaths: config.allowedPaths,
      readOnly: config.readOnly,
      baseUrl: config.baseUrl ?? config.url,
      url: config.baseUrl ?? config.url,
      command: config.command,
      args: Array.isArray(config.args) ? config.args : typeof config.args === 'string' ? config.args.split(' ') : [],
      env: config.env ?? {},
      headers: config.headers ?? {},
      registryUrl: config.registryUrl,
      autoConnect: config.autoConnect,
      longRunning: config.longRunning,
      timeoutMs: config.timeoutMs,
      provider: config.provider,
      providerUrl: config.providerUrl,
      logoUrl: config.logoUrl,
      tags: config.tags,
      createdAt: config.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    }

    return normalized
  }

  private ensureStatus(config: McpServerConfig): McpServerStatus {
    const existing = this.statuses.get(config.id)
    if (existing) return existing
    const status: McpServerStatus = {
      id: config.id,
      title: config.title,
      type: config.type,
      connected: false,
      connecting: false,
    }
    this.statuses.set(config.id, status)
    return status
  }

  private updateStatus(id: string, patch: Partial<McpServerStatus>) {
    const cfg = this.configs.find((c) => c.id === id)
    if (!cfg) return
    const current = this.ensureStatus(cfg)
    const next: McpServerStatus = {
      ...current,
      title: cfg.title,
      type: cfg.type,
      ...patch,
    }
    this.statuses.set(id, next)
  }

  listConfigs(): McpServerConfig[] {
    return this.configs.map((cfg) => ({ ...cfg }))
  }

  upsertConfig(cfg: McpServerConfig) {
    const incoming = this.normalizeConfig(cfg)
    const idx = this.configs.findIndex((c) => c.id === incoming.id)
    if (idx >= 0) {
      this.configs[idx] = { ...this.configs[idx], ...incoming, updatedAt: Date.now() }
    } else {
      this.configs.push(incoming)
    }
    this.ensureStatus(incoming)
    this.save()
  }

  removeConfig(id: string) {
    this.disconnect(id).catch(() => {})
    this.configs = this.configs.filter((c) => c.id !== id)
    this.statuses.delete(id)
    this.save()
  }

  getStatus(): McpServerStatus[] {
    return this.configs.map((cfg) => this.ensureStatus(cfg))
  }

  async connect(id: string): Promise<void> {
    const cfg = this.configs.find((c) => c.id === id)
    if (!cfg) throw new Error('MCP server config not found')

    const existing = this.clients.get(id)
    if (existing) return // Already connected

    if (this.pendingConnections.has(id)) {
      await this.pendingConnections.get(id)!
      return
    }

    this.updateStatus(id, { connecting: true })

    const connectPromise = this.createClient(cfg)
    this.pendingConnections.set(id, connectPromise)

    try {
      const entry = await connectPromise
      this.clients.set(id, entry)
      this.updateStatus(id, {
        connected: true,
        connecting: false,
        lastConnectedAt: Date.now(),
        lastError: undefined,
        lastErrorAt: undefined,
      })
      // Don't return the client - it can't be serialized over IPC
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.updateStatus(id, {
        connected: false,
        connecting: false,
        lastError: message,
        lastErrorAt: Date.now(),
      })
      throw error
    } finally {
      this.pendingConnections.delete(id)
    }
  }

  private async createClient(cfg: McpServerConfig): Promise<ClientEntry> {
    // Handle built-in servers (no external dependencies required)
    if (cfg.type === 'builtin') {
      if (!cfg.builtinType) throw new Error('Missing builtinType for built-in server')
      const entry = await createBuiltinServer({
        type: cfg.builtinType,
        options: {
          allowedPaths: cfg.allowedPaths,
          readOnly: cfg.readOnly,
        },
      })
      return { client: entry.client, disconnect: entry.disconnect }
    }

    const client = new Client(CLIENT_INFO)

    if (cfg.type === 'stdio') {
      if (!cfg.command) throw new Error('Missing command for stdio server')
      const transport = new StdioClientTransport({
        command: cfg.command,
        args: cfg.args || [],
        env: cfg.env,
      })
      await client.connect(transport)
      return { client, disconnect: () => transport.close?.() }
    }

    const targetUrl = cfg.baseUrl ?? cfg.url
    if (!targetUrl) throw new Error('Missing base URL for HTTP server')
    const parsedUrl = new URL(targetUrl)

    try {
      const streamTransport = new StreamableHTTPClientTransport(parsedUrl, {
        requestInit: cfg.headers ? { headers: cfg.headers } : undefined,
      })
      await client.connect(streamTransport)
      return { client, disconnect: () => streamTransport.close?.() }
    } catch (streamErr) {
      const fallbackTransport = new SSEClientTransport(parsedUrl, {
        requestInit: cfg.headers ? { headers: cfg.headers } : undefined,
      })
      try {
        await client.connect(fallbackTransport)
        return { client, disconnect: () => fallbackTransport.close?.() }
      } catch (sseErr) {
        throw streamErr instanceof Error ? streamErr : sseErr
      }
    }
  }

  async disconnect(id: string) {
    const entry = this.clients.get(id)
    if (!entry) {
      this.updateStatus(id, { connected: false, connecting: false })
      return
    }

    this.clients.delete(id)
    try {
      await entry.client.close()
    } catch {
      /* ignore */
    }
    try {
      await entry.disconnect?.()
    } catch {
      /* ignore */
    }

    this.updateStatus(id, { connected: false, connecting: false })
  }

  async restartServer(id: string) {
    await this.disconnect(id)
    await this.connect(id)
  }

  async stopServer(id: string) {
    await this.disconnect(id)
  }

  async checkConnectivity(id: string): Promise<McpConnectivityCheckResult> {
    const start = Date.now()
    try {
      await this.connect(id)
      const client = await this.ensureClient(id)
      await client.listTools()
      return { ok: true, latencyMs: Date.now() - start }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getServerVersion(id: string): Promise<string | null> {
    try {
      await this.connect(id)
      const client = await this.ensureClient(id)
      const info = client.getServerVersion()
      return (info && info.version) || null
    } catch {
      return null
    }
  }

  async listTools(id: string): Promise<ToolList> {
    const client = await this.ensureClient(id)
    const res = await client.listTools()
    return res.tools
  }

  async listResources(id: string): Promise<ResourceList> {
    const client = await this.ensureClient(id)
    const res = await client.listResources()
    return res.resources
  }

  async listPrompts(id: string): Promise<PromptList> {
    const client = await this.ensureClient(id)
    const res = await client.listPrompts()
    return res.prompts
  }

  async callTool(id: string, name: string, args?: Record<string, any>): Promise<CallToolResponse> {
    const client = await this.ensureClient(id)
    return client.callTool({ name, arguments: args || {} })
  }

  async readResource(id: string, uri: string): Promise<ReadResourceResponse> {
    const client = await this.ensureClient(id)
    return client.readResource({ uri })
  }

  async getPrompt(id: string, name: string, args?: Record<string, any>): Promise<GetPromptResponse> {
    const client = await this.ensureClient(id)
    return client.getPrompt({ name, arguments: args || {} })
  }

  async shutdown() {
    await Promise.allSettled([...this.clients.keys()].map((id) => this.disconnect(id)))
  }

  /**
   * Get list of available built-in servers
   */
  getBuiltinServers() {
    return BUILTIN_SERVERS
  }

  private async ensureClient(id: string): Promise<Client> {
    const existing = this.clients.get(id)?.client
    if (existing) return existing
    await this.connect(id)
    const created = this.clients.get(id)?.client
    if (!created) throw new Error('Failed to connect MCP server')
    return created
  }
}

export const mcpManager = new MCPManager()
