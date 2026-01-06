import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { McpServerConfig, McpServerStatus, McpServerType } from '@lib/types/mcp'

import { useMcpStore } from '@/stores/mcp-store'

import { Button } from '@/components/ui/button'

import NewServerModal from '@/modals/new-server-modal'
import QuickToolRunnerModal from '@/modals/quick-tool-runner-modal'

const HTTP_TYPES: McpServerType[] = ['http', 'streamableHttp', 'sse']

const EMPTY_FORM: McpServerConfig = {
  id: '',
  title: '',
  type: 'http',
  baseUrl: '',
  url: '',
  autoConnect: true,
  description: '',
  provider: '',
  tags: [],
  command: '',
  args: [],
  env: {},
  headers: {},
}

const toFormState = (config?: McpServerConfig): McpServerConfig => {
  if (!config) return { ...EMPTY_FORM }
  return {
    ...config,
    baseUrl: config.baseUrl ?? config.url ?? '',
    url: config.baseUrl ?? config.url ?? '',
    args: config.args ?? [],
    env: config.env ?? {},
    headers: config.headers ?? {},
  }
}

const recordToTextarea = (map?: Record<string, string>) =>
  Object.entries(map ?? {})
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

const textareaToRecord = (value: string) =>
  Object.fromEntries(
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split('='))
      .map(([key, ...rest]) => [key?.trim(), rest.join('=').trim()])
      .filter(([key, val]) => !!key && !!val),
  )

const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
  <div>
    <h3 className="text-base font-semibold leading-tight">{title}</h3>
    {description ? <p className="text-xs text-muted-foreground mt-1">{description}</p> : null}
  </div>
)

const StatusBadge = ({ connected, connecting }: McpServerStatus) => {
  const label = connecting ? 'Connecting…' : connected ? 'Connected' : 'Disconnected'
  const color = connecting ? 'badge-warning' : connected ? 'badge-success' : 'badge-ghost'
  return <span className={`badge ${color} text-xs`}>{label}</span>
}

const formatTimestamp = (ts?: number) => (ts ? new Date(ts).toLocaleString() : '—')
const formatRelative = (ts?: number) => {
  if (!ts) return 'Never'
  const delta = Date.now() - ts
  const seconds = Math.floor(delta / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function MCPSettingsPage() {
  const configs = useMcpStore((state) => state.configs)
  const statuses = useMcpStore((state) => state.statuses)
  const busyMap = useMcpStore((state) => state.busyMap)
  const loading = useMcpStore((state) => state.loading)
  const init = useMcpStore((state) => state.init)
  const refresh = useMcpStore((state) => state.refresh)
  const saveConfig = useMcpStore((state) => state.saveConfig)
  const deleteConfig = useMcpStore((state) => state.deleteConfig)
  const toggleConnection = useMcpStore((state) => state.toggleConnection)
  const restartServer = useMcpStore((state) => state.restartServer)
  const stopServer = useMcpStore((state) => state.stopServer)
  const checkConnectivity = useMcpStore((state) => state.checkConnectivity)
  const getServerVersion = useMcpStore((state) => state.getServerVersion)
  const storeError = useMcpStore((state) => state.error)

  const [form, setForm] = useState<McpServerConfig>({ ...EMPTY_FORM })
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [connectivityResult, setConnectivityResult] = useState<Record<string, string>>({})
  const [versions, setVersions] = useState<Record<string, string>>({})
  const [connectivityCheckedAt, setConnectivityCheckedAt] = useState<Record<string, number>>({})
  const [versionCheckedAt, setVersionCheckedAt] = useState<Record<string, number>>({})
  const [pingingMap, setPingingMap] = useState<Record<string, boolean>>({})
  const [versionLoadingMap, setVersionLoadingMap] = useState<Record<string, boolean>>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<McpServerConfig | undefined>()

  const [isToolRunnerOpen, setIsToolRunnerOpen] = useState(false)
  const [dismissedError, setDismissedError] = useState(false)

  const statusList = useMemo(() => Object.values(statuses) as McpServerStatus[], [statuses])
  const connectedStatuses = useMemo(() => statusList.filter((status) => status.connected), [statusList])
  const isGlobalBusy = loading || Object.keys(busyMap).length > 0

  useEffect(() => {
    init().catch(() => {})
  }, [init])

  useEffect(() => {
    setDismissedError(false)
  }, [storeError])

  const handleEdit = (config: McpServerConfig) => {
    setEditingConfig(config)
    setIsModalOpen(true)
  }

  const handleResetForm = () => {
    setForm({ ...EMPTY_FORM })
    setAdvancedOpen(false)
  }

  const handleSave = async (config: McpServerConfig) => {
    try {
      await saveConfig(config)
      toast.success(`Saved ${config.id}`)
      setEditingConfig(undefined)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save server')
      throw error
    }
  }

  const handleRunConnectivity = useCallback(
    async (id: string) => {
      setPingingMap((prev) => ({ ...prev, [id]: true }))
      try {
        const result = await checkConnectivity(id)
        if (!result) {
          setConnectivityResult((prev) => ({ ...prev, [id]: 'Failed to reach server' }))
          toast.error(`Connectivity check failed for ${id}`)
          return
        }
        setConnectivityResult((prev) => ({
          ...prev,
          [id]: result.ok
            ? `Latency ${result.latencyMs ?? 0} ms`
            : `Error: ${result.error ?? 'unknown'}`,
        }))
        setConnectivityCheckedAt((prev) => ({ ...prev, [id]: Date.now() }))
        toast.success(`Connectivity check completed for ${id}`)
      } catch (error: any) {
        toast.error(error?.message || `Connectivity check failed for ${id}`)
      } finally {
        setPingingMap((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
    },
    [checkConnectivity],
  )

  const handleFetchVersion = useCallback(
    async (id: string) => {
      setVersionLoadingMap((prev) => ({ ...prev, [id]: true }))
      try {
        const version = await getServerVersion(id)
        setVersions((prev) => ({ ...prev, [id]: version ?? 'Unknown' }))
        setVersionCheckedAt((prev) => ({ ...prev, [id]: Date.now() }))
        toast.success(`Fetched version for ${id}`)
      } catch (error: any) {
        toast.error(error?.message || `Failed to fetch version for ${id}`)
      } finally {
        setVersionLoadingMap((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
    },
    [getServerVersion],
  )

  const handleConnectionToggle = async (id: string, connect?: boolean) => {
    try {
      await toggleConnection(id, connect)
      toast.success(connect ? `Connecting to ${id}` : `Toggled connection for ${id}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to toggle connection')
    }
  }

  const handleRestart = async (id: string) => {
    try {
      await restartServer(id)
      toast.success(`Restarted ${id}`)
    } catch (error: any) {
      toast.error(error?.message || `Failed to restart ${id}`)
    }
  }

  const handleStop = async (id: string) => {
    try {
      await stopServer(id)
      toast.success(`Stopped ${id}`)
    } catch (error: any) {
      toast.error(error?.message || `Failed to stop ${id}`)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteConfig(id)
      toast.success(`Deleted ${id}`)
    } catch (error: any) {
      toast.error(error?.message || `Failed to delete ${id}`)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {storeError && !dismissedError ? (
        <div className="alert alert-error flex items-start justify-between">
          <div>
            <h4 className="font-semibold">Something went wrong</h4>
            <p className="text-sm leading-snug">{storeError}</p>
          </div>
          <Button size="xs" onClick={() => setDismissedError(true)}>
            Dismiss
          </Button>
        </div>
      ) : null}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Model Context Protocol</h2>
          <p className="text-sm text-muted-foreground">Add MCP servers to power tools, resources, and prompts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={isGlobalBusy} onClick={() => refresh()}>
            Refresh
          </Button>
          <Button disabled={isGlobalBusy} onClick={() => setIsToolRunnerOpen(true)}>
            Quick Tool Runner
          </Button>
          <Button disabled={isGlobalBusy} onClick={() => { setEditingConfig(undefined); setIsModalOpen(true); }}>
            New Server
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded border p-3">
          <p className="text-sm text-muted-foreground">Servers</p>
          <p className="text-2xl font-semibold">{configs.length}</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-sm text-muted-foreground">Active Connections</p>
          <p className="text-2xl font-semibold">{statusList.filter((s) => s.connected).length}</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-sm text-muted-foreground">Busy Servers</p>
          <p className="text-2xl font-semibold">{Object.keys(busyMap).length}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {configs.length === 0 ? (
          <div className="rounded border border-dashed p-6 text-center space-y-3">
            <h3 className="text-base font-semibold">No MCP servers yet</h3>
            <p className="text-sm text-muted-foreground">
              Add your first server to unlock contextual tools and resources. We support HTTP, SSE, and STDIO providers.
            </p>
            <Button variant="primary" size="sm" onClick={() => { setEditingConfig(undefined); setIsModalOpen(true); }}>Create server</Button>
          </div>
        ) : null}
        {configs.map((config) => {
          const status = statuses[config.id]
          const rowBusy = !!busyMap[config.id]
          return (
            <div key={config.id} className="rounded border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold">{config.title || config.id}</h4>
                    {status ? <StatusBadge {...status} /> : null}
                    {config.autoConnect ? <span className="badge badge-outline badge-success text-xs">Auto</span> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{config.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                    {config.provider ? <span>Provider: {config.provider}</span> : null}
                    {config.tags?.length ? (
                      <span>
                        Tags: {config.tags.join(', ')}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="xs" disabled={isGlobalBusy} onClick={() => handleEdit(config)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={rowBusy}
                    onClick={() => handleConnectionToggle(config.id, !status?.connected)}
                  >
                    {status?.connected ? 'Disconnect' : 'Connect'}
                  </Button>
                  <Button size="xs" disabled={rowBusy} onClick={() => handleRestart(config.id)}>
                    Restart
                  </Button>
                  <Button size="xs" disabled={rowBusy} onClick={() => handleStop(config.id)}>
                    Stop
                  </Button>
                  <Button size="xs" disabled={rowBusy}
                    onClick={() => handleRunConnectivity(config.id)}>
                    Ping
                    {pingingMap[config.id] ? <span className="loading loading-spinner loading-xs ml-1" /> : null}
                  </Button>
                  <Button size="xs" disabled={rowBusy}
                    onClick={() => handleFetchVersion(config.id)}>
                    Version
                    {versionLoadingMap[config.id] ? <span className="loading loading-spinner loading-xs ml-1" /> : null}
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    disabled={rowBusy || isGlobalBusy}
                    onClick={() => handleDelete(config.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{config.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Connected</p>
                  <p className="font-medium">{formatTimestamp(status?.lastConnectedAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Latency</p>
                  <p className="font-medium">{connectivityResult[config.id] ?? '—'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {connectivityCheckedAt[config.id] ? formatRelative(connectivityCheckedAt[config.id]) : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">{versions[config.id] ?? '—'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {versionCheckedAt[config.id] ? formatRelative(versionCheckedAt[config.id]) : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Auto Connect</p>
                  <p className="font-medium">{config.autoConnect ? 'Yes' : 'No'}</p>
                </div>
                {status?.lastError ? (
                  <div className="md:col-span-3">
                    <p className="text-muted-foreground">Last Error</p>
                    <p className="text-sm text-error">{status.lastError}</p>
                    <p className="text-[10px] text-muted-foreground">{formatTimestamp(status.lastErrorAt)}</p>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <NewServerModal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        onSave={handleSave}
        initialConfig={editingConfig}
      />

      <QuickToolRunnerModal
        open={isToolRunnerOpen}
        setOpen={setIsToolRunnerOpen}
      />
    </div>
  )
}

