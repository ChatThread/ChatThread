import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { HardDrive } from 'lucide-react'

import type { McpServerConfig, McpServerType, BuiltinServerType } from '@lib/types/mcp'

import BaseModal from '../base-modal'

const HTTP_TYPES: McpServerType[] = ['http', 'streamableHttp', 'sse']

// Built-in servers that don't require Node.js
const BUILTIN_SERVERS: Record<BuiltinServerType, { name: string; description: string }> = {
  filesystem: {
    name: 'File System',
    description: 'Read and write files on your computer (no Node.js required)',
  },
}

const EMPTY_FORM: McpServerConfig = {
  id: '',
  title: '',
  type: 'builtin',
  builtinType: 'filesystem',
  allowedPaths: [],
  readOnly: false,
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
    allowedPaths: config.allowedPaths ?? [],
    readOnly: config.readOnly ?? false,
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

interface NewServerModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSave: (config: McpServerConfig) => Promise<void>
  initialConfig?: McpServerConfig
}

export default function NewServerModal({ open, setOpen, onSave, initialConfig }: NewServerModalProps) {
  const [form, setForm] = useState<McpServerConfig>(() => toFormState(initialConfig))
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.id) return
    const trimmedId = form.id.trim()
    if (!trimmedId) return

    const payload: McpServerConfig = {
      ...form,
      id: trimmedId,
    }

    if (payload.type === 'builtin') {
      // Clean up non-builtin fields
      payload.command = undefined
      payload.args = undefined
      payload.baseUrl = undefined
      payload.url = undefined
    } else if (HTTP_TYPES.includes(payload.type)) {
      const urlValue = payload.baseUrl || payload.url || ''
      payload.baseUrl = urlValue
      payload.url = urlValue
      payload.command = undefined
      payload.args = undefined
      payload.builtinType = undefined
      payload.allowedPaths = undefined
      payload.readOnly = undefined
    } else {
      payload.command = form.command || ''
      payload.args = (form.args || []).filter(Boolean)
      payload.baseUrl = undefined
      payload.url = undefined
      payload.builtinType = undefined
      payload.allowedPaths = undefined
      payload.readOnly = undefined
    }

    setSaving(true)
    try {
      await onSave(payload)
      setOpen(false)
      setForm({ ...EMPTY_FORM })
      setAdvancedOpen(false)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save server')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setForm(toFormState(initialConfig))
    setAdvancedOpen(false)
  }

  return (
    <BaseModal open={open} setOpen={setOpen} size="large">
      <BaseModal.Header description="Configure server details, endpoints, environment variables, and trust metadata.">
        {initialConfig ? 'Edit Server' : 'Create New Server'}
      </BaseModal.Header>
      <BaseModal.Content>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <label className="flex flex-col text-sm gap-1">
              ID
              <Input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="unique id"
              />
            </label>
            <label className="flex flex-col text-sm gap-1">
              Title
              <Input
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="display name"
              />
            </label>
            <label className="flex flex-col text-sm gap-1">
              Description
              <Textarea
                rows={3}
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short summary"
              />
            </label>
            <label className="flex flex-col text-sm">
              Provider
              <Input
                value={form.provider || ''}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                placeholder="ChatThreadAI"
              />
            </label>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              Type
              <Select value={form.type} onValueChange={(value: McpServerType) => setForm({ ...form, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="builtin">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Built-in (No Node.js)
                    </div>
                  </SelectItem>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="streamableHttp">Streamable HTTP</SelectItem>
                  <SelectItem value="sse">SSE</SelectItem>
                  <SelectItem value="stdio">STDIO</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              Auto Connect
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={!!form.autoConnect}
                onChange={(e) => setForm({ ...form, autoConnect: e.target.checked })}
              />
            </label>
          </div>
          {form.type === 'builtin' ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Recommended</Badge>
                  <span className="text-xs text-muted-foreground">No Node.js installation required</span>
                </div>
                <label className="flex flex-col text-sm gap-1">
                  Built-in Server Type
                  <Select
                    value={form.builtinType || 'filesystem'}
                    onValueChange={(value: BuiltinServerType) => setForm({ ...form, builtinType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BUILTIN_SERVERS).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>{info.name}</span>
                            <span className="text-xs text-muted-foreground">{info.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>
              {form.builtinType === 'filesystem' && (
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="flex flex-col text-sm">
                    Allowed Paths (one per line)
                    <Textarea
                      rows={4}
                      value={(form.allowedPaths || []).join('\n')}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          allowedPaths: e.target.value
                            .split('\n')
                            .map((p) => p.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="~/Desktop\n~/Documents\n~/Downloads"
                    />
                    <span className="text-xs text-muted-foreground mt-1">
                      Leave empty to allow Desktop, Documents, Downloads
                    </span>
                  </label>
                  <label className="flex flex-col text-sm">
                    <span>Options</span>
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={!!form.readOnly}
                        onChange={(e) => setForm({ ...form, readOnly: e.target.checked })}
                      />
                      Read-only mode
                    </label>
                    <span className="text-xs text-muted-foreground mt-1">
                      Disable write/delete operations
                    </span>
                  </label>
                </div>
              )}
            </div>
          ) : form.type === 'stdio' ? (
            <div className="grid md:grid-cols-2 gap-3">
              <label className="flex flex-col text-sm">
                Command
                <Input
                  value={form.command || ''}
                  onChange={(e) => setForm({ ...form, command: e.target.value })}
                  placeholder="npx"
                />
              </label>
              <label className="flex flex-col text-sm">
                Args
                <Input
                  value={(form.args || []).join(' ')}
                  onChange={(e) => setForm({ ...form, args: e.target.value.split(' ').filter(Boolean) })}
                  placeholder="@mcp/server"
                />
              </label>
            </div>
          ) : HTTP_TYPES.includes(form.type) ? (
            <label className="flex flex-col text-sm">
              Base URL
              <Input
                value={form.baseUrl || ''}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value, url: e.target.value })}
                placeholder="http://localhost:3000/mcp"
              />
            </label>
          ) : null}

          <button className="text-sm text-muted-foreground flex items-center gap-2" onClick={() => setAdvancedOpen((prev) => !prev)}>
            <span>{advancedOpen ? 'Hide advanced options' : 'Show advanced options'}</span>
          </button>
          {advancedOpen && (
            <div className="grid md:grid-cols-2 gap-3">
              <label className="flex flex-col text-sm">
                Env Variables
                <Textarea
                  rows={4}
                  value={recordToTextarea(form.env)}
                  onChange={(e) => setForm({ ...form, env: textareaToRecord(e.target.value) })}
                  placeholder="KEY=value"
                />
              </label>
              <label className="flex flex-col text-sm">
                Headers
                <Textarea
                  rows={4}
                  value={recordToTextarea(form.headers)}
                  onChange={(e) => setForm({ ...form, headers: textareaToRecord(e.target.value) })}
                  placeholder="Authorization=Bearer xxx"
                />
              </label>
            </div>
          )}
        </div>
      </BaseModal.Content>
      <BaseModal.Footer
        submit={{
          label: 'Save',
          loading: saving,
          disabled: !form.id || saving,
          onClick: handleSave,
        }}
      >
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          Reset
        </Button>
      </BaseModal.Footer>
    </BaseModal>
  )
}