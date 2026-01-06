import FetchErrorComponent from "@/components/common/fetch-error-component";
import TimeoutErrorComponent from "@/components/common/timeout-error-component";
import {
  FETCH_ERROR_DESCRIPION,
  FETCH_ERROR_MESSAGE,
  TIMEOUT_ERROR_DESCRIPION,
  TIMEOUT_ERROR_MESSAGE,
} from "@/constants/constants";

export function GenericErrorComponent({ healthCheckTimeout, fetching, retry }) {
  switch (healthCheckTimeout) {
    case "serverDown":
      return (
        <FetchErrorComponent
          description={FETCH_ERROR_DESCRIPION}
          message={FETCH_ERROR_MESSAGE}
          openModal={true}
          setRetry={retry}
          isLoadingHealth={fetching}
        ></FetchErrorComponent>
      );
    case "timeout":
      return (
        <TimeoutErrorComponent
          description={TIMEOUT_ERROR_MESSAGE}
          message={TIMEOUT_ERROR_DESCRIPION}
          openModal={true}
          setRetry={retry}
          isLoadingHealth={fetching}
        ></TimeoutErrorComponent>
      );
    default:
      return <></>;
  }
}
