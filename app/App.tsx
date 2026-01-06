import "@xyflow/react/dist/style.css";
import { Suspense, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { useDarkStore } from "./stores/dark-store";
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  const dark = useDarkStore((state) => state.dark);
  useEffect(() => {
    if (!dark) {
      document.body.classList.remove("dark");
    } else {
      document.body.classList.add("dark");
    }
  }, [dark]);

  // Listen for protocol URLs from the main process (e.g. chatmagic://...)
  useEffect(() => {
    try {
      // @ts-ignore
      if (window?.api?.receive) {
        // @ts-ignore
        window.api.receive('protocol-url', (url: string) => {
          // console.log('App opened with deep link:', url)
          // TODO: handle the URL inside your app, e.g. navigate to a route
        })
      }
    } catch (e) {
      // ignore
    }
    return () => {
      try {
        // @ts-ignore
        if (window?.api?.removeAllListeners) window.api.removeAllListeners('protocol-url')
      } catch (e) {}
    }
  }, [])
  return (
    <Suspense>
      <RouterProvider router={router} />
      <Toaster />
    </Suspense>
  );
}
