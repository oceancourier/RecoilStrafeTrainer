import { useAppStore } from "../store";

export function StrafePattern() {
  const { selectedWeapon, timeline } = useAppStore();
  const totalBullets = Math.max(0, selectedWeapon.magSize);

  const segments: { dir: "left" | "right" | "down" | "none"; count: number }[] = [];

  if (totalBullets > 0) {
    let currentDir: "left" | "right" | "down" | "none" = timeline[0]?.dir || "none";
    let currentStart = 1;

    for (let bullet = 1; bullet <= totalBullets; bullet += 1) {
      let activeDir = currentDir;

      for (let index = timeline.length - 1; index >= 0; index -= 1) {
        if (timeline[index].bullet <= bullet) {
          activeDir = timeline[index].dir;
          break;
        }
      }

      if (activeDir !== currentDir) {
        segments.push({ dir: currentDir, count: bullet - currentStart });
        currentDir = activeDir;
        currentStart = bullet;
      }
    }

    segments.push({ dir: currentDir, count: totalBullets - currentStart + 1 });
  }

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-black tracking-[-0.04em] text-[color:var(--app-text-strong)]">横移节奏</h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <div className="helper-badge">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            左
          </div>
          <div className="helper-badge">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
            右
          </div>
          <div className="helper-badge">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-violet-500" />
            下
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-2.5">
        {totalBullets > 0 ? (
          <div className="relative overflow-hidden rounded-full border border-[color:var(--app-border)] bg-black/10 p-1">
            <div className="flex h-[18px] overflow-hidden rounded-full">
              {segments.map((segment, index) => {
                let bgClass = "bg-white/20";
                if (segment.dir === "left") bgClass = "bg-blue-500";
                if (segment.dir === "right") bgClass = "bg-rose-500";
                if (segment.dir === "down") bgClass = "bg-violet-500";

                return (
                  <div
                    key={`${segment.dir}-${index}`}
                    className={`${bgClass} h-full border-r border-black/15`}
                    style={{ width: `${(segment.count / totalBullets) * 100}%` }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[color:var(--app-border)] px-4 py-5 text-center text-sm text-[color:var(--app-text-muted)]">
            当前武器没有可用子弹数，时间轴暂不显示。
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          <div className="helper-badge">总子弹 {totalBullets} 发</div>
          <div className="helper-badge">分段数 {segments.length} 段</div>
        </div>
      </div>
    </div>
  );
}
