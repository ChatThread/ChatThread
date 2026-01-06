"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMcpStore } from "@/stores/mcp-store";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import { Cable, Server, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/utils/utils";

interface McpStatusIndicatorProps {
  showLabel?: boolean;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

export function McpStatusIndicator({
  showLabel = false,
  compact = false,
  onClick,
  className,
}: McpStatusIndicatorProps) {
  const configs = useMcpStore((state) => state.configs);
  const statuses = useMcpStore((state) => state.statuses);
  const loading = useMcpStore((state) => state.loading);
  const navigate = useCustomNavigate();

  const { connectedCount, totalCount, hasConnecting } = useMemo(() => {
    const statusList = Object.values(statuses);
    return {
      connectedCount: statusList.filter((s) => s.connected).length,
      totalCount: configs.length,
      hasConnecting: statusList.some((s) => s.connecting),
    };
  }, [statuses, configs]);

  const isConnected = connectedCount > 0;
  const isPartiallyConnected = connectedCount > 0 && connectedCount < totalCount;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/mcp");
    }
  };

  const getStatusIcon = () => {
    if (loading || hasConnecting) {
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    }
    if (connectedCount === totalCount && totalCount > 0) {
      return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    }
    if (isConnected) {
      return <Cable className="h-3.5 w-3.5 text-yellow-500" />;
    }
    return <XCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (loading || hasConnecting) return "Connecting...";
    if (totalCount === 0) return "No servers";
    if (connectedCount === totalCount) return "All connected";
    if (isConnected) return `${connectedCount}/${totalCount} connected`;
    return "Disconnected";
  };

  const getStatusColor = () => {
    if (loading || hasConnecting) return "bg-yellow-500/20 text-yellow-600";
    if (connectedCount === totalCount && totalCount > 0) return "bg-green-500/20 text-green-600";
    if (isConnected) return "bg-yellow-500/20 text-yellow-600";
    return "bg-muted text-muted-foreground";
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClick}
              className={cn("h-8 w-8 p-0", className)}
            >
              <div className="relative">
                <Cable className="h-4 w-4" />
                {isConnected && (
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500" />
                )}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className={cn("gap-2 h-8", className)}
          >
            <div className="relative">
              <Cable className="h-4 w-4" />
              {isConnected && (
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500" />
              )}
            </div>
            {showLabel && (
              <>
                <span className="text-xs">MCP</span>
                <Badge
                  variant="secondary"
                  className={cn("h-5 px-1.5 text-xs", getStatusColor())}
                >
                  {connectedCount}/{totalCount}
                </Badge>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">{getStatusText()}</span>
            </div>
            {totalCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Click to manage MCP servers
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default McpStatusIndicator;
