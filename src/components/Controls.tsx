import { HelpCircle, Play, Pause, RotateCcw, Download, Upload } from "lucide-react";
import { useAppStore } from "../store";
import { useRef, useEffect } from "react";

export function Controls() {
  const { playbackState, togglePlaying, pausePlaying, resumePlaying, replayPlaying, resetPlaying, volume, setVolume, waitTime, setWaitTime, statusText, selectedWeapon, patterns, setPatterns } = useAppStore();
  const popupRef = useRef<Window | null>(null);

  const isPlaying = playbackState.status === "playing" || playbackState.status === "countdown";
  const isPaused = playbackState.status === "paused";

  useEffect(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.postMessage({ type: "UPDATE_STATUS", text: statusText }, "*");
    }
  }, [statusText]);

  const openPopup = () => {
    const popup = window.open("", "ApexStrafePopup", "width=400,height=200");
    if (popup) {
      popupRef.current = popup;
      popup.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Apex Strafe Overlay</title>
          <style>
            body {
              margin: 0;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              font-family: sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              overflow: hidden;
            }
            .container {
              text-align: center;
            }
            .title {
              font-size: 12px;
              opacity: 0.6;
              margin-bottom: 8px;
            }
            .status {
              font-size: 48px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="title">Apex Strafe Trainer</div>
            <div class="status" id="status">-</div>
          </div>
          <script>
            window.addEventListener("message", (event) => {
              if (event.data && event.data.type === "UPDATE_STATUS") {
                document.getElementById("status").innerText = event.data.text;
              }
            });
          </script>
        </body>
        </html>
      `);
      popup.document.close();
      popup.postMessage({ type: "UPDATE_STATUS", text: statusText }, "*");
    }
  };

  const exportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patterns, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "apex_strafe_weapons.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          
          if (Array.isArray(config)) {
            // Import multiple weapons
            const validPatterns = config.filter(p => p.id && p.weapon && p.rpm && p.magSize && Array.isArray(p.turns));
            if (validPatterns.length > 0) {
              const newPatterns = [...patterns];
              validPatterns.forEach(vp => {
                const existingIdx = newPatterns.findIndex(p => p.id === vp.id);
                if (existingIdx >= 0) {
                  newPatterns[existingIdx] = vp;
                } else {
                  newPatterns.push(vp);
                }
              });
              setPatterns(newPatterns);
              alert(`成功导入 ${validPatterns.length} 个武器配置！`);
            } else {
              alert("文件中没有找到有效的武器配置。");
            }
          } else if (config.id && config.weapon && config.rpm && config.magSize && Array.isArray(config.turns)) {
            // Import single weapon (legacy support)
            const existingIdx = patterns.findIndex(p => p.id === config.id);
            if (existingIdx >= 0) {
              const newPatterns = [...patterns];
              newPatterns[existingIdx] = config;
              setPatterns(newPatterns);
            } else {
              setPatterns([...patterns, config]);
            }
            alert(`成功导入武器: ${config.name}！`);
          } else {
            alert("无效的配置文件格式。");
          }
        } catch (err) {
          alert("解析 JSON 失败。");
        }
      };
      reader.readAsText(file);
    }
    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
        <div className="flex gap-2">
          <button
            onClick={togglePlaying}
            className={`flex-1 h-12 font-semibold px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
              isPlaying
                ? "bg-gray-600 hover:bg-gray-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isPlaying ? "停止" : "开始"}
          </button>
          
          {isPlaying || isPaused ? (
            <button
              onClick={isPaused ? resumePlaying : pausePlaying}
              className="w-12 h-12 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
              title={isPaused ? "继续" : "暂停"}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          ) : null}

          <button
            onClick={replayPlaying}
            className="w-12 h-12 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            title="重新开始"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden md:flex gap-2">
          <div className="relative group flex-1">
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 w-72 max-w-[calc(100vw-2rem)]">
              <div className="rounded-md border border-white/15 bg-black/90 p-2 shadow-lg">
                <div className="text-[11px] text-white/80 mb-2">
                  用于游戏内反馈。仅适用于 Chromium 浏览器。请确保在 Apex
                  的视频设置中使用无边框窗口。你可以把弹出窗拖到准星略上方，以同时获得视觉与音频提示。
                </div>
              </div>
            </div>
            <button
              onClick={openPopup}
              className="w-full h-12 px-4 text-sm font-semibold rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              打开弹出
            </button>
          </div>
          
          <button
            onClick={exportConfig}
            className="w-12 h-12 flex items-center justify-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors"
            title="导出配置"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <label className="w-12 h-12 flex items-center justify-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer" title="导入配置">
            <Upload className="w-5 h-5" />
            <input type="file" accept=".json" className="hidden" onChange={importConfig} />
          </label>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex items-center justify-between mb-1 h-4">
            <label
              htmlFor="waitTimeSeconds"
              className="flex items-center gap-1 text-[10px] tracking-wider text-white/60"
            >
              额外延迟
              <div className="relative inline-block align-middle">
                <div className="inline-block ml-1">
                  <button
                    className="text-white/50 hover:text-white/80 cursor-help inline-flex items-center"
                    type="button"
                  >
                    <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute top-1 bottom-0 left-[7px] right-[7px] z-0 flex items-center">
                <div className="w-full h-2 bg-gray-600 rounded"></div>
              </div>
              <input
                id="waitTimeSeconds"
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={waitTime}
                onChange={(e) => setWaitTime(parseFloat(e.target.value))}
                className="uniform-slider relative z-20 w-full h-2 cursor-pointer appearance-none rounded outline-none bg-transparent"
              />
            </div>
            <span className="text-sm font-semibold text-amber-300 min-w-[3rem] text-right">
              {waitTime.toFixed(1)}s
            </span>
          </div>
        </div>
        <div className="hidden sm:block rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <label
            htmlFor="volume"
            className="flex items-center gap-1 text-[10px] tracking-wider text-white/60 mb-1 h-4"
          >
            音量
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute top-1 bottom-0 left-[7px] right-[7px] z-0 flex items-center">
                <div className="w-full h-2 bg-gray-600 rounded"></div>
              </div>
              <input
                id="volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="uniform-slider relative z-20 w-full h-2 cursor-pointer appearance-none rounded bg-transparent outline-none"
              />
            </div>
            <span className="text-sm font-semibold text-amber-300 min-w-[3rem] text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
