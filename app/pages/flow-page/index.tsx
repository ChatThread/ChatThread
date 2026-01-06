import { SidebarProvider } from "@/components/ui/sidebar";
import { useGetFlow } from "@/controllers/API/queries/flows/use-get-flow";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import useSaveFlow from "@/hooks/flows/use-save-flow";
import { useIsMobile } from "@/hooks/use-mobile";
import { SaveChangesModal } from "@/modals/save-changes-modal";
import useAlertStore from "@/stores/alert-store";
import { customStringify } from "@/utils/reactflow-utils";
import { useEffect, useRef, useState } from "react";
import { useBlocker, useParams } from "react-router-dom";
import useFlowStore from "../../stores/flow-store";
import useFlowsManagerStore from "../../stores/flows-manager-store";
import Page from "./components/page-component";
import { FlowSidebarComponent } from "./components/flow-sidebar-component";
import { useTypesStore } from "@/stores/types-store";
import { useGetTypes } from "@/controllers/API/queries/flows/use-get-types";
import { LoadingPage } from "@/pages/loading-page";

export default function FlowPage({ view }: { view?: boolean }): JSX.Element {
  const setCurrentFlow = useFlowsManagerStore((state) => state.setCurrentFlow);
  const autoSaving = useFlowsManagerStore((state) => state.autoSaving);
  const flows = useFlowsManagerStore((state) => state.flows);
  const currentFlowId = useFlowsManagerStore((state) => state.currentFlowId);
  const flowToCanvas = useFlowsManagerStore((state) => state.flowToCanvas);
  const currentSavedFlow = useFlowsManagerStore((state) => state.currentFlow);

  const currentFlow = useFlowStore((state) => state.currentFlow);
  const setOnFlowPage = useFlowStore((state) => state.setOnFlowPage);
  const isBuilding = useFlowStore((state) => state.isBuilding);
  const stopBuilding = useFlowStore((state) => state.stopBuilding);

  const types = useTypesStore((state) => state.types);

  useGetTypes({
    enabled: Object.keys(types).length <= 0,
  });

  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlowLoading, setIsFlowLoading] = useState(false);
  const hasRequestedFlow = useRef(false);

  const changesNotSaved =
    customStringify(currentFlow) !== customStringify(currentSavedFlow) &&
    (currentFlow?.data?.nodes?.length ?? 0) > 0;

  const blocker = useBlocker(changesNotSaved || isBuilding);

  const { id } = useParams();
  const navigate = useCustomNavigate();
  const saveFlow = useSaveFlow();

  const updatedAt = currentSavedFlow?.updated_at;

  const { mutateAsync: getFlow } = useGetFlow();

  const handleSave = () => {
    let saving = true;
    let proceed = false;
    setTimeout(() => {
      saving = false;
      if (proceed) {
        blocker.proceed && blocker.proceed();
        setSuccessData({
          title: "Flow saved successfully!",
        });
      }
    }, 1200);
    saveFlow().then(() => {
      if (!autoSaving || saving === false) {
        blocker.proceed && blocker.proceed();
        setSuccessData({
          title: "Flow saved successfully!",
        });
      }
      proceed = true;
    });
  };

  const handleExit = () => {
    if (isBuilding) {
      // Do nothing, let the blocker handle it
    } else if (changesNotSaved) {
      if (blocker.proceed) blocker.proceed();
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (changesNotSaved || isBuilding) {
        event.preventDefault();
        event.returnValue = ""; // Required for Chrome
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [changesNotSaved, isBuilding]);

  // Set flow tab id
  useEffect(() => {
    const awaitgetTypes = async () => {
      if (flows && currentFlowId === "") {
        const isAnExistingFlow = flows.find((flow) => flow.id === id);

        if (!isAnExistingFlow) {
          navigate("/");
          return;
        }

        const isAnExistingFlowId = isAnExistingFlow.id;
        hasRequestedFlow.current = true;
        getFlowToAddToCanvas(isAnExistingFlowId);
      }
    };
    awaitgetTypes();
  }, [id, flows, currentFlowId, flowToCanvas]);

  useEffect(() => {
    setOnFlowPage(true);

    return () => {
      hasRequestedFlow.current = false;
      setOnFlowPage(false);
      setCurrentFlow(undefined);
    };
  }, [id]);

  useEffect(() => {
    if (!currentFlow && id && !hasRequestedFlow.current) {
      hasRequestedFlow.current = true;
      getFlowToAddToCanvas(id);
    }
  }, [currentFlow, id]);

  useEffect(() => {
    if (
      blocker.state === "blocked" &&
      autoSaving &&
      changesNotSaved &&
      !isBuilding
    ) {
      handleSave();
    }
  }, [blocker.state, isBuilding]);

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (isBuilding) {
        stopBuilding();
      } else if (!changesNotSaved) {
        blocker.proceed && blocker.proceed();
      }
    }
  }, [blocker.state, isBuilding]);

  const getFlowToAddToCanvas = async (id: string) => {
    setIsFlowLoading(true);
    try {
      const flow = await getFlow({ id });
      setCurrentFlow(flow);
    } finally {
      setIsFlowLoading(false);
    }
  };

  const isMobile = useIsMobile();

  return (
    <>
      <div className="flow-page-positioning">
        {isFlowLoading && <LoadingPage />}
        {!isFlowLoading && currentFlow && (
          <div className="flex h-full overflow-hidden">
            <SidebarProvider width="15rem" defaultOpen={!isMobile}>
              {!view && <FlowSidebarComponent isLoading={isLoading} />}
              <main className="flex w-full overflow-hidden">
                <div className="h-full w-full">
                  <Page setIsLoading={setIsLoading} />
                </div>
              </main>
            </SidebarProvider>
          </div>
        )}
      </div>
      {blocker.state === "blocked" && (
        <>
          {!isBuilding && currentSavedFlow && (
            <SaveChangesModal
              onSave={handleSave}
              onCancel={() => blocker.reset?.()}
              onProceed={handleExit}
              flowName={currentSavedFlow.name}
              lastSaved={
                updatedAt
                  ? new Date(updatedAt).toLocaleString("en-US", {
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })
                  : undefined
              }
              autoSave={autoSaving}
            />
          )}
        </>
      )}
    </>
  );
}
