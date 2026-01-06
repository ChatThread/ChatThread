import IconComponent from "@/components/common/generic-icon-component";
import ShadTooltip from "@/components/common/shad-tooltip-component";
import { Button } from "@/components/ui/button";

export const AddFolderButton = ({
  onClick,
  disabled,
  loading,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
}) => (
  <Button
    variant="ghost"
    size="icon"
    className="w-full aspect-square border-0 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white data-[active=true]:bg-zinc-200 data-[active=true]:text-zinc-900 dark:data-[active=true]:bg-zinc-800 dark:data-[active=true]:text-white"
    onClick={onClick}
    data-testid="add-folder-button"
    data-active={active}
    disabled={disabled}
    loading={loading}
  >
    <IconComponent name="Plus" className="h-4 w-4" />
  </Button>
);
