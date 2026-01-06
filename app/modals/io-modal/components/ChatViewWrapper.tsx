import ShadTooltip from "@/components/common/shad-tooltip-component";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/utils";
import IconComponent from "../../../components/common/generic-icon-component";
import { ChatViewWrapperProps } from "../types/chat-view-wrapper";
import ChatView from "./chat-view/components/ChatView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ChatViewWrapper = ({
  selectedViewField,
  visibleSession,
  sessions,
  sidebarOpen,
  currentFlowId,
  setSidebarOpen,
  isPlayground,
  setVisibleSession,
  setSelectedViewField,
  messagesFetched,
  sessionId,
  sendMessage,
  canvasOpen,
  setOpen,
  playgroundTitle,
  playgroundPage,
  chatPage,
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
  chatMode,
  onChangeChatMode,
  models,
  selectedModelId,
  onSelectModel,
  onCreateSession,
  isStreaming,
  stopStreaming,
}: ChatViewWrapperProps) => {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col px-4 pt-2",
        selectedViewField ? "hidden" : "",
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-10 shrink-0 items-center text-[16px] font-semibold",
          playgroundPage ? "justify-between" : "lg:justify-start",
        )}
      >
        <div className={cn(sidebarOpen ? "lg:hidden" : "left-4")}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8"
            >
              <IconComponent
                name="PanelLeftOpen"
                className="h-[18px] w-[18px] text-ring"
              />
            </Button>
          </div>
        </div>
        {!chatPage && visibleSession && sessions.length > 0 && (
          <div
            className={cn(
              "truncate text-center font-semibold",
              playgroundPage ? "" : "mr-12 grow lg:mr-0",
              // sidebarOpen ? "blur-xs lg:blur-0" : "",
            )}
          >
            {visibleSession === currentFlowId
              ? "Default Session"
              : `${visibleSession}`}
          </div>
        )}
        {chatPage && (
          <div
            className={cn(
              "grow",
              "flex items-center justify-center gap-2",
            )}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-gray-200 bg-gray-100 shadow-sm dark:border-white/10 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => onChangeChatMode?.("direct")}
                  className={cn(
                    "px-3 py-1 rounded-l-full text-sm transition-colors",
                    chatMode === "direct"
                      ? "bg-white shadow-sm dark:bg-white/10 dark:shadow-none"
                      : "bg-transparent hover:bg-gray-200 dark:hover:bg-white/5",
                  )}
                >
                  Direct
                </button>
                <button
                  type="button"
                  onClick={() => onChangeChatMode?.("workflow")}
                  className={cn(
                    "px-3 py-1 rounded-r-full text-sm transition-colors",
                    chatMode === "workflow"
                      ? "bg-white shadow-sm dark:bg-white/10 dark:shadow-none"
                      : "bg-transparent hover:bg-gray-200 dark:hover:bg-white/5",
                  )}
                >
                  Workflow
                </button>
              </div>
            </div>

            {chatMode === "workflow" && (
              (workflows && workflows.length > 0) ? (
                <Select onValueChange={onSelectWorkflow} value={selectedWorkflowId}>
                  <SelectTrigger className=" rounded-full border-gray-200 bg-gray-100 text-left text-gray-900 ring-0 ring-offset-0 transition-none hover:bg-gray-200 focus:ring-0 focus:ring-offset-0 data-[state=open]:ring-0 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:w-64">
                    <SelectValue placeholder="Select a Workflow" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 bg-white text-gray-900 dark:border-white/10 dark:bg-[#0f1115] dark:text-white">
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-muted-foreground dark:border-white/20 dark:bg-white/10 sm:w-64">
                  No workflows available
                </div>
              )
            )}

            {chatMode === "direct" && (
              (models && models.length > 0) ? (
                <Select onValueChange={onSelectModel} value={selectedModelId}>
                  <SelectTrigger className=" rounded-full border-gray-200 bg-gray-100 text-left text-gray-900 ring-0 ring-offset-0 transition-none hover:bg-gray-200 focus:ring-0 focus:ring-offset-0 data-[state=open]:ring-0 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:w-64">
                    <SelectValue placeholder="Select a Model" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 bg-white text-gray-900 dark:border-white/10 dark:bg-[#0f1115] dark:text-white">
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-muted-foreground dark:border-white/20 dark:bg-white/10 sm:w-64">
                  No workflows available
                </div>
              )
            )}

          </div>
        )}
        <div
          className={cn(
            sidebarOpen ? "pointer-events-none opacity-0" : "",
            "flex items-center justify-center rounded-sm ring-offset-background transition-opacity focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
            playgroundPage ? "right-2 top-4" : "absolute right-12 top-2 h-8",
          )}
        >
          <ShadTooltip side="bottom" styleClasses="z-50" content="New Chat">
            <Button
              className="mr-2 h-[32px] w-[32px] hover:bg-secondary-hover"
              variant="ghost"
              size="icon"
              onClick={() => {
                if (onCreateSession) {
                  onCreateSession();
                  return;
                }
                setVisibleSession(undefined);
                setSelectedViewField(undefined);
              }}
            >
              <IconComponent
                name="Plus"
                className="h-[18px]! w-[18px]! text-ring"
              />
            </Button>
          </ShadTooltip>
          {!playgroundPage && <Separator orientation="vertical" />}
        </div>
      </div>

      {messagesFetched && (
        <div className="flex-1 min-h-0">
          <ChatView
            focusChat={sessionId}
            sendMessage={sendMessage}
            visibleSession={visibleSession}
            closeChat={
              !canvasOpen
                ? undefined
                : () => {
                    setOpen(false);
                  }
            }
            playgroundPage={playgroundPage}
            sidebarOpen={sidebarOpen}
            chatPage={chatPage}
            isStreaming={isStreaming}
            stopStreaming={stopStreaming}
          />
        </div>
      )}
    </div>
  );
};
