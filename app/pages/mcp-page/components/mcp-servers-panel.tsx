"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMcpStore } from "@/stores/mcp-store";
import { toast } from "sonner";
import {
  Server,
  Power,
  PowerOff,
  RefreshCw,
  Trash2,
  Edit,
  Activity,
  Clock,
  Search,
  Plus,
  MoreHorizontal,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NewServerModal from "@/modals/new-server-modal";
import type { McpServerConfig, McpServerStatus } from "@lib/types/mcp";

const formatTimestamp = (ts?: number) => (ts ? new Date(ts).toLocaleString() : "—");
const formatRelative = (ts?: number) => {
  if (!ts) return "Never";
  const delta = Date.now() - ts;
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

interface McpServersPanelProps {
  onAddServer: () => void;
}

export default function McpServersPanel({ onAddServer }: McpServersPanelProps) {
  const configs = useMcpStore((state) => state.configs);
  const statuses = useMcpStore((state) => state.statuses);
  const busyMap = useMcpStore((state) => state.busyMap);
  const loading = useMcpStore((state) => state.loading);
  const toggleConnection = useMcpStore((state) => state.toggleConnection);
  const restartServer = useMcpStore((state) => state.restartServer);
  const stopServer = useMcpStore((state) => state.stopServer);
  const deleteConfig = useMcpStore((state) => state.deleteConfig);
  const saveConfig = useMcpStore((state) => state.saveConfig);
  const checkConnectivity = useMcpStore((state) => state.checkConnectivity);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingConfig, setEditingConfig] = useState<McpServerConfig | undefined>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pingingMap, setPingingMap] = useState<Record<string, boolean>>({});
  const [connectivityResult, setConnectivityResult] = useState<Record<string, string>>({});

  const filteredConfigs = configs.filter(
    (cfg) =>
      cfg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cfg.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cfg.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConnectionToggle = async (id: string, connect?: boolean) => {
    try {
      await toggleConnection(id, connect);
      toast.success(connect ? `Connecting to ${id}...` : `Disconnecting from ${id}...`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to toggle connection");
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await restartServer(id);
      toast.success(`Restarted ${id}`);
    } catch (error: any) {
      toast.error(error?.message || `Failed to restart ${id}`);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await stopServer(id);
      toast.success(`Stopped ${id}`);
    } catch (error: any) {
      toast.error(error?.message || `Failed to stop ${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConfig(id);
      toast.success(`Deleted ${id}`);
    } catch (error: any) {
      toast.error(error?.message || `Failed to delete ${id}`);
    }
  };

  const handleEdit = (config: McpServerConfig) => {
    setEditingConfig(config);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (config: McpServerConfig) => {
    try {
      await saveConfig(config);
      toast.success(`Saved ${config.id}`);
      setIsEditModalOpen(false);
      setEditingConfig(undefined);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save server");
      throw error;
    }
  };

  const handlePing = useCallback(
    async (id: string) => {
      setPingingMap((prev) => ({ ...prev, [id]: true }));
      try {
        const result = await checkConnectivity(id);
        if (!result) {
          setConnectivityResult((prev) => ({ ...prev, [id]: "Failed to reach server" }));
          toast.error(`Connectivity check failed for ${id}`);
          return;
        }
        setConnectivityResult((prev) => ({
          ...prev,
          [id]: result.ok
            ? `${result.latencyMs ?? 0}ms`
            : `Error: ${result.error ?? "unknown"}`,
        }));
        toast.success(`Connectivity check completed for ${id}`);
      } catch (error: any) {
        toast.error(error?.message || `Connectivity check failed for ${id}`);
      } finally {
        setPingingMap((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [checkConnectivity]
  );

  if (configs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Server className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">No MCP servers yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            Add your first MCP server to unlock contextual tools and resources. 
            We support HTTP, SSE, and STDIO providers.
          </p>
        </div>
        <Button onClick={onAddServer}>
          <Plus className="h-4 w-4 mr-2" />
          Add Server
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Search Bar */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-4">
          {filteredConfigs.map((config) => {
            const status = statuses[config.id];
            const isBusy = !!busyMap[config.id];
            const isPinging = !!pingingMap[config.id];

            return (
              <ServerCard
                key={config.id}
                config={config}
                status={status}
                isBusy={isBusy || loading}
                isPinging={isPinging}
                connectivityResult={connectivityResult[config.id]}
                onConnect={() => handleConnectionToggle(config.id, true)}
                onDisconnect={() => handleConnectionToggle(config.id, false)}
                onRestart={() => handleRestart(config.id)}
                onStop={() => handleStop(config.id)}
                onDelete={() => handleDelete(config.id)}
                onEdit={() => handleEdit(config)}
                onPing={() => handlePing(config.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      <NewServerModal
        open={isEditModalOpen}
        setOpen={setIsEditModalOpen}
        onSave={handleSaveEdit}
        initialConfig={editingConfig}
      />
    </div>
  );
}

interface ServerCardProps {
  config: McpServerConfig;
  status?: McpServerStatus;
  isBusy: boolean;
  isPinging: boolean;
  connectivityResult?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onRestart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPing: () => void;
}

function ServerCard({
  config,
  status,
  isBusy,
  isPinging,
  connectivityResult,
  onConnect,
  onDisconnect,
  onRestart,
  onStop,
  onDelete,
  onEdit,
  onPing,
}: ServerCardProps) {
  const isConnected = status?.connected ?? false;
  const isConnecting = status?.connecting ?? false;

  const getStatusColor = () => {
    if (isConnecting) return "bg-yellow-500";
    if (isConnected) return "bg-green-500";
    return "bg-gray-400";
  };

  const getStatusText = () => {
    if (isConnecting) return "Connecting...";
    if (isConnected) return "Connected";
    return "Disconnected";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`mt-1 h-3 w-3 rounded-full ${getStatusColor()} shrink-0`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base truncate">
                  {config.title || config.id}
                </CardTitle>
                <Badge variant="outline" className="text-xs shrink-0">
                  {config.type.toUpperCase()}
                </Badge>
                {config.autoConnect && (
                  <Badge variant="secondary" className="text-xs shrink-0">Auto</Badge>
                )}
              </div>
              <CardDescription className="mt-1 text-xs truncate">
                {config.description || "No description"}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Connect/Disconnect Button */}
            <Button
              variant={isConnected ? "destructive" : "default"}
              size="sm"
              disabled={isBusy || isConnecting}
              onClick={isConnected ? onDisconnect : onConnect}
              className="gap-1"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isConnected ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isConnecting ? "..." : isConnected ? "Disconnect" : "Connect"}
              </span>
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} disabled={isBusy}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRestart} disabled={isBusy}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onStop} disabled={isBusy}>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Stop
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPing} disabled={isBusy || isPinging}>
                  <Activity className="h-4 w-4 mr-2" />
                  {isPinging ? "Pinging..." : "Ping"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  disabled={isBusy}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground mb-1">Status</p>
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="font-medium">{getStatusText()}</span>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Last Connected</p>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">
                {formatRelative(status?.lastConnectedAt)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Latency</p>
            <span className="font-medium">
              {connectivityResult ?? "—"}
            </span>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Provider</p>
            <span className="font-medium truncate">
              {config.provider || "—"}
            </span>
          </div>
        </div>

        {/* Error display */}
        {status?.lastError && (
          <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-destructive">Last Error</p>
                <p className="text-xs text-destructive/80 break-words">
                  {status.lastError}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(status.lastErrorAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {config.tags && config.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {config.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
