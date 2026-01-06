"use client";

import ChatThreadLogo from "@/assets/logo.svg?react";
import IconComponent from "@/components/common/generic-icon-component";
import { Button } from "@/components/ui/button";
import { useGetFolderQuery } from "@/controllers/API/queries/folders/use-get-folder";
import { ensureNewChatSession } from "@/db";
import useChatSessions from "@/hooks/use-chat-sessions";
import { streamChat } from "@/pages/new-chat-page/services/chat-stream";
import { api } from "@/controllers/API/api";
import type { Message } from "@/types/messages";
import { generateMessageId } from "@/db/messages-actions";
import { ChatViewWrapper } from "@/modals/io-modal/components/ChatViewWrapper";
import { SelectedViewField } from "@/modals/io-modal/components/SelectedViewField";
import { SidebarOpenView } from "@/modals/io-modal/components/SidebarOpenView";
import useFlowStore from "@/stores/flow-store";
import useFlowsManagerStore from "@/stores/flows-manager-store";
import { useMessagesStore } from "@/stores/messages-store";
import { useUtilityStore } from "@/stores/utility-store";
import { cn } from "@/utils/utils";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BaseModal from "@/modals/base-modal";
import { BASE_URL_API, BASE_URL_API_V2 } from "@/constants/constants";

function AuthenticatedChatPage({ folderId }: { folderId: string }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");
  const [workflowList, setWorkflowList] = useState<
    { id: string; name: string }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // session state and operations are managed by `useChatSessions` hook
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMode, setChatMode] = useState<"direct" | "workflow">("direct");
  const userChangedChatModeRef = useRef(false);
  // Keep this list focused on currently supported / modern models.
  // Older legacy models have been removed to avoid offering deprecated options.
  const [models] = useState<{ id: string; name: string }[]>([
    { id: "deepseek-chat", name: "DeepSeek" },
    { id: "gpt-5.1", name: "GPT-5.1" },
    { id: "gpt-5", name: "GPT-5" },
    { id: "gpt-5-mini", name: "GPT-5 Mini" },
    { id: "gpt-4.1", name: "GPT-4.1" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  ]);
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(models[0]?.id);
  const activeRequestRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  const stopStreaming = useCallback(() => {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  const currentFlowId = useFlowsManagerStore((state) => state.currentFlowId);
  const setCurrentFlowId = useFlowsManagerStore(
    (state) => state.setCurrentFlowId,
  );
  

  const allNodes = useFlowStore((state) => state.nodes);
  const flowInputs = useFlowStore((state) => state.inputs);
  const flowOutputs = useFlowStore((state) => state.outputs);
  const inputs = useMemo(
    () => flowInputs.filter((input) => input.type !== "ChatInput"),
    [flowInputs],
  );

  const outputs = useMemo(
    () => flowOutputs.filter((output) => output.type !== "ChatOutput"),
    [flowOutputs],
  );

  const chatInput = useMemo(
    () => flowInputs.find((input) => input.type === "ChatInput"),
    [flowInputs],
  );

  const chatOutput = useMemo(
    () => flowOutputs.find((output) => output.type === "ChatOutput"),
    [flowOutputs],
  );

  const nodes = useMemo(
    () =>
      allNodes.filter(
        (node) =>
          inputs.some((input) => input.id === node.id) ||
          outputs.some((output) => output.id === node.id),
      ),
    [allNodes, inputs, outputs],
  );

  const haveChat = chatInput || chatOutput;

  const chatSessions = useChatSessions({ currentFlowId, initialSelectedWorkflow: selectedWorkflow, workflowList, namespace: 'new-chat' });
  const {
    sessions,
    sessionWorkflows,
    sessionNames,
    sessionId,
    visibleSession,
    currentSessionId,
    selectedViewField,
    setSelectedViewField,
    setVisibleSession,
    handleNewSession,
    handleDeleteSession,
    handleRenameSession,
    handleChatPageRename,
    setSessionWorkflows,
  } = chatSessions;

  // Keep the top workflow selector in sync with the currently visible
  // session's stored workflow id. When the visible session changes or
  // the sessionWorkflows mapping is updated (e.g. messages updated),
  // update the local selectedWorkflow and global currentFlowId.
  useEffect(() => {
    if (!visibleSession) return;
    const wf = sessionWorkflows?.[visibleSession];
    if (wf && wf !== selectedWorkflow) {
      setSelectedWorkflow(wf);
      setCurrentFlowId(wf);
    }
  }, [visibleSession, sessionWorkflows, selectedWorkflow, setCurrentFlowId]);

  const setChatValue = useUtilityStore((state) => state.setChatValueStore);
  const chatValue = useUtilityStore((state) => state.chatValueStore);
  const setPlaygroundScrollBehaves = useUtilityStore(
    (state) => state.setPlaygroundScrollBehaves,
  );

  

  const { addMessage, updateMessageText } = useMessagesStore();

  const { data: flowData } = useGetFolderQuery(
    {
      id: folderId,
      page: 1,
      size: 100,
      is_component: false,
      is_flow: true,
      search: "",
    },
    {
      enabled: Boolean(folderId),
    },
  );

  
  const isBuilding = useFlowStore((state) => state.isBuilding);

  useEffect(() => {
    if (!flowData) {
      return;
    }

    const flowDataItems = flowData["flows"]["items"];
    if (!Array.isArray(flowDataItems)) {
      return;
    }

    setWorkflowList(flowDataItems as { id: string; name: string }[]);
    if (!selectedWorkflow && flowDataItems.length > 0) {
      const initialFlowId = flowDataItems[0].id;
      setSelectedWorkflow(initialFlowId);
      setCurrentFlowId(initialFlowId);
    }
    // Set default chat mode based on whether there are workflows.
    // Do not override if the user has already changed the chat mode.
    if (!userChangedChatModeRef.current) {
      if (flowDataItems.length > 0) {
        setChatMode("workflow");
      } else {
        setChatMode("direct");
      }
    }
  }, [flowData, selectedWorkflow, setCurrentFlowId]);

  useEffect(() => {
    setPlaygroundScrollBehaves("instant");
  }, [setPlaygroundScrollBehaves]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // session rename/delete handled by `useChatSessions`

  // Placeholder for future stream toggles

  const sendMessage = useCallback(
    async ({ repeat, files }: { repeat: number; files?: string[] }) => {
      if (isBuilding) return;
      stopStreaming();
      if (chatMode === "workflow" && !selectedWorkflow) {
        toast.error("Please select a workflow before chatting");
        return;
      }
      setChatValue("");
      const activeSession = currentSessionId || sessionId;
      // ensure we have a session id; if none, create one synchronously via handleNewSession
      let maybeNewSessionId: string | undefined = undefined;
      if (!activeSession) {
        try {
          // handleNewSession now returns the new session id so we can use it immediately
          maybeNewSessionId = handleNewSession();
        } catch (err) {
          console.error('[debug][auth-chat-page] handleNewSession failed', err);
        }
      }
      const resolvedActiveSession = currentSessionId || sessionId || maybeNewSessionId;
      const userMessage: Message = {
        id: generateMessageId(),
        flow_id: currentFlowId,
        text: chatValue,
        sender: "User",
        sender_name: "User",
        session_id: resolvedActiveSession,
        timestamp: new Date().toISOString(),
        files: files || [],
        edit: false,
        background_color: "",
        text_color: "",
      };
      addMessage(userMessage);
      const machineMessage: Message = {
        id: generateMessageId(),
        flow_id: currentFlowId,
        text: "",
        sender: "AI",
        sender_name: "AI",
        session_id: resolvedActiveSession,
        timestamp: new Date().toISOString(),
        files: [],
        edit: false,
        background_color: "",
        text_color: "",
      };
      addMessage(machineMessage);
      for (let i = 0; i < repeat; i++) {
        const abortController = new AbortController();
        activeRequestRef.current = abortController;
        setIsStreaming(true);

        let requestBody: Record<string, unknown>;
        if (chatMode === "workflow") {
          requestBody = {
            input_value: chatValue,
            output_type: "chat",
            input_type: "chat",
            session: resolvedActiveSession,
            files: files ?? [],
          };
        } else {
          // Direct mode: adapt payload to provider-style direct API (e.g. DeepSeek)
          // Example shape:
          // {
          //   messages: [{ role: 'user', content: 'hello' }],
          //   model: 'deepseek-chat',
          //   stream: true
          // }
          requestBody = {
            messages: [
              {
                role: "user",
                content: chatValue,
              },
            ],
            model: selectedModelId,
            stream: true,
          };
        }
        const runTargetId = chatMode === "workflow" ? selectedWorkflow : currentFlowId;
        const base = api?.defaults?.baseURL ?? "";
        const url =
          chatMode === "workflow"
            ? `${base}${BASE_URL_API}run/self/${runTargetId}?stream=true`
            : `${base}${BASE_URL_API_V2}chat/open/`;
        
        try {
          await streamChat({
            url,
            body: requestBody,
            signal: abortController.signal,
            onChunk: (chunk) => updateMessageText(machineMessage.id, chunk),
          });
        } catch (error) {
          if ((error as DOMException)?.name !== "AbortError") {
            console.error(error);
            const msg = error instanceof Error ? error.message : String(error);
            // Detect HTTP 402 Payment Required from fetch / streamChat
            if (typeof msg === "string" && msg.includes("status: 402")) {
              setOpenPaymentModal(true);
              try {
                updateMessageText(
                  machineMessage.id,
                  "Payment required. Please visit your wallet to add a payment method.",
                );
              } catch (e) {
                console.error('Failed to update message text with payment required', e);
              }
            } else {
              try {
                updateMessageText(machineMessage.id, `Error: ${msg}`);
              } catch (e) {
                console.error('Failed to update message text with error', e);
              }
            }
          } else {
            try {
              updateMessageText(machineMessage.id, '[Aborted]');
            } catch (e) {
              console.error('Failed to update message text after abort', e);
            }
          }
          break;
        } finally {
          if (activeRequestRef.current === abortController) {
            activeRequestRef.current = null;
          }
          setIsStreaming(false);
        }
      }
    },
    [
      addMessage,
      chatValue,
      currentFlowId,
      isBuilding,
      sessionId,
      currentSessionId,
      visibleSession,
      handleNewSession,
      setChatValue,
      selectedWorkflow,
      stopStreaming,
      updateMessageText,
      chatMode,
    ],
  );

    const handleGoToWallet = useCallback(() => {
      setOpenPaymentModal(false);
      navigate("/settings/wallet");
    }, [navigate]);

  const handleWorkflowChange = useCallback((value: string) => {
    setSelectedWorkflow(value);
    setCurrentFlowId(value);
    if (visibleSession) {
      setSessionWorkflows((prev) => {
        if (prev[visibleSession] === value) {
          return prev;
        }
        return {
          ...prev,
          [visibleSession]: value,
        };
      });
      void ensureNewChatSession(visibleSession, value, Date.now(), undefined, 'new-chat');
    }
  }, [setCurrentFlowId, setSelectedWorkflow, visibleSession, setSessionWorkflows]);

  const currentFlow = useFlowStore((state) => state.currentFlow);
  const flowTitle = currentFlow?.name ?? "ChatThread";

  // workflowList may be empty initially; no-op variable removed to avoid lint warning
  const workflowNameById = useMemo(() => {
    const lookup: Record<string, string> = {};
    for (const workflow of workflowList) {
      lookup[workflow.id] = workflow.name;
    }
    return lookup;
  }, [workflowList]);

  return (
    <div className="flex h-screen min-h-0 w-full flex-col">
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex h-full min-h-0 w-full">
          <div
            className={cn(
              "flex h-full shrink-0 flex-col justify-start transition-all duration-300",
              sidebarOpen
                ? "absolute z-10 w-full lg:relative lg:w-1/5 lg:max-w-[280px]"
                : "w-0",
            )}
          >
            <div
              className={cn("relative flex h-full flex-col border-r")}
            >
              <div className="flex items-center justify-between gap-2 pb-8 align-middle">
                <div className="flex items-center gap-2">
                  {sidebarOpen && (
                    <div className={cn("flex rounded pl-4 pt-3")}>
                      <ChatThreadLogo className="h-5 w-5" />
                    </div>
                  )}
                  {sidebarOpen && (
                    <div className="truncate font-semibold pt-3">ChatThread</div>
                  )}
                </div>
                {sidebarOpen && (
                  <Button
                    variant="ghost"
                    className="flex h-8 w-8 items-center justify-center p-0 mt-3"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <IconComponent
                      name={sidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"}
                      className="text-ring h-[18px] w-[18px]"
                    />
                  </Button>
                )}
              </div>
              <div className="custom-scroll flex-1 overflow-y-auto text-center">
                {sidebarOpen && (
                  <SidebarOpenView
                    sessions={sessions}
                    setSelectedViewField={setSelectedViewField}
                    setVisibleSession={setVisibleSession}
                    handleDeleteSession={handleDeleteSession}
                    handleRenameSession={handleRenameSession}
                    onCreateSession={handleNewSession}
                    visibleSession={visibleSession}
                    selectedViewField={selectedViewField}
                    playgroundPage={false}
                    sessionWorkflows={sessionWorkflows}
                    sessionNames={sessionNames}
                    workflowNameLookup={workflowNameById}
                    onChatPageRename={handleChatPageRename}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="bg-background flex h-full min-h-0 min-w-0 grow">
            {selectedViewField && (
              <SelectedViewField
                selectedViewField={selectedViewField}
                setSelectedViewField={setSelectedViewField}
                haveChat={haveChat}
                inputs={inputs}
                outputs={outputs}
                sessions={sessions}
                currentFlowId={currentFlowId}
                nodes={nodes}
              />
            )}
            <ChatViewWrapper
              playgroundPage={false}
              selectedViewField={selectedViewField}
              visibleSession={visibleSession}
              sessions={sessions}
              sidebarOpen={sidebarOpen}
              currentFlowId={currentFlowId}
              setSidebarOpen={setSidebarOpen}
              isPlayground={false}
              setVisibleSession={setVisibleSession}
              setSelectedViewField={setSelectedViewField}
              haveChat={haveChat}
              messagesFetched={true}
              sessionId={sessionId}
              sendMessage={sendMessage}
              canvasOpen={false}
              setOpen={() => {}}
              playgroundTitle={flowTitle}
              workflows={workflowList}
              chatPage={true}
              selectedWorkflowId={selectedWorkflow}
              onSelectWorkflow={handleWorkflowChange}
              chatMode={chatMode}
              onChangeChatMode={(m) => {
                userChangedChatModeRef.current = true;
                setChatMode(m);
              }}
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={(id) => setSelectedModelId(id)}
              onCreateSession={handleNewSession}
              isStreaming={isStreaming}
              stopStreaming={stopStreaming}
            />
          </div>
        </div>
      </main>
      <BaseModal open={openPaymentModal} setOpen={setOpenPaymentModal} size="small">
        <BaseModal.Header description={"Add a payment method to continue using this feature."}>
          Payment Required
        </BaseModal.Header>
        <BaseModal.Content>
          <div className="px-6 pb-4">
            <p className="mb-2 text-sm">
              We detected that payment is required to continue using the selected model or workflow. Please add a payment method or top up your wallet to proceed.
            </p>
            <p className="text-sm text-muted-foreground">
              Click "Open Wallet" to manage billing and add funds. If you believe this is a mistake, contact support.
            </p>
          </div>
        </BaseModal.Content>
        <BaseModal.Footer submit={{ label: "Open Wallet", onClick: handleGoToWallet, dataTestId: "btn-open-wallet" }} close />
      </BaseModal>
    </div>
  );
}

export default AuthenticatedChatPage;
