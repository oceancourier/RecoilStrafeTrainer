import { Controls } from "./Controls";
import { SelectedWeapons } from "./SelectedWeapons";
import { StrafePattern } from "./StrafePattern";
import { useAppStore } from "../store";

export function MainPanel() {
  const { selectedWeapon, statusText } = useAppStore();

  return (
    <section className="panel-surface flex h-full min-h-0 flex-col overflow-hidden p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="section-kicker">Dashboard</div>
          <h2 className="truncate text-[20px] font-black tracking-[-0.04em] text-[color:var(--app-text-strong)]">{selectedWeapon.name}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="helper-badge">状态: {statusText}</div>
          <div className="helper-badge">弹匣: {selectedWeapon.magSize} 发</div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 grid-rows-[auto_auto_minmax(0,1fr)]">
        <div className="panel-soft p-3">
          <SelectedWeapons />
        </div>

        <Controls />

        <div className="panel-soft min-h-0 p-3">
          <StrafePattern />
        </div>
      </div>
    </section>
  );
}
