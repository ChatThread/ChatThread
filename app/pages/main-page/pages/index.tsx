import SidebarFoldersButtonsComponent from "@/components/core/folderSidebarComponent/components/sidebar-folder-buttons";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useDeleteFolders } from "@/controllers/API/queries/folders";
import CustomLoader from "@/customization/components/CustomLoader";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import useAlertStore from "@/stores/alert-store";
import useFlowsManagerStore from "@/stores/flows-manager-store";
import { useFolderStore } from "@/stores/folders-store";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import ModalsComponent from "../components/modals-component";
import EmptyPage from "./empty-page";

export default function CollectionPage(): JSX.Element {
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteFolderModal, setOpenDeleteFolderModal] = useState(false);
  const setFolderToEdit = useFolderStore((state) => state.setFolderToEdit);
  const navigate = useCustomNavigate();
  const flows = useFlowsManagerStore((state) => state.flows);
  const examples = useFlowsManagerStore((state) => state.examples);
  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const setErrorData = useAlertStore((state) => state.setErrorData);
  const folderToEdit = useFolderStore((state) => state.folderToEdit);
  const folders = useFolderStore((state) => state.folders);
  // const queryClient = useQueryClient();
  // useEffect(() => {
  //   return () => queryClient.removeQueries({ queryKey: ["useGetFolder"] });
  // }, []);

  // const { mutate } = useDeleteFolders();
  // const handleDeleteFolder = () => {
  //   const storedToken = localStorage.getItem('authToken');
  //   if (!storedToken) {
  //     setErrorData({
  //       title: "You are not logged in.",
  //     });
  //     return;
  //   }
  //   mutate(
  //     {
  //       folder_id: folderToEdit?.id!,
  //     },
  //     {
  //       onSuccess: () => {
  //         setSuccessData({
  //           title: "Folder deleted successfully.",
  //         });
  //         navigate("/all");
  //       },
  //       onError: (err) => {
  //         console.error(err);
  //         setErrorData({
  //           title: "Error deleting folder.",
  //         });
  //       },
  //     },
  //   );
  // };
  return (
    <SidebarProvider width="4rem">
      {
          <SidebarFoldersButtonsComponent
            handleChangeFolder={(id: string) => {
              navigate(`${id}/`);
            }}
          />
      }
      <main className="flex h-full w-full overflow-hidden">
          <div
            className={`relative mx-auto flex h-full w-full flex-col overflow-hidden`}
          >
            {flows?.length !== examples?.length || folders?.length > 1 ? (
              <Outlet />
            ) : (
              <EmptyPage setOpenModal={setOpenModal} />
            )}
          </div>
      </main>
      {/* <ModalsComponent
        openModal={openModal}
        setOpenModal={setOpenModal}
        openDeleteFolderModal={openDeleteFolderModal}
        setOpenDeleteFolderModal={setOpenDeleteFolderModal}
        handleDeleteFolder={handleDeleteFolder}
      /> */}
    </SidebarProvider>
  );
}
