import useFlowStore from "@/stores/flow-store";
import { useMutationFunctionType } from "@/types/api";
import { Message } from "@/types/messages";
import { UseMutationResult } from "@tanstack/react-query";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import { updateNewChatSessionName } from "@/db/new-chat-actions";

interface UpdateDisplayNameParams {
  session_id: string;
  name: string;
}

export const useUpdateSessionDisplayName: useMutationFunctionType<
  undefined,
  UpdateDisplayNameParams
> = (options?) => {
  const { mutate, queryClient } = UseRequestProcessor();

  const updateDisplayNameApi = async (data: UpdateDisplayNameParams) => {
    const isPlayground = useFlowStore.getState().playgroundPage;
    const flowId = useFlowStore.getState().currentFlow?.id;
    // For playground/local mode, persist the display name to local indexedDB
    if (isPlayground && flowId) {
      await updateNewChatSessionName(data.session_id, data.name, 'playground');
      return { data: { session_id: data.session_id, name: data.name } };
    } else {
      // Fallback: hit API; try to send new_name param (server may ignore)
      const result = await api.patch(
        `${getURL("MESSAGES")}/session/${data.session_id}`,
        null,
        {
          params: { new_name: data.name },
        },
      );
      return result.data;
    }
  };

  const mutation: UseMutationResult<Message[], any, UpdateDisplayNameParams> =
    mutate(["useUpdateSessionDisplayName"], updateDisplayNameApi, {
      ...options,
      onSettled: (data, variables, context) => {
        queryClient.refetchQueries({
          queryKey: ["useGetMessagesQuery"],
        });
        try {
          // emit a small event so local components/hooks can update their sessionNames state
          if (variables && (variables as UpdateDisplayNameParams).session_id) {
            const payload = {
              sessionId: (variables as UpdateDisplayNameParams).session_id,
              name: (variables as UpdateDisplayNameParams).name,
            }
            window.dispatchEvent(new CustomEvent('sessionNameUpdated', { detail: payload }))
          }
        } catch (err) {
          // ignore
        }
      },
    });

  return mutation;
};

export default useUpdateSessionDisplayName;
