"use client";

import { useMcpBridge } from "@/hooks/use-mcp-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cable, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * MCP Bridge 连接状态指示器
 * 可以放在顶部导航栏或设置页面中显示
 */
export function McpBridgeStatus() {
  const {
    connectionState,
    isConnected,
    isConnecting,
    error,
    connect,
    clearError,
  } = useMcpBridge();

  const getStatusIcon = () => {
    switch (connectionState) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "connecting":
      case "reconnecting":
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case "disconnected":
      default:
        return error ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Cable className="h-4 w-4 text-muted-foreground" />
        );
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case "connected":
        return "MCP Bridge 已连接";
      case "connecting":
        return "正在连接...";
      case "reconnecting":
        return "正在重连...";
      case "disconnected":
      default:
        return error ? `连接失败: ${error}` : "MCP Bridge 未连接";
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case "connected":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "connecting":
      case "reconnecting":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "disconnected":
      default:
        return error
          ? "bg-red-500/10 text-red-500 border-red-500/20"
          : "bg-muted text-muted-foreground";
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`flex items-center gap-1.5 ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span className="text-xs">
              {isConnected ? "Bridge" : isConnecting ? "..." : "离线"}
            </span>
          </Badge>
          {!isConnected && !isConnecting && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                clearError();
                connect();
              }}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{getStatusText()}</p>
        {error && (
          <p className="text-xs text-muted-foreground mt-1">
            点击重试按钮重新连接
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default McpBridgeStatus;
