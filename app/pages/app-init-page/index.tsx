// import { useGetAutoLogin } from "@/controllers/API/queries/auth";
// import { CustomLoadingPage } from "@/customization/components/custom-loading-page";
// import { useCustomPrimaryLoading } from "@/customization/hooks/use-custom-primary-loading";
import { Outlet } from "react-router-dom";

export function AppInitPage() {
  // const isLoading = useFlowsManagerStore((state) => state.isLoading);

  // const { isFetched: isLoaded } = useCustomPrimaryLoading();

  // const { isFetched, refetch } = useGetAutoLogin({ enabled: isLoaded });

  return (
    //need parent component with width and height
    <>
      <Outlet />
    </>
  );
}
