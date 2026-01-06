import { CustomAPIGenerator } from "@/customization/components/CustomApiGenerator";
import { useCustomAPICode } from "@/customization/hooks/use-custom-api-code";
import useAuthStore from "@/stores/auth-store";
import { ReactNode, useEffect, useState } from "react";
import IconComponent from "../../components/common/generic-icon-component";
import CodeTabsComponent from "../../components/core/code-tabs-component";
import { EXPORT_CODE_DIALOG } from "../../constants/constants";
import { useTweaksStore } from "../../stores/tweaks-store";
import { FlowType } from "../../types/flow/index";
import BaseModal from "../base-modal";

export default function ApiModal({
  flow,
  children,
  open: myOpen,
  setOpen: mySetOpen,
}: {
  flow: FlowType;
  children: ReactNode;
  open?: boolean;
  setOpen?: (a: boolean | ((o?: boolean) => boolean)) => void;
}) {
  const autoLogin = useAuthStore((state) => state.autoLogin);
  const [open, setOpen] =
    mySetOpen !== undefined && myOpen !== undefined
      ? [myOpen, mySetOpen]
      : useState(false);
  const [activeTab, setActiveTab] = useState("0");
  const activeTweaks = useTweaksStore((state) => state.activeTweaks);
  const setActiveTweaks = useTweaksStore((state) => state.setActiveTweaks);
  const tabs = useTweaksStore((state) => state.tabs);
  const initialSetup = useTweaksStore((state) => state.initialSetup);

  const getCodes = useCustomAPICode();

  useEffect(() => {
    if (open) initialSetup(autoLogin ?? false, flow, getCodes);
    setActiveTab("0");
  }, [open]);

  return (
    <BaseModal open={open} setOpen={setOpen} size="x-large">
      <BaseModal.Trigger asChild>{children}</BaseModal.Trigger>
      <BaseModal.Header description={EXPORT_CODE_DIALOG}>
        <span className="pr-2">API</span>
        <IconComponent
          name="Code2"
          className="h-6 w-6 pl-1 text-gray-800 dark:text-white"
          aria-hidden="true"
        />
      </BaseModal.Header>
      <BaseModal.Content overflowHidden>
        {open && (
          <>
            <CustomAPIGenerator isOpen={open} />
            <CodeTabsComponent
              open={open}
              tabs={tabs!}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeTweaks={activeTweaks}
              setActiveTweaks={setActiveTweaks}
            />
          </>
        )}
      </BaseModal.Content>
    </BaseModal>
  );
}
