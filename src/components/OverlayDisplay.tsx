import { type OverlayAccent, type OverlayStatePayload } from "../overlay";
import { cn } from "../utils";

type OverlayDisplayProps = {
  state: OverlayStatePayload;
  className?: string;
  mode?: "embedded" | "mini";
  compactMode?: "normal" | "compact" | "tight";
};

function getAccentClasses(accent: OverlayAccent) {
  if (accent === "left") {
    return {
      glow: "from-blue-500/20 via-blue-400/8 to-transparent",
      text: "text-[color:var(--accent-left)]",
      badge: "border-[color:var(--accent-left-border)] bg-[color:var(--accent-left-soft)] text-[color:var(--accent-left)]",
      marker: "bg-[color:var(--accent-left)]",
    };
  }

  if (accent === "right") {
    return {
      glow: "from-rose-500/20 via-rose-400/8 to-transparent",
      text: "text-[color:var(--accent-right)]",
      badge: "border-[color:var(--accent-right-border)] bg-[color:var(--accent-right-soft)] text-[color:var(--accent-right)]",
      marker: "bg-[color:var(--accent-right)]",
    };
  }

  if (accent === "down") {
    return {
      glow: "from-violet-500/18 via-violet-400/8 to-transparent",
      text: "text-[color:var(--accent-down)]",
      badge: "border-[color:var(--accent-down-border)] bg-[color:var(--accent-down-soft)] text-[color:var(--accent-down)]",
      marker: "bg-[color:var(--accent-down)]",
    };
  }

  if (accent === "countdown") {
    return {
      glow: "from-amber-500/22 via-amber-400/8 to-transparent",
      text: "text-[color:var(--accent-countdown)]",
      badge: "border-[color:var(--accent-countdown-border)] bg-[color:var(--accent-countdown-soft)] text-[color:var(--accent-countdown)]",
      marker: "bg-[color:var(--accent-countdown)]",
    };
  }

  return {
    glow: "from-amber-500/12 via-transparent to-transparent",
    text: "text-[color:var(--app-text-strong)]",
    badge: "border-[color:var(--overlay-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)]",
    marker: "bg-[color:var(--app-text-strong)]",
  };
}

function getSegmentClasses(dir: OverlayStatePayload["segments"][number]["dir"]) {
  if (dir === "left") return "from-blue-500 to-sky-400 text-blue-50";
  if (dir === "right") return "from-rose-500 to-pink-400 text-rose-50";
  if (dir === "down") return "from-violet-500 to-fuchsia-400 text-violet-50";
  return "from-white/20 to-white/10 text-white/45";
}

export function OverlayDisplay({ state, className, mode = "embedded", compactMode = "normal" }: OverlayDisplayProps) {
  const accent = getAccentClasses(state.accent);
  const markerLeft = `${Math.min(99, Math.max(1, state.progressPct || 0))}%`;
  const isMiniMode = mode === "mini";
  const isCompact = isMiniMode && compactMode !== "normal";
  const isTight = isMiniMode && compactMode === "tight";

  const largeTextClass = isMiniMode
    ? isTight
      ? state.displayText.length > 4
        ? "text-[14px]"
        : "text-[24px]"
      : isCompact
        ? state.displayText.length > 4
          ? "text-[16px]"
          : "text-[28px]"
        : state.displayText.length > 4
          ? "text-[18px] md:text-[22px]"
          : "text-[32px] md:text-[40px]"
    : state.displayText.length > 4
      ? "text-[38px] md:text-[50px]"
      : "text-[68px] md:text-[96px]";

  return (
    <section
      className={cn(
        "relative overflow-hidden text-[color:var(--app-text)]",
        isMiniMode
          ? "h-full rounded-[22px] border border-[color:var(--overlay-border)] bg-[color:var(--overlay-surface)]"
          : "rounded-[28px] border border-[color:var(--overlay-border)] bg-[color:var(--overlay-surface-strong)] shadow-[var(--app-shadow)]",
        className,
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-100", accent.glow)} style={{ opacity: state.overlayOpacity }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%),linear-gradient(135deg,rgba(244,181,63,0.1),transparent_35%),linear-gradient(180deg,var(--overlay-surface-strong)_0%,var(--overlay-surface)_100%)]" />
      {!isMiniMode ? <div className="absolute inset-0 border border-white/5" /> : null}

      <div
        className={cn(
          "relative flex h-full flex-col",
          isMiniMode
            ? isTight
              ? "min-h-[74px] px-2 py-1.5"
              : isCompact
                ? "min-h-[80px] px-2 py-1.5"
                : "min-h-[84px] px-2.5 py-2 md:min-h-[92px]"
            : "min-h-[200px] px-4 py-4 md:min-h-[230px] md:px-6 md:py-5",
        )}
      >
        <div className={cn("flex justify-between", isMiniMode ? (isTight ? "items-center gap-1.5" : "items-center gap-2") : "items-start gap-3")}>
          <div
            className={cn(
              "inline-flex min-w-0 items-center gap-1.5 rounded-2xl border backdrop-blur-sm",
              isMiniMode
                ? isTight
                  ? "max-w-[34%] px-2 py-0.5"
                  : isCompact
                    ? "max-w-[36%] px-2 py-0.5"
                    : "max-w-[38%] px-2.5 py-1"
                : "min-w-[128px] px-3 py-2",
              accent.badge,
            )}
          >
            <span className={cn("shrink-0 rounded-full bg-current/80", isMiniMode ? "h-2 w-2" : "h-2 w-2")} />
            <span className={cn("truncate font-semibold tracking-wide", isMiniMode ? (isTight ? "text-[9px]" : "text-[10px]") : "text-sm")}>
              {state.weaponName}
            </span>
          </div>

          <div className={cn("min-w-0 flex-1 text-center", isMiniMode ? "px-1 pt-0" : "px-2 pt-1")}>
            <div
              className={cn(
                "truncate font-semibold text-[color:var(--app-text-muted)]",
                isMiniMode ? (isTight ? "text-[8px] tracking-[0.16em]" : "text-[9px] tracking-[0.24em]") : "text-xs tracking-[0.3em]",
              )}
            >
              {state.statusText}
            </div>
            {isMiniMode && !isTight ? (
              <div className={cn("mt-0.5 truncate font-medium text-[color:var(--app-text-muted)]", isCompact ? "text-[9px]" : "text-[10px]")}>
                {state.helperText}
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-2xl border border-[color:var(--overlay-border)] bg-black/10 font-semibold tracking-[0.18em] text-[color:var(--app-text-strong)] backdrop-blur-sm",
              isMiniMode
                ? isTight
                  ? "px-2 py-0.5 text-[9px]"
                  : isCompact
                    ? "px-2 py-0.5 text-[9px]"
                    : "min-w-[56px] px-2.5 py-1 text-[10px]"
                : "min-w-[108px] px-3 py-2 text-sm",
            )}
          >
            {state.triggerLabel}
          </div>
        </div>

        <div className={cn("flex flex-1 flex-col items-center justify-center text-center", isMiniMode ? (isTight ? "gap-0 px-1 pt-0.5" : "gap-0 px-1 pt-1") : "gap-2 px-2 pt-2")}>
          {!isMiniMode ? (
            <div className="text-[11px] font-medium uppercase tracking-[0.35em] text-[color:var(--app-text-muted)]">{state.helperText}</div>
          ) : null}
          <div
            className={cn(
              "font-black leading-none tracking-[-0.08em] drop-shadow-[0_0_22px_rgba(255,255,255,0.14)]",
              largeTextClass,
              accent.text,
            )}
          >
            {state.displayText}
          </div>
        </div>

        <div className={cn("relative", isMiniMode ? "pt-0.5" : "pt-1")}>
          <div className="pointer-events-none absolute z-20 -translate-x-1/2" style={{ left: markerLeft, top: isMiniMode ? "-4px" : "-12px" }}>
            <div
              className={cn(
                "mx-auto h-0 w-0 border-x-transparent border-t-[color:var(--app-text-strong)] drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]",
                isMiniMode ? (isTight ? "border-x-[2px] border-t-[4px]" : "border-x-[3px] border-t-[5px]") : "border-x-[7px] border-t-[10px]",
              )}
            />
            <div
              className={cn(
                "mx-auto rounded-full shadow-[0_0_12px_rgba(255,255,255,0.4)]",
                accent.marker,
                isMiniMode ? (isTight ? "mt-0.5 h-1.5 w-[2px]" : "mt-0.5 h-2 w-[2px]") : "mt-1 h-5 w-[2px]",
              )}
            />
          </div>

          <div
            className={cn(
              "rounded-full bg-black/12 px-[3px] py-[3px] backdrop-blur-sm",
              isMiniMode ? "border-0" : "border border-[color:var(--overlay-border)]",
            )}
          >
            <div className={cn("flex w-full overflow-hidden rounded-full", isMiniMode ? (isTight ? "h-2" : "h-2.5") : "h-5")}>
              {state.segments.map((segment, index) => (
                <div
                  key={`${segment.dir}-${index}`}
                  className={cn(
                    "relative flex h-full min-w-0 items-center justify-center bg-gradient-to-r font-bold tracking-[0.12em] shadow-[inset_-1px_0_0_rgba(0,0,0,0.15)]",
                    isMiniMode ? (isTight ? "text-[0px]" : isCompact ? "text-[5px]" : "text-[6px]") : "text-[10px]",
                    getSegmentClasses(segment.dir),
                  )}
                  style={{ width: `${segment.widthPct}%` }}
                >
                  {!isTight ? <span className="truncate px-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">{segment.label}</span> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
