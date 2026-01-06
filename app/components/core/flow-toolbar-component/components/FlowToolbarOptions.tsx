import useFlowStore from "@/stores/flow-store";
import { useState } from "react";
import PlaygroundButton from "./PlaygroundButton";
import { Button } from "@/components/ui/button";
import useSaveFlow from "@/hooks/flows/use-save-flow";
import { toast } from "sonner"
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";

export default function FlowToolbarOptions() {
  const [open, setOpen] = useState<boolean>(false);
  const hasIO = useFlowStore((state) => state.hasIO);
  const saveFlow = useSaveFlow();
  const navigate = useCustomNavigate();
  
  function save(){
    saveFlow().then(() => {
      toast.success("Workflow save success");
      navigate(-1);
    });
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex h-full w-full gap-1.5 rounded-sm transition-all">
        <PlaygroundButton
          hasIO={hasIO}
          open={open}
          setOpen={setOpen}
          canvasOpen
        />
      </div>
      <Button
        variant="default"
        className="h-8! w-[95px]! font-medium"
        data-testid="publish-button"
        onClick={() => {
          save();
        }}
      >
        Save
      </Button>
    </div>
  );
}
