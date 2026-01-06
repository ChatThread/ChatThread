import ForwardedIconComponent from "@/components/common/generic-icon-component";
import { Button } from "@/components/ui/button";


type EmptyFolderProps = {
  handleNewFlow: () => void;
};

export const EmptyFolder = ({ handleNewFlow }: EmptyFolderProps) => {
  return (
    <div className="m-0 flex w-full justify-center">
      <div className="absolute top-1/2 flex w-full -translate-y-1/2 flex-col items-center justify-center gap-2">
        <h3
          className="pt-5 font-chivo text-2xl font-semibold"
          data-testid="mainpage_title"
        >
          {"Create New Workflow"}
        </h3>
        <p className="pb-5 text-sm text-secondary-foreground">
          Create a workflow that fits your task by dragging and dropping.
        </p>
        <Button
          variant="default"
          onClick={() => {
            handleNewFlow()
          }}
          id="new-project-btn"
        >
          <ForwardedIconComponent
            name="plus"
            aria-hidden="true"
            className="h-4 w-4"
          />
          <span className="whitespace-nowrap font-semibold">Create Workflow</span>
        </Button>
      </div>
    </div>
  );
};

export default EmptyFolder;
