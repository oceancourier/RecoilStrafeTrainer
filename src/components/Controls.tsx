import { Download, Upload } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { type MonitorBinding, normalizeWeaponPattern, type WeaponPattern } from "../data";
import { useAppStore } from "../store";
import {
  buildOverlayState,
  formatMonitorBinding,
  OVERLAY_CHANNEL,
  OVERLAY_STATE_STORAGE_KEY,
} from "../overlay";

function isValidPattern(value: unknown): value is WeaponPattern {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const pattern = value as Partial<WeaponPattern>;
  return Boolean(pattern.id && pattern.weapon && pattern.rpm && pattern.magSize && Array.isArray(pattern.turns));
}

export function Controls() {
  const {
    playbackState,
    togglePlaying,
    volume,
    setVolume,
    waitTime,
    setWaitTime,
    statusText,
    selectedWeapon,
    patterns,
    setPatterns,
    setSelectedWeapon,
    timeline,
    totalDuration,
    triggerBinding,
    setTriggerBinding,
    overlayScale,
    setOverlayScale,
    overlayOpacity,
    setOverlayOpacity,
    triggerScopeNotice,
  } = useAppStore();

  const popupRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [isCapturingBinding, setIsCapturingBinding] = useState(false);

  const isMonitoring = playbackState.status !== "idle";

  const buildCurrentOverlayState = () =>
    buildOverlayState({
      selectedWeapon,
      playbackState,
      timeline,
      waitTime,
      totalDuration,
      statusText,
      triggerBinding,
      overlayScale,
      overlayOpacity,
    });

  const broadcastOverlayState = () => {
    const payload = buildCurrentOverlayState();
    localStorage.setItem(OVERLAY_STATE_STORAGE_KEY, JSON.stringify(payload));
    channelRef.current?.postMessage({
      type: "OVERLAY_STATE",
      payload,
    });
    return payload;
  };

  const getPopupSize = () => ({
    width: Math.round(760 * overlayScale),
    height: Math.round(290 * overlayScale),
  });

  useEffect(() => {
    const channel = new BroadcastChannel(OVERLAY_CHANNEL);
    channelRef.current = channel;

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    broadcastOverlayState();
  }, [
    playbackState,
    selectedWeapon,
    timeline,
    waitTime,
    totalDuration,
    statusText,
    triggerBinding,
    overlayScale,
    overlayOpacity,
  ]);

  useEffect(() => {
    if (!popupRef.current || popupRef.current.closed) {
      return;
    }

    const { width, height } = getPopupSize();
    try {
      popupRef.current.resizeTo(width, height);
    } catch {
      // Ignore popup resize failures.
    }
  }, [overlayScale]);

  useEffect(() => {
    if (!isCapturingBinding) {
      return;
    }

    let armed = false;

    const finishCapture = (binding: MonitorBinding) => {
      setTriggerBinding(binding);
      setIsCapturingBinding(false);
    };

    const cancelCapture = () => {
      setIsCapturingBinding(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.code === "Escape") {
        cancelCapture();
        return;
      }

      finishCapture({ kind: "keyboard", code: event.code });
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button > 2) return;

      event.preventDefault();
      event.stopPropagation();
      finishCapture({ kind: "mouse", button: event.button as 0 | 1 | 2 });
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const timer = window.setTimeout(() => {
      armed = true;
      window.addEventListener("keydown", onKeyDown, true);
      window.addEventListener("mousedown", onMouseDown, true);
      window.addEventListener("contextmenu", onContextMenu, true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (armed) {
        window.removeEventListener("keydown", onKeyDown, true);
        window.removeEventListener("mousedown", onMouseDown, true);
        window.removeEventListener("contextmenu", onContextMenu, true);
      }
    };
  }, [isCapturingBinding, setTriggerBinding]);

  const openPopup = () => {
    broadcastOverlayState();

    const popupUrl = new URL(window.location.href);
    popupUrl.searchParams.set("overlay", "1");

    const { width, height } = getPopupSize();

    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      try {
        popupRef.current.resizeTo(width, height);
      } catch {
        // Ignore popup resize failures.
      }
      return;
    }

    const popup = window.open(
      popupUrl.toString(),
      "ApexStrafePopup",
      `popup=yes,width=${width},height=${height},resizable=yes,scrollbars=no`,
    );

    if (!popup) {
      return;
    }

    popupRef.current = popup;

    window.setTimeout(() => {
      broadcastOverlayState();
      try {
        popup.resizeTo(width, height);
      } catch {
        // Ignore popup resize failures.
      }
    }, 250);
  };

  const exportConfig = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(patterns, null, 2))}`;
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "apex_strafe_weapons.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importConfig = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const config = JSON.parse(loadEvent.target?.result as string);

        if (Array.isArray(config)) {
          const validPatterns = config.filter(isValidPattern).map(normalizeWeaponPattern);
          if (validPatterns.length === 0) {
            alert("文件中没有找到可导入的武器配置。");
            return;
          }

          const nextPatterns = [...patterns];
          validPatterns.forEach((pattern) => {
            const existingIndex = nextPatterns.findIndex((item) => item.id === pattern.id);
            if (existingIndex >= 0) {
              nextPatterns[existingIndex] = pattern;
            } else {
              nextPatterns.push(pattern);
            }
          });

          setPatterns(nextPatterns);

          const selectedMatch = validPatterns.find((pattern) => pattern.id === selectedWeapon.id);
          if (selectedMatch) {
            setSelectedWeapon(selectedMatch);
          }

          alert(`成功导入 ${validPatterns.length} 个武器配置。`);
        } else if (isValidPattern(config)) {
          const pattern = normalizeWeaponPattern(config);
          const existingIndex = patterns.findIndex((item) => item.id === pattern.id);

          if (existingIndex >= 0) {
            const nextPatterns = [...patterns];
            nextPatterns[existingIndex] = pattern;
            setPatterns(nextPatterns);
          } else {
            setPatterns([...patterns, pattern]);
          }

          if (selectedWeapon.id === pattern.id) {
            setSelectedWeapon(pattern);
          }

          alert(`成功导入武器：${pattern.name ?? pattern.weapon}`);
        } else {
          alert("无效的配置文件格式。");
        }
      } catch {
        alert("解析 JSON 失败。");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_48px_48px]">
        <button
          onClick={togglePlaying}
          className={`h-12 rounded-xl px-4 text-sm font-semibold transition-colors ${
            isMonitoring ? "bg-slate-600 text-white hover:bg-slate-500" : "bg-red-600 text-white hover:bg-red-500"
          }`}
        >
          {isMonitoring ? "停止监听" : "开始监听"}
        </button>

        <button
          onClick={openPopup}
          className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          打开小窗
        </button>

        <button
          onClick={exportConfig}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10"
          title="导出配置"
        >
          <Download className="h-5 w-5" />
        </button>

        <label
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10"
          title="导入配置"
        >
          <Upload className="h-5 w-5" />
          <input type="file" accept=".json" className="hidden" onChange={importConfig} />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.35em] text-white/55">监听按键</div>
              <div className="mt-2 text-2xl font-black tracking-[0.12em] text-white">{formatMonitorBinding(triggerBinding)}</div>
            </div>

            <button
              type="button"
              onClick={() => setIsCapturingBinding(true)}
              className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              {isCapturingBinding ? "等待输入..." : "重新设置"}
            </button>
          </div>

          <div className="mt-3 text-xs leading-5 text-white/60">
            {isCapturingBinding ? "按任意键或鼠标按钮进行绑定，按 Esc 取消。" : triggerScopeNotice}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <label htmlFor="waitTimeSeconds" className="text-[11px] uppercase tracking-[0.35em] text-white/55">
            触发延迟
          </label>
          <div className="mt-3 flex items-center gap-3">
            <input
              id="waitTimeSeconds"
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={waitTime}
              onChange={(event) => setWaitTime(parseFloat(event.target.value))}
              className="uniform-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
            />
            <span className="min-w-[3.25rem] text-right text-sm font-semibold text-amber-300">{waitTime.toFixed(2)}s</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <label htmlFor="volume" className="text-[11px] uppercase tracking-[0.35em] text-white/55">
            音量
          </label>
          <div className="mt-3 flex items-center gap-3">
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(parseFloat(event.target.value))}
              className="uniform-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
            />
            <span className="min-w-[3.25rem] text-right text-sm font-semibold text-amber-300">{Math.round(volume * 100)}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <label htmlFor="overlayScale" className="text-[11px] uppercase tracking-[0.35em] text-white/55">
            小窗缩放
          </label>
          <div className="mt-3 flex items-center gap-3">
            <input
              id="overlayScale"
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={overlayScale}
              onChange={(event) => setOverlayScale(parseFloat(event.target.value))}
              className="uniform-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
            />
            <span className="min-w-[3.25rem] text-right text-sm font-semibold text-amber-300">{Math.round(overlayScale * 100)}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <label htmlFor="overlayOpacity" className="text-[11px] uppercase tracking-[0.35em] text-white/55">
            小窗背景透明度
          </label>
          <div className="mt-3 flex items-center gap-3">
            <input
              id="overlayOpacity"
              type="range"
              min="0.55"
              max="1"
              step="0.05"
              value={overlayOpacity}
              onChange={(event) => setOverlayOpacity(parseFloat(event.target.value))}
              className="uniform-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
            />
            <span className="min-w-[3.25rem] text-right text-sm font-semibold text-amber-300">{Math.round(overlayOpacity * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
