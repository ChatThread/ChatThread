import ForwardedIconComponent from "@/components/common/generic-icon-component";
import ShadTooltip from "@/components/common/shad-tooltip-component";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useState } from "react";

interface HeaderComponentProps {
  handleNewFlow: () => void;
  folderName?: string;
  setSearch: (search: string) => void;
  isEmptyFolder: boolean;
  showSearch?: boolean;
  newButtonLabel?: string;
  showNewButton?: boolean;
}

const HeaderComponent = ({
  folderName = "",
  handleNewFlow,
  setSearch,
  isEmptyFolder,
  showSearch = true,
  newButtonLabel = "New",
  showNewButton = true,
}: HeaderComponentProps) => {
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce the setSearch function from the parent
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
    }, 1000),
    [setSearch],
  );

  useEffect(() => {
    debouncedSetSearch(debouncedSearch);

    return () => {
      debouncedSetSearch.cancel(); // Cleanup on unmount
    };
  }, [debouncedSearch, debouncedSetSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDebouncedSearch(e.target.value);
  };

  return (
    <>
      <div
        className="flex items-center pb-8 text-xl font-semibold"
        data-testid="mainpage_title"
      >
        <div className="h-7 w-10 transition-all md:group-data-[open=true]/sidebar-wrapper:w-0 lg:hidden">
          <div className="relative left-0 opacity-100 transition-all md:group-data-[open=true]/sidebar-wrapper:opacity-0">
            <SidebarTrigger>
              <ForwardedIconComponent
                name="PanelLeftOpen"
                aria-hidden="true"
                className=""
              />
            </SidebarTrigger>
          </div>
        </div>
        {folderName}
      </div>
      {!isEmptyFolder && (
        <>
          <div className="flex flex-row-reverse pb-8">
            <div className="w-full border-b dark:border-border" />
          </div>
          {/* Search and filters */}
          <div className="flex justify-between">
            <div className="flex w-full xl:w-5/12">
              {showSearch && (
                <Input
                  icon="Search"
                  data-testid="search-store-input"
                  type="text"
                  placeholder={`Search workflows...`}
                  className="mr-2"
                  value={debouncedSearch}
                  onChange={handleSearch}
                />
              )}
            </div>
            {showNewButton && (
              <ShadTooltip content={newButtonLabel} side="bottom">
                <Button
                  variant="default"
                  className="px-3! md:px-4! md:pl-3.5!"
                  onClick={() => handleNewFlow()}
                  id="new-project-btn"
                  data-testid="new-project-btn"
                >
                  <ForwardedIconComponent
                    name="Plus"
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                  <span className="hidden whitespace-nowrap font-semibold md:inline">
                    {newButtonLabel}
                  </span>
                </Button>
              </ShadTooltip>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default HeaderComponent;
