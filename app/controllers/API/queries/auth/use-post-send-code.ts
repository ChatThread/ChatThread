import { Users, useMutationFunctionType } from "@/types/api";
import { UserSendCodeType } from "@/types/components";
import { UseMutationResult } from "@tanstack/react-query";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export const useSendCode: useMutationFunctionType<undefined, UserSendCodeType> = (
  options?,
) => {
  const { mutate } = UseRequestProcessor();

  const sendCodeFunction = async (
    user: UserSendCodeType,
  ): Promise<any> => {
    const res = await api.post(`${getURL("SEND_CODE")}`, user);
    return res.data;
  };

  const mutation: UseMutationResult<UserSendCodeType, any, UserSendCodeType> = mutate(
    ["useSendCode"],
    sendCodeFunction,
    options,
  );

  return mutation;
};
