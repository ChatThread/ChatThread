import type { INewChatMessage, INewChatSession } from './interface'
import type { Message } from '@/types/messages'
import db from './db'
import { flow } from 'lodash'

type SessionId = string

type FlowId = string

function normalizeFiles(files: Message['files']): string[] {
  if (Array.isArray(files)) {
    return [...files]
  }
  if (files === undefined || files === null) {
    return []
  }
  if (typeof files === 'string') {
    return [files]
  }
  return []
}

const DEFAULT_NAMESPACE = 'default'

async function ensureSession(sessionId: SessionId, flowId: FlowId, timestamp: number, name?: string, namespace?: string) {
  const ns = namespace ?? DEFAULT_NAMESPACE
  const existingSession = await db.newChatSessions.get(sessionId)
  if (existingSession) {
    const updates = {
      flow_id: flowId,
      updated_at: timestamp,
    }
    if (name && existingSession.name !== name) {
      updates["name"] = name
    }
    if (!existingSession.created_at || existingSession.created_at > timestamp) {
      updates["created_at"] = timestamp
    }
    if (!existingSession.namespace || existingSession.namespace !== ns) {
      updates["namespace"] = ns
    }
    await db.newChatSessions.update(sessionId, updates)
  }
  else {
    const session: INewChatSession = {
      id: sessionId,
      flow_id: flowId,
      namespace: ns,
      name: name,
      created_at: timestamp,
      updated_at: timestamp,
    }
    await db.newChatSessions.add(session)
  }
}

export async function ensureNewChatSession(sessionId: SessionId, flowId: FlowId, timestamp?: number, name?: string, namespace?: string) {
  if (!sessionId || !flowId) return
  const value = timestamp ?? Date.now()
  await ensureSession(sessionId, flowId, value, name, namespace)
}

function toDbMessage(message: Message, defaults?: Partial<INewChatMessage>): INewChatMessage {
  const now = Date.now()
  const fallbackTimestamp = defaults?.updated_at ?? defaults?.created_at ?? now
  const baseTimestamp = message.sender === 'AI' ? Math.max(fallbackTimestamp, now + 1) : Math.max(fallbackTimestamp, now)
  const createdAt = defaults?.created_at ?? baseTimestamp
  return {
    ...message,
    files: normalizeFiles(message.files),
    namespace: defaults?.namespace ?? (message as any).namespace ?? DEFAULT_NAMESPACE,
    created_at: createdAt,
    updated_at: baseTimestamp,
  }
}

export function toStoreMessage(message: INewChatMessage): Message {
  const { created_at: _created, updated_at: _updated, ...rest } = message
  return {
    ...rest,
    files: normalizeFiles(rest.files),
  }
}

export async function ensureDefaultSession(flowId: FlowId) {
  if (!flowId) return
  const existing = await db.newChatSessions.get(flowId)
  if (!existing) {
    const now = Date.now()
    const session: INewChatSession = {
      id: flowId,
      flow_id: flowId,
      namespace: DEFAULT_NAMESPACE,
      created_at: now,
      updated_at: now,
    }
    await db.newChatSessions.add(session)
  }
}

export async function upsertNewChatMessage(message: Message, namespace?: string) {
  if (!message.id) return
  console.debug('[db] upsertNewChatMessage', { id: message.id, session_id: message.session_id, flow_id: message.flow_id, namespace })
  await db.transaction('readwrite', db.newChatSessions, db.newChatMessages, async () => {
    const existing = await db.newChatMessages.get(message.id)
    const dbMessage = toDbMessage(message, { ...(existing ?? {}), namespace: namespace ?? existing?.namespace })
    await db.newChatMessages.put(dbMessage)
    // use exported ensureNewChatSession which guards against empty sessionId/flowId
    await ensureNewChatSession(message.session_id, message.flow_id, dbMessage.updated_at, undefined, namespace)
  })
}

export async function bulkUpsertNewChatMessages(messages: Message[], namespace?: string) {
  if (!messages.length) return
  console.debug('[db] bulkUpsertNewChatMessages', { count: messages.length, namespace })
  await db.transaction('readwrite', db.newChatSessions, db.newChatMessages, async () => {
    const putPayload: INewChatMessage[] = []
    for (const message of messages) {
      const existing = await db.newChatMessages.get(message.id)
      const dbMessage = toDbMessage(message, { ...(existing ?? {}), namespace: namespace ?? existing?.namespace })
      putPayload.push(dbMessage)
      // use exported ensureNewChatSession which guards against empty sessionId/flowId
      await ensureNewChatSession(message.session_id, message.flow_id, dbMessage.updated_at, undefined, namespace)
    }
    await db.newChatMessages.bulkPut(putPayload)
  })
}

export async function updateNewChatMessage(id: string, updates: Partial<Message>, namespace?: string) {
  if (!id) return
  await db.transaction('readwrite', db.newChatSessions, db.newChatMessages, async () => {
    const existing = await db.newChatMessages.get(id)
    if (!existing) return
    const updated: INewChatMessage = {
      ...existing,
      ...updates,
      files: updates.files ? normalizeFiles(updates.files) : existing.files,
      namespace: namespace ?? existing.namespace,
      updated_at: Date.now(),
    }
    await db.newChatMessages.put(updated)
    // use exported ensureNewChatSession to avoid creating sessions with empty ids
    await ensureNewChatSession(updated.session_id, updated.flow_id, updated.updated_at, undefined, namespace)
  })
}

export async function deleteNewChatMessages(ids: string[]) {
  if (!ids.length) return
  await db.newChatMessages.bulkDelete(ids)
}

export async function deleteNewChatSessionCascade(sessionId: SessionId, namespace?: string) {
  if (!sessionId) return
  try {
    await db.transaction('readwrite', db.newChatSessions, db.newChatMessages, async () => {
      if (namespace) {
        await db.newChatMessages.where('session_id').equals(sessionId).filter((m) => (m as any).namespace === namespace).delete()
        const sess = await db.newChatSessions.get(sessionId)
        if (sess && sess.namespace === namespace) {
          await db.newChatSessions.delete(sessionId)
        }
      } else {
        await db.newChatMessages.where('session_id').equals(sessionId).delete()
        await db.newChatSessions.delete(sessionId)
      }
    })
  } catch (error) {
    throw error
  }
}

export async function renameNewChatSession(oldId: SessionId, newId: SessionId, namespace?: string) {
  if (!oldId || !newId || oldId === newId) return
  await db.transaction('readwrite', db.newChatSessions, db.newChatMessages, async () => {
    const existing = await db.newChatSessions.get(oldId)
    const timestamp = Date.now()
    const fallbackMessage = existing ? null : await db.newChatMessages.where('session_id').equals(oldId).first()
    const targetFlowId = existing?.flow_id ?? fallbackMessage?.flow_id ?? ''
    if (existing) {
      // if namespace provided, only rename if namespaces match
      if (namespace && existing.namespace !== namespace) return
      const name = existing.name
      await db.newChatSessions.delete(oldId)
      await db.newChatSessions.put({
        ...existing,
        id: newId,
        name,
        updated_at: timestamp,
      })
    }
    else {
      await db.newChatSessions.put({
        id: newId,
        flow_id: targetFlowId || newId,
        name: undefined,
        created_at: timestamp,
        updated_at: timestamp,
      })
    }
    if (namespace) {
      await db.newChatMessages.where('session_id').equals(oldId).filter((m) => (m as any).namespace === namespace).modify((message) => {
        message.session_id = newId
        if (!message.flow_id && targetFlowId) {
          message.flow_id = targetFlowId
        }
        message.updated_at = timestamp
      })
    } else {
      await db.newChatMessages.where('session_id').equals(oldId).modify((message) => {
        message.session_id = newId
        if (!message.flow_id && targetFlowId) {
          message.flow_id = targetFlowId
        }
        message.updated_at = timestamp
      })
    }
  })
}

export async function updateNewChatSessionName(sessionId: SessionId, name: string, namespace?: string) {
  if (!sessionId) return
  if (!name) return
  const timestamp = Date.now()
  if (namespace) {
    const existing = await db.newChatSessions.get(sessionId)
    if (!existing || existing.namespace !== namespace) return
  }
  await db.newChatSessions.update(sessionId, {
    name,
    updated_at: timestamp,
  })
}

export async function getNewChatSessions(namespace?: string): Promise<INewChatSession[]> {
  if (namespace) {
    const sessions = await db.newChatSessions.where('namespace').equals(namespace).sortBy('updated_at')
    return sessions.sort((a, b) => a.updated_at - b.updated_at)
  }
  const sessions = await db.newChatSessions.orderBy('updated_at').toArray()
  return sessions.sort((a, b) => a.updated_at - b.updated_at)
}

export async function getNewChatMessagesByFlow(flowId: FlowId, namespace?: string): Promise<Message[]> {
  if (!flowId) return []
  if (namespace) {
    const messages = await db.newChatMessages.where('flow_id').equals(flowId).filter((m) => (m as any).namespace === namespace).sortBy('timestamp')
    return messages.map(toStoreMessage)
  }
  const messages = await db.newChatMessages.where('flow_id').equals(flowId).sortBy('timestamp')
  return messages.map(toStoreMessage)
}

export async function getNewChatMessagesBySession(sessionId: SessionId, namespace?: string): Promise<Message[]> {
  if (!sessionId) return []
  if (namespace) {
    const messages = await db.newChatMessages.where('session_id').equals(sessionId).filter((m) => (m as any).namespace === namespace).sortBy('timestamp')
    return messages.map(toStoreMessage)
  }
  const messages = await db.newChatMessages.where('session_id').equals(sessionId).sortBy('timestamp')
  return messages.map(toStoreMessage)
}

export async function getAllNewChatMessages(namespace?: string): Promise<Message[]> {
  if (namespace) {
    const messages = await db.newChatMessages.where('namespace').equals(namespace).sortBy('timestamp')
    return messages.map(toStoreMessage)
  }
  const messages = await db.newChatMessages.orderBy('timestamp').toArray()
  return messages.map(toStoreMessage)
}

// Utility: cleanup any sessions or messages that have an empty session id.
// Call this once (e.g. from a dev-only UI or the browser console) to remove bad records.
export async function cleanupEmptyNewChatSessions() {
  try {
    const emptySession = await db.newChatSessions.get("")
    if (emptySession) {
      await db.newChatMessages.where('session_id').equals("").delete()
      await db.newChatSessions.delete("")
      return true
    }
    const emptyMessagesCount = await db.newChatMessages.where('session_id').equals("").count()
    if (emptyMessagesCount > 0) {
      await db.newChatMessages.where('session_id').equals("").delete()
      return true
    }
    return false
  } catch (err) {
    throw err
  }
}