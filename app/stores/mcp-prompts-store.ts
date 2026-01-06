import { create } from "zustand";

export interface McpPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: McpPromptArgument[];
}

interface McpPromptsState {
  prompts: Record<string, McpPrompt[]>;
  loading: boolean;
  error?: string;
  loadPromptsForServer: (serverId: string) => Promise<void>;
  getPrompt: (serverId: string, name: string, args?: Record<string, string>) => Promise<any>;
  clearPrompts: (serverId?: string) => void;
}

const ensureMcpApi = () => {
  if (typeof window === "undefined" || !window.api?.mcp) {
    throw new Error("MCP bridge is unavailable in this context");
  }
  return window.api.mcp;
};

export const useMcpPromptsStore = create<McpPromptsState>((set, get) => ({
  prompts: {},
  loading: false,
  error: undefined,

  loadPromptsForServer: async (serverId: string) => {
    const api = ensureMcpApi();
    set({ loading: true, error: undefined });
    try {
      const promptsList = await api.listPrompts(serverId);
      set((state) => ({
        prompts: { ...state.prompts, [serverId]: promptsList },
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ loading: false, error: message });
      throw error;
    }
  },

  getPrompt: async (serverId: string, name: string, args?: Record<string, string>) => {
    const api = ensureMcpApi();
    try {
      return await api.getPrompt(serverId, name, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message });
      throw error;
    }
  },

  clearPrompts: (serverId?: string) => {
    if (serverId) {
      set((state) => {
        const newPrompts = { ...state.prompts };
        delete newPrompts[serverId];
        return { prompts: newPrompts };
      });
    } else {
      set({ prompts: {} });
    }
  },
}));

export default useMcpPromptsStore;
