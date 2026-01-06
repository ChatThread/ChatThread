"use client";

import { useEffect, ReactNode } from "react";
import { useMcpBridge } from "@/hooks/use-mcp-bridge";

interface McpBridgeProviderProps {
  children: ReactNode;
}

/**
 * MCP Bridge Provider
 * 
 * 在应用启动时自动管理 MCP Bridge 连接
 * 
 * 使用方式：
 * ```tsx
 * // 在 ContextWrapper 或 App 中包裹
 * <McpBridgeProvider>
 *   <YourApp />
 * </McpBridgeProvider>
 * ```
 */
export function McpBridgeProvider({ children }: McpBridgeProviderProps) {
  // 这个 hook 会自动处理：
  // 1. 用户登录后自动连接
  // 2. 用户登出后自动断开
  // 3. Token 更新后自动更新
  // 4. 定期刷新连接状态
  useMcpBridge();

  return <>{children}</>;
}

export default McpBridgeProvider;
