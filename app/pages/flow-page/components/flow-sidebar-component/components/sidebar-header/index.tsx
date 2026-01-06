import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
} from "@/components/ui/disclosure";

import { ForwardedIconComponent } from "@/components/common/generic-icon-component";
import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { memo } from "react";
import { SidebarFilterComponent } from "../../../extra-sidebar-component/sidebar-filter-component";
import { SidebarHeaderComponentProps } from "../../types";
import { SearchInput } from "../search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";

export const SidebarHeaderComponent = memo(function SidebarHeaderComponent({
  showConfig,
  setShowConfig,
  searchInputRef,
  isInputFocused,
  search,
  handleInputFocus,
  handleInputBlur,
  handleInputChange,
  filterType,
  setFilterEdge,
  setFilterData,
  data,
}: SidebarHeaderComponentProps) {
  const navigate = useCustomNavigate();
  return (
    <SidebarHeader className="flex w-full flex-col gap-4 p-4 pb-1">
      <Disclosure open={showConfig} onOpenChange={setShowConfig}>
        <div className="flex w-full items-center gap-2">
          <Button
            className={cn("node-toolbar-buttons")}
            variant="ghost"
            onClick={() => {
              navigate(-1)
            }}
            size="node-toolbar"
            data-testid={"flow_sidebar_back"}
          >
            <ForwardedIconComponent name="ArrowLeft" className="h-4 w-4" />
          </Button>
          <SidebarTrigger className="text-muted-foreground">
            <ForwardedIconComponent name="PanelLeftClose" />
          </SidebarTrigger>
          <h3 className="flex-1 text-sm font-semibold">Components</h3>
        </div>
      </Disclosure>
      <SearchInput
        searchInputRef={searchInputRef}
        isInputFocused={isInputFocused}
        search={search}
        handleInputFocus={handleInputFocus}
        handleInputBlur={handleInputBlur}
        handleInputChange={handleInputChange}
      />
      {filterType && (
        <SidebarFilterComponent
          isInput={!!filterType.source}
          type={filterType.type}
          color={filterType.color}
          resetFilters={() => {
            setFilterEdge([]);
            setFilterData(data);
          }}
        />
      )}
    </SidebarHeader>
  );
});

SidebarHeaderComponent.displayName = "SidebarHeaderComponent";
