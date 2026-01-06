import { create } from "zustand";

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface McpToolsState {
  tools: Record<string, McpTool[]>;
  loading: boolean;
  error?: string;
  loadToolsForServer: (serverId: string) => Promise<void>;
  runTool: (serverId: string, toolName: string, args?: Record<string, unknown>) => Promise<any>;
  clearTools: (serverId?: string) => void;
}

const ensureMcpApi = () => {
  if (typeof window === "undefined" || !window.api?.mcp) {
    throw new Error("MCP bridge is unavailable in this context");
  }
  return window.api.mcp;
};

export const useMcpToolsStore = create<McpToolsState>((set, get) => ({
  tools: {},
  loading: false,
  error: undefined,

  loadToolsForServer: async (serverId: string) => {
    const api = ensureMcpApi();
    set({ loading: true, error: undefined });
    try {
      const toolsList = await api.listTools(serverId);
      set((state) => ({
        tools: { ...state.tools, [serverId]: toolsList },
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ loading: false, error: message });
      throw error;
    }
  },

  runTool: async (serverId: string, toolName: string, args?: Record<string, unknown>) => {
    const api = ensureMcpApi();
    try {
      return await api.callTool(serverId, toolName, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message });
      throw error;
    }
  },

  clearTools: (serverId?: string) => {
    if (serverId) {
      set((state) => {
        const newTools = { ...state.tools };
        delete newTools[serverId];
        return { tools: newTools };
      });
    } else {
      set({ tools: {} });
    }
  },
}));

export default useMcpToolsStore;
