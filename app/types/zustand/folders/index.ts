import { FolderType } from "../../../pages/main-page/entities";

export type FoldersStoreType = {
  myCollectionId: string | null;
  setMyCollectionId: (value: string) => void;
  folderToEdit: FolderType | null;
  setFolderToEdit: (folder: FolderType | null) => void;
  folderDragging: boolean;
  setFolderDragging: (set: boolean) => void;
  folderIdDragging: string;
  setFolderIdDragging: (id: string) => void;
  starterProjectId: string;
  setStarterProjectId: (id: string) => void;
  folders: FolderType[];
  setFolders: (folders: FolderType[]) => void;
  resetStore: () => void;
};
