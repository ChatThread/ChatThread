import ForwardedIconComponent from "@/components/common/generic-icon-component";
import useDragStart from "@/components/core/card-component/hooks/use-on-drag-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import useDeleteFlow from "@/hooks/flows/use-delete-flow";
import DeleteConfirmationModal from "@/modals/delete-confirmation-modal";
import FlowSettingsModal from "@/modals/flow-settings-modal";
import useAlertStore from "@/stores/alert-store";
import useFlowsManagerStore from "@/stores/flows-manager-store";
import { FlowType } from "@/types/flow";
import { swatchColors } from "@/utils/style-utils";
import { cn, getNumberFromString } from "@/utils/utils";
import { useState } from "react";
import { useParams } from "react-router-dom";
import useDescriptionModal from "../../hooks/use-description-modal";
import { useGetTemplateStyle } from "../../utils/use-get-template-style";

const ExploreGrid = ({
  flowData,
  handlePurchase,
  purchasingId,
}: {
  flowData: FlowType;
  handlePurchase?: (id: string) => void | Promise<void>;
  purchasingId?: string | null;
}) => {
  const navigate = useCustomNavigate();

  const [openDelete, setOpenDelete] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const { deleteFlow } = useDeleteFlow();

  const setErrorData = useAlertStore((state) => state.setErrorData);
  const { folderId } = useParams();
  const isComponent = flowData.is_component ?? false;
  const setFlowToCanvas = useFlowsManagerStore(
    (state) => state.setFlowToCanvas,
  );

  const { getIcon } = useGetTemplateStyle(flowData);

  const editFlowLink = `/flow/${flowData.id}${folderId ? `/folder/${folderId}` : ""}`;

  const handleClick = async () => {
    // if (!isComponent) {
    //   await setFlowToCanvas(flowData);
    //   navigate(editFlowLink);
    // }
  };

  const handleDelete = () => {
    deleteFlow({ id: [flowData.id] })
      .then(() => {
        setSuccessData({
          title: "Selected items deleted successfully",
        });
      })
      .catch(() => {
        setErrorData({
          title: "Error deleting items",
          list: ["Please try again"],
        });
      });
  };

  const descriptionModal = useDescriptionModal(
    [flowData?.id],
    flowData.is_component ? "component" : "flow",
  );

  const { onDragStart } = useDragStart(flowData);

  const swatchIndex =
    (flowData.gradient && !isNaN(parseInt(flowData.gradient))
      ? parseInt(flowData.gradient)
      : getNumberFromString(flowData.gradient ?? flowData.id)) %
    swatchColors.length;

  const price = (flowData as any).price ?? null;
  const purchased = Boolean((flowData as any).purchased);
  const handleBuy = (e: any) => {
    e.stopPropagation();
    if (!flowData?.id) return;
    try {
      if (typeof handlePurchase === "function") {
        handlePurchase(flowData.id);
      } else {
        console.warn("handlePurchase not provided");
      }
    } catch (err) {
      console.error("Error calling handlePurchase:", err);
    }
  };

  return (
    <>
      <Card
        key={flowData.id}
        // draggable
        // onDragStart={onDragStart}
        // onClick={handleClick}
        className={`my-1 flex flex-col rounded-lg border border-border bg-background p-4 hover:border-placeholder-foreground hover:shadow-2xs`}
      >
        <div className="flex w-full items-center gap-4">
          <div className={cn(`flex rounded-lg p-3`, swatchColors[swatchIndex])}>
            <ForwardedIconComponent
              name={getIcon()}
              aria-hidden="true"
              className="h-5 w-5"
            />
          </div>
          <div className="flex w-full min-w-0 items-center justify-between">
            <div className="flex min-w-0 flex-col">
              <div className="text-md truncate font-semibold">{flowData.name}</div>
              {/* <div className="truncate text-xs text-muted-foreground">
                Edited {timeElapsed(flowData.updated_at)} ago
              </div> */}
            </div>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  data-testid="home-dropdown-menu"
                  size="iconMd"
                  className="group"
                >
                  <ForwardedIconComponent
                    name="Ellipsis"
                    aria-hidden="true"
                    className="h-5 w-5 text-muted-foreground group-hover:text-foreground"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[185px]"
                sideOffset={5}
                side="bottom"
              >
                <DropdownComponent
                  flowData={flowData}
                  setOpenDelete={setOpenDelete}
                  handleEdit={() => {
                    setOpenSettings(true);
                  }}
                />
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>

        <div className="line-clamp-2 h-full pt-5 text-sm text-primary">
          {flowData.description}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            {price ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-4 w-4 text-yellow-400 shrink-0"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16z" />
                  <path d="M12.75 7h-1.5v1.25A2.75 2.75 0 009.5 11H8.75v1.5h.75a2.75 2.75 0 001.75 2.75V16h1.5v-1.25A2.75 2.75 0 0014.5 12h.75V10.5h-.75a2.75 2.75 0 00-1.75-2.75V7z" />
                </svg>
                <span>{price}</span>
              </>
            ) : (
              <span>Free</span>
            )}
          </div>
          <div>
            {purchased ? (
              <span className="inline-flex items-center rounded-md bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                Purchased
              </span>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleBuy}
                loading={Boolean(purchasingId && purchasingId === flowData.id)}
              >
                Buy
              </Button>
            )}
          </div>
        </div>
      </Card>

      {openDelete && (
        <DeleteConfirmationModal
          open={openDelete}
          setOpen={setOpenDelete}
          onConfirm={handleDelete}
          description={descriptionModal}
          note={
            !flowData.is_component
              ? "Deleting the selected flow will remove all associated messages."
              : ""
          }
        >
          <></>
        </DeleteConfirmationModal>
      )}
      <FlowSettingsModal
        open={openSettings}
        setOpen={setOpenSettings}
        flowData={flowData}
        details
      />
    </>
  );
};

export default ExploreGrid;
