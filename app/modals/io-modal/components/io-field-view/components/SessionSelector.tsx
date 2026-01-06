import IconComponent from "@/components/common/generic-icon-component";
import ShadTooltip from "@/components/common/shad-tooltip-component";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select-custom";
import { useUpdateSessionName } from "@/controllers/API/queries/messages/use-rename-session";
import { useUpdateSessionDisplayName } from "@/controllers/API/queries/messages/use-update-session-display-name";
import useFlowsManagerStore from "@/stores/flows-manager-store";
import { useMessagesStore } from "@/stores/messages-store";
import { useUtilityStore } from "@/stores/utility-store";
import { useVoiceStore } from "@/stores/voice-store";
import { cn } from "@/utils/utils";
import { trim } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { v5 as uuidv5 } from "uuid";

export default function SessionSelector({
  deleteSession,
  session,
  sessionNames,
  toggleVisibility,
  isVisible,
  inspectSession,
  updateVisibleSession,
  selectedView,
  setSelectedView,
  playgroundPage,
  onRenameSession,
  workflowLabel,
  onChatPageRename,
}: {
  deleteSession: (session: string) => void;
  session: string;
  sessionNames?: Record<string, string>;
  toggleVisibility: () => void;
  isVisible: boolean;
  inspectSession: (session: string) => void;
  updateVisibleSession: (session: string) => void;
  selectedView?: { type: string; id: string };
  setSelectedView: (view: { type: string; id: string } | undefined) => void;
  playgroundPage: boolean;
  onRenameSession?: (oldId: string, newId: string) => void;
  workflowLabel?: string;
  onChatPageRename?: (oldId: string, newId: string) => void;
}) {
  const clientId = useUtilityStore((state) => state.clientId);
  let realFlowId = useFlowsManagerStore((state) => state.currentFlowId);
  const currentFlowId = realFlowId;
  const [isEditing, setIsEditing] = useState(false);
  const [editedSession, setEditedSession] = useState(
    sessionNames?.[session] ?? session,
  );
  const { mutate: updateSessionName } = useUpdateSessionName();
  const { mutate: updateDisplayName } = useUpdateSessionDisplayName();
  const renameSession = useMessagesStore((state) => state.renameSession);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedSession(sessionNames?.[session] ?? session);
  }, [session]);

  useEffect(() => {
    setEditedSession(sessionNames?.[session] ?? session);
  }, [sessionNames, session]);

  const handleEditClick = (e?: React.MouseEvent<HTMLDivElement>) => {
    e?.stopPropagation();
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedSession(e.target.value);
  };

  const applyLocalRename = (
    nextId: string,
    options?: { skipStoreRename?: boolean },
  ) => {
    if (!options?.skipStoreRename) {
      renameSession(session, nextId);
    }
    onRenameSession?.(session, nextId);
    if (isVisible) {
      updateVisibleSession(nextId);
    }
    if (selectedView?.type === "Session" && selectedView?.id === session) {
      setSelectedView({ type: "Session", id: nextId });
    }
  };

  const handleConfirm = () => {
    const trimmed = editedSession.trim();
    setIsEditing(false);
    if (!trimmed) {
      setEditedSession(sessionNames?.[session] ?? session);
      return;
    }

    // If parent requested chat-page-rename (which historically renames session id), delegate to that
    if (onChatPageRename) {
      onChatPageRename(session, trimmed);
      setEditedSession(trimmed);
      return;
    }

    // Otherwise treat this as editing the session's display name (no id change)
    updateDisplayName(
      { session_id: session, name: trimmed },
      {
        onSuccess: () => {
          setEditedSession(trimmed);
        },
      },
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedSession(sessionNames?.[session] ?? session);
  };

  const handleSelectChange = (value: string) => {
    switch (value) {
      case "rename":
        handleEditClick();
        break;
      case "messageLogs":
        inspectSession(session);
        break;
      case "delete":
        deleteSession(session);
        break;
    }
  };

  const handleOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (
      !e.relatedTarget ||
      e.relatedTarget.getAttribute("data-confirm") !== "true"
    ) {
      handleCancel();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleConfirm();
    }
  };

  const setNewSessionCloseVoiceAssistant = useVoiceStore(
    (state) => state.setNewSessionCloseVoiceAssistant,
  );

  return (
    <div
      data-testid="session-selector"
      onClick={(e) => {
        setNewSessionCloseVoiceAssistant(true);
        if (isEditing) e.stopPropagation();
        else toggleVisibility();
      }}
      className={cn(
        "file-component-accordion-div group cursor-pointer rounded-md text-left text-[13px] hover:bg-secondary-hover",
        isVisible ? "bg-secondary-hover font-semibold" : "font-normal",
      )}
    >
      <div className="flex w-full items-center justify-between overflow-hidden px-2 py-1 align-middle">
        <div className="flex w-full min-w-0 items-center">
          {isEditing ? (
            <div className="flex items-center">
              <Input
                ref={inputRef}
                value={editedSession}
                onKeyDown={onKeyDown}
                onChange={handleInputChange}
                onBlur={handleOnBlur}
                autoFocus
                className="h-6 grow px-1 py-0"
              />
              <button
                onClick={handleCancel}
                className="hover:text-status-red-hover ml-2 text-status-red"
              >
                <IconComponent name="X" className="h-4 w-4" />
              </button>
              <button
                onClick={handleConfirm}
                data-confirm="true"
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                className="ml-2 text-green-500 hover:text-green-600"
              >
                <IconComponent name="Check" className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <ShadTooltip styleClasses="z-50" content={sessionNames?.[session] ?? session}>
              <div
                className={cn(
                  "flex w-full items-center gap-2 whitespace-nowrap group-hover:truncate-secondary-hover"
                )}
              >
                <span className="truncate">
                  {session === currentFlowId
                    ? "Default Session"
                    : sessionNames?.[session] ?? session}
                </span>
                {/* {workflowLabel && (
                  <span className="shrink-0 truncate text-[11px] text-muted-foreground">
                    {workflowLabel}
                  </span>
                )} */}
              </div>
            </ShadTooltip>
          )}
        </div>
        <Select value={""} onValueChange={handleSelectChange}>
          <ShadTooltip styleClasses="z-50" side="right" content="Options">
            <SelectTrigger
              onClick={(e) => {
                e.stopPropagation();
              }}
              onFocusCapture={() => {
                inputRef.current?.focus();
              }}
              data-confirm="true"
              className={cn(
                "h-8 w-fit border-none bg-transparent p-2 focus:ring-0",
                isVisible ? "visible" : "invisible group-hover:visible",
              )}
            >
              <IconComponent name="MoreHorizontal" className="h-4 w-4" />
            </SelectTrigger>
          </ShadTooltip>
          <SelectContent side="right" align="start" className="p-0">
            <SelectItem
              value="rename"
              className="cursor-pointer px-3 py-2 focus:bg-muted"
            >
              <div className="flex items-center">
                <IconComponent name="SquarePen" className="mr-2 h-4 w-4" />
                Rename
              </div>
            </SelectItem>
            {/* <SelectItem
              value="messageLogs"
              className="cursor-pointer px-3 py-2 focus:bg-muted"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <IconComponent name="Scroll" className="mr-2 h-4 w-4" />
                  Message logs
                </div>
              </div>
            </SelectItem> */}
            <SelectItem
              value="delete"
              className="cursor-pointer px-3 py-2 focus:bg-muted"
            >
              <div className="flex items-center text-status-red hover:text-status-red">
                <IconComponent name="Trash2" className="mr-2 h-4 w-4" />
                Delete
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
