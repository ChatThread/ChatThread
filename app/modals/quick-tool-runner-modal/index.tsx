import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { useMcpStore } from '@/stores/mcp-store'
import { toast } from 'sonner'

import BaseModal from '../base-modal'

const formatTimestamp = (ts?: number) => (ts ? new Date(ts).toLocaleString() : '—')

interface QuickToolRunnerModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function QuickToolRunnerModal({ open, setOpen }: QuickToolRunnerModalProps) {
  const statuses = useMcpStore((state) => state.statuses)

  const [selectedServer, setSelectedServer] = useState('')
  const [tools, setTools] = useState<{ name: string; description?: string }[]>([])
  const [selectedTool, setSelectedTool] = useState('')
  const [argsJson, setArgsJson] = useState('{}')
  const [result, setResult] = useState<any>(null)
  const [toolBusy, setToolBusy] = useState(false)
  const [toolError, setToolError] = useState<string | null>(null)
  const [resultTimestamp, setResultTimestamp] = useState<number | null>(null)

  const statusList = Object.values(statuses)
  const connectedStatuses = statusList.filter((status) => status.connected)

  useEffect(() => {
    if (!selectedServer) return
    const run = async () => {
      try {
        const availableTools = await window.api.mcp.listTools(selectedServer)
        setTools(availableTools)
      } catch {
        setTools([])
      }
    }
    run()
  }, [selectedServer])

  const runTool = async () => {
    if (!selectedServer || !selectedTool) return
    let parsedArgs: Record<string, unknown> = {}
    try {
      parsedArgs = argsJson ? JSON.parse(argsJson) : {}
      setToolError(null)
    } catch (error: any) {
      setToolError('Arguments must be valid JSON')
      toast.error('Invalid JSON arguments')
      return
    }
    setToolBusy(true)
    try {
      const response = await window.api.mcp.callTool(selectedServer, selectedTool, parsedArgs)
      setResult(response)
      setResultTimestamp(Date.now())
      toast.success(`Ran ${selectedTool}`)
    } catch (error: any) {
      setResult({ isError: true, error: String(error?.message || error) })
      setResultTimestamp(Date.now())
      toast.error(error?.message || 'Tool execution failed')
    } finally {
      setToolBusy(false)
    }
  }

  return (
    <BaseModal open={open} setOpen={setOpen} size="large">
      <BaseModal.Header description="Run MCP tools directly for debugging">
        Quick Tool Runner
      </BaseModal.Header>
      <BaseModal.Content>
        <div className="space-y-3 overflow-y-auto">
          <div className="grid md:grid-cols-3 gap-3">
            <label className="flex flex-col text-sm">
              Server
              <Select value={selectedServer} onValueChange={setSelectedServer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select connected server" />
                </SelectTrigger>
                <SelectContent>
                  {connectedStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.title || status.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="flex flex-col text-sm">
              Tool
              <Select value={selectedTool} onValueChange={setSelectedTool}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tool" />
                </SelectTrigger>
                <SelectContent>
                  {tools.map((tool) => (
                    <SelectItem key={tool.name} value={tool.name}>
                      {tool.name}{tool.description ? ` · ${tool.description}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          <label className="flex flex-col text-sm">
            Arguments (JSON)
            <Textarea
              rows={6}
              value={argsJson}
              onChange={(e) => setArgsJson(e.target.value)}
              placeholder={`{
                "message": "hello"
              }`}
            />
          </label>
          {toolError ? <p className="text-sm text-error">{toolError}</p> : null}
          {!connectedStatuses.length ? (
            <p className="text-xs text-muted-foreground">Connect to a server to run tools.</p>
          ) : null}
          {result && (
            <div className="rounded bg-muted/30 p-3 overflow-auto">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={result.isError ? 'text-error' : 'text-success'}>
                  {result.isError ? 'Error Result' : 'Success Result'}
                </span>
                <span className="text-muted-foreground">{resultTimestamp ? formatTimestamp(resultTimestamp) : ''}</span>
              </div>
              <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </BaseModal.Content>
      <BaseModal.Footer
        submit={{
          label: 'Run Tool',
          loading: toolBusy,
          disabled: !selectedServer || !selectedTool,
          onClick: runTool,
        }}
      >
        <Button variant="outline" onClick={() => setResult(null)}>
          Clear Result
        </Button>
      </BaseModal.Footer>
    </BaseModal>
  )
}