import { useEffect, useState } from "react";
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { normalizeWeaponPattern, type Direction, type WeaponPattern } from "../data";
import { useAppStore } from "../store";

type DraftTurn = Omit<WeaponPattern["turns"][number], "bullet"> & {
  bullet: string;
};

type DraftWeapon = Omit<WeaponPattern, "rpm" | "magSize" | "turns"> & {
  rpm: string;
  magSize: string;
  turns: DraftTurn[];
};

const DIGITS_ONLY_PATTERN = /^\d*$/;

function buildDraftWeapon(weapon: WeaponPattern): DraftWeapon {
  return {
    ...weapon,
    name: weapon.name ?? weapon.weapon,
    rpm: String(Math.max(0, weapon.rpm)),
    magSize: String(Math.max(0, weapon.magSize)),
    turns: weapon.turns.map((turn) => ({
      ...turn,
      bullet: String(Math.max(1, turn.bullet)),
    })),
  };
}

function parseNonNegativeInteger(value: string, fallback = 0) {
  if (value.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, parsed);
}

function parseTurnBullet(value: string, fallback = 1, maxBullet = 0) {
  if (value.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const nonNegativeValue = Math.max(1, parsed);
  return maxBullet > 0 ? Math.min(nonNegativeValue, maxBullet) : nonNegativeValue;
}

export function SelectedWeapons() {
  const { selectedWeapon, setSelectedWeapon, patterns, setPatterns } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editWeapon, setEditWeapon] = useState<DraftWeapon>(() => buildDraftWeapon(selectedWeapon));

  useEffect(() => {
    if (!isEditing) {
      setEditWeapon(buildDraftWeapon(selectedWeapon));
    }
  }, [isEditing, selectedWeapon]);

  useEffect(() => {
    setEditWeapon(buildDraftWeapon(selectedWeapon));
    setIsEditing(false);
  }, [selectedWeapon.id]);

  const handleSave = () => {
    const magSize = parseNonNegativeInteger(editWeapon.magSize, 0);
    const updatedWeapon = normalizeWeaponPattern({
      ...editWeapon,
      rpm: parseNonNegativeInteger(editWeapon.rpm, 0),
      magSize,
      turns: editWeapon.turns
        .map((turn) => ({
          ...turn,
          bullet: parseTurnBullet(turn.bullet, 1, magSize),
        }))
        .sort((a, b) => a.bullet - b.bullet),
    });

    setSelectedWeapon(updatedWeapon);
    setPatterns(patterns.map((pattern) => (pattern.id === updatedWeapon.id ? updatedWeapon : pattern)));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditWeapon(buildDraftWeapon(selectedWeapon));
    setIsEditing(false);
  };

  const handleNumberInputChange = (field: "rpm" | "magSize", value: string) => {
    if (!DIGITS_ONLY_PATTERN.test(value)) {
      return;
    }

    setEditWeapon((currentWeapon) => ({
      ...currentWeapon,
      [field]: value,
    }));
  };

  const addTurn = () => {
    const maxBullet = editWeapon.turns.length > 0 ? Math.max(...editWeapon.turns.map((turn) => parseTurnBullet(turn.bullet, 1))) : 0;
    const currentMagSize = parseNonNegativeInteger(editWeapon.magSize, 0);
    const nextBullet = currentMagSize > 0 ? Math.min(maxBullet + 5, currentMagSize) : Math.max(1, maxBullet + 1);

    setEditWeapon((currentWeapon) => ({
      ...currentWeapon,
      turns: [...currentWeapon.turns, { bullet: String(nextBullet), dir: "left" }],
    }));
  };

  const removeTurn = (index: number) => {
    const nextTurns = [...editWeapon.turns];
    nextTurns.splice(index, 1);
    setEditWeapon({
      ...editWeapon,
      turns: nextTurns,
    });
  };

  const updateTurn = (index: number, field: "bullet" | "dir", value: string | Direction) => {
    const nextTurns = [...editWeapon.turns];
    const nextTurn = { ...nextTurns[index] };

    if (field === "bullet") {
      const nextValue = String(value);
      if (!DIGITS_ONLY_PATTERN.test(nextValue)) {
        return;
      }

      nextTurn.bullet = nextValue;
    } else {
      nextTurn.dir = value as Direction;
    }

    nextTurns[index] = nextTurn;
    setEditWeapon({
      ...editWeapon,
      turns: nextTurns,
    });
  };

  const previewRpm = parseNonNegativeInteger(editWeapon.rpm, 0);
  const previewMagSize = parseNonNegativeInteger(editWeapon.magSize, 0);

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>{!isEditing ? <h3 className="text-[24px] font-black tracking-[-0.05em] text-[color:var(--app-text-strong)]">{selectedWeapon.name}</h3> : null}</div>

        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <button type="button" onClick={handleSave} className="action-button-primary h-9 min-h-9 px-3.5">
                <Check className="h-4 w-4" />
                保存
              </button>
              <button type="button" onClick={handleCancel} className="action-button-secondary h-9 min-h-9 px-3.5">
                <X className="h-4 w-4" />
                取消
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="action-button-secondary h-9 min-h-9 px-3.5">
              <Edit2 className="h-4 w-4" />
              编辑
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="grid min-h-0 gap-2.5">
          <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_104px_104px]">
            <input
              type="text"
              value={editWeapon.name}
              onChange={(event) => setEditWeapon({ ...editWeapon, name: event.target.value })}
              className="app-input h-10 text-base font-black tracking-[-0.03em]"
            />

            <input
              id="weaponRpm"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={editWeapon.rpm}
              onChange={(event) => handleNumberInputChange("rpm", event.target.value)}
              className="app-input h-10 text-center text-sm font-bold"
              placeholder="0"
              title="射速 RPM"
            />

            <input
              id="weaponMagSize"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={editWeapon.magSize}
              onChange={(event) => handleNumberInputChange("magSize", event.target.value)}
              className="app-input h-10 text-center text-sm font-bold"
              placeholder="0"
              title="弹匣容量"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <div className="helper-badge">RPM {previewRpm}</div>
              <div className="helper-badge">弹匣 {previewMagSize}</div>
              <div className="helper-badge">拐点 {editWeapon.turns.length}</div>
            </div>

            <button type="button" onClick={addTurn} className="action-button-secondary h-9 min-h-9 px-3">
              <Plus className="h-4 w-4" />
              添加拐点
            </button>
          </div>

          <div className="custom-scroll min-h-0 max-h-[156px] space-y-2 overflow-y-auto pr-1">
            {editWeapon.turns.map((turn, index) => (
              <div
                key={`${selectedWeapon.id}-turn-${index}`}
                className="grid gap-2 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-2 md:grid-cols-[82px_minmax(0,1fr)_38px]"
              >
                <input
                  id={`turn-bullet-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={turn.bullet}
                  onChange={(event) => updateTurn(index, "bullet", event.target.value)}
                  className="app-input h-9 text-center text-sm font-bold"
                  placeholder="1"
                  title="第几发"
                />

                <select
                  id={`turn-dir-${index}`}
                  value={turn.dir}
                  onChange={(event) => updateTurn(index, "dir", event.target.value as Direction)}
                  className="app-select h-9 text-sm font-semibold"
                >
                  <option value="left">向左 (A)</option>
                  <option value="right">向右 (D)</option>
                  <option value="down">向下 (S)</option>
                </select>

                <button type="button" onClick={() => removeTurn(index)} className="icon-action-button h-9 w-9">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {editWeapon.turns.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[color:var(--app-border)] px-4 py-5 text-center text-sm text-[color:var(--app-text-muted)]">
                暂无拐点
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2.5">
            <div className="stat-label">射速</div>
            <div className="mt-1.5 text-[20px] font-black tracking-[-0.03em] text-[color:var(--app-text-strong)]">{selectedWeapon.rpm} RPM</div>
          </div>
          <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2.5">
            <div className="stat-label">弹匣</div>
            <div className="mt-1.5 text-[20px] font-black tracking-[-0.03em] text-[color:var(--app-text-strong)]">{selectedWeapon.magSize} 发</div>
          </div>
          <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2.5">
            <div className="stat-label">拐点</div>
            <div className="mt-1.5 text-[20px] font-black tracking-[-0.03em] text-[color:var(--app-text-strong)]">{selectedWeapon.turns.length} 段</div>
          </div>
        </div>
      )}
    </div>
  );
}
