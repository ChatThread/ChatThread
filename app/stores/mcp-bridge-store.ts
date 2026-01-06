import { create } from "zustand";

import type { ConnectionState, McpBridgeClientConfig } from "@lib/types/mcp-bridge";

interface McpBridgeState {
  /** 连接状态 */
  connectionState: ConnectionState;
  /** 服务端 URL */
  serverUrl: string | null;
  /** 是否已配置 */
  configured: boolean;
  /** 错误信息 */
  error: string | null;

  /** 连接到服务端 */
  connect: (config: McpBridgeClientConfig) => Promise<void>;
  /** 断开连接 */
  disconnect: () => Promise<void>;
  /** 刷新连接状态 */
  refreshState: () => Promise<void>;
  /** 更新 token */
  updateToken: (token: string) => Promise<void>;
  /** 设置错误 */
  setError: (error: string | null) => void;
}

const ensureBridgeApi = () => {
  if (typeof window === "undefined" || !window.api?.mcpBridge) {
    throw new Error("MCP Bridge API is unavailable in this context");
  }
  return window.api.mcpBridge;
};

export const useMcpBridgeStore = create<McpBridgeState>((set, get) => ({
  connectionState: "disconnected",
  serverUrl: null,
  configured: false,
  error: null,

  connect: async (config: McpBridgeClientConfig) => {
    const api = ensureBridgeApi();
    
    set({ 
      connectionState: "connecting", 
      serverUrl: config.serverUrl,
      configured: true,
      error: null,
    });

    try {
      await api.connect(config);
      const state = await api.getState();
      set({ connectionState: state });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ 
        connectionState: "disconnected",
        error: message,
      });
      throw error;
    }
  },

  disconnect: async () => {
    const api = ensureBridgeApi();
    
    try {
      await api.disconnect();
      set({ 
        connectionState: "disconnected",
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message });
      throw error;
    }
  },

  refreshState: async () => {
    const api = ensureBridgeApi();
    
    try {
      const state = await api.getState();
      set({ connectionState: state });
    } catch (error) {
      // 忽略错误，保持当前状态
    }
  },

  updateToken: async (token: string) => {
    const api = ensureBridgeApi();
    
    try {
      await api.updateToken(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message });
      throw error;
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
