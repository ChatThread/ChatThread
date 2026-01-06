import { useMutationFunctionType } from "@/types/api";
import { UseMutationResult } from "@tanstack/react-query";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export interface DeleteUserParams {
  password: string;
}

export const useDeleteUsers: useMutationFunctionType<
  undefined,
  DeleteUserParams
> = (options?) => {
  const { mutate } = UseRequestProcessor();

  const deleteMessage = async (data: DeleteUserParams): Promise<any> => {
    const res = await api.post(`${getURL("DELETE_USER")}`, data);
    return res.data;
  };

  const mutation: UseMutationResult<DeleteUserParams, any, DeleteUserParams> =
    mutate(["useDeleteUsers"], deleteMessage, options);

  return mutation;
};
