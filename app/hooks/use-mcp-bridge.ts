import { useEffect, useCallback, useContext } from "react";
import { useMcpBridgeStore } from "@/stores/mcp-bridge-store";
import { AuthContext } from "@/contexts/auth-context";
import useAuthStore from "@/stores/auth-store";

/**
 * Hook 用于管理 MCP Bridge 连接
 * 当用户登录后自动连接到服务端 WebSocket
 */
export function useMcpBridge() {
  const { accessToken } = useContext(AuthContext);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const {
    connectionState,
    serverUrl,
    configured,
    error,
    connect,
    disconnect,
    refreshState,
    updateToken,
    setError,
  } = useMcpBridgeStore();

  // 获取服务端地址
  const getServerUrl = useCallback(() => {
    // 从环境变量或配置中获取服务端地址
    // 你可以根据实际情况修改这里的逻辑
    // @ts-expect-error - Vite env vars are injected at build time
    const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:7860";
    // 将 http 转为 ws，https 转为 wss
    const wsUrl = baseUrl.replace(/^http/, "ws");
    return `${wsUrl}/api/v1/mcp-bridge/ws`;
  }, []);

  // 连接到服务端
  const connectToBridge = useCallback(async () => {
    if (!accessToken) {
      console.log("[MCP Bridge] No access token, skip connecting");
      return;
    }

    const wsUrl = getServerUrl();
    
    try {
      await connect({
        serverUrl: wsUrl,
        token: accessToken,
        autoReconnect: true,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        requestTimeout: 60000,
      });
      console.log("[MCP Bridge] Connected successfully");
    } catch (error) {
      console.error("[MCP Bridge] Failed to connect:", error);
    }
  }, [accessToken, connect, getServerUrl]);

  // 当用户登录状态变化时，自动连接或断开
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // 用户已登录，连接到 bridge
      connectToBridge();
    } else {
      // 用户未登录或已登出，断开连接
      if (connectionState !== "disconnected") {
        disconnect().catch(console.error);
      }
    }
  }, [isAuthenticated, accessToken, connectToBridge, disconnect, connectionState]);

  // 当 token 更新时，更新 bridge 中的 token
  useEffect(() => {
    if (accessToken && connectionState === "connected") {
      updateToken(accessToken).catch(console.error);
    }
  }, [accessToken, connectionState, updateToken]);

  // 定期刷新连接状态
  useEffect(() => {
    const interval = setInterval(() => {
      refreshState();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshState]);

  return {
    /** 连接状态 */
    connectionState,
    /** 服务端 URL */
    serverUrl,
    /** 是否已配置 */
    configured,
    /** 错误信息 */
    error,
    /** 是否已连接 */
    isConnected: connectionState === "connected",
    /** 是否正在连接 */
    isConnecting: connectionState === "connecting" || connectionState === "reconnecting",
    /** 手动连接 */
    connect: connectToBridge,
    /** 断开连接 */
    disconnect,
    /** 清除错误 */
    clearError: () => setError(null),
  };
}

export default useMcpBridge;
