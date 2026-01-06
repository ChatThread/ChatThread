import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForwardedIconComponent from "../../components/common/generic-icon-component";
import GridSkeleton from "../main-page/components/grid-skeleton";
import HeaderComponent from "../main-page/components/header";
import PublishWishlistModal from "./PublishWishlistModal";
import { WishlistItem, deleteItem, fetchPage } from "./wishlistApi";
import { Card } from "@/components/ui/card";

const WISHLIST_COPY = {
  short: "No wishes yet — publish one to request a custom workflow.",
  headline: "Nothing here yet.",
  body: "Didn't find the workflow you're looking for in Explore? Publish a wish so our team can see it — we'll evaluate requests and help build the workflow you need.",
  modalTitle: "Share your wishlist item",
  modalBody:
    "Tell us what workflow you'd like but couldn't find in Explore. When you publish a wishlist item, our team will review it and may contact you to clarify requirements or to let you know when the workflow is available. The more detail you provide, the faster we can act.",
  privacyNote:
    "By publishing, you agree that your submission may be reviewed by the product team. We won't share your personal data publicly without consent.",
  publishLabel: "Publish Wish",
  publishTooltip:
    "Publish this wish to notify our team and request a custom workflow.",
} as const;

const WishlistListPage: React.FC = () => {
  const navigate = useNavigate();

  const storedToken = localStorage.getItem("authToken");
  const isAuthenticated = !!storedToken;

  const [pageName, setPageName] = useState("Wishlist");
  const [serverItems, setServerItems] = useState<WishlistItem[] | null>(null);
  const [loading, setLoading] = useState(isAuthenticated);

  const mountedRef = useRef(true);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchPage({ page: 1, pageSize: 100 });
      setServerItems(res.items);
      if (mountedRef.current) setLoading(false);
      if (!mountedRef.current) return;
    } catch (e: any) {
      if (!mountedRef.current) return;
    } finally {
      
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const fetchItems = async () => {
      if (isAuthenticated) {
        await loadItems();
      }
    };
    fetchItems();

    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated]);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this wishlist item?")) return;
    try {
      // Optimistically update local UI
      setServerItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
      await deleteItem(id);
    } catch (e) {
      // Re-fetch on failure to restore state
      try {
        await loadItems();
      } catch (_err) {
        // ignore
      }
      throw e;
    }
  };

  const handleNewFlow = () => {
    const storedToken = localStorage.getItem("authToken");
    if (!storedToken) {
      navigate("/login");
      return;
    }
    setShowPublishModal(true);
  };

  const [showPublishModal, setShowPublishModal] = useState(false);

  const closePublishModal = async () => {
    setShowPublishModal(false);
    loadItems();
  };
  
  const displayItems = React.useMemo(() => {
    const map = new Map<string, WishlistItem>();
    if (serverItems) {
      for (const it of serverItems) map.set(it.id, it);
    }
    return Array.from(map.values());
  }, [serverItems]);

  return (
    <div
      className="flex h-full w-full flex-col overflow-y-auto"
      data-testid="cards-wrapper"
    >
      <div className="flex h-full w-full flex-col xl:container">
        <div className="flex flex-1 flex-col justify-start px-5 pt-10">
          <div className="flex h-full flex-col justify-start">
            <HeaderComponent
              folderName={pageName}
              handleNewFlow={handleNewFlow}
              // hide the search input for wishlist page
              showSearch={false}
              // use a clearer Publish label
              newButtonLabel={WISHLIST_COPY.publishLabel}
              isEmptyFolder={!isAuthenticated}
              setSearch={function (search: string): void {}}
            />

            <div className="mt-6">
              {loading ? (
                <div className="mt-1 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <GridSkeleton />
                  <GridSkeleton />
                </div>
              ) : displayItems.length > 0 ? (
                <div className="mt-1 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {displayItems.map((it) => (
                    <Card
                      key={it.id}
                      // draggable
                      // onDragStart={onDragStart}
                      // onClick={handleClick}
                      className={`my-1 flex flex-col rounded-lg border border-border bg-background p-4 hover:border-placeholder-foreground hover:shadow-2xs`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {it.title}
                            </div>
                          </div>

                          {/** Description (optional) */}
                          {it.description ? (
                            <div className="mt-2 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
                              {it.description}
                            </div>
                          ) : null}

                          <div className="mt-3 flex items-center justify-between text-xs text-secondary-foreground">
                            <div className="truncate">
                              {new Date(it.createdAt).toLocaleString()}
                            </div>

                            <button
                              onClick={() => onDelete(it.id)}
                              aria-label="Delete wishlist item"
                              title="Delete"
                              className="ml-3 inline-flex items-center justify-center rounded p-1 hover:bg-red-50 focus:outline-none dark:hover:bg-red-900/30"
                            >
                              <ForwardedIconComponent
                                name="Trash2"
                                className="h-4 w-4"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center pt-10">
                  <div className="w-full max-w-xl rounded-lg bg-white/80 p-6 text-center shadow-md dark:bg-gray-800">
                    <div className="mb-4 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-primary-600 dark:text-primary-400 h-12 w-12"
                      >
                        <path d="M12 2l1.176 3.618L17 7.07l-3.412 2.48L14.352 13 12 11.053 9.648 13l.765-3.45L6.999 7.07l3.824-1.452L12 2z" />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {WISHLIST_COPY.headline}
                    </h3>
                    <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                      {WISHLIST_COPY.body}
                    </p>
                    <p className="mb-6 text-xs text-secondary-foreground">
                      {WISHLIST_COPY.short}
                    </p>

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => navigate("/explore")}
                        className="bg-primary hover:bg-primary-hover inline-flex items-center rounded-md px-4 py-2 text-primary-foreground focus:outline-none"
                      >
                        Browse Explore
                      </button>
                      <button
                        onClick={handleNewFlow}
                        title={WISHLIST_COPY.publishTooltip}
                        className="rounded-md border border-gray-300 bg-white/60 px-4 py-2 text-sm dark:bg-transparent"
                      >
                        {WISHLIST_COPY.publishLabel}
                      </button>
                    </div>

                    <p className="mt-4 text-xs text-muted-foreground">
                      {WISHLIST_COPY.privacyNote}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showPublishModal && <PublishWishlistModal onClose={closePublishModal} />}
    </div>
  );
};

export default WishlistListPage;
