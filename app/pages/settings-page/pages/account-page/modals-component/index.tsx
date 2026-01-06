// Modals.tsx

import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface ModalsProps {
  openDeleteModal: boolean;
  password: string;
  setPassword?: (pwd: string) => void;
  setOpenDeleteModal: (value: boolean) => void;
  handleDeleteAccount: () => void;
}

const ModalsComponent = ({
  openDeleteModal = false,
  password,
  setPassword,
  setOpenDeleteModal = () => {},
  handleDeleteAccount = () => {},
}: ModalsProps) => (
  <>
    {openDeleteModal && (
      <DeleteConfirmationModal
        password={password}
        setPassword={setPassword}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        onConfirm={() => {
          handleDeleteAccount();
          setOpenDeleteModal(false);
        }}
        description="account"
        note={
          "Deleting account will remove all associated data."
        }
      >
        <></>
      </DeleteConfirmationModal>
    )}
  </>
);

export default ModalsComponent;
