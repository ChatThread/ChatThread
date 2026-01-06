"use client";

import ChatThreadLogo from "@/assets/logo.svg?react";
import IconComponent from "@/components/common/generic-icon-component";
import { Button } from "@/components/ui/button";
import { useCustomNavigate } from "@/customization/hooks/use-custom-navigate";
import { useCallback, useEffect, useState } from "react";
import AuthenticatedChatPage from "./auth-chat-page";



export default function NewChatPage() {
  const navigate = useCustomNavigate();
  const [clientEnv, setClientEnv] = useState(() => {
    if (typeof window === "undefined") {
      return { folderId: "", token: null as string | null };
    }
    return {
      folderId: localStorage.getItem("folderId") ?? "",
      token: localStorage.getItem("authToken"),
    };
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const refreshClientEnv = () => {
      setClientEnv({
        folderId: localStorage.getItem("folderId") ?? "",
        token: localStorage.getItem("authToken"),
      });
    };

    refreshClientEnv();
    window.addEventListener("storage", refreshClientEnv);
    window.addEventListener("focus", refreshClientEnv);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshClientEnv();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", refreshClientEnv);
      window.removeEventListener("focus", refreshClientEnv);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const folderId = clientEnv.folderId;
  const isAuthenticated = !!clientEnv.token;

  const handleLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  if (!isAuthenticated) {
    return <LoggedOutChatGate onLogin={handleLogin} />;
  }

  const sessionKey = folderId || "default";

  return <AuthenticatedChatPage key={sessionKey} folderId={folderId} />;
}

function LoggedOutChatGate({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="relative flex h-screen min-h-0 w-full flex-col overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />
        <div className="absolute inset-y-0 right-[-10%] w-[70%] bg-[radial-gradient(circle,_rgba(14,165,233,0.18),_transparent_60%)] blur-3xl" />
      </div>
      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div className="flex w-full max-w-5xl flex-col gap-10 rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_120px_rgba(15,23,42,0.55)] backdrop-blur-2xl lg:flex-row lg:gap-14 lg:p-12">
          <div className="flex flex-1 flex-col items-center lg:items-start lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              Live workspace
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-slate-900">
                <ChatThreadLogo className="h-8 w-8" />
              </div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-200/70">
                ChatThread Studio
              </p>
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              Unlock the full conversation canvas.
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-100/80 sm:text-lg">
              Craft intelligent workflows, pick up past chats instantly, and invite your team with
              synchronized permissions. Sign in to keep ideas flowing without limits.
            </p>
            <div className="mt-8 flex flex-col gap-3 text-left text-sm text-slate-100/70 sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-4">
                <IconComponent name="Sparkles" className="h-5 w-5 text-emerald-300" />
                <span>Adaptive copilots for every product sprint</span>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-4">
                <IconComponent name="History" className="h-5 w-5 text-sky-300" />
                <span>Resume sessions exactly where you left off</span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-[28px] bg-gradient-to-b from-white/90 to-white/75 p-8 text-slate-900 shadow-2xl lg:max-w-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Welcome back
            </div>
            <h2 className="text-2xl font-semibold">Sign in to continue</h2>
            <p className="text-base text-slate-600">
              Your drafts, flows, and copilots await. Continue building with full power instantly.
            </p>
            <Button
              size="lg"
              className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onLogin();
              }}
              onMouseDown={(event) => event.preventDefault()}
            >
              Login to Continue
            </Button>
            <div className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-4 text-left text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Creators online</span>
                {/* <span className="text-emerald-500">+482 today</span> */}
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <IconComponent name="Users" className="h-5 w-5 text-slate-400" />
                <span>Teams collaborate in real-time with versioned histories.</span>
              </div>
            </div>
            {/* <button
              type="button"
              className="text-sm font-semibold text-slate-500 underline-offset-4 transition hover:text-slate-900"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onLogin();
              }}
            >
              Preview the tour
            </button> */}
          </div>
        </div>
      </main>
    </div>
  );
}
