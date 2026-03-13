import { Plus, Trash2 } from "lucide-react";
import { createCustomWeaponPattern } from "../data";
import { useAppStore } from "../store";

export function WeaponList() {
  const { patterns, selectedWeapon, setPatterns, setSelectedWeapon } = useAppStore();
  const canDeleteWeapon = patterns.length > 1;

  const handleAddWeapon = () => {
    const nextWeapon = createCustomWeaponPattern(patterns);
    setPatterns([...patterns, nextWeapon]);
    setSelectedWeapon(nextWeapon);
  };

  const handleDeleteWeapon = (weaponId: string) => {
    if (!canDeleteWeapon) {
      return;
    }

    const deletedIndex = patterns.findIndex((weapon) => weapon.id === weaponId);
    const nextPatterns = patterns.filter((weapon) => weapon.id !== weaponId);

    setPatterns(nextPatterns);

    if (selectedWeapon.id !== weaponId) {
      return;
    }

    const nextSelectedWeapon = nextPatterns[Math.min(deletedIndex, nextPatterns.length - 1)] ?? nextPatterns[0];
    if (nextSelectedWeapon) {
      setSelectedWeapon(nextSelectedWeapon);
    }
  };

  return (
    <div className="panel-surface flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-[color:var(--app-border)] px-4 pb-3 pt-4">
        <div className="section-kicker">Weapons</div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">武器列表</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="helper-badge">{patterns.length} 把</div>
            <button type="button" onClick={handleAddWeapon} className="icon-action-button h-9 w-9" title="新增武器">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-2">
          {patterns.map((weapon) => {
            const isActive = weapon.id === selectedWeapon.id;

            return (
              <div key={weapon.id} className={isActive ? "weapon-row weapon-row-active flex items-center gap-2" : "weapon-row weapon-row-idle flex items-center gap-2"}>
                <button
                  type="button"
                  onClick={() => setSelectedWeapon(weapon)}
                  className="min-w-0 flex flex-1 items-center justify-between gap-2 bg-transparent text-left"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold tracking-[0.01em] text-[color:var(--app-text-strong)]">{weapon.name}</div>
                    <div className="mt-1 text-xs text-[color:var(--app-text-muted)]">
                      {weapon.rpm} RPM · {weapon.magSize} 发
                    </div>
                  </div>

                  <div
                    className={
                      isActive
                        ? "rounded-full bg-[color:var(--app-accent-soft)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--app-accent-strong)]"
                        : "rounded-full border border-[color:var(--app-border)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--app-text-muted)]"
                    }
                  >
                    {weapon.turns.length} 段
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteWeapon(weapon.id)}
                  className="icon-action-button h-9 w-9 shrink-0"
                  title={canDeleteWeapon ? `删除 ${weapon.name}` : "至少保留一把武器"}
                  disabled={!canDeleteWeapon}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
