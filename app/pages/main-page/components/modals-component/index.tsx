// Modals.tsx
import DeleteConfirmationModal from "@/modals/delete-confirmation-modal";

interface ModalsProps {
  openModal: boolean;
  setOpenModal: (value: boolean) => void;
  openDeleteFolderModal: boolean;
  setOpenDeleteFolderModal: (value: boolean) => void;
  handleDeleteSession: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  handleEditName?: (item: string) => void;
}

const ModalsComponent = ({
  openModal = false,
  setOpenModal = () => { },
  openDeleteFolderModal = false,
  setOpenDeleteFolderModal = () => { },
  handleDeleteSession = () => { },
  inputRef = {} as React.RefObject<HTMLInputElement>,
  handleEditName = () => { },
}: ModalsProps) => (
  <>
    {openDeleteFolderModal && (
      <DeleteConfirmationModal
        open={openDeleteFolderModal}
        setOpen={setOpenDeleteFolderModal}
        onConfirm={() => {
          handleDeleteSession();
          setOpenDeleteFolderModal(false);
        }}
        description="session"
        note={
          "Deleting the selected session will remove all associated messages."
        }
      >
        <></>
      </DeleteConfirmationModal>
    )}
  </>
);

export default ModalsComponent;
