/**
 * Built-in MCP Servers Registry
 * 
 * This module manages built-in MCP servers that run inside the Electron process.
 * No external Node.js installation required.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { createFilesystemServer, createInProcessTransport, FilesystemServerOptions } from './filesystem-server'

export type BuiltinServerType = 'filesystem'

export interface BuiltinServerConfig {
  type: BuiltinServerType
  options?: FilesystemServerOptions
}

const CLIENT_INFO = {
  name: 'ChatThread-Internal',
  version: '1.0.0',
}

interface BuiltinServerEntry {
  client: Client
  disconnect: () => Promise<void>
}

/**
 * Creates a built-in MCP server and returns a connected client
 */
export async function createBuiltinServer(config: BuiltinServerConfig): Promise<BuiltinServerEntry> {
  const { clientTransport, serverTransport } = createInProcessTransport()

  let server
  switch (config.type) {
    case 'filesystem':
      server = createFilesystemServer(config.options)
      break
    default:
      throw new Error(`Unknown built-in server type: ${config.type}`)
  }

  // Connect server to its transport
  await server.connect(serverTransport)

  // Create client and connect to client transport
  const client = new Client(CLIENT_INFO)
  await client.connect(clientTransport)

  return {
    client,
    disconnect: async () => {
      await client.close()
      await server.close()
    },
  }
}

/**
 * List of available built-in servers
 */
export const BUILTIN_SERVERS: Record<BuiltinServerType, { name: string; description: string }> = {
  filesystem: {
    name: 'File System',
    description: 'Read and write files on your computer (no Node.js required)',
  },
}
