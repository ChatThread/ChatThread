"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMcpChat, type McpToolWithServer, type McpPromptWithServer, type McpResourceWithServer } from "@/hooks/use-mcp-chat";
import {
  Cable,
  Wrench,
  FileText,
  Sparkles,
  Check,
  Search,
  Loader2,
  Server,
} from "lucide-react";
import { cn } from "@/utils/utils";

export type McpItemType = "tool" | "resource" | "prompt";

export interface McpSelectedItem {
  type: McpItemType;
  serverId: string;
  name: string;
  item: McpToolWithServer | McpResourceWithServer | McpPromptWithServer;
}

interface McpToolSelectorProps {
  onSelect?: (item: McpSelectedItem) => void;
  selectedItems?: McpSelectedItem[];
  onRemove?: (item: McpSelectedItem) => void;
  showSelected?: boolean;
  triggerClassName?: string;
  disabled?: boolean;
}

export function McpToolSelector({
  onSelect,
  selectedItems = [],
  onRemove,
  showSelected = true,
  triggerClassName,
  disabled = false,
}: McpToolSelectorProps) {
  const {
    isMcpAvailable,
    connectedServers,
    allTools,
    allResources,
    allPrompts,
    loadAllMcpData,
  } = useMcpChat();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load MCP data when popover opens
  useEffect(() => {
    if (open && isMcpAvailable) {
      setLoading(true);
      loadAllMcpData().finally(() => setLoading(false));
    }
  }, [open, isMcpAvailable, loadAllMcpData]);

  // Filter items based on search
  const filteredTools = useMemo(() => {
    if (!searchQuery) return allTools;
    const query = searchQuery.toLowerCase();
    return allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.serverTitle?.toLowerCase().includes(query)
    );
  }, [allTools, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!searchQuery) return allResources;
    const query = searchQuery.toLowerCase();
    return allResources.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.uri.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.serverTitle?.toLowerCase().includes(query)
    );
  }, [allResources, searchQuery]);

  const filteredPrompts = useMemo(() => {
    if (!searchQuery) return allPrompts;
    const query = searchQuery.toLowerCase();
    return allPrompts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.serverTitle?.toLowerCase().includes(query)
    );
  }, [allPrompts, searchQuery]);

  const isSelected = (type: McpItemType, serverId: string, name: string) => {
    return selectedItems.some(
      (item) => item.type === type && item.serverId === serverId && item.name === name
    );
  };

  const handleSelect = (type: McpItemType, item: McpToolWithServer | McpResourceWithServer | McpPromptWithServer) => {
    const selectedItem: McpSelectedItem = {
      type,
      serverId: item.serverId,
      name: item.name,
      item,
    };

    if (isSelected(type, item.serverId, item.name)) {
      onRemove?.(selectedItem);
    } else {
      onSelect?.(selectedItem);
    }
  };

  const totalItems = allTools.length + allResources.length + allPrompts.length;

  if (!isMcpAvailable) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className={cn("gap-2", triggerClassName)}
          >
            <Cable className="h-4 w-4" />
            <span className="hidden sm:inline">MCP</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-4" align="start">
          <div className="flex flex-col items-center gap-2 text-center">
            <Server className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No MCP servers connected</p>
            <p className="text-xs text-muted-foreground">
              Connect to an MCP server to use tools, resources, and prompts.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Selected Items Display */}
      {showSelected && selectedItems.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {selectedItems.map((item) => (
            <Badge
              key={`${item.type}-${item.serverId}-${item.name}`}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => onRemove?.(item)}
            >
              {item.type === "tool" && <Wrench className="h-3 w-3" />}
              {item.type === "resource" && <FileText className="h-3 w-3" />}
              {item.type === "prompt" && <Sparkles className="h-3 w-3" />}
              <span className="max-w-[100px] truncate text-xs">{item.name}</span>
              <span className="text-xs text-muted-foreground ml-1">×</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Selector Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "gap-2",
              selectedItems.length > 0 && "text-primary",
              triggerClassName
            )}
          >
            <Cable className="h-4 w-4" />
            <span className="hidden sm:inline">MCP</span>
            {selectedItems.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedItems.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools, resources, prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 border-0 p-0 focus-visible:ring-0 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : totalItems === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-sm text-muted-foreground">No items available</p>
              <p className="text-xs text-muted-foreground">
                Connected servers don't provide any tools, resources, or prompts.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="p-2">
                {/* Tools Section */}
                {filteredTools.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5" />
                      Tools ({filteredTools.length})
                    </div>
                    <div className="space-y-1">
                      {filteredTools.map((tool) => (
                        <button
                          key={`tool-${tool.serverId}-${tool.name}`}
                          onClick={() => handleSelect("tool", tool)}
                          className={cn(
                            "w-full flex items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-muted transition-colors",
                            isSelected("tool", tool.serverId, tool.name) && "bg-primary/10"
                          )}
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 shrink-0 mt-0.5">
                            <Wrench className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{tool.name}</span>
                              {isSelected("tool", tool.serverId, tool.name) && (
                                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {tool.description || tool.serverTitle || "No description"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources Section */}
                {filteredResources.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Resources ({filteredResources.length})
                    </div>
                    <div className="space-y-1">
                      {filteredResources.map((resource) => (
                        <button
                          key={`resource-${resource.serverId}-${resource.uri}`}
                          onClick={() => handleSelect("resource", resource)}
                          className={cn(
                            "w-full flex items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-muted transition-colors",
                            isSelected("resource", resource.serverId, resource.name) && "bg-primary/10"
                          )}
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/10 shrink-0 mt-0.5">
                            <FileText className="h-3 w-3 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{resource.name}</span>
                              {isSelected("resource", resource.serverId, resource.name) && (
                                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {resource.description || resource.uri}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompts Section */}
                {filteredPrompts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      Prompts ({filteredPrompts.length})
                    </div>
                    <div className="space-y-1">
                      {filteredPrompts.map((prompt) => (
                        <button
                          key={`prompt-${prompt.serverId}-${prompt.name}`}
                          onClick={() => handleSelect("prompt", prompt)}
                          className={cn(
                            "w-full flex items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-muted transition-colors",
                            isSelected("prompt", prompt.serverId, prompt.name) && "bg-primary/10"
                          )}
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/10 shrink-0 mt-0.5">
                            <Sparkles className="h-3 w-3 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{prompt.name}</span>
                              {isSelected("prompt", prompt.serverId, prompt.name) && (
                                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {prompt.description || "No description"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {searchQuery && filteredTools.length === 0 && filteredResources.length === 0 && filteredPrompts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No results found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          <div className="border-t p-2 text-xs text-muted-foreground text-center">
            {connectedServers.length} server{connectedServers.length !== 1 ? "s" : ""} connected
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default McpToolSelector;
