import PaginatorComponent from "@/components/common/paginator-component";
import { useGetFolderQuery } from "@/controllers/API/queries/folders/use-get-folder";
import { CustomBanner } from "@/customization/components/CustomBanner";
import { ENABLE_DATASTAX_CHATMAGIC } from "@/customization/feature-flags";
import { useCallback, useEffect, useState } from "react";
import GridComponent from "../../components/grid";
import GridSkeleton from "../../components/grid-skeleton";
import HeaderComponent from "../../components/header";
import EmptyFolder from "../empty-folder";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import useAddFlow from "@/hooks/flows/use-add-flow";

const HomePage = ({ type }) => {
  const folderId = localStorage.getItem("folderId") ?? "";

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [search, setSearch] = useState("");

  const [pageName, setPageName] = useState("");

  const addFlow = useAddFlow();
  const navigate = useCustomNavigate();

  const { data: folderData, isLoading } = useGetFolderQuery({
    id: folderId,
    page: pageIndex,
    size: pageSize,
    is_component: false,
    is_flow: true,
    search,
  });

  const data = {
    flows: folderData?.flows?.items ?? [],
    name: folderData?.folder?.name ?? "",
    description: folderData?.folder?.description ?? "",
    parent_id: folderData?.folder?.parent_id ?? "",
    components: folderData?.folder?.components ?? [],
    pagination: {
      page: folderData?.flows?.page ?? 1,
      size: folderData?.flows?.size ?? 12,
      total: folderData?.flows?.total ?? 0,
      pages: folderData?.flows?.pages ?? 0,
    },
  };

  const handlePageChange = useCallback((newPageIndex, newPageSize) => {
    setPageIndex(newPageIndex);
    setPageSize(newPageSize);
  }, []);

  const onSearch = useCallback((newSearch) => {
    setSearch(newSearch);
    setPageIndex(1);
  }, []);

  const storedToken = localStorage.getItem('authToken');
  const isAuthenticated = !!storedToken;
  useEffect(() => {
    if(isAuthenticated){
      setPageName("Workflows");
    }
  }, [isAuthenticated]);

  function handleNewFlow() {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      navigate("/login");
      return;
    }else{
      addFlow().then((id) => {
        navigate(
          `/flow/${id}`,
        );
      });
    }
  }

  return (
      <div
        className="flex h-full w-full flex-col overflow-y-auto"
        data-testid="cards-wrapper"
      >
        <div className="flex h-full w-full flex-col xl:container">
          {ENABLE_DATASTAX_CHATMAGIC && <CustomBanner />}

          {/* mt-10 to mt-8 for Datastax LF */}
          <div className="flex flex-1 flex-col justify-start px-5 pt-10">
            <div className="flex h-full flex-col justify-start">
              <HeaderComponent
                folderName={pageName}
                handleNewFlow={handleNewFlow}
                setSearch={onSearch}
                isEmptyFolder={!isAuthenticated}
              />
              {!isAuthenticated ? (
                <EmptyFolder handleNewFlow={handleNewFlow} />
              ) : (
                <div className="mt-6">
                  {isLoading ? (
                    (
                      <div className="mt-1 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <GridSkeleton />
                        <GridSkeleton />
                      </div>
                    )
                  ) : data && data.pagination.total > 0 ? (
                    (
                      <div className="mt-1 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {data.flows.map((flow) => (
                          <GridComponent key={flow.id} flowData={flow} />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="pt-2 text-center text-sm text-secondary-foreground">
                      No workflows{" "}
                      <a
                        onClick={() => handleNewFlow()}
                        className="cursor-pointer underline"
                      >
                        Create a new workflow
                      </a>
                    </div>
                  ) }
                </div>
              )}
            </div>
          </div>

          {!isLoading && isAuthenticated && data.pagination.total >= 10 && (
            <div className="flex justify-end px-3 py-4">
              <PaginatorComponent
                pageIndex={data.pagination.page}
                pageSize={data.pagination.size}
                rowsCount={[12, 24, 48, 96]}
                totalRowsCount={data.pagination.total}
                paginate={handlePageChange}
                pages={data.pagination.pages}
                isComponent={false}
              />
            </div>
          )}
        </div>
      </div>
  );
};

export default HomePage;
