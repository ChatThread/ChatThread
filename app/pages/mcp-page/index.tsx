"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMcpStore } from "@/stores/mcp-store";
import { Cable, Server, Wrench, FileText, MessageSquare, RefreshCw, Plus, Zap } from "lucide-react";
import NewServerModal from "@/modals/new-server-modal";
import QuickToolRunnerModal from "@/modals/quick-tool-runner-modal";
import { toast } from "sonner";

const McpServersPanel = lazy(() => import("./components/mcp-servers-panel"));
const McpToolsPanel = lazy(() => import("./components/mcp-tools-panel"));
const McpResourcesPanel = lazy(() => import("./components/mcp-resources-panel"));
const McpPromptsPanel = lazy(() => import("./components/mcp-prompts-panel"));

export default function MCPPage() {
  const configs = useMcpStore((state) => state.configs);
  const statuses = useMcpStore((state) => state.statuses);
  const loading = useMcpStore((state) => state.loading);
  const init = useMcpStore((state) => state.init);
  const refresh = useMcpStore((state) => state.refresh);
  const storeError = useMcpStore((state) => state.error);

  const [isNewServerModalOpen, setIsNewServerModalOpen] = useState(false);
  const [isToolRunnerOpen, setIsToolRunnerOpen] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);
  const [activeTab, setActiveTab] = useState("servers");

  const statusList = Object.values(statuses);
  const connectedCount = statusList.filter((s) => s.connected).length;

  useEffect(() => {
    init().catch(() => {});
  }, [init]);

  useEffect(() => {
    setDismissedError(false);
  }, [storeError]);

  const handleSaveServer = async (config: any) => {
    const saveConfig = useMcpStore.getState().saveConfig;
    await saveConfig(config);
    toast.success(`Server ${config.id} saved`);
    setIsNewServerModalOpen(false);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Cable className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Model Context Protocol</h1>
              <p className="text-sm text-muted-foreground">
                Connect to MCP servers to access tools, resources, and prompts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsToolRunnerOpen(true)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Run
            </Button>
            <Button
              size="sm"
              onClick={() => setIsNewServerModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 px-4 pb-4">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Servers:</span>
            <Badge variant="secondary">{configs.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${connectedCount > 0 ? 'bg-green-500' : 'bg-muted'}`} />
            <span className="text-sm text-muted-foreground">Connected:</span>
            <Badge variant={connectedCount > 0 ? "default" : "secondary"}>{connectedCount}</Badge>
          </div>
        </div>

        {/* Error Alert */}
        {storeError && !dismissedError && (
          <div className="mx-4 mb-4 flex items-start justify-between gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-destructive">Something went wrong</h4>
              <p className="text-xs text-destructive/80">{storeError}</p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setDismissedError(true)}
              className="h-6 text-xs"
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>

      {/* Main Content with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          <div className="flex-shrink-0 border-b px-4">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger 
                value="servers" 
                className="data-[state=active]:bg-muted gap-2"
              >
                <Server className="h-4 w-4" />
                Servers
                <Badge variant="secondary" className="ml-1 text-xs">
                  {configs.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="tools" 
                className="data-[state=active]:bg-muted gap-2"
              >
                <Wrench className="h-4 w-4" />
                Tools
              </TabsTrigger>
              <TabsTrigger 
                value="resources" 
                className="data-[state=active]:bg-muted gap-2"
              >
                <FileText className="h-4 w-4" />
                Resources
              </TabsTrigger>
              <TabsTrigger 
                value="prompts" 
                className="data-[state=active]:bg-muted gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Prompts
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="servers" className="h-full mt-0 p-0 data-[state=inactive]:hidden">
              <Suspense fallback={<LoadingPlaceholder />}>
                <McpServersPanel onAddServer={() => setIsNewServerModalOpen(true)} />
              </Suspense>
            </TabsContent>
            <TabsContent value="tools" className="h-full mt-0 p-0 data-[state=inactive]:hidden">
              <Suspense fallback={<LoadingPlaceholder />}>
                <McpToolsPanel />
              </Suspense>
            </TabsContent>
            <TabsContent value="resources" className="h-full mt-0 p-0 data-[state=inactive]:hidden">
              <Suspense fallback={<LoadingPlaceholder />}>
                <McpResourcesPanel />
              </Suspense>
            </TabsContent>
            <TabsContent value="prompts" className="h-full mt-0 p-0 data-[state=inactive]:hidden">
              <Suspense fallback={<LoadingPlaceholder />}>
                <McpPromptsPanel />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modals */}
      <NewServerModal
        open={isNewServerModalOpen}
        setOpen={setIsNewServerModalOpen}
        onSave={handleSaveServer}
      />
      <QuickToolRunnerModal
        open={isToolRunnerOpen}
        setOpen={setIsToolRunnerOpen}
      />
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}
