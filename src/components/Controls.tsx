import { Clock3, Download, Keyboard, Minimize2, Upload, Volume2 } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { getDesktopApi } from "../desktop";
import { type MonitorBinding, normalizeWeaponPattern, type WeaponPattern } from "../data";
import { buildOverlayState, formatMonitorBinding, OVERLAY_CHANNEL, OVERLAY_STATE_STORAGE_KEY } from "../overlay";
import { useAppStore } from "../store";

function isValidPattern(value: unknown): value is WeaponPattern {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const pattern = value as Partial<WeaponPattern>;
  return Boolean(
    typeof pattern.id === "string" &&
      pattern.id.length > 0 &&
      typeof pattern.weapon === "string" &&
      pattern.weapon.length > 0 &&
      typeof pattern.rpm === "number" &&
      Number.isFinite(pattern.rpm) &&
      pattern.rpm >= 0 &&
      typeof pattern.magSize === "number" &&
      Number.isFinite(pattern.magSize) &&
      pattern.magSize >= 0 &&
      Array.isArray(pattern.turns),
  );
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
  } = useAppStore();

  const channelRef = useRef<BroadcastChannel | null>(null);
  const [isCapturingBinding, setIsCapturingBinding] = useState(false);
  const desktopApi = getDesktopApi();
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
  };

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
    if (!desktopApi?.isElectron) {
      return;
    }

    void desktopApi.updateOverlayAppearance({
      scale: overlayScale,
      opacity: overlayOpacity,
    });
  }, [desktopApi, overlayOpacity, overlayScale]);

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
      if (event.button > 2) {
        return;
      }

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

  const enterMiniMode = async () => {
    if (!desktopApi?.isElectron) {
      return;
    }

    broadcastOverlayState();
    await desktopApi.enterMiniMode({
      scale: overlayScale,
      opacity: overlayOpacity,
    });
  };

  const exportConfig = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(patterns, null, 2))}`;
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "recoil_strafe_trainer_patterns.json");
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
    <section className="panel-soft flex h-full min-h-0 flex-col p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="helper-badge">状态: {statusText}</div>
          <div className="helper-badge">触发键: {formatMonitorBinding(triggerBinding)}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={togglePlaying} className="action-button-primary h-9 min-h-9 px-4">
            {isMonitoring ? "停止" : "开始"}
          </button>

          <button type="button" onClick={enterMiniMode} className="action-button-secondary h-9 min-h-9 px-3.5">
            <Minimize2 className="h-4 w-4" />
            小窗
          </button>

          <button type="button" onClick={exportConfig} className="icon-action-button h-9 w-9" title="导出配置">
            <Download className="h-4 w-4" />
          </button>

          <label className="icon-action-button h-9 w-9 cursor-pointer" title="导入配置">
            <Upload className="h-4 w-4" />
            <input type="file" accept=".json" className="hidden" onChange={importConfig} />
          </label>
        </div>
      </div>

      <div className="mt-2.5 grid min-h-0 gap-2.5 xl:grid-cols-[200px_repeat(3,minmax(0,1fr))]">
        <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="stat-label">监听键</div>
            <Keyboard className="h-4 w-4 text-[color:var(--app-text-muted)]" />
          </div>
          <div className="text-[34px] font-black leading-none tracking-[-0.05em] text-[color:var(--app-text-strong)]">{formatMonitorBinding(triggerBinding)}</div>
          <div className="mt-1.5 text-xs leading-5 text-[color:var(--app-text-muted)]">
            {isCapturingBinding ? "按键或鼠标输入，Esc 取消。" : "支持键盘与鼠标按键。"}
          </div>
          <button type="button" onClick={() => setIsCapturingBinding(true)} className="action-button-secondary mt-2.5 h-9 min-h-9 w-full px-3">
            {isCapturingBinding ? "等待输入..." : "重新设置"}
          </button>
        </div>

        <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="stat-label">触发延迟</div>
            <Clock3 className="h-4 w-4 text-[color:var(--app-text-muted)]" />
          </div>
          <div className="mb-1.5 text-lg font-black tracking-[-0.04em] text-[color:var(--app-accent-strong)]">{waitTime.toFixed(2)}s</div>
          <input
            id="waitTimeSeconds"
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={waitTime}
            onChange={(event) => setWaitTime(parseFloat(event.target.value))}
            className="uniform-slider h-2 w-full cursor-pointer rounded-full"
          />
        </div>

        <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="stat-label">音量</div>
            <Volume2 className="h-4 w-4 text-[color:var(--app-text-muted)]" />
          </div>
          <div className="mb-1.5 text-lg font-black tracking-[-0.04em] text-[color:var(--app-accent-strong)]">{Math.round(volume * 100)}%</div>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(parseFloat(event.target.value))}
            className="uniform-slider h-2 w-full cursor-pointer rounded-full"
          />
        </div>

        <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-2.5">
          <div className="stat-label">小窗</div>

          <div className="mt-2.5 space-y-2.5">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-[color:var(--app-text-muted)]">
                <span>缩放</span>
                <span>{Math.round(overlayScale * 100)}%</span>
              </div>
              <input
                id="overlayScale"
                type="range"
                min="0.65"
                max="1.25"
                step="0.05"
                value={overlayScale}
                onChange={(event) => setOverlayScale(parseFloat(event.target.value))}
                className="uniform-slider h-2 w-full cursor-pointer rounded-full"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-[color:var(--app-text-muted)]">
                <span>透明度</span>
                <span>{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <input
                id="overlayOpacity"
                type="range"
                min="0.55"
                max="1"
                step="0.05"
                value={overlayOpacity}
                onChange={(event) => setOverlayOpacity(parseFloat(event.target.value))}
                className="uniform-slider h-2 w-full cursor-pointer rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
