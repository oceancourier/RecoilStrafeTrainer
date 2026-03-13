import { useEffect, useState } from "react";
import { DEFAULT_DESKTOP_WINDOW_STATE, getDesktopApi, type DesktopWindowState } from "../desktop";
import { OVERLAY_CHANNEL, OVERLAY_STATE_STORAGE_KEY, type OverlayStatePayload } from "../overlay";
import { OverlayDisplay } from "./OverlayDisplay";
import { OverlayToolbar } from "./OverlayToolbar";

function readInitialOverlayState() {
  try {
    const raw = localStorage.getItem(OVERLAY_STATE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as OverlayStatePayload;
  } catch {
    return null;
  }
}

function getCompactMode(viewportWidth: number): "normal" | "compact" | "tight" {
  if (viewportWidth <= 290) {
    return "tight";
  }

  if (viewportWidth <= 380) {
    return "compact";
  }

  return "normal";
}

export function OverlayWindow() {
  const [overlayState, setOverlayState] = useState<OverlayStatePayload | null>(() => readInitialOverlayState());
  const [windowState, setWindowState] = useState<DesktopWindowState>(DEFAULT_DESKTOP_WINDOW_STATE);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const desktopApi = getDesktopApi();
  const compactMode = getCompactMode(viewportWidth);

  useEffect(() => {
    document.title = "RecoilStrafeTrainer Mini Overlay";

    const channel = new BroadcastChannel(OVERLAY_CHANNEL);
    channel.onmessage = (event) => {
      if (event.data?.type === "OVERLAY_STATE") {
        setOverlayState(event.data.payload as OverlayStatePayload);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!desktopApi?.isElectron) {
      return;
    }

    void desktopApi.getWindowState().then(setWindowState);
    return desktopApi.onWindowState((nextState) => {
      setWindowState(nextState);
    });
  }, [desktopApi]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault();
        void desktopApi?.exitMiniMode();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [desktopApi]);

  return (
    <main className="min-h-screen overflow-hidden bg-[color:var(--overlay-shell)] text-[color:var(--app-text)]">
      <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,rgba(244,181,63,0.16),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.16),transparent_30%),linear-gradient(180deg,var(--overlay-surface-strong)_0%,var(--overlay-shell)_100%)] p-1">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-4 top-2 h-16 w-28 rounded-full bg-[radial-gradient(circle,rgba(244,181,63,0.22),transparent_68%)] blur-2xl" />
          <div className="absolute right-4 top-4 h-18 w-24 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_70%)] blur-2xl" />
        </div>

        <div className="relative flex min-h-[calc(100vh-2px)] flex-1 flex-col rounded-[24px] border border-[color:var(--overlay-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--overlay-surface-strong)_96%,transparent_4%)_0%,color-mix(in_srgb,var(--overlay-surface)_96%,transparent_4%)_100%)] p-1.5 shadow-[0_24px_70px_rgba(3,7,18,0.34)]">
          <div className="[-webkit-app-region:drag]">
            <OverlayToolbar
              shortcuts={windowState.shortcuts}
              isAlwaysOnTop={windowState.isAlwaysOnTop}
              isClickThrough={windowState.isClickThrough}
              showClickThroughHint={windowState.isClickThrough}
              compactMode={compactMode}
            />
          </div>

          <div className="mt-1.5 flex-1 min-h-0">
            {overlayState ? (
              <OverlayDisplay state={overlayState} mode="mini" compactMode={compactMode} className="h-full" />
            ) : (
              <div className="flex h-full items-center justify-center rounded-[18px] border border-[color:var(--overlay-border)] bg-[color:var(--app-surface-soft)] text-xs text-[color:var(--app-text-muted)]">
                正在同步小窗内容...
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
