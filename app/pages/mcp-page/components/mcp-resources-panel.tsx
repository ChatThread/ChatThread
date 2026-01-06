"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMcpStore } from "@/stores/mcp-store";
import { useMcpResourcesStore, type McpResource } from "@/stores/mcp-resources-store";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Server,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  File,
  Folder,
  Database,
  Globe,
} from "lucide-react";
import { cn } from "@/utils/utils";

export default function McpResourcesPanel() {
  const statuses = useMcpStore((state) => state.statuses);
  const { resources, loading, error, loadResourcesForServer, readResource } = useMcpResourcesStore();

  const [selectedServer, setSelectedServer] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [readingResource, setReadingResource] = useState<string | null>(null);
  const [resourceContent, setResourceContent] = useState<Record<string, any>>({});

  const connectedServers = Object.values(statuses).filter((s) => s.connected);

  // Load resources when server is selected
  useEffect(() => {
    if (selectedServer) {
      loadResourcesForServer(selectedServer);
    }
  }, [selectedServer, loadResourcesForServer]);

  // Filter resources based on search
  const filteredResources = useMemo(() => {
    const serverResources = resources[selectedServer] || [];
    if (!searchQuery) return serverResources;
    return serverResources.filter(
      (resource) =>
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.uri.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resources, selectedServer, searchQuery]);

  const handleReadResource = async (resource: McpResource) => {
    if (!selectedServer) return;
    
    setReadingResource(resource.uri);
    try {
      const content = await readResource(selectedServer, resource.uri);
      setResourceContent((prev) => ({ ...prev, [resource.uri]: content }));
      toast.success(`Resource loaded`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to read resource");
      setResourceContent((prev) => ({ 
        ...prev, 
        [resource.uri]: { isError: true, error: error?.message } 
      }));
    } finally {
      setReadingResource(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getResourceIcon = (resource: McpResource) => {
    const uri = resource.uri.toLowerCase();
    if (uri.startsWith("file://") || uri.includes("/")) return File;
    if (uri.startsWith("http")) return Globe;
    if (uri.includes("database") || uri.includes("db")) return Database;
    return FileText;
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
            Connect to an MCP server first to browse resources.
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
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {selectedServer && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>
              {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""} available
            </span>
          </div>
        )}
      </div>

      {/* Resources List */}
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

        {!loading && !error && selectedServer && filteredResources.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No resources match your search." : "No resources available from this server."}
            </p>
          </div>
        )}

        {!selectedServer && !loading && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Select a connected server to view available resources.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {filteredResources.map((resource) => {
            const IconComponent = getResourceIcon(resource);
            const isExpanded = expandedResource === resource.uri;
            const content = resourceContent[resource.uri];
            const isReading = readingResource === resource.uri;

            return (
              <Card
                key={resource.uri}
                className={cn("transition-all", isExpanded && "ring-1 ring-primary")}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                        <IconComponent className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-medium truncate">
                          {resource.name}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          {resource.uri}
                        </CardDescription>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {resource.mimeType && (
                        <Badge variant="outline" className="text-xs">
                          {resource.mimeType}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(resource.uri)}
                        className="h-7 w-7 p-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedResource(isExpanded ? null : resource.uri)}
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
                  <CardContent className="pt-3 space-y-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReadResource(resource)}
                      disabled={isReading}
                      className="gap-2"
                    >
                      {isReading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      {isReading ? "Loading..." : "Read Resource"}
                    </Button>

                    {content && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Content</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(content, null, 2))}
                            className="h-6 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg p-3 text-xs overflow-auto max-h-[300px]",
                            content.isError
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted/50"
                          )}
                        >
                          <pre className="whitespace-pre-wrap break-words font-mono">
                            {JSON.stringify(content, null, 2)}
                          </pre>
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
