import { EventDeliveryType } from "@/constants/enums";
import { useGetConfig } from "@/controllers/API/queries/config/use-get-config";
import {
  useDeleteMessages,
  useGetMessagesQuery,
} from "@/controllers/API/queries/messages";
import { ENABLE_PUBLISH } from "@/customization/feature-flags";
import { useUtilityStore } from "@/stores/utility-store";
import useChatSessions from "@/hooks/use-chat-sessions";
import { swatchColors } from "@/utils/style-utils";
import { useCallback, useEffect, useState } from "react";
import IconComponent from "../../components/common/generic-icon-component";
import ShadTooltip from "../../components/common/shad-tooltip-component";
import { Button } from "../../components/ui/button";
import useAlertStore from "../../stores/alert-store";
import useFlowStore from "../../stores/flow-store";
import useFlowsManagerStore from "../../stores/flows-manager-store";
import { useMessagesStore } from "../../stores/messages-store";
import { IOModalPropsType } from "../../types/components";
import { cn, getNumberFromString } from "../../utils/utils";
import BaseModal from "../base-modal";
import { ChatViewWrapper } from "./components/ChatViewWrapper";
import { SelectedViewField } from "./components/SelectedViewField";
import { SidebarOpenView } from "./components/SidebarOpenView";
export default function IOModal({
  children,
  open,
  setOpen,
  disable,
  isPlayground,
  canvasOpen,
  playgroundPage,
  chatPage,
}: IOModalPropsType): JSX.Element {
  const allNodes = useFlowStore((state) => state.nodes);
  const setIOModalOpen = useFlowsManagerStore((state) => state.setIOModalOpen);
  const inputs = useFlowStore((state) => state.inputs).filter(
    (input) => input.type !== "ChatInput",
  );
  const chatInput = useFlowStore((state) => state.inputs).find(
    (input) => input.type === "ChatInput",
  );
  const outputs = useFlowStore((state) => state.outputs).filter(
    (output) => output.type !== "ChatOutput",
  );
  const chatOutput = useFlowStore((state) => state.outputs).find(
    (output) => output.type === "ChatOutput",
  );
  const nodes = useFlowStore((state) => state.nodes).filter(
    (node) =>
      inputs.some((input) => input.id === node.id) ||
      outputs.some((output) => output.id === node.id),
  );
  const haveChat = chatInput || chatOutput;
  const [selectedTab, setSelectedTab] = useState(
    inputs.length > 0 ? 1 : outputs.length > 0 ? 2 : 0,
  );
  const setErrorData = useAlertStore((state) => state.setErrorData);
  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const deleteSession = useMessagesStore((state) => state.deleteSession);
  const clientId = useUtilityStore((state) => state.clientId);
  let realFlowId = useFlowsManagerStore((state) => state.currentFlowId);
  const currentFlowId = realFlowId;
  const currentFlow = useFlowStore((state) => state.currentFlow);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { mutate: deleteSessionFunction } = useDeleteMessages();

  // centralize session state using useChatSessions instead of local state
  const chatSessions = useChatSessions({ currentFlowId, namespace: 'playground'});
  const {
    visibleSession,
    setVisibleSession,
    sessionId,
    setSessionId,
    currentSessionId,
  } = chatSessions;
  const flowName = useFlowStore((state) => state.currentFlow?.name);
  const PlaygroundTitle =
    playgroundPage && ENABLE_PUBLISH && flowName ? flowName : "Playground";

  useEffect(() => {
    useMessagesStore.getState().setPlaygroundPageFlag?.(true);
    setIOModalOpen(open);
    return () => {
      setIOModalOpen(false);
      useMessagesStore.getState().setPlaygroundPageFlag?.(false);
    };
  }, [open]);

  function handleDeleteSession(session_id: string) {
    deleteSessionFunction(
      {
        ids: messages
          .filter((msg) => msg.session_id === session_id)
          .map((msg) => msg.id),
      },
      {
        onSuccess: () => {
          setSuccessData({
            title: "Session deleted successfully.",
          });
          deleteSession(session_id);
          if (visibleSession === session_id) {
            setVisibleSession(undefined);
          }
        },
        onError: () => {
          setErrorData({
            title: "Error deleting Session.",
          });
        },
      },
    );
  }

  function startView() {
    if (!chatInput && !chatOutput) {
      if (inputs.length > 0) {
        return inputs[0];
      } else {
        return outputs[0];
      }
    } else {
      return undefined;
    }
  }

  const [selectedViewField, setSelectedViewField] = useState<
    { type: string; id: string } | undefined
  >(startView());

  // chat mode (direct vs workflow) and simple models list for direct mode
  const [chatMode, setChatMode] = useState<"direct" | "workflow">("direct");
  const [models] = useState<{ id: string; name: string }[]>([
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4", name: "GPT-4" },
    { id: "gpt-3.5", name: "GPT-3.5" },
  ]);
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(
    models[0]?.id,
  );

  const buildFlow = useFlowStore((state) => state.buildFlow);
  const setIsBuilding = useFlowStore((state) => state.setIsBuilding);

  const isBuilding = useFlowStore((state) => state.isBuilding);
  const messages = useMessagesStore((state) => state.messages);
  const [sessions, setSessions] = useState<string[]>(
    Array.from(
      new Set(
        messages
          .filter((message) => message.flow_id === currentFlowId)
          .map((message) => message.session_id),
      ),
    ),
  );
  // sessionId and visibleSession are now provided by useChatSessions

  // const { isFetched: messagesFetched } = useGetMessagesQuery(
  //   {
  //     mode: "union",
  //     id: currentFlowId,
  //   },
  //   { enabled: open },
  // );
  const messagesFetched = true;

  const chatValue = useUtilityStore((state) => state.chatValueStore);
  const setChatValue = useUtilityStore((state) => state.setChatValueStore);
  const config = useGetConfig();

  function shouldStreamEvents() {
    return config.data?.event_delivery === EventDeliveryType.STREAMING;
  }

  const sendMessage = useCallback(
    async ({
      repeat = 1,
      files,
    }: {
      repeat: number;
      files?: string[];
    }): Promise<void> => {
      if (isBuilding) return;
      setChatValue("");
      for (let i = 0; i < repeat; i++) {
        const activeSession = currentSessionId || sessionId;
        await buildFlow({
          input_value: chatValue,
          startNodeId: chatInput?.id,
          files: files,
          silent: true,
          session: activeSession,
          stream: shouldStreamEvents(),
        }).catch((err) => {
          console.error("[debug][io-modal] buildFlow error", err);
        });
      }
    },
    [isBuilding, setIsBuilding, chatValue, chatInput?.id, sessionId, buildFlow, currentFlowId, currentSessionId, setChatValue, shouldStreamEvents, visibleSession],
  );

  useEffect(() => {
    setSelectedTab(inputs.length > 0 ? 1 : outputs.length > 0 ? 2 : 0);
  }, [allNodes.length]);

  useEffect(() => {
    const sessions = new Set<string>();
    messages
      .filter((message) => message.flow_id === currentFlowId)
      .forEach((row) => {
        sessions.add(row.session_id);
      });
    setSessions((prev) => {
      if (prev.length < Array.from(sessions).length) {
        // set the new session as visible
        setVisibleSession(
          Array.from(sessions)[Array.from(sessions).length - 1],
        );
      }
      return Array.from(sessions);
    });
  }, [messages]);

  useEffect(() => {
    if (!visibleSession) {
      setSessionId(
        `Session ${new Date().toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, second: "2-digit", timeZone: "UTC" })}`,
      );
    } else if (visibleSession) {
      setSessionId(visibleSession);
      if (selectedViewField?.type === "Session") {
        setSelectedViewField({
          id: visibleSession,
          type: "Session",
        });
      }
    }
  }, [visibleSession]);

  const setPlaygroundScrollBehaves = useUtilityStore(
    (state) => state.setPlaygroundScrollBehaves,
  );

  useEffect(() => {
    if (open) {
      setPlaygroundScrollBehaves("instant");
    }
  }, [open]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // 1024px is Tailwind's 'lg' breakpoint
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const showPublishOptions = playgroundPage && ENABLE_PUBLISH;

  useEffect(() => {
    if (playgroundPage && messages.length > 0) {
      window.sessionStorage.setItem(currentFlowId, JSON.stringify(messages));
    }
  }, [playgroundPage, messages]);

  const swatchIndex =
    (currentFlow?.gradient && !isNaN(parseInt(currentFlow?.gradient))
      ? parseInt(currentFlow?.gradient)
      : getNumberFromString(currentFlow?.gradient ?? currentFlow?.id ?? "")) %
    swatchColors.length;

  return (
    <BaseModal
      open={open}
      setOpen={setOpen}
      disable={disable}
      type={isPlayground ? "full-screen" : undefined}
      onSubmit={() => sendMessage({ repeat: 1 })}
      size="x-large"
      className="rounded-[12px]! p-0"
    >
      <BaseModal.Trigger>{children}</BaseModal.Trigger>
      {/* TODO ADAPT TO ALL TYPES OF INPUTS AND OUTPUTS */}
      <BaseModal.Content overflowHidden className="h-full">
        {open && (
          <div className="flex-max-width h-full">
            <div
              className={cn(
                "flex h-full shrink-0 flex-col justify-start overflow-hidden transition-all duration-300",
                sidebarOpen
                  ? "absolute z-50 lg:relative lg:w-1/5 lg:max-w-[280px]"
                  : "w-0",
              )}
            >
              <div
                className={cn(
                  "relative flex h-full flex-col overflow-y-auto border-r border-border bg-muted p-4 text-center custom-scroll dark:bg-canvas",
                  playgroundPage ? "pt-[15px]" : "pt-3.5",
                )}
              >
                <div className="flex items-center justify-between gap-2 pb-8 align-middle">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        `flex rounded p-1`,
                        swatchColors[swatchIndex],
                      )}
                    >
                      <IconComponent
                        name={currentFlow?.icon ?? "Workflow"}
                        className="h-3.5 w-3.5"
                      />
                    </div>
                    {sidebarOpen && (
                      <div className="truncate font-semibold">
                        {PlaygroundTitle}
                      </div>
                    )}
                  </div>
                  <ShadTooltip
                    styleClasses="z-50"
                    side="right"
                    content="Hide sidebar"
                  >
                    <Button
                      variant="ghost"
                      className="flex h-8 w-8 items-center justify-center p-0!"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                      <IconComponent
                        name={sidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"}
                        className="h-[18px] w-[18px] text-ring"
                      />
                    </Button>
                  </ShadTooltip>
                </div>
                {sidebarOpen && (
                  <SidebarOpenView
                    sessions={sessions}
                    setSelectedViewField={setSelectedViewField}
                    setVisibleSession={setVisibleSession}
                    handleDeleteSession={handleDeleteSession}
                    visibleSession={visibleSession}
                    selectedViewField={selectedViewField}
                    playgroundPage={!!playgroundPage}
                  />
                )}
              </div>
            </div>
            <div className="flex h-full min-w-96 grow bg-background">
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
                playgroundPage={playgroundPage}
                selectedViewField={selectedViewField}
                visibleSession={visibleSession}
                sessions={sessions}
                sidebarOpen={sidebarOpen}
                currentFlowId={currentFlowId}
                setSidebarOpen={setSidebarOpen}
                isPlayground={isPlayground}
                setVisibleSession={setVisibleSession}
                setSelectedViewField={setSelectedViewField}
                haveChat={haveChat}
                messagesFetched={messagesFetched}
                sessionId={sessionId}
                sendMessage={sendMessage}
                canvasOpen={canvasOpen}
                setOpen={setOpen}
                playgroundTitle={PlaygroundTitle}
                chatPage={chatPage}
                chatMode={chatMode}
                onChangeChatMode={(m) => setChatMode(m)}
                models={models}
                selectedModelId={selectedModelId}
                onSelectModel={(id) => setSelectedModelId(id)}
              />
            </div>
          </div>
        )}
      </BaseModal.Content>
    </BaseModal>
  );
}
