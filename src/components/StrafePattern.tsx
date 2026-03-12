import { useAppStore } from "../store";

export function StrafePattern() {
  const { selectedWeapon, timeline } = useAppStore();
  const totalBullets = selectedWeapon.magSize;

  const segments = [];
  let currentDir = timeline[0]?.dir || 'none';
  let currentStart = 1;

  for (let i = 1; i <= totalBullets; i++) {
    let activeDir = currentDir;
    for (let j = timeline.length - 1; j >= 0; j--) {
      if (timeline[j].bullet <= i) {
        activeDir = timeline[j].dir;
        break;
      }
    }
    if (activeDir !== currentDir) {
      segments.push({ dir: currentDir, count: i - currentStart });
      currentDir = activeDir;
      currentStart = i;
    }
  }
  segments.push({ dir: currentDir, count: totalBullets - currentStart + 1 });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/90 font-semibold tracking-wide">
          横移模式
        </div>
        <div className="text-xs text-white/60">
          <span className="inline-flex items-center mr-3">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-sm mr-1"></span> 左
          </span>
          <span className="inline-flex items-center mr-3">
            <span className="inline-block w-3 h-3 bg-rose-500 rounded-sm mr-1"></span> 右
          </span>
          <span className="inline-flex items-center">
            <span className="inline-block w-3 h-3 bg-purple-500 rounded-sm mr-1"></span> 下
          </span>
        </div>
      </div>
      <div className="h-4 w-full rounded-md overflow-hidden bg-white/10 border border-white/10 relative">
        <div className="absolute inset-0 flex">
          {segments.map((seg, i) => {
            let bgColor = "bg-white/5";
            if (seg.dir === "left") bgColor = "bg-blue-500";
            if (seg.dir === "right") bgColor = "bg-rose-500";
            if (seg.dir === "down") bgColor = "bg-purple-500";

            return (
              <div
                key={i}
                className={`h-full border-r border-black/20 ${bgColor}`}
                style={{ width: `${(seg.count / totalBullets) * 100}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
