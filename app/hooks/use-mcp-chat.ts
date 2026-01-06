import { useCallback, useMemo } from "react";
import { useMcpStore } from "@/stores/mcp-store";
import { useMcpToolsStore, type McpTool } from "@/stores/mcp-tools-store";
import { useMcpResourcesStore, type McpResource } from "@/stores/mcp-resources-store";
import { useMcpPromptsStore, type McpPrompt } from "@/stores/mcp-prompts-store";

export interface McpToolWithServer extends McpTool {
  serverId: string;
  serverTitle?: string;
}

export interface McpResourceWithServer extends McpResource {
  serverId: string;
  serverTitle?: string;
}

export interface McpPromptWithServer extends McpPrompt {
  serverId: string;
  serverTitle?: string;
}

/**
 * Hook to integrate MCP functionality into chat
 * Provides access to all connected MCP tools, resources, and prompts
 */
export function useMcpChat() {
  const statuses = useMcpStore((state) => state.statuses);
  const configs = useMcpStore((state) => state.configs);
  const { tools, runTool, loadToolsForServer } = useMcpToolsStore();
  const { resources, readResource, loadResourcesForServer } = useMcpResourcesStore();
  const { prompts, getPrompt, loadPromptsForServer } = useMcpPromptsStore();

  // Get all connected servers
  const connectedServers = useMemo(() => {
    return Object.values(statuses).filter((s) => s.connected);
  }, [statuses]);

  // Check if MCP is available
  const isMcpAvailable = connectedServers.length > 0;

  // Get all tools from all connected servers
  const allTools = useMemo((): McpToolWithServer[] => {
    const result: McpToolWithServer[] = [];
    for (const server of connectedServers) {
      const config = configs.find((c) => c.id === server.id);
      const serverTools = tools[server.id] || [];
      for (const tool of serverTools) {
        result.push({
          ...tool,
          serverId: server.id,
          serverTitle: config?.title || server.title,
        });
      }
    }
    return result;
  }, [connectedServers, tools, configs]);

  // Get all resources from all connected servers
  const allResources = useMemo((): McpResourceWithServer[] => {
    const result: McpResourceWithServer[] = [];
    for (const server of connectedServers) {
      const config = configs.find((c) => c.id === server.id);
      const serverResources = resources[server.id] || [];
      for (const resource of serverResources) {
        result.push({
          ...resource,
          serverId: server.id,
          serverTitle: config?.title || server.title,
        });
      }
    }
    return result;
  }, [connectedServers, resources, configs]);

  // Get all prompts from all connected servers
  const allPrompts = useMemo((): McpPromptWithServer[] => {
    const result: McpPromptWithServer[] = [];
    for (const server of connectedServers) {
      const config = configs.find((c) => c.id === server.id);
      const serverPrompts = prompts[server.id] || [];
      for (const prompt of serverPrompts) {
        result.push({
          ...prompt,
          serverId: server.id,
          serverTitle: config?.title || server.title,
        });
      }
    }
    return result;
  }, [connectedServers, prompts, configs]);

  // Load all tools, resources, and prompts from all connected servers
  const loadAllMcpData = useCallback(async () => {
    const promises: Promise<void>[] = [];
    for (const server of connectedServers) {
      promises.push(
        loadToolsForServer(server.id).catch(() => {}),
        loadResourcesForServer(server.id).catch(() => {}),
        loadPromptsForServer(server.id).catch(() => {})
      );
    }
    await Promise.allSettled(promises);
  }, [connectedServers, loadToolsForServer, loadResourcesForServer, loadPromptsForServer]);

  // Execute a tool
  const executeTool = useCallback(
    async (serverId: string, toolName: string, args?: Record<string, unknown>) => {
      return runTool(serverId, toolName, args);
    },
    [runTool]
  );

  // Read a resource
  const fetchResource = useCallback(
    async (serverId: string, uri: string) => {
      return readResource(serverId, uri);
    },
    [readResource]
  );

  // Get a prompt
  const fetchPrompt = useCallback(
    async (serverId: string, name: string, args?: Record<string, string>) => {
      return getPrompt(serverId, name, args);
    },
    [getPrompt]
  );

  // Find a tool by name (across all servers)
  const findTool = useCallback(
    (toolName: string): McpToolWithServer | undefined => {
      return allTools.find((t) => t.name === toolName);
    },
    [allTools]
  );

  // Format tool call for AI context
  const formatToolForAI = useCallback((tool: McpToolWithServer) => {
    return {
      type: "function" as const,
      function: {
        name: `mcp_${tool.serverId}_${tool.name}`,
        description: tool.description || `MCP tool: ${tool.name}`,
        parameters: tool.inputSchema || { type: "object", properties: {} },
      },
    };
  }, []);

  // Get all tools formatted for AI function calling
  const getToolsForAI = useCallback(() => {
    return allTools.map(formatToolForAI);
  }, [allTools, formatToolForAI]);

  // Parse and execute tool call from AI response
  const handleToolCall = useCallback(
    async (functionName: string, args: Record<string, unknown>) => {
      // Parse function name: mcp_{serverId}_{toolName}
      const match = functionName.match(/^mcp_(.+?)_(.+)$/);
      if (!match) {
        throw new Error(`Invalid MCP function name: ${functionName}`);
      }
      const [, serverId, toolName] = match;
      return executeTool(serverId, toolName, args);
    },
    [executeTool]
  );

  return {
    // State
    isMcpAvailable,
    connectedServers,
    allTools,
    allResources,
    allPrompts,

    // Actions
    loadAllMcpData,
    executeTool,
    fetchResource,
    fetchPrompt,
    findTool,

    // AI Integration
    getToolsForAI,
    handleToolCall,
    formatToolForAI,
  };
}

export default useMcpChat;
