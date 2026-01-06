import {
  bulkUpsertNewChatMessages,
  deleteNewChatMessages as persistDeleteMessages,
  deleteNewChatSessionCascade,
  renameNewChatSession as persistRenameSession,
  upsertNewChatMessage,
  updateNewChatMessage as persistUpdateMessage,
} from "@/db";
import useFlowStore from "@/stores/flow-store";
import type { Message } from "@/types/messages";
import { create } from "zustand";
import { MessagesStoreType } from "../types/zustand/messages";

export const useMessagesStore = create<MessagesStoreType>((set, get) => ({
  displayLoadingMessage: false,
  hydrated: false,
  // Optional page-level override: if set, this flag will determine whether
  // to use the 'playground' namespace. If undefined, falls back to flow store.
  playgroundPageFlag: undefined,
  setPlaygroundPageFlag: (v?: boolean) => set(() => ({ playgroundPageFlag: v })),
  deleteSession: (id) => {
    set((state) => {
      const updatedMessages = state.messages.filter(
        (msg) => msg.session_id !== id,
      );
      return { messages: updatedMessages };
    });
    const playgroundFlag = get().playgroundPageFlag ?? useFlowStore.getState().playgroundPage;
    const ns = playgroundFlag ? 'playground' : 'new-chat';
    void deleteNewChatSessionCascade(id, ns)
      .then(() => console.log('[store] deleteSession persisted', id))
      .catch((err) => console.error('[store] deleteSession error', id, err));
  },
  renameSession: (oldId, newId) => {
    if (!oldId || !newId || oldId === newId) return;
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.session_id === oldId
          ? {
              ...msg,
              session_id: newId,
            }
          : msg,
      ),
    }));
    const playgroundFlag = get().playgroundPageFlag ?? useFlowStore.getState().playgroundPage;
    const ns = playgroundFlag ? 'playground' : 'new-chat';
    void persistRenameSession(oldId, newId, ns).catch(console.error);
  },
  messages: [],
  setMessages: (messages, options) => {
    set(() => ({ messages: messages, hydrated: true }));
    if (options?.persist === false) {
      return;
    }
    const playgroundFlag = get().playgroundPageFlag ?? useFlowStore.getState().playgroundPage;
    const ns = playgroundFlag ? 'playground' : 'new-chat';
    void bulkUpsertNewChatMessages(messages, ns).catch(console.error);
  },
  addMessage: (message) => {
    const existingMessage = get().messages.find((msg) => msg.id === message.id);
    if (existingMessage) {
      get().updateMessagePartial(message);
      return;
    }
    if (message.sender === "Machine") {
      set(() => ({ displayLoadingMessage: false }));
    }
    set(() => ({ messages: [...get().messages, message], hydrated: true }));
    const playgroundFlag = get().playgroundPageFlag ?? useFlowStore.getState().playgroundPage;
    const ns = playgroundFlag ? 'playground' : 'new-chat';
    void upsertNewChatMessage(message, ns).catch(console.error);
  },
  removeMessage: (message) => {
    set(() => ({
      messages: get().messages.filter((msg) => msg.id !== message.id),
    }));
    void persistDeleteMessages([message.id]).catch(console.error);
  },
  updateMessage: (message) => {
    let updatedMessage = message;
    set(() => ({
      messages: get().messages.map((msg) =>
        msg.id === message.id ? message : msg,
      ),
    }));
    const playgroundFlag = get().playgroundPageFlag ?? useFlowStore.getState().playgroundPage;
    const ns = playgroundFlag ? 'playground' : 'new-chat';
    void persistUpdateMessage(message.id, updatedMessage, ns).catch(console.error);
  },
  updateMessagePartial: (message) => {
    let persisted: { id: string; payload: Partial<Message> } | null = null;
    // search for the message and update it
    // look for the message list backwards to find the message faster
    set((state) => {
      const updatedMessages = [...state.messages];
      for (let i = state.messages.length - 1; i >= 0; i--) {
        if (state.messages[i].id === message.id) {
          updatedMessages[i] = { ...updatedMessages[i], ...message };
          persisted = {
            id: updatedMessages[i].id,
            payload: { ...message },
          };
          break;
        }
      }
      return { messages: updatedMessages };
    });
    if (persisted) {
      const playgroundFlag = get().playgroundPageFlag ?? useFlowStore.getState().playgroundPage;
      const ns = playgroundFlag ? 'playground' : 'new-chat';
      void persistUpdateMessage(persisted.id, persisted.payload, ns).catch(
        console.error,
      );
    }
  },
  updateMessageText: (id, chunk) => {
    if (!chunk || chunk.length === 0) return;
    let updatedMessage: Message | null = null;
    set((state) => {
      const updatedMessages = [...state.messages];
      for (let i = state.messages.length - 1; i >= 0; i--) {
        if (state.messages[i].id === id) {
          const currentText = updatedMessages[i].text || "";
          // Avoid appending the same chunk twice. If the current text already
          // ends with the incoming chunk, skip concatenation.
          if (chunk && currentText.endsWith(chunk)) {
            updatedMessage = { ...updatedMessages[i] };
          } else {
            const nextText = currentText + chunk;
            updatedMessages[i] = {
              ...updatedMessages[i],
              text: nextText,
            };
            updatedMessage = { ...updatedMessages[i] };
          }
          break;
        }
      }
      return { messages: updatedMessages };
    });
    if (updatedMessage) {
      const playgroundFlag = get().playgroundPageFlag ?? useFlowStore.getState().playgroundPage;
      const ns = playgroundFlag ? 'playground' : 'new-chat';
      void persistUpdateMessage(updatedMessage.id, {
        text: updatedMessage.text,
      }, ns).catch(
        console.error,
      );
    }
  },
  clearMessages: () => {
    set(() => ({ messages: [] }));
  },
  removeMessages: (ids) => {
    return new Promise((resolve, reject) => {
      try {
        set((state) => {
          const updatedMessages = state.messages.filter(
            (msg) => !ids.includes(msg.id),
          );
          get().setMessages(updatedMessages);
          resolve(updatedMessages);
          return { messages: updatedMessages };
        });
        void persistDeleteMessages(ids).catch(console.error);
      } catch (error) {
        reject(error);
      }
    });
  },
}));
