import SideBarButtonsComponent from "@/components/core/sidebar-component";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import ForwardedIconComponent from "../../components/common/generic-icon-component";
import PageLayout from "../../components/common/page-layout";

export default function SettingsPage(): JSX.Element {
  const sidebarNavItems: {
    href?: string;
    title: string;
    icon: React.ReactNode;
  }[] = [];

  sidebarNavItems.push(
    {
      title: "Account",
      href: "/settings/account",
      icon: (
        <ForwardedIconComponent
          name="User"
          className="w-4 shrink-0 justify-start stroke-[1.5]"
        />
      ),
    },
    {
      title: "Agreement",
      href: "/settings/agreement",
      icon: (
        <ForwardedIconComponent
          name="FileText"
          className="w-4 shrink-0 justify-start stroke-[1.5]"
        />
      ),
    },
    // {
    //   title: "Global Variables",
    //   href: "/settings/global-variables",
    //   icon: (
    //     <ForwardedIconComponent
    //       name="Globe"
    //       className="w-4 shrink-0 justify-start stroke-[1.5]"
    //     />
    //   ),
    // },
    // {
    //   title: "ChatThread API Keys",
    //   href: "/settings/api-keys",
    //   icon: (
    //     <ForwardedIconComponent
    //       name="Key"
    //       className="w-4 shrink-0 justify-start stroke-[1.5]"
    //     />
    //   ),
    // },
    // {
    //   title: "Shortcuts",
    //   href: "/settings/shortcuts",
    //   icon: (
    //     <ForwardedIconComponent
    //       name="Keyboard"
    //       className="w-4 shrink-0 justify-start stroke-[1.5]"
    //     />
    //   ),
    // },
    // {
    //   title: "Messages",
    //   href: "/settings/messages",
    //   icon: (
    //     <ForwardedIconComponent
    //       name="MessagesSquare"
    //       className="w-4 shrink-0 justify-start stroke-[1.5]"
    //     />
    //   ),
    // },
  );
  return (
    <PageLayout
      title="Settings"
      description="Manage the general settings for ChatThread."
    >
      <SidebarProvider width="15rem" defaultOpen={true}>
        <SideBarButtonsComponent items={sidebarNavItems} />
        <main className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-x-hidden pt-1">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </PageLayout>
  );
}
