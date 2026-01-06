import { useRef, useState } from "react";
import useAlertStore from "../../../../stores/alert-store";
import { Button } from "../../../../components/ui/button"; // Import shadcn Button
import { FileText, Shield } from "lucide-react"; // Import icons for agreements

export default function AgreementPage() {
    const setErrorData = useAlertStore((state) => state.setErrorData);
    const [openModal, setOpenModal] = useState(false);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const isElectron = (
        typeof window !== 'undefined' && (
        window.process?.type === 'renderer' ||
        window.electron !== undefined ||
        navigator.userAgent.toLowerCase().includes('electron')
        )
    );
    // Mock functions for viewing agreements
    const handleViewServiceAgreement = () => {
        // @ts-expect-error - Vite env vars are injected at build time
        const base = (import.meta.env.VITE_PUBLIC_SITE_URL as string) || "";
        const url = base ? `${base}/agreement` : "";
        if (!url) return;
        if (isElectron) {
            window.api.invoke("open-new-window", url)
        } else {
            // 非 Electron 环境下的备用方案
            window.open(url, '_blank')
        }
    };

    const handleViewPrivacyPolicy = () => {
        // @ts-expect-error - Vite env vars are injected at build time
        const base = (import.meta.env.VITE_PUBLIC_SITE_URL as string) || "";
        const url = base ? `${base}/privacy` : "";
        if (!url) return;
        if (isElectron) {
        window.api.invoke("open-new-window", url)
        } else {
        // 非 Electron 环境下的备用方案
        window.open(url, '_blank')
        }
    };
    return (
        <div className="flex h-full w-full flex-col justify-between gap-6">
            <div className="flex w-full items-start justify-between gap-6">
                <div className="flex w-full flex-col">
                    <h2 className="flex items-center text-lg font-semibold tracking-tight">
                        Service Agreement
                    </h2>
                </div>
            </div>

            <div className="flex h-full w-full flex-col justify-between gap-6">
                <div className="space-y-4">
                    {/* Service Agreement */}
                    <div className="flex items-center justify-between rounded-lg p-4">
                        <div className="flex items-center gap-4">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-medium">Service Agreement</h3>
                                <p className="text-sm text-muted-foreground">
                                    Terms and conditions for using our service
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="outline"
                            onClick={handleViewServiceAgreement}
                        >
                            View
                        </Button>
                    </div>

                    {/* Privacy Policy */}
                    <div className="flex items-center justify-between rounded-lg p-4">
                        <div className="flex items-center gap-4">
                            <Shield className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-medium">Privacy Policy</h3>
                                <p className="text-sm text-muted-foreground">
                                    How we collect, use, and protect your data
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="outline"
                            onClick={handleViewPrivacyPolicy}
                        >
                            View
                        </Button>
                    </div>
                </div>

                {/* Optional: Add a section for agreement acceptance if needed */}
                {/* <div className="mt-auto pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Last updated: January 1, 2023
                        </p>
                        <Button>
                            I Agree
                        </Button>
                    </div>
                </div> */}
            </div>
        </div>
    );
}