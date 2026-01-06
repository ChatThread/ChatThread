import PaginatorComponent from "@/components/common/paginator-component";
import { CustomBanner } from "@/customization/components/CustomBanner";
import { ENABLE_DATASTAX_CHATMAGIC } from "@/customization/feature-flags";
import { useCallback, useEffect, useRef, useState } from "react";
import ExploreGrid from "../../components/explore-grid";
import GridSkeleton from "../../components/grid-skeleton";
import HeaderComponent from "../../components/header";
import EmptyFolder from "../empty-folder";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import useAddFlow from "@/hooks/flows/use-add-flow";
import { FlowType } from "@/types/flow";
import { BASE_URL_API_V2 } from "@/customization/config-constants";
import { api } from "@/controllers/API/api";

const PAGE_SIZE = 20;

type ExplorePageProps = {
  type?: string | null | undefined;
};

// use actual FlowType for store items so they match ExploreGrid expectations

const ExplorePage = ({ type }: ExplorePageProps) => {
  const folderId = localStorage.getItem("folderId") ?? "";

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [search, setSearch] = useState("");

  const [pageName, setPageName] = useState("Explore");

  // Store (workflow store) specific state
  type StoreFlow = FlowType & { price?: number | string | null; purchased?: boolean };
  const [storeItems, setStoreItems] = useState<StoreFlow[]>([]);
  const [storePage, setStorePage] = useState(1);
  const [storeTotal, setStoreTotal] = useState<number | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const addFlow = useAddFlow();
  const navigate = useCustomNavigate();

  const fetchedOnceRef = useRef(false);

  const isLoading = storeLoading;

  const data = type === "store"
    ? {
        flows: storeItems,
        name: "",
        description: "",
        parent_id: "",
        components: [],
        pagination: {
          page: storePage,
          size: PAGE_SIZE,
          total: storeTotal ?? 0,
          pages: storeTotal ? Math.ceil((storeTotal ?? 0) / PAGE_SIZE) : 0,
        },
      }
    : {
        flows: [],
        name: "",
        description: "",
        parent_id: "",
        components: [],
        pagination: { page: 1, size: 12, total: 0, pages: 0 },
      };

  const handlePageChange = useCallback((newPageIndex, newPageSize) => {
    setPageIndex(newPageIndex);
    setPageSize(newPageSize);
  }, []);

  const onSearch = useCallback((newSearch) => {
    setSearch(newSearch);
    setPageIndex(1);
  }, []);

  // Fetch workflows from the public store API when this page is used as the store
  useEffect(() => {
    // Guard to avoid duplicate calls (React 18 Strict Mode mounts twice in dev)
    if (type === "store" && !fetchedOnceRef.current) {
      fetchedOnceRef.current = true;
      fetchStorePage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function fetchStorePage(p: number) {
    setStoreLoading(true);
    setStoreError(null);
    try {
      const base = api?.defaults?.baseURL ?? "";
      const resp = await fetch(`${base}${BASE_URL_API_V2}workflow_store/?page=${p}&size=${PAGE_SIZE}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const body = await resp.json();

      let list: any[] = [];
      let tot: number | null = null;
      if (Array.isArray(body)) {
        list = body;
      } else if (body.items && Array.isArray(body.items)) {
        list = body.items;
        tot = typeof body.total === "number" ? body.total : tot;
      } else if (body.data && Array.isArray(body.data)) {
        list = body.data;
        tot = typeof body.total === "number" ? body.total : tot;
      } else if (body.flows && body.flows.items && Array.isArray(body.flows.items)) {
        list = body.flows.items;
        tot = typeof body.flows.total === "number" ? body.flows.total : tot;
      } else if (body.flows && Array.isArray(body.flows)) {
        list = body.flows;
      } else {
        const firstArray = Object.values(body).find((v) => Array.isArray(v));
        if (Array.isArray(firstArray)) list = firstArray as any[];
      }

      const parsed: StoreFlow[] = list.map((e: any) => ({
        id: (e.id || e._id || e.flow_id || "").toString(),
        name: e.name || e.title || e.name_en || e.display_name || e.id || "",
        description: e.description || e.desc || "",
        // preserve graph data when available so downstream components can use it
        data: e.data ?? null,
        updated_at: e.updated_at || e.updatedAt || new Date().toISOString(),
        gradient: e.gradient ?? (e.id || e._id || e.flow_id || "").toString(),
        is_component: Boolean(e.is_component || e.isComponent || false),
        // price may be string or number depending on API
        price: e.price ?? e.amount ?? null,
        // normalize purchased flag from several possible fields
        purchased: Boolean(
          e.purchased || e.is_purchased || e.owned || e.has_purchased || e.isPurchased || false,
        ),
      }));

      setStoreItems(parsed);
      setStoreTotal(tot);
      setStorePage(p);
    } catch (e: any) {
      setStoreError(e?.message || String(e));
    } finally {
      setStoreLoading(false);
    }
  }

  async function handlePurchase(id: string) {
    if (!id) return;
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      navigate("/login");
      return;
    }
    try {
      
      setPurchasingId(id);
      const base = api?.defaults?.baseURL ?? "";
      const resp = await fetch(`${base}${BASE_URL_API_V2}workflow_store/purchase/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });
      if (resp.status === 200 || resp.status === 201) {
        alert("Purchase successful.");
        await fetchStorePage(storePage);
        return;
      }
      if (resp.status === 402) {
        const go = window.confirm(
          "Your account balance is insufficient. Would you like to add funds now?"
        );
        if (go) navigate("/settings/agreement");
        return;
      }
      let msg = `Purchase failed (HTTP ${resp.status})`;
      try {
        const body = await resp.json();
        if (body && body.message) msg = body.message;
      } catch (_) {}
      alert(msg);
    } catch (e: any) {
      alert(`Purchase error: ${e?.message ?? String(e)}`);
    } finally {
      setPurchasingId(null);
    }
  }

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

          <div className="flex flex-1 flex-col justify-start px-5 pt-10">
            <div className="flex h-full flex-col justify-start">
              <HeaderComponent
                folderName={pageName}
                handleNewFlow={handleNewFlow}
                setSearch={onSearch}
                isEmptyFolder={false}
                showSearch={false}
                showNewButton={false}
              />
              {(
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
                          <ExploreGrid
                            key={flow.id}
                            flowData={flow}
                            handlePurchase={handlePurchase}
                            purchasingId={purchasingId}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="pt-2 text-center text-sm text-secondary-foreground">
                      No items available.
                    </div>
                  ) }
                </div>
              )}
            </div>
          </div>

          {!isLoading && data.pagination.total >= 10 && (
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

export default ExplorePage;
