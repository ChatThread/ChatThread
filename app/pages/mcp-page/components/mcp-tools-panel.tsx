"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMcpStore } from "@/stores/mcp-store";
import { useMcpToolsStore, type McpTool } from "@/stores/mcp-tools-store";
import { toast } from "sonner";
import {
  Wrench,
  Search,
  Play,
  Copy,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Server,
  Info,
  Code,
} from "lucide-react";
import { cn } from "@/utils/utils";

export default function McpToolsPanel() {
  const statuses = useMcpStore((state) => state.statuses);
  const { tools, loading, error, loadToolsForServer, runTool } = useMcpToolsStore();

  const [selectedServer, setSelectedServer] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<{ tool: string; result: any } | null>(null);

  const connectedServers = Object.values(statuses).filter((s) => s.connected);

  // Load tools when server is selected
  useEffect(() => {
    if (selectedServer) {
      loadToolsForServer(selectedServer);
    }
  }, [selectedServer, loadToolsForServer]);

  // Filter tools based on search
  const filteredTools = useMemo(() => {
    const serverTools = tools[selectedServer] || [];
    if (!searchQuery) return serverTools;
    return serverTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tools, selectedServer, searchQuery]);

  const handleRunTool = async (tool: McpTool) => {
    if (!selectedServer) return;
    
    let parsedArgs: Record<string, unknown> = {};
    try {
      const argStr = toolArgs[tool.name];
      if (argStr) {
        parsedArgs = JSON.parse(argStr);
      }
    } catch (e) {
      toast.error("Invalid JSON arguments");
      return;
    }

    setRunningTool(tool.name);
    try {
      const result = await runTool(selectedServer, tool.name, parsedArgs);
      setToolResult({ tool: tool.name, result });
      toast.success(`Tool ${tool.name} executed successfully`);
    } catch (error: any) {
      toast.error(error?.message || "Tool execution failed");
      setToolResult({ tool: tool.name, result: { isError: true, error: error?.message } });
    } finally {
      setRunningTool(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (connectedServers.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Server className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">No connected servers</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            Connect to an MCP server first to browse and run tools.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header with Server Selector */}
      <div className="flex-shrink-0 p-4 border-b space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedServer} onValueChange={setSelectedServer}>
            <SelectTrigger className="sm:w-[240px]">
              <SelectValue placeholder="Select a server" />
            </SelectTrigger>
            <SelectContent>
              {connectedServers.map((server) => (
                <SelectItem key={server.id} value={server.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    {server.title || server.id}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {selectedServer && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span>
              {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""} available
            </span>
          </div>
        )}
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && selectedServer && filteredTools.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No tools match your search." : "No tools available from this server."}
            </p>
          </div>
        )}

        {!selectedServer && !loading && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Select a connected server to view available tools.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.name}
              tool={tool}
              isExpanded={expandedTool === tool.name}
              onToggleExpand={() => setExpandedTool(expandedTool === tool.name ? null : tool.name)}
              args={toolArgs[tool.name] || "{}"}
              onArgsChange={(args) => setToolArgs({ ...toolArgs, [tool.name]: args })}
              onRun={() => handleRunTool(tool)}
              onCopy={() => copyToClipboard(JSON.stringify(tool, null, 2))}
              isRunning={runningTool === tool.name}
              result={toolResult?.tool === tool.name ? toolResult.result : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ToolCardProps {
  tool: McpTool;
  isExpanded: boolean;
  onToggleExpand: () => void;
  args: string;
  onArgsChange: (args: string) => void;
  onRun: () => void;
  onCopy: () => void;
  isRunning: boolean;
  result?: any;
}

function ToolCard({
  tool,
  isExpanded,
  onToggleExpand,
  args,
  onArgsChange,
  onRun,
  onCopy,
  isRunning,
  result,
}: ToolCardProps) {
  const inputSchema = tool.inputSchema as { type?: string; properties?: Record<string, any>; required?: string[] } | undefined;
  const hasParameters = inputSchema?.properties && Object.keys(inputSchema.properties).length > 0;

  return (
    <Card className={cn("transition-all", isExpanded && "ring-1 ring-primary")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium truncate">{tool.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {tool.description || "No description"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={onCopy} className="h-7 w-7 p-0">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleExpand} className="h-7 w-7 p-0">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-3 space-y-4">
          {/* Schema Info */}
          {hasParameters && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                Parameters
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-2">
                {Object.entries(inputSchema!.properties!).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-start gap-2">
                    <code className="font-mono text-primary">{key}</code>
                    <span className="text-muted-foreground">
                      ({value.type || "any"})
                      {inputSchema?.required?.includes(key) && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </span>
                    {value.description && (
                      <span className="text-muted-foreground">- {value.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Args Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Code className="h-3.5 w-3.5" />
              Arguments (JSON)
            </div>
            <Textarea
              value={args}
              onChange={(e) => onArgsChange(e.target.value)}
              placeholder='{"key": "value"}'
              className="font-mono text-xs min-h-[80px]"
            />
          </div>

          {/* Run Button */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onRun}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? "Running..." : "Run Tool"}
            </Button>
          </div>

          {/* Result Display */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CheckCircle className={cn("h-3.5 w-3.5", result.isError ? "text-destructive" : "text-green-500")} />
                {result.isError ? "Error" : "Result"}
              </div>
              <div className={cn(
                "rounded-lg p-3 text-xs overflow-auto max-h-[200px]",
                result.isError ? "bg-destructive/10 text-destructive" : "bg-muted/50"
              )}>
                <pre className="whitespace-pre-wrap break-words font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
