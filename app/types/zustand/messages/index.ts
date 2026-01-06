import { Message } from "../../messages";

export type MessagesStoreType = {
  messages: Message[];
  hydrated: boolean;
  /** Optional page-level override for playground mode. If undefined, falls back to flow store. */
  playgroundPageFlag?: boolean;
  /** Setter to update the optional page-level playground flag. Pass `undefined` to clear and fall back to flow store. */
  setPlaygroundPageFlag?: (v?: boolean) => void;
  setMessages: (messages: Message[], options?: { persist?: boolean }) => void;
  addMessage: (message: Message) => void;
  removeMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  updateMessagePartial: (message: Partial<Message>) => void;
  updateMessageText: (id: string, chunk: string) => void;
  clearMessages: () => void;
  removeMessages: (ids: string[]) => void;
  deleteSession: (id: string) => void;
  renameSession: (oldId: string, newId: string) => void;
  displayLoadingMessage: boolean;
};
