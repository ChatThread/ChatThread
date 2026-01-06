"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useMcpPromptsStore, type McpPrompt } from "@/stores/mcp-prompts-store";
import { toast } from "sonner";
import {
  MessageSquare,
  Search,
  Server,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Play,
  Info,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/utils";

export default function McpPromptsPanel() {
  const statuses = useMcpStore((state) => state.statuses);
  const { prompts, loading, error, loadPromptsForServer, getPrompt } = useMcpPromptsStore();

  const [selectedServer, setSelectedServer] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [promptArgs, setPromptArgs] = useState<Record<string, Record<string, string>>>({});
  const [loadingPrompt, setLoadingPrompt] = useState<string | null>(null);
  const [promptResult, setPromptResult] = useState<Record<string, any>>({});

  const connectedServers = Object.values(statuses).filter((s) => s.connected);

  // Load prompts when server is selected
  useEffect(() => {
    if (selectedServer) {
      loadPromptsForServer(selectedServer);
    }
  }, [selectedServer, loadPromptsForServer]);

  // Filter prompts based on search
  const filteredPrompts = useMemo(() => {
    const serverPrompts = prompts[selectedServer] || [];
    if (!searchQuery) return serverPrompts;
    return serverPrompts.filter(
      (prompt) =>
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [prompts, selectedServer, searchQuery]);

  const handleGetPrompt = async (prompt: McpPrompt) => {
    if (!selectedServer) return;
    
    const args = promptArgs[prompt.name] || {};
    
    setLoadingPrompt(prompt.name);
    try {
      const result = await getPrompt(selectedServer, prompt.name, args);
      setPromptResult((prev) => ({ ...prev, [prompt.name]: result }));
      toast.success(`Prompt loaded`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to get prompt");
      setPromptResult((prev) => ({ 
        ...prev, 
        [prompt.name]: { isError: true, error: error?.message } 
      }));
    } finally {
      setLoadingPrompt(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const updatePromptArg = (promptName: string, argName: string, value: string) => {
    setPromptArgs((prev) => ({
      ...prev,
      [promptName]: {
        ...(prev[promptName] || {}),
        [argName]: value,
      },
    }));
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
            Connect to an MCP server first to browse prompts.
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
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {selectedServer && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>
              {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? "s" : ""} available
            </span>
          </div>
        )}
      </div>

      {/* Prompts List */}
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

        {!loading && !error && selectedServer && filteredPrompts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No prompts match your search." : "No prompts available from this server."}
            </p>
          </div>
        )}

        {!selectedServer && !loading && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Select a connected server to view available prompts.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {filteredPrompts.map((prompt) => {
            const isExpanded = expandedPrompt === prompt.name;
            const result = promptResult[prompt.name];
            const isLoading = loadingPrompt === prompt.name;
            const args = promptArgs[prompt.name] || {};

            return (
              <Card
                key={prompt.name}
                className={cn("transition-all", isExpanded && "ring-1 ring-primary")}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 shrink-0">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-medium truncate">
                          {prompt.name}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {prompt.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(prompt, null, 2))}
                        className="h-7 w-7 p-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedPrompt(isExpanded ? null : prompt.name)}
                        className="h-7 w-7 p-0"
                      >
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
                    {/* Arguments */}
                    {prompt.arguments && prompt.arguments.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Info className="h-3.5 w-3.5" />
                          Arguments
                        </div>
                        <div className="grid gap-3">
                          {prompt.arguments.map((arg) => (
                            <div key={arg.name} className="space-y-1">
                              <label className="text-xs font-medium flex items-center gap-2">
                                <code className="font-mono text-primary">{arg.name}</code>
                                {arg.required && (
                                  <span className="text-destructive">*</span>
                                )}
                              </label>
                              {arg.description && (
                                <p className="text-xs text-muted-foreground">{arg.description}</p>
                              )}
                              <Input
                                value={args[arg.name] || ""}
                                onChange={(e) => updatePromptArg(prompt.name, arg.name, e.target.value)}
                                placeholder={`Enter ${arg.name}...`}
                                className="text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Get Prompt Button */}
                    <Button
                      size="sm"
                      onClick={() => handleGetPrompt(prompt)}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isLoading ? "Loading..." : "Get Prompt"}
                    </Button>

                    {/* Result Display */}
                    {result && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {result.isError ? "Error" : "Generated Prompt"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(
                              result.isError 
                                ? result.error 
                                : result.messages?.map((m: any) => m.content?.text || JSON.stringify(m.content)).join("\n") || JSON.stringify(result, null, 2)
                            )}
                            className="h-6 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg p-3 text-xs overflow-auto max-h-[300px]",
                            result.isError
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted/50"
                          )}
                        >
                          {result.isError ? (
                            <p>{result.error}</p>
                          ) : result.messages ? (
                            <div className="space-y-3">
                              {result.messages.map((msg: any, idx: number) => (
                                <div key={idx} className="space-y-1">
                                  <Badge variant="outline" className="text-xs">
                                    {msg.role}
                                  </Badge>
                                  <div className="whitespace-pre-wrap font-mono">
                                    {typeof msg.content === 'string' 
                                      ? msg.content 
                                      : msg.content?.text || JSON.stringify(msg.content, null, 2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <pre className="whitespace-pre-wrap break-words font-mono">
                              {JSON.stringify(result, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
