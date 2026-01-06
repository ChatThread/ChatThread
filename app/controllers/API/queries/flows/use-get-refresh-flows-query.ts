import buildQueryStringUrl from "@/controllers/utils/create-query-param-string";
import useAlertStore from "@/stores/alert-store";
import useFlowsManagerStore from "@/stores/flows-manager-store";
import { useTypesStore } from "@/stores/types-store";
import { useQueryFunctionType } from "@/types/api";
import { FlowType, PaginatedFlowsType } from "@/types/flow";
import {
  extractFieldsFromComponenents,
  processFlows,
} from "@/utils/reactflow-utils";
import { UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

interface GetFlowsParams {
  id?: string;
  is_component?: boolean;
  is_flow?: boolean;
  search?: string;
  components_only?: boolean;
  get_all?: boolean;
  header_flows?: boolean;
  folder_id?: string;
  remove_example_flows?: boolean;
  page?: number;
  size?: number;
}

const addQueryParams = (url: string, params: GetFlowsParams): string => {
  return buildQueryStringUrl(url, params);
};

export const useGetRefreshFlowsQuery: useQueryFunctionType<
  GetFlowsParams,
  FlowType[] | PaginatedFlowsType
> = (params, options, skip) => {
  const { query } = UseRequestProcessor();
  const setFlows = useFlowsManagerStore((state) => state.setFlows);
  const setErrorData = useAlertStore((state) => state.setErrorData);

  if (skip) {
    return [] as any;
  }

  const getFlowsFn = async (
    params: GetFlowsParams,
  ): Promise<FlowType[] | PaginatedFlowsType> => {
    try {
      const url = addQueryParams(`${getURL("FLOWS")}/`, params);
      const { data: dbDataFlows } = await api.get<FlowType[]>(url);

      if (params.components_only) {
        return dbDataFlows;
      }

      // const { data: dbDataComponents } = await api.get<FlowType[]>(
      //   addQueryParams(`${getURL("FLOWS")}/`, {
      //     components_only: true,
      //     get_all: true,
      //   }),
      // );

      // if (dbDataComponents) {
      //   const { data } = processFlows(dbDataComponents);
      //   useTypesStore.setState((state) => ({
      //     data: { ...state.data, ["saved_components"]: data },
      //     ComponentFields: extractFieldsFromComponenents({
      //       ...state.data,
      //       ["saved_components"]: data,
      //     }),
      //   }));
      // }

      if (dbDataFlows) {
        const flows = Array.isArray(dbDataFlows)
          ? dbDataFlows
          : (dbDataFlows as { items: FlowType[] }).items;
        setFlows(flows);
        return flows;
      }

      return [];
    } catch (e) {
      setErrorData({
        title: "Could not load flows from database",
      });
      throw e;
    }
  };

  const queryResult = query(
    ["useGetRefreshFlowsQuery", params],
    () => getFlowsFn(params || {}),
    options as UseQueryOptions,
  );

  return queryResult;
};
