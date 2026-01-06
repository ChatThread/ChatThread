import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { Cable, MessageSquare, Settings, Workflow, Compass, Heart } from "lucide-react";
import { SidebarFooter } from "@/components/ui/sidebar";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";

const APP_MENUS = [
  {
    id: "chat",
    label: "Chat",
    icon: MessageSquare,
  },
  {
    id: "flows",
    label: "Workflow",
    icon: Workflow,
  },
  {
    id: "explore",
    label: "Explore",
    icon: Compass,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: Heart,
  },
  {
    id: "mcp",
    label: "MCP",
    icon: Cable,
  },
] as const;

type SidebarFoldersButtonsComponentProps = {
  handleChangeFolder?: (id: string) => void;
};

const SidebarFoldersButtonsComponent = ({
  handleChangeFolder
}: SidebarFoldersButtonsComponentProps) => {
  const isMobile = useIsMobile({ maxWidth: 1024 });
  const location = useLocation();
  const activeId = APP_MENUS.find(menu => location.pathname.startsWith(`/${menu.id}`))?.id || "chat";
  const navigate = useCustomNavigate();
  
  function to_setting_page() {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      navigate("/login");
    }else{
      navigate("/settings");
    }
  }
  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      data-testid="folder-sidebar"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
            {APP_MENUS.map((item) => (
              <SidebarMenuItem key={item.id} className="w-full aspect-square m-0 border-0">
                <SidebarMenuButton 
                  isActive={activeId === item.id} 
                  onClick={() => handleChangeFolder?.(item.id)}
                  className="h-full w-full p-0 flex-col gap-1 justify-center items-center hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white data-[active=true]:bg-zinc-200 data-[active=true]:text-zinc-900 dark:data-[active=true]:bg-zinc-800 dark:data-[active=true]:text-white"
                >
                  <div className="rounded-lg bg-muted/50">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-normal leading-none">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem key={'setting'} className="w-full aspect-square m-0 border-0">
            <SidebarMenuButton 
              onClick={() => to_setting_page()}
              className="h-full w-full p-0 flex-col gap-1 justify-center items-center hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white data-[active=true]:bg-zinc-200 data-[active=true]:text-zinc-900 dark:data-[active=true]:bg-zinc-800 dark:data-[active=true]:text-white"
            >
              <div className="rounded-lg bg-muted/50">
                <Settings className="h-5 w-5" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarFoldersButtonsComponent;
