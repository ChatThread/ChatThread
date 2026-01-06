import type { IConversations, IMessage } from '@/db/interface'
import type { RequireKey } from '@/types/global-variables'
import type { StoreState } from './initial-state'
import { Role } from '@/constants/constants'
import { getNow, uuid, } from '@/utils/utils'
import { formatDate } from '@/utils/date-utils'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { initialState } from './initial-state'

interface StoreActions {
  reset: () => void
}
export type ConversationsStore = StoreState & StoreActions

// 创建基础 store
export const useConversationsStore = create<ConversationsStore>()(
  devtools(
    set => ({
      ...initialState,
      reset: () => {
        set(initialState)
      },
    }),
    {
      enabled: import.meta.env.MODE === 'development',
    },
  ),
)

export function createConversations(option?: Partial<IConversations>): IConversations {
  const time = getNow()
  const date = new Date()
  const formattedTime = formatDate(date);
  return Object.assign({
    id: uuid(),
    title: "会话"+formattedTime,
    createAt: time,
    updateAt: time,
  }, option)
}

export function createMessage(option?: RequireKey<Partial<IMessage>, 'convId'>): IMessage {
  return Object.assign({
    id: uuid(),
    role: Role.USER,
    content: '',
    reasoningContent: '',
    createAt: getNow(),
    status: 'success',
    convId: '',
    images: [],
    attachments: [],
  }, option)
}
