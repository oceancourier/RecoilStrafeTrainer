import { type OverlayAccent, type OverlayStatePayload } from "../overlay";
import { cn } from "../utils";

type OverlayDisplayProps = {
  state: OverlayStatePayload;
  className?: string;
};

function getAccentClasses(accent: OverlayAccent) {
  if (accent === "left") {
    return {
      glow: "from-blue-500/25 via-blue-400/10 to-transparent",
      text: "text-blue-100",
      badge: "border-blue-300/30 bg-blue-400/10 text-blue-50",
      marker: "bg-blue-300",
    };
  }

  if (accent === "right") {
    return {
      glow: "from-rose-500/25 via-rose-400/10 to-transparent",
      text: "text-rose-100",
      badge: "border-rose-300/30 bg-rose-400/10 text-rose-50",
      marker: "bg-rose-300",
    };
  }

  if (accent === "down") {
    return {
      glow: "from-violet-500/25 via-violet-400/10 to-transparent",
      text: "text-violet-100",
      badge: "border-violet-300/30 bg-violet-400/10 text-violet-50",
      marker: "bg-violet-300",
    };
  }

  if (accent === "countdown") {
    return {
      glow: "from-amber-500/25 via-amber-400/10 to-transparent",
      text: "text-amber-50",
      badge: "border-amber-300/30 bg-amber-400/10 text-amber-50",
      marker: "bg-amber-300",
    };
  }

  return {
    glow: "from-amber-500/20 via-transparent to-transparent",
    text: "text-white",
    badge: "border-white/15 bg-white/[0.07] text-white/90",
    marker: "bg-white",
  };
}

function getSegmentClasses(dir: OverlayStatePayload["segments"][number]["dir"]) {
  if (dir === "left") return "from-blue-500 to-blue-400 text-blue-50";
  if (dir === "right") return "from-rose-500 to-rose-400 text-rose-50";
  if (dir === "down") return "from-violet-500 to-violet-400 text-violet-50";
  return "from-white/[0.08] to-white/[0.05] text-white/40";
}

export function OverlayDisplay({ state, className }: OverlayDisplayProps) {
  const accent = getAccentClasses(state.accent);
  const markerLeft = `${Math.min(99, Math.max(1, state.progressPct || 0))}%`;
  const largeTextClass = state.displayText.length > 4 ? "text-[42px] md:text-[56px]" : "text-[74px] md:text-[110px]";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-[#11161f] text-white shadow-[0_22px_80px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-100",
          accent.glow,
        )}
        style={{ opacity: state.overlayOpacity }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_40%),linear-gradient(135deg,rgba(255,191,36,0.12),transparent_32%),linear-gradient(180deg,#1a202b_0%,#0c1016_100%)]" />
      <div className="absolute inset-0 border border-white/5" />

      <div className="relative flex h-full min-h-[200px] flex-col px-4 py-4 md:min-h-[240px] md:px-6 md:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("inline-flex min-w-[128px] items-center gap-2 rounded-2xl border px-3 py-2 backdrop-blur-sm", accent.badge)}>
            <span className="h-2 w-2 rounded-full bg-current/80" />
            <span className="truncate text-sm font-semibold tracking-wide">{state.weaponName}</span>
          </div>

          <div className="flex-1 px-2 pt-1 text-center">
            <div className="text-xs font-semibold tracking-[0.35em] text-white/60">{state.statusText}</div>
          </div>

          <div className="inline-flex min-w-[108px] items-center justify-center rounded-2xl border border-white/12 bg-black/20 px-3 py-2 text-sm font-semibold tracking-[0.2em] text-white/90 backdrop-blur-sm">
            {state.triggerLabel}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2 pt-3 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/45">{state.helperText}</div>
          <div className={cn("font-black leading-none tracking-[-0.08em] drop-shadow-[0_0_22px_rgba(255,255,255,0.18)]", largeTextClass, accent.text)}>
            {state.displayText}
          </div>
        </div>

        <div className="relative pt-1">
          <div className="pointer-events-none absolute -top-3 z-20 -translate-x-1/2" style={{ left: markerLeft }}>
            <div className="mx-auto h-0 w-0 border-x-[7px] border-x-transparent border-t-[10px] border-t-white/95 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]" />
            <div className={cn("mx-auto mt-1 h-5 w-[2px] rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)]", accent.marker)} />
          </div>

          <div className="rounded-full border border-white/10 bg-black/35 px-[3px] py-[3px] backdrop-blur-sm">
            <div className="flex h-5 overflow-hidden rounded-full">
              {state.segments.map((segment, index) => (
                <div
                  key={`${segment.dir}-${index}`}
                  className={cn(
                    "relative flex h-full items-center justify-center bg-gradient-to-r text-[10px] font-bold tracking-[0.15em] shadow-[inset_-1px_0_0_rgba(0,0,0,0.18)]",
                    getSegmentClasses(segment.dir),
                  )}
                  style={{ width: `${segment.widthPct}%` }}
                >
                  <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">{segment.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
