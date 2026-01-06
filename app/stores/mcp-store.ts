import { create } from "zustand";

import type {
  McpConnectivityCheckResult,
  McpServerConfig,
  McpServerStatus,
} from "@lib/types/mcp";

const buildStatusMap = (
  list: McpServerStatus[],
): Record<string, McpServerStatus> => {
  return list.reduce<Record<string, McpServerStatus>>((acc, status) => {
    acc[status.id] = status;
    return acc;
  }, {});
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : JSON.stringify(error);
};

const ensureMcpApi = () => {
  if (typeof window === "undefined" || !window.api?.mcp) {
    throw new Error("MCP bridge is unavailable in this context");
  }
  return window.api.mcp;
};

export interface McpStoreState {
  configs: McpServerConfig[];
  statuses: Record<string, McpServerStatus>;
  busyMap: Record<string, boolean>;
  loading: boolean;
  error?: string;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  saveConfig: (cfg: McpServerConfig) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  toggleConnection: (id: string, connect?: boolean) => Promise<void>;
  restartServer: (id: string) => Promise<void>;
  stopServer: (id: string) => Promise<void>;
  checkConnectivity: (id: string) => Promise<McpConnectivityCheckResult | undefined>;
  getServerVersion: (id: string) => Promise<string | null>;
}

const withServerBusy = async <T>(
  id: string,
  set: (
    partial:
      | Partial<McpStoreState>
      | ((state: McpStoreState) => Partial<McpStoreState>),
  ) => void,
  fn: () => Promise<T>,
): Promise<T> => {
  set((state) => ({ busyMap: { ...state.busyMap, [id]: true } }));
  try {
    return await fn();
  } finally {
    set((state) => {
      const next = { ...state.busyMap };
      delete next[id];
      return { busyMap: next };
    });
  }
};

export const useMcpStore = create<McpStoreState>((set, get) => ({
  configs: [],
  statuses: {},
  busyMap: {},
  loading: false,
  error: undefined,
  init: async () => {
    await get().refresh();
  },
  refresh: async () => {
    const api = ensureMcpApi();
    set((state) => ({ ...state, loading: true, error: undefined }));
    try {
      const [configs, statusList] = await Promise.all([
        api.listConfigs(),
        api.status(),
      ]);
      set((state) => ({
        ...state,
        configs,
        statuses: buildStatusMap(statusList),
        loading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        loading: false,
        error: getErrorMessage(error),
      }));
      throw error;
    }
  },
  refreshStatus: async () => {
    const api = ensureMcpApi();
    try {
      const statusList = await api.status();
      set((state) => ({ ...state, statuses: buildStatusMap(statusList) }));
    } catch (error) {
      set((state) => ({ ...state, error: getErrorMessage(error) }));
      throw error;
    }
  },
  saveConfig: async (cfg: McpServerConfig) => {
    const api = ensureMcpApi();
    try {
      await api.upsertConfig(cfg);
      await get().refresh();
    } catch (error) {
      set((state) => ({ ...state, error: getErrorMessage(error) }));
      throw error;
    }
  },
  deleteConfig: async (id: string) => {
    const api = ensureMcpApi();
    try {
      await api.removeConfig(id);
      await get().refresh();
    } catch (error) {
      set((state) => ({ ...state, error: getErrorMessage(error) }));
      throw error;
    }
  },
  toggleConnection: async (id: string, connect?: boolean) => {
    const api = ensureMcpApi();
    const current = get().statuses[id]?.connected ?? false;
    const target = typeof connect === "boolean" ? connect : !current;
    await withServerBusy(
      id,
      (partial) => set((state) => ({ ...state, ...partial })),
      async () => {
        if (target) await api.connect(id);
        else await api.disconnect(id);
      },
    );
    await get().refreshStatus();
  },
  restartServer: async (id: string) => {
    const api = ensureMcpApi();
    await withServerBusy(
      id,
      (partial) => set((state) => ({ ...state, ...partial })),
      async () => api.restart(id),
    );
    await get().refreshStatus();
  },
  stopServer: async (id: string) => {
    const api = ensureMcpApi();
    await withServerBusy(
      id,
      (partial) => set((state) => ({ ...state, ...partial })),
      async () => api.stop(id),
    );
    await get().refreshStatus();
  },
  checkConnectivity: async (id: string) => {
    const api = ensureMcpApi();
    try {
      return await api.checkConnectivity(id);
    } catch (error) {
      set((state) => ({ ...state, error: getErrorMessage(error) }));
      return undefined;
    }
  },
  getServerVersion: async (id: string) => {
    const api = ensureMcpApi();
    try {
      return await api.getServerVersion(id);
    } catch (error) {
      set((state) => ({ ...state, error: getErrorMessage(error) }));
      return null;
    }
  },
}));

export default useMcpStore;
