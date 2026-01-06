import ShadTooltip from "@/components/common/shad-tooltip-component";
import { Button } from "@/components/ui/button";
import { useVoiceStore } from "@/stores/voice-store";
import IconComponent from "../../../components/common/generic-icon-component";
import { SidebarOpenViewProps } from "../types/sidebar-open-view";
import SessionSelector from "./io-field-view/components/SessionSelector";

export const SidebarOpenView = ({
  sessions,
  setSelectedViewField,
  setVisibleSession,
  handleDeleteSession,
  handleRenameSession,
  onCreateSession,
  visibleSession,
  selectedViewField,
  playgroundPage,
  sessionWorkflows,
  sessionNames,
  workflowNameLookup,
  onChatPageRename,
}: SidebarOpenViewProps) => {
  const setNewSessionCloseVoiceAssistant = useVoiceStore(
    (state) => state.setNewSessionCloseVoiceAssistant,
  );

  const orderedSessions = [...sessions].reverse();

  return (
    <>
      <div className="flex h-full flex-col pl-3">
        <div className="flex flex-col gap-3 pb-2 pr-4">
          <div className="flex w-full justify-center">
            <ShadTooltip styleClasses="z-50" content="New Chat">
              <Button
                data-testid="new-chat"
                className="group flex h-10 w-full items-center gap-3 rounded-full bg-[#242731] px-5 text-[13px] font-medium text-white transition hover:bg-[#2d313c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={(_) => {
                  setNewSessionCloseVoiceAssistant(true);
                  if (onCreateSession) {
                    onCreateSession();
                    return;
                  }
                  setVisibleSession(undefined);
                  setSelectedViewField(undefined);
                }}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3a404d]">
                  <IconComponent name="Plus" className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="text-[13px] font-medium">New Chat</span>
                {/* <span className="ml-auto text-xs text-[#9aa1ad]">⌘ J</span> */}
              </Button>
            </ShadTooltip>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scroll pr-1">
          {orderedSessions.map((session, index) => (
            <SessionSelector
              setSelectedView={setSelectedViewField}
              selectedView={selectedViewField}
              key={index}
              session={session}
              // pass optional display-name map
              // SessionSelector will prefer `sessionNames[session]` if present
              sessionNames={sessionNames}
              playgroundPage={playgroundPage}
              onChatPageRename={onChatPageRename}
              deleteSession={(session) => {
                handleDeleteSession(session);
                if (selectedViewField?.id === session) {
                  setSelectedViewField(undefined);
                }
              }}
              onRenameSession={(oldId, newId) =>
                handleRenameSession?.(oldId, newId)
              }
              updateVisibleSession={(session) => {
                setVisibleSession(session);
              }}
              toggleVisibility={() => {
                setVisibleSession(session);
              }}
              isVisible={visibleSession === session}
              inspectSession={(session) => {
                setSelectedViewField({
                  id: session,
                  type: "Session",
                });
              }}
              workflowLabel={""}
            />
          ))}
        </div>
      </div>
    </>
  );
};
