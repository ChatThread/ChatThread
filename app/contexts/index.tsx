import { GradientWrapper } from "@/components/common/gradient-wrapper";
import { CustomWrapper } from "@/customization/CustomWrapper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { TooltipProvider } from "../components/ui/tooltip";
import { ApiInterceptor } from "../controllers/API/api";
import { AuthProvider } from "./auth-context";

export default function ContextWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  //element to wrap all context
  return (
    <>
      <CustomWrapper>
        <GradientWrapper>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider skipDelayDuration={0}>
                <ApiInterceptor />
                {children}
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </GradientWrapper>
      </CustomWrapper>
    </>
  );
}
