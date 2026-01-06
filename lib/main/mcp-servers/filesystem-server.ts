/**
 * Built-in Filesystem MCP Server
 * This runs inside the Electron main process, no external Node.js required.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { app } from 'electron'

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)
const mkdir = promisify(fs.mkdir)
const rename = promisify(fs.rename)
const unlink = promisify(fs.unlink)
const rmdir = promisify(fs.rmdir)

const SERVER_INFO = {
  name: 'builtin-filesystem',
  version: '1.0.0',
}

export interface FilesystemServerOptions {
  allowedPaths?: string[]
  readOnly?: boolean
}

/**
 * Creates a built-in filesystem MCP server that runs in the Electron process
 */
export function createFilesystemServer(options: FilesystemServerOptions = {}) {
  const { allowedPaths = [], readOnly = false } = options

  // Default allowed paths if none specified
  const effectivePaths = allowedPaths.length > 0 ? allowedPaths : [
    app.getPath('home'),
    app.getPath('desktop'),
    app.getPath('documents'),
    app.getPath('downloads'),
  ]

  const server = new Server(SERVER_INFO, {
    capabilities: {
      tools: {},
      resources: {},
    },
  })

  // Validate path is within allowed directories
  const isPathAllowed = (targetPath: string): boolean => {
    const resolved = path.resolve(targetPath)
    return effectivePaths.some((allowed) => {
      const resolvedAllowed = path.resolve(allowed)
      return resolved.startsWith(resolvedAllowed) || resolved === resolvedAllowed
    })
  }

  const validatePath = (targetPath: string): string => {
    const resolved = path.resolve(targetPath)
    if (!isPathAllowed(resolved)) {
      throw new Error(`Access denied: ${targetPath} is not within allowed directories`)
    }
    return resolved
  }

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    interface ToolDef {
      name: string
      description: string
      inputSchema: {
        type: 'object'
        properties: Record<string, { type: string; description: string; default?: unknown }>
        required: string[]
      }
    }

    const tools: ToolDef[] = [
      {
        name: 'list_directory',
        description: 'List contents of a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path to list' },
          },
          required: ['path'],
        },
      },
      {
        name: 'read_file',
        description: 'Read contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' },
            encoding: { type: 'string', description: 'File encoding (default: utf-8)', default: 'utf-8' },
          },
          required: ['path'],
        },
      },
      {
        name: 'get_file_info',
        description: 'Get file or directory information',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File or directory path' },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_files',
        description: 'Search for files by name pattern',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory to search in' },
            pattern: { type: 'string', description: 'File name pattern (supports * and ? wildcards)' },
            recursive: { type: 'boolean', description: 'Search recursively', default: false },
          },
          required: ['path', 'pattern'],
        },
      },
    ]

    if (!readOnly) {
      tools.push(
        {
          name: 'write_file',
          description: 'Write content to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path to write' },
              content: { type: 'string', description: 'Content to write' },
              encoding: { type: 'string', description: 'File encoding (default: utf-8)' },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'create_directory',
          description: 'Create a new directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Directory path to create' },
            },
            required: ['path'],
          },
        },
        {
          name: 'move_file',
          description: 'Move or rename a file/directory',
          inputSchema: {
            type: 'object',
            properties: {
              source: { type: 'string', description: 'Source path' },
              destination: { type: 'string', description: 'Destination path' },
            },
            required: ['source', 'destination'],
          },
        },
        {
          name: 'delete_file',
          description: 'Delete a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path to delete' },
            },
            required: ['path'],
          },
        },
      )
    }

    return { tools }
  })

  // List resources (allowed directories)
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: effectivePaths.map((p) => ({
        uri: `file://${p}`,
        name: path.basename(p) || p,
        description: `Access to ${p}`,
        mimeType: 'inode/directory',
      })),
    }
  })

  // Read resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri
    if (!uri.startsWith('file://')) {
      throw new Error('Invalid resource URI')
    }
    const filePath = validatePath(uri.slice(7))
    const content = await readFile(filePath, 'utf-8')
    return {
      contents: [{ uri, mimeType: 'text/plain', text: content }],
    }
  })

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    try {
      switch (name) {
        case 'list_directory': {
          const dirPath = validatePath(args?.path as string)
          const entries = await readdir(dirPath, { withFileTypes: true })
          const items = entries.map((entry) => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            path: path.join(dirPath, entry.name),
          }))
          return {
            content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
          }
        }

        case 'read_file': {
          const filePath = validatePath(args?.path as string)
          const encoding = (args?.encoding as BufferEncoding) || 'utf-8'
          const content = await readFile(filePath, encoding)
          return {
            content: [{ type: 'text', text: content }],
          }
        }

        case 'get_file_info': {
          const targetPath = validatePath(args?.path as string)
          const stats = await stat(targetPath)
          const info = {
            path: targetPath,
            name: path.basename(targetPath),
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            accessed: stats.atime.toISOString(),
            isHidden: path.basename(targetPath).startsWith('.'),
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
          }
        }

        case 'search_files': {
          const searchPath = validatePath(args?.path as string)
          const pattern = args?.pattern as string
          const recursive = args?.recursive as boolean ?? false

          const matches: string[] = []
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i')

          const searchDir = async (dir: string) => {
            const entries = await readdir(dir, { withFileTypes: true })
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name)
              if (regex.test(entry.name)) {
                matches.push(fullPath)
              }
              if (recursive && entry.isDirectory()) {
                try {
                  await searchDir(fullPath)
                } catch {
                  // Skip inaccessible directories
                }
              }
            }
          }

          await searchDir(searchPath)
          return {
            content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }],
          }
        }

        case 'write_file': {
          if (readOnly) throw new Error('Write operations are disabled')
          const filePath = validatePath(args?.path as string)
          const content = args?.content as string
          const encoding = (args?.encoding as BufferEncoding) || 'utf-8'
          await writeFile(filePath, content, encoding)
          return {
            content: [{ type: 'text', text: `Successfully wrote to ${filePath}` }],
          }
        }

        case 'create_directory': {
          if (readOnly) throw new Error('Write operations are disabled')
          const dirPath = validatePath(args?.path as string)
          await mkdir(dirPath, { recursive: true })
          return {
            content: [{ type: 'text', text: `Successfully created directory ${dirPath}` }],
          }
        }

        case 'move_file': {
          if (readOnly) throw new Error('Write operations are disabled')
          const source = validatePath(args?.source as string)
          const destination = validatePath(args?.destination as string)
          await rename(source, destination)
          return {
            content: [{ type: 'text', text: `Successfully moved ${source} to ${destination}` }],
          }
        }

        case 'delete_file': {
          if (readOnly) throw new Error('Write operations are disabled')
          const filePath = validatePath(args?.path as string)
          const stats = await stat(filePath)
          if (stats.isDirectory()) {
            await rmdir(filePath, { recursive: true })
          } else {
            await unlink(filePath)
          }
          return {
            content: [{ type: 'text', text: `Successfully deleted ${filePath}` }],
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      }
    }
  })

  return server
}

/**
 * Creates a connected pair of transports for in-process communication
 */
export function createInProcessTransport() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  return { clientTransport, serverTransport }
}
