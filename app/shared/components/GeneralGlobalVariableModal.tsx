import ForwardedIconComponent from "@/components/common/generic-icon-component";
import GlobalVariableModal from "@/components/core/global-variable-modal/GlobalVariableModal";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/utils/utils";

interface GeneralGlobalVariableModalProps {}

const GeneralGlobalVariableModal = ({}: GeneralGlobalVariableModalProps) => {
  return (
    <>
      <GlobalVariableModal disabled={false}>
        <CommandItem value="doNotFilter-addNewVariable">
          <ForwardedIconComponent
            name="Plus"
            className={cn("mr-2 h-4 w-4 text-primary")}
            aria-hidden="true"
          />
          <span>Add New Variable</span>
        </CommandItem>
      </GlobalVariableModal>
    </>
  );
};

export default GeneralGlobalVariableModal;
