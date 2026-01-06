import { create } from "zustand";

export interface McpResource {
  name: string;
  uri: string;
  description?: string;
  mimeType?: string;
}

interface McpResourcesState {
  resources: Record<string, McpResource[]>;
  loading: boolean;
  error?: string;
  loadResourcesForServer: (serverId: string) => Promise<void>;
  readResource: (serverId: string, uri: string) => Promise<any>;
  clearResources: (serverId?: string) => void;
}

const ensureMcpApi = () => {
  if (typeof window === "undefined" || !window.api?.mcp) {
    throw new Error("MCP bridge is unavailable in this context");
  }
  return window.api.mcp;
};

export const useMcpResourcesStore = create<McpResourcesState>((set, get) => ({
  resources: {},
  loading: false,
  error: undefined,

  loadResourcesForServer: async (serverId: string) => {
    const api = ensureMcpApi();
    set({ loading: true, error: undefined });
    try {
      const resourcesList = await api.listResources(serverId);
      set((state) => ({
        resources: { ...state.resources, [serverId]: resourcesList },
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ loading: false, error: message });
      throw error;
    }
  },

  readResource: async (serverId: string, uri: string) => {
    const api = ensureMcpApi();
    try {
      return await api.readResource(serverId, uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message });
      throw error;
    }
  },

  clearResources: (serverId?: string) => {
    if (serverId) {
      set((state) => {
        const newResources = { ...state.resources };
        delete newResources[serverId];
        return { resources: newResources };
      });
    } else {
      set({ resources: {} });
    }
  },
}));

export default useMcpResourcesStore;
