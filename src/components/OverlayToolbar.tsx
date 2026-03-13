type OverlayToolbarProps = {
  shortcuts: {
    exitMiniMode: string;
    toggleAlwaysOnTop: string;
    toggleClickThrough: string;
  };
  isAlwaysOnTop: boolean;
  isClickThrough: boolean;
  showClickThroughHint?: boolean;
  compactMode?: "normal" | "compact" | "tight";
};

export function OverlayToolbar({
  shortcuts,
  isAlwaysOnTop,
  isClickThrough,
  showClickThroughHint = false,
  compactMode = "normal",
}: OverlayToolbarProps) {
  const isTight = compactMode === "tight";
  const isCompact = compactMode !== "normal";
  const shortcutText = `${shortcuts.exitMiniMode} 退出  ·  ${shortcuts.toggleClickThrough} 穿透  ·  ${shortcuts.toggleAlwaysOnTop} 置顶`;

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-[16px] border border-[color:var(--overlay-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-surface-soft)_92%,transparent_8%)_0%,color-mix(in_srgb,var(--app-surface-soft)_68%,transparent_32%)_100%)] backdrop-blur-xl ${
        isTight ? "px-2 py-1" : "px-2.5 py-1.5"
      }`}
    >
      <div className="min-w-0">
        <div className={`truncate font-black uppercase text-[color:var(--app-text-strong)] ${isTight ? "text-[9px] tracking-[0.14em]" : isCompact ? "text-[10px] tracking-[0.16em]" : "text-[10px] tracking-[0.18em]"}`}>
          {shortcutText}
        </div>
        {showClickThroughHint ? (
          <div className={`mt-0.5 text-[color:var(--app-text-muted)] ${isTight ? "text-[8px]" : "text-[9px]"}`}>
            穿透已开，按 {shortcuts.toggleClickThrough} 关闭
          </div>
        ) : null}
      </div>

      <div className={`flex shrink-0 items-center gap-1.5 ${isTight ? "text-[8px]" : "text-[9px]"}`}>
        {isAlwaysOnTop ? (
          <div className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 font-semibold tracking-[0.08em] text-[color:var(--app-text-strong)]">
            置顶
          </div>
        ) : null}
        {isClickThrough ? (
          <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 font-semibold tracking-[0.08em] text-[color:var(--app-text-strong)]">
            穿透
          </div>
        ) : null}
      </div>
    </div>
  );
}
