import { Users, useMutationFunctionType } from "@/types/api";
import { UserRegisterType } from "@/types/components";
import { UseMutationResult } from "@tanstack/react-query";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

export const useRegister: useMutationFunctionType<undefined, UserRegisterType> = (
  options?,
) => {
  const { mutate } = UseRequestProcessor();

  const registerFunction = async (
    user: UserRegisterType,
  ): Promise<any> => {
    const res = await api.post(`${getURL("REGISTER")}`, user);
    return res.data;
  };

  const mutation: UseMutationResult<UserRegisterType, any, UserRegisterType> = mutate(
    ["useRegister"],
    registerFunction,
    options,
  );

  return mutation;
};
