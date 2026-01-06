import type { ConversationsId, IConversations, ModelConfig } from '@/db/interface'
import { Role } from '@/constants/constants'
import {
  addConversations,
  addMessage,
  conversationsExists,
  db,
  deleteConversations,
  fetchConversations,
  getConversationsById,
  getMessagesByConvId,
  importMessages,
  messageIsExists,
  renameConversations,
  setConversationsModelConfig,
  setConversationsSystemPrompt,
} from '@/db'
import { produce } from 'immer'
import { isEqual } from 'lodash-es'
import { setActiveConversationsId, updateMessageAction, useMessagesStore } from '../message'
import { createMessage, useConversationsStore } from './conversations-store'

export async function addConversationsAction(conversation: IConversations) {
  await addConversations(conversation)
  // await addMessage(createMessage({ convId: conversation.id, role: Role.SYSTEM, content: "" }))

  useConversationsStore.setState(state => produce(state, (draft) => {
    draft.conversations.splice(0, 0, conversation)
  }))
}

export async function renameConversationsAction(id: ConversationsId, title: string) {
  await renameConversations(id, title)

  useConversationsStore.setState(state => produce(state, (draft) => {
    const conversation = draft.conversations.find(c => c.id === id)
    if (conversation) {
      conversation.title = title
    }
  }))
}

export async function deleteConversationsAction(id: ConversationsId) {
  await deleteConversations(id)

  setActiveConversationsId('')

  useConversationsStore.setState(state => produce(state, (draft) => {
    draft.conversations = draft.conversations.filter(c => c.id !== id)
  }))
}

export async function clearConversationsAction() {
  await Promise.all([
    db.conversations.clear(),
    db.messages.clear(),
  ])

  await setActiveConversationsId('')

  useConversationsStore.setState(state => produce(state, (draft) => {
    draft.conversations = []
  }))
}

export async function nextPageConversationsAction() {
  const { pageIndex, pageSize} = useConversationsStore.getState()
  const { conversations, total } = await fetchConversations(pageIndex, pageSize)

  useConversationsStore.setState(state => produce(state, (draft) => {
    const existingIds = new Set(draft.conversations.map(c => c.id));
    const newConversations = conversations.filter(c => !existingIds.has(c.id));
    draft.conversations.push(...newConversations)

    draft.conversationsTotal = total

    if (draft.conversations.length < total) {
      draft.pageIndex = pageIndex + 1
    }
  }))
}


export interface UpdateConversationsSettingsConfig {
  title?: string
  systemPrompt?: string
  modelConfig?: ModelConfig | null
}

export async function updateConversationsSettingsAction(id: ConversationsId, config: UpdateConversationsSettingsConfig) {
  const { title, systemPrompt, modelConfig } = config
  const conversations = await getConversationsById(id)
  let systemPromptChanged = false
  if (!conversations) {
    console.error('conversations not found')
    return
  }

  if (title && conversations.title !== title) {
    await renameConversationsAction(id, title)
  }

  if (systemPrompt && conversations.settings?.systemPrompt !== systemPrompt) {
    systemPromptChanged = true
    await setConversationsSystemPrompt(id, systemPrompt)
  }

  if (modelConfig === null) {
    await setConversationsModelConfig(id, null)
  }

  else if (modelConfig !== undefined && !(isEqual(conversations.settings?.modelConfig, modelConfig))) {
    await setConversationsModelConfig(id, modelConfig)
  }

  // 更新conversationsStore.messages的系统提示词
  const messages = await getMessagesByConvId(id)
  const message = messages.find(item => item.role === Role.SYSTEM)

  if (!message) {
    throw new Error('当前对话没有系统提示词。')
  }

  // 同步更新messages中的系统提示词
  if (systemPrompt && systemPromptChanged) {
    message.content = systemPrompt
    await updateMessageAction(message)
  }

  useConversationsStore.setState(state => produce(state, (draft) => {
    const conversation = draft.conversations.find(c => c.id === id)
    if (conversation) {
      conversation.settings = config
    }
  }))
}
