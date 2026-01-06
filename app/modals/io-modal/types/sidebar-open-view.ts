export type SidebarOpenViewProps = {
  sessions: string[];
  setSelectedViewField: (
    field: { type: string; id: string } | undefined,
  ) => void;
  setVisibleSession: (session: string | undefined) => void;
  handleDeleteSession: (session: string) => void;
  handleRenameSession?: (oldId: string, newId: string) => void;
  onCreateSession?: () => void;
  visibleSession: string | undefined;
  selectedViewField: { type: string; id: string } | undefined;
  playgroundPage: boolean;
  sessionWorkflows?: Record<string, string>;
  sessionNames?: Record<string, string>;
  workflowNameLookup?: Record<string, string>;
  onChatPageRename?: (oldId: string, newId: string) => void;
};
