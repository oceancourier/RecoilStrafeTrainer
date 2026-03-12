import { useEffect, useRef, useState } from "react";
import { OverlayDisplay } from "./OverlayDisplay";
import { OVERLAY_CHANNEL, OVERLAY_STATE_STORAGE_KEY, type OverlayStatePayload } from "../overlay";

function readInitialOverlayState() {
  try {
    const raw = localStorage.getItem(OVERLAY_STATE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OverlayStatePayload;
  } catch {
    return null;
  }
}

export function OverlayWindow() {
  const [overlayState, setOverlayState] = useState<OverlayStatePayload | null>(() => readInitialOverlayState());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const activeInputRef = useRef<unknown>(null);

  useEffect(() => {
    document.title = "Recoil Trainer Overlay";

    const channel = new BroadcastChannel(OVERLAY_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type === "OVERLAY_STATE") {
        setOverlayState(event.data.payload as OverlayStatePayload);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const emit = (phase: "down" | "up", input: unknown) => {
      if (phase === "down") {
        activeInputRef.current = input;
      } else {
        activeInputRef.current = null;
      }

      channelRef.current?.postMessage({
        type: "OVERLAY_INPUT",
        phase,
        input,
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      emit("down", { kind: "keyboard", code: event.code });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      emit("up", { kind: "keyboard", code: event.code });
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button > 2) return;
      emit("down", { kind: "mouse", button: event.button });
    };

    const onMouseUp = (event: MouseEvent) => {
      if (event.button > 2) return;
      emit("up", { kind: "mouse", button: event.button });
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const onBlur = () => {
      if (!activeInputRef.current) return;
      emit("up", activeInputRef.current);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  if (!overlayState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07090d] px-4 text-center text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70 shadow-2xl backdrop-blur-sm">
          主窗口打开后，这里会同步显示小窗内容。
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#07090d] p-2">
      <div
        className="w-full max-w-[980px]"
        style={{
          transform: `scale(${overlayState.overlayScale})`,
          transformOrigin: "center center",
        }}
      >
        <OverlayDisplay state={overlayState} />
      </div>
    </main>
  );
}
