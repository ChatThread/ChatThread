import { lazy, Suspense } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import { Outlet, useLocation } from "react-router-dom";

const SidebarFoldersButtonsComponent = lazy(() => 
  import("@/components/core/folderSidebarComponent/components/sidebar-folder-buttons")
);

export default function MainPage(): JSX.Element {
  const navigate = useCustomNavigate();
  const location = useLocation();
  
  return (
    <SidebarProvider width="4rem">
      <Suspense>
        <SidebarFoldersButtonsComponent
          handleChangeFolder={(id: string) => {
            if (location.pathname.startsWith(`/${id}`)) return;
            navigate(`/${id}`, { replace: true });
          }}
        />
      </Suspense>
      <main className="flex h-full w-full overflow-hidden">
        <div className="relative mx-auto flex h-full w-full flex-col overflow-hidden">
          <Suspense>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </SidebarProvider>
  );
}
