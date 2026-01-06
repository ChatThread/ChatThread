import { useCallback, useEffect, useRef, useState } from "react";
import useFlowStore from "@/stores/flow-store";
import {
  ensureDefaultSession,
  ensureNewChatSession,
  getAllNewChatMessages,
  getNewChatSessions,
  updateNewChatSessionName,
} from "@/db";
import { useMessagesStore } from "@/stores/messages-store";
import { useVoiceStore } from "@/stores/voice-store";

import type { SessionRecord, Workflow } from "@/types/chat";
import type { Message as StoreMessage } from "@/types/messages";
import { uuid } from "@/utils/utils";

export function useChatSessions(opts: {
  currentFlowId?: string;
  initialSelectedWorkflow?: string;
  workflowList?: Workflow[];
  namespace?: string;
}) {
  const { currentFlowId, initialSelectedWorkflow, workflowList = [], namespace } = opts;
  const ns = namespace ?? 'default'

  const [sessions, setSessions] = useState<string[]>([]);
  const [persistedSessions, setPersistedSessions] = useState<string[]>([]);
  const [sessionsHydrated, setSessionsHydrated] = useState(false);
  const [sessionWorkflows, setSessionWorkflows] = useState<Record<string, string>>({});
  const [sessionNames, setSessionNames] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string>("");
  const [visibleSession, setVisibleSession] = useState<string | undefined>(undefined);
  const [selectedViewField, setSelectedViewField] = useState<{ type: string; id: string } | undefined>(undefined);

  const sessionsLoadInitializedRef = useRef(false);
  const sessionMetadataRef = useRef<string | null>(null);
  const sessionOrderRef = useRef<string | null>(null);
  const persistedKeyRef = useRef<string | null>(null);

  // Note: we intentionally do not write to the global utility store here.
  // `useChatSessions` is the single source of truth for session selection.
  const setNewSessionCloseVoiceAssistant = useVoiceStore((s) => s.setNewSessionCloseVoiceAssistant);
  const setMessagesStore = useMessagesStore((s) => s.setMessages);
  const deleteSession = useMessagesStore((s) => s.deleteSession);
  const renameSessionStore = useMessagesStore((s) => s.renameSession);

  // Helper: merge two session lists while preserving order and uniqueness
  const mergeSessions = useCallback((primary: string[], existing: string[]) => {
    if (existing.length === 0) return [...primary];
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const id of primary) {
      if (!seen.has(id)) {
        merged.push(id);
        seen.add(id);
      }
    }
    for (const id of existing) {
      if (!seen.has(id)) {
        merged.push(id);
        seen.add(id);
      }
    }
    return merged;
  }, []);

  const createSessionLabel = useCallback(() => {
    const timestamp = new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      second: "2-digit",
      timeZone: "UTC",
    });
    const base = `Session ${timestamp}`;
    const taken = new Set([...persistedSessions, ...sessions]);
    if (!taken.has(base)) return base;
    let counter = 2;
    let candidate = `${base} (${counter})`;
    while (taken.has(candidate)) {
      counter += 1;
      candidate = `${base} (${counter})`;
    }
    return candidate;
  }, [persistedSessions, sessions]);

  const handleNewSession = useCallback(() => {
    const fallbackWorkflowId = initialSelectedWorkflow || currentFlowId || workflowList[0]?.id || "";
    if (!fallbackWorkflowId) return;
    const newSessionName = createSessionLabel();
    const newSessionId = uuid();
    const currentTime = Date.now();
    
    setVisibleSession(newSessionId);
    setSelectedViewField(undefined);
    setSessionId(newSessionId);
    setNewSessionCloseVoiceAssistant(true);
    setSessionsHydrated(true);

    setSessionWorkflows((prev) => ({ ...prev, [newSessionId]: fallbackWorkflowId }));
    setSessionNames((prev) => ({ ...prev, [newSessionId]: newSessionName }));

    setPersistedSessions((prev) => (prev.includes(newSessionId) ? prev : [...prev, newSessionId]));
    setSessions((prev) => (prev.includes(newSessionId) ? prev : [...prev, newSessionId]));

    // store the initial display name equal to the generated label
    void ensureNewChatSession(newSessionId, fallbackWorkflowId, currentTime, newSessionName, ns);
    return newSessionId;
  }, [createSessionLabel, currentFlowId, initialSelectedWorkflow, setNewSessionCloseVoiceAssistant, workflowList]);

  useEffect(() => {
    if (sessionsLoadInitializedRef.current) return;
    let cancelled = false;

    const loadPersisted = async () => {
      setSessionsHydrated(false);
      try {
        let sessionRecords: SessionRecord[] = await getNewChatSessions(ns);
        if (!sessionRecords.length) {
          // create a new session id (do not use flowId as the session id)
          const newSessionName = createSessionLabel();
          const newSessionId = uuid();
          const currentTime = Date.now();
          await ensureNewChatSession(newSessionId, currentFlowId, currentTime, newSessionName, ns);
          sessionRecords = await getNewChatSessions(ns);
        }
        const messageRecords: StoreMessage[] = await getAllNewChatMessages(ns);
        if (cancelled) return;
        const sessionIds = sessionRecords.map((s) => s.id);

        setSessionWorkflows((prev) => {
          const next = { ...prev };
          let mutated = false;
          for (const session of sessionRecords) {
            if (!next[session.id] || next[session.id] !== session.flow_id) {
              next[session.id] = session.flow_id;
              mutated = true;
            }
          }
          return mutated ? next : prev;
        });

        setSessionNames((prev) => {
          const next = { ...prev };
          let mutated = false;
          for (const session of sessionRecords) {
            const name = session.name ?? session.id
            if (next[session.id] !== name) {
              next[session.id] = name
              mutated = true
            }
          }
          return mutated ? next : prev
        });

        setPersistedSessions((prev) => mergeSessions(sessionIds, prev));
        setSessions((prev) => {
          const merged = mergeSessions(sessionIds, prev);
          if (prev.length === merged.length && prev.every((id, idx) => id === merged[idx])) return prev;
          return merged;
        });
        setMessagesStore(messageRecords, { persist: false });
        if (!visibleSession && sessionIds.length) setVisibleSession(sessionIds[sessionIds.length - 1]);
        sessionsLoadInitializedRef.current = true;
      } catch (error) {
        // keep fail silent; component may display alerts
         
        console.error("Failed to load stored chat sessions:", error);
      } finally {
        if (!cancelled && sessionsLoadInitializedRef.current) setSessionsHydrated(true);
      }
    };

    void loadPersisted();
    return () => {
      cancelled = true;
    };
  }, [currentFlowId, mergeSessions, setMessagesStore, visibleSession]);

  useEffect(() => {
    if (!sessionsHydrated) return;
    const seenSessions = new Set<string>();
    const sessionOrder: string[] = [];
    const sessionFlowFromMessages: Record<string, string> = {};
    const metadataPairs: string[] = [];

    const messages = useMessagesStore.getState().messages;
    for (const message of messages) {
      const sessionKey = message.session_id;
      if (!sessionKey) continue;
      metadataPairs.push(`${sessionKey}:${message.flow_id ?? ""}`);
      if (!seenSessions.has(sessionKey)) {
        seenSessions.add(sessionKey);
        sessionOrder.push(sessionKey);
      }
      if (message.flow_id && !sessionFlowFromMessages[sessionKey]) sessionFlowFromMessages[sessionKey] = message.flow_id;
    }

    metadataPairs.sort();
    const metadataKey = metadataPairs.join("|");
    const sessionOrderKey = sessionOrder.join("|");
    const persistedKey = persistedSessions.join("|");

    const shouldSkip =
      sessionMetadataRef.current === metadataKey &&
      sessionOrderRef.current === sessionOrderKey &&
      persistedKeyRef.current === persistedKey;

    if (shouldSkip) {
      if (sessions.length === 0 && persistedSessions.length === 0) {
        handleNewSession();
      } else if (visibleSession !== undefined && !persistedSessions.includes(visibleSession) && persistedSessions.length > 0) {
        setVisibleSession(persistedSessions[persistedSessions.length - 1]);
      }
      return;
    }

    sessionMetadataRef.current = metadataKey;
    sessionOrderRef.current = sessionOrderKey;
    persistedKeyRef.current = persistedKey;

    // setSessionWorkflows((prev) => {
    //   const next = { ...prev };
    //   let mutated = false;
    //   for (const [sessionKey, flowId] of Object.entries(sessionFlowFromMessages)) {
    //     if (flowId && next[sessionKey] !== flowId) {
    //       next[sessionKey] = flowId;
    //       mutated = true;
    //     }
    //   }
    //   return mutated ? next : prev;
    // });

    const nextPersisted = [...persistedSessions];
    let persistedMutated = false;
    for (const sessionKey of sessionOrder) {
      if (!nextPersisted.includes(sessionKey)) {
        nextPersisted.push(sessionKey);
        persistedMutated = true;
      }
    }

    const orderedSessions = persistedMutated ? nextPersisted : persistedSessions;

    if (persistedMutated) setPersistedSessions(nextPersisted);

    setSessions((prev) => {
      if (prev.length === orderedSessions.length && prev.every((id, idx) => id === orderedSessions[idx])) return prev;
      return orderedSessions;
    });

    if (orderedSessions.length === 0) {
      handleNewSession();
      return;
    }

    const lastSessionId = orderedSessions[orderedSessions.length - 1];
    if (persistedMutated) {
      if (lastSessionId && lastSessionId !== visibleSession) setVisibleSession(lastSessionId);
      return;
    }

    if (visibleSession === undefined) setVisibleSession(lastSessionId);
    else if (!orderedSessions.includes(visibleSession)) setVisibleSession(lastSessionId);
  }, [sessionsHydrated, persistedSessions, sessions, visibleSession, handleNewSession]);

  // Listen for session name updates made elsewhere (e.g., via the display-name mutation)
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { sessionId: string; name: string };
        if (!detail?.sessionId) return;
        setSessionNames((prev) => {
          if (prev[detail.sessionId] === detail.name) return prev;
          return { ...prev, [detail.sessionId]: detail.name };
        });
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('sessionNameUpdated', handler as EventListener);
    return () => window.removeEventListener('sessionNameUpdated', handler as EventListener);
  }, []);

  // We no longer sync to the utility store here. Consumers should use
  // the `currentSessionId` returned by this hook as the authoritative
  // session id.

  const handleDeleteSession = useCallback((session_id: string) => {
    try {
      deleteSession(session_id);
      setSessions((prev) => prev.filter((id) => id !== session_id));
      setPersistedSessions((prev) => prev.filter((id) => id !== session_id));
      setSessionWorkflows((prev) => {
        if (!(session_id in prev)) return prev;
        const next = { ...prev };
        delete next[session_id];
        return next;
      });
      if (visibleSession === session_id) {
        const remainingSessions = sessions.filter((id) => id !== session_id);
        if (remainingSessions.length > 0) setVisibleSession(remainingSessions[remainingSessions.length - 1]);
        else handleNewSession();
      }
    } catch (error) {
       
      console.error("Error deleting session", error);
    }
  }, [deleteSession, sessions, visibleSession, handleNewSession]);

  const handleRenameSession = useCallback((currentId: string, sessionName: string) => {
    if (!currentId) return;
    setSessionNames((prev) => {
      if (prev[currentId] === sessionName) return prev;
      return { ...prev, [currentId]: sessionName };
    });

    // Persist the display name change to local DB (playground/local mode)
    void updateNewChatSessionName(currentId, sessionName, ns).catch((err) => {
      console.error("Failed to persist session display name", err);
    });
  }, [updateNewChatSessionName]);

  const handleChatPageRename = useCallback((oldId: string, newId: string) => {
    handleRenameSession(oldId, newId);
  }, [handleRenameSession, renameSessionStore]);

  return {
    sessions,
    persistedSessions,
    sessionsHydrated,
    sessionWorkflows,
    sessionNames,
    sessionId,
    visibleSession,
    // Expose a single authoritative currentSessionId so consumers can
    // read the currently selected session without reaching into the
    // utility store.
    currentSessionId: visibleSession ?? sessionId,
    selectedViewField,
    setSelectedViewField,
    setVisibleSession,
    setSessions,
    setPersistedSessions,
    setSessionWorkflows,
    setSessionId,
    createSessionLabel,
    handleNewSession,
    handleDeleteSession,
    handleRenameSession,
    handleChatPageRename,
  };
}

export default useChatSessions;
