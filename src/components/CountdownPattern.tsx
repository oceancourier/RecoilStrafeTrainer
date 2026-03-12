import { useAppStore } from "../store";

export function CountdownPattern() {
  const { selectedWeapon, playbackState, totalDuration, statusText, timeline, waitTime } = useAppStore();

  const sequenceDuration = totalDuration; // pattern + reload
  const intervalMs = 60000 / selectedWeapon.rpm;
  const magDuration = selectedWeapon.magSize * intervalMs;
  const totalCountdownMs = waitTime * 1000 + 1500;

  const segments = [];
  let currentDir = timeline[0]?.dir || 'none';
  let currentStart = 1;

  for (let i = 1; i <= selectedWeapon.magSize; i++) {
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
  segments.push({ dir: currentDir, count: selectedWeapon.magSize - currentStart + 1 });

  const getWidth = (duration: number) => `${(duration / sequenceDuration) * 100}%`;

  const renderSequence = () => (
    <div className="relative h-full flex" style={{ width: "33.333333%" }}>
      {segments.map((seg, i) => {
        let bgColor = "bg-white/5";
        if (seg.dir === "left") bgColor = "bg-blue-500";
        if (seg.dir === "right") bgColor = "bg-rose-500";
        if (seg.dir === "down") bgColor = "bg-purple-500";

        return (
          <div
            key={i}
            className={`${bgColor} relative h-full border-r border-black/20`}
            style={{ width: getWidth(seg.count * intervalMs) }}
          >
            <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-white/90 drop-shadow-md">
              {seg.dir === "left" ? "A" : seg.dir === "right" ? "D" : seg.dir === "down" ? "S" : ""}
            </span>
          </div>
        );
      })}
      <div
        className="bg-emerald-600 relative h-full flex items-center justify-center"
        style={{ width: getWidth(waitTime * 1000) }}
      >
        <span className="text-[10px] font-bold text-white/90 drop-shadow-md">R</span>
      </div>
    </div>
  );

  if (playbackState.status === "countdown") {
    const progressPct = Math.min(100, (playbackState.progressMs / totalCountdownMs) * 100);
    return (
      <div className="pt-2">
        <div className="text-white">
          <div className="group relative mb-4 rounded-xl border border-white/10 bg-gradient-to-br from-gray-900 to-black min-w-0 overflow-hidden select-none min-h-[160px] md:min-h-[280px] shadow-2xl">
            {/* Yellow glow */}
            <div className="absolute inset-0 opacity-20 bg-amber-500 transition-colors duration-300" />
            
            <div className="absolute left-4 top-4 z-20">
              <div className="inline-flex items-center gap-2 rounded-md border px-2 py-1 border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="text-xs font-semibold text-white/80">
                  {selectedWeapon.name}
                </div>
              </div>
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 top-4 z-20">
              <span className="text-xs font-medium text-white/50 tracking-widest uppercase">
                {statusText}
              </span>
            </div>

            <div className="flex items-center justify-center h-full pt-8 z-10 relative">
              <div className="text-[64px] md:text-[96px] font-black leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] text-amber-500">
                {playbackState.countdownValue !== null ? playbackState.countdownValue : "-"}
              </div>
            </div>

            <div className="absolute left-0 right-0 bottom-6 px-8 z-20">
              <div className="h-4 w-full rounded-full overflow-hidden bg-black/50 border border-white/10 relative">
                <div 
                  className="h-full bg-amber-500 transition-all duration-100 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progressPct = (playbackState.progressMs / sequenceDuration) * 100;
  const translateX = -16.666667 - (progressPct / 3);

  let mainDisplay = "-";
  if (playbackState.status === "playing" || playbackState.status === "paused") {
    if (playbackState.currentDirection) {
      if (playbackState.currentDirection === "left") mainDisplay = "A";
      else if (playbackState.currentDirection === "right") mainDisplay = "D";
      else if (playbackState.currentDirection === "down") mainDisplay = "S";
    }
    if (playbackState.progressMs >= magDuration) {
      mainDisplay = "R";
    }
  }

  return (
    <div className="pt-2">
      <div className="text-white">
        <div className="group relative mb-4 rounded-xl border border-white/10 bg-gradient-to-br from-gray-900 to-black min-w-0 overflow-hidden select-none min-h-[160px] md:min-h-[280px] shadow-2xl">
          {/* Background glow based on current direction */}
          <div className={`absolute inset-0 opacity-20 transition-colors duration-300 ${
            mainDisplay === 'A' ? 'bg-blue-500' : 
            mainDisplay === 'D' ? 'bg-rose-500' : 
            mainDisplay === 'S' ? 'bg-purple-500' : 
            mainDisplay === 'R' ? 'bg-emerald-500' : 'bg-transparent'
          }`} />
          
          <div className="absolute left-4 top-4 z-20">
            <div className="inline-flex items-center gap-2 rounded-md border px-2 py-1 border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="text-xs font-semibold text-white/80">
                {selectedWeapon.name}
              </div>
            </div>
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 top-4 z-20">
            <span className="text-xs font-medium text-white/50 tracking-widest uppercase">
              {statusText}
            </span>
          </div>

          <div className="flex items-center justify-center h-full pt-8 z-10 relative">
            <div className="text-[64px] md:text-[96px] font-black leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {mainDisplay}
            </div>
          </div>

          <div className="absolute left-0 right-0 bottom-6 px-8 z-20">
            <div className="relative">
              <div className="h-4 w-full rounded-full overflow-hidden bg-black/50 border border-white/10 relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <div
                  className="h-full flex absolute top-0 left-0 will-change-transform"
                  style={{ 
                    width: "300%", 
                    transform: `translateX(${translateX}%)`
                  }}
                >
                  {renderSequence()}
                  {renderSequence()}
                  {renderSequence()}
                </div>
              </div>
              
              {/* Glowing Playhead */}
              <div className="pointer-events-none absolute inset-0 z-30 flex justify-center">
                <div className="w-[2px] h-6 -mt-1 bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.8)] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
