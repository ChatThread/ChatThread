import type { EntityTable } from 'dexie'
import type { IConversations, IMessage, INewChatMessage, INewChatSession } from './interface'
import Dexie from 'dexie'

export function createDb() {
  return new Dexie('ChatThread') as Dexie & {
    conversations: EntityTable<IConversations, 'id'>
    messages: EntityTable<IMessage, 'id'>
    customModels: EntityTable<{ id: string, ownedBy: string, createAt: number }, 'id'>
    newChatSessions: EntityTable<INewChatSession, 'id'>
    newChatMessages: EntityTable<INewChatMessage, 'id'>
  }
}

export function upgradeToV1(db: Dexie) {
  db.version(4).stores({
    conversations: '&id, title, createAt, updateAt',
    messages: '&id, convId, content, createAt',
    customModels: '&id, ownedBy, createAt',
  }).upgrade((trans) => {
    return trans.table('conversations').toCollection().modify((conv) => {
      conv.updateAt = conv.createAt
    })
  })
}

export function upgradeToV2(db: Dexie) {
  db.version(5).stores({
    conversations: '&id, title, createAt, updateAt',
    messages: '&id, convId, content, createAt',
    customModels: '&id, ownedBy, createAt',
    // include `namespace` so sessions/messages can be partitioned by page/context
    newChatSessions: '&id, flow_id, namespace, updated_at',
    newChatMessages: '&id, session_id, flow_id, namespace, timestamp, updated_at',
  })
}

const db = createDb()

upgradeToV1(db)
upgradeToV2(db)

// window.indexedDB.databases().then(dbs => {
//   console.log('All databases:', dbs);
// });

export default db
