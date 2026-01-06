import useFlowsManagerStore from "@/stores/flows-manager-store";
import { useTypesStore } from "@/stores/types-store";
import { APIObjectType, useQueryFunctionType } from "../../../../types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import { CATEGERY_DATA } from "@/constants/categery";

export const useGetTypes: useQueryFunctionType<
  undefined,
  any,
  { checkCache?: boolean }
> = (options) => {
  const { query } = UseRequestProcessor();
  const setLoading = useFlowsManagerStore((state) => state.setIsLoading);
  const setTypes = useTypesStore((state) => state.setTypes);

  const getTypesFn = async (checkCache = false) => {
    const isElectron = (
      typeof window !== 'undefined' && (
        window.process?.type === 'renderer' ||
        window.electron !== undefined ||
        navigator.userAgent.toLowerCase().includes('electron')
      )
    );
    if(isElectron){
      setTypes(CATEGERY_DATA);
      return CATEGERY_DATA;
    }else{
      try {
        if (checkCache) {
          const data = useTypesStore.getState().types;
          if (data && Object.keys(data).length > 0) {
            return data;
          }
        }

        const response = await api.get<APIObjectType>(
          `${getURL("ALL")}?force_refresh=true`,
        );
        const data = response?.data;
        setTypes(data);
        return data;
      } catch (error) {
        console.error("[Types] Error fetching types:", error);
        setLoading(false);
        throw error;
      }
    }
    
  };

  const queryResult = query(
    ["useGetTypes"],
    () => getTypesFn(options?.checkCache),
    {
      refetchOnWindowFocus: false,
      ...options,
    },
  );
  return queryResult;
};
