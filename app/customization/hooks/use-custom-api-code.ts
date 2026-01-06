import {
  getCurlRunCode,
  getCurlWebhookCode,
} from "@/modals/api-modal/utils/get-curl-code";
import getJsApiCode from "@/modals/api-modal/utils/get-js-api-code";

export function useCustomAPICode() {
  return {
    getCurlRunCode,
    getCurlWebhookCode,
    getJsApiCode,
  };
}
