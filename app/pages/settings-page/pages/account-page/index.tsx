import {
  DeleteUserParams,
  useDeleteUsers,
} from "@/controllers/API/queries/auth";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import { clearConversationsAction } from "@/stores/conversation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button"; // Import shadcn Button
import ModalsComponent from "./modals-component";
import { Cookies } from "react-cookie";
import {
  CHATMAGIC_ACCESS_TOKEN,
  CHATMAGIC_AUTO_LOGIN_OPTION,
  CHATMAGIC_REFRESH_TOKEN,
} from "@/constants/constants";
import useAuthStore from "@/stores/auth-store";

export default function AccountPage() {
  const [openModal, setOpenModal] = useState(false);
  const navigate = useCustomNavigate();
  const [password, setPassword] = useState("");
  const { mutate: deleteUser } = useDeleteUsers();
  // Mock functions for the actions
  const handleLogoutAllDevices = async () => {
    const cookies = new Cookies();
    cookies.remove(CHATMAGIC_ACCESS_TOKEN, { path: "/" });
    cookies.remove(CHATMAGIC_REFRESH_TOKEN, { path: "/" });
    cookies.remove(CHATMAGIC_AUTO_LOGIN_OPTION, { path: "/" });
    useAuthStore.getState().logout();
    localStorage.clear();
    await clearConversationsAction();
    navigate("/");
  };

  const openDialog = () => {
    setOpenModal(true);
  };
  const handleDeleteAccount = async () => {
    if (password.length < 1) {
      toast.error("Please input the password");
    } else {
      const newUser: DeleteUserParams = {
        password: password.trim(),
      };
      const toastId = toast.loading("Loading...");
      deleteUser(newUser, {
        onSuccess: async (data) => {
          toast.dismiss(toastId);
          toast.success("Account delete successful");
          const cookies = new Cookies();
          cookies.remove(CHATMAGIC_ACCESS_TOKEN, { path: "/" });
          cookies.remove(CHATMAGIC_REFRESH_TOKEN, { path: "/" });
          cookies.remove(CHATMAGIC_AUTO_LOGIN_OPTION, { path: "/" });
          useAuthStore.getState().logout();
          localStorage.clear();
          await clearConversationsAction();
          navigate("/");
        },
        onError: (error) => {
          const err_msg = error.message;
          if (error.response?.data && error.response?.data.detail) {
            toast.error(error.response?.data.detail, { id: toastId });
          } else {
            toast.error(err_msg, { id: toastId });
          }
        },
      });
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-between gap-6">
      <div className="flex w-full items-start justify-between gap-6">
        <div className="flex w-full flex-col">
          <h2 className="flex items-center text-lg font-semibold tracking-tight">
            Account Management
          </h2>
        </div>
      </div>

      <div className="flex h-full w-full flex-col justify-between gap-8">
        <div className="space-y-6">
          {/* Logout all devices */}
          <div className="flex items-center justify-between rounded-lg p-4">
            <div>
              <h3 className="font-medium">Logout</h3>
              <p className="text-muted-foreground text-sm">
                This will sign you out where you're currently logged in.
              </p>
            </div>
            <Button variant="outline" onClick={handleLogoutAllDevices}>
              Logout
            </Button>
          </div>

          {/* Delete all conversations */}
          {/* <div className="flex items-center justify-between rounded-lg p-4">
                        <div>
                            <h3 className="font-medium">Delete all conversations</h3>
                            <p className="text-sm text-muted-foreground">
                                Permanently remove all your conversation history.
                            </p>
                        </div>
                        <Button 
                            variant="outline"
                            onClick={handleDeleteAllConversations}
                        >
                            Delete All
                        </Button>
                    </div> */}

          {/* Delete account */}
          <div className="flex items-center justify-between rounded-lg p-4">
            <div>
              <h3 className="font-medium">Delete account</h3>
              <p className="text-muted-foreground text-sm">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button variant="destructive" onClick={openDialog}>
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <ModalsComponent
        password={password}
        setPassword={setPassword}
        openDeleteModal={openModal}
        setOpenDeleteModal={setOpenModal}
        handleDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
