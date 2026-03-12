import { type Direction, type MonitorBinding, type PlaybackState, type TimelineCue, type WeaponPattern } from "./data";

export const OVERLAY_CHANNEL = "apex-recoil-overlay";
export const OVERLAY_STATE_STORAGE_KEY = "apex_recoil_overlay_state";

export type OverlayAccent = "neutral" | "countdown" | Direction;

export type OverlaySegment = {
  dir: Direction | "none";
  label: string;
  widthPct: number;
};

export type OverlayStatePayload = {
  weaponName: string;
  statusText: string;
  triggerLabel: string;
  displayText: string;
  helperText: string;
  accent: OverlayAccent;
  phase: PlaybackState["status"];
  progressPct: number;
  segments: OverlaySegment[];
  overlayScale: number;
  overlayOpacity: number;
};

type BuildOverlayStateParams = {
  selectedWeapon: WeaponPattern;
  playbackState: PlaybackState;
  timeline: TimelineCue[];
  waitTime: number;
  totalDuration: number;
  statusText: string;
  triggerBinding: MonitorBinding;
  overlayScale: number;
  overlayOpacity: number;
};

const KEY_LABELS: Record<string, string> = {
  Space: "SPACE",
  ShiftLeft: "LSHIFT",
  ShiftRight: "RSHIFT",
  ControlLeft: "LCTRL",
  ControlRight: "RCTRL",
  AltLeft: "LALT",
  AltRight: "RALT",
  Enter: "ENTER",
  Tab: "TAB",
  Backquote: "`",
  Escape: "ESC",
};

export function getWeaponLabel(pattern: WeaponPattern) {
  return pattern.name ?? pattern.weapon;
}

export function formatMonitorBinding(binding: MonitorBinding) {
  if (binding.kind === "mouse") {
    if (binding.button === 0) return "LMB";
    if (binding.button === 1) return "MMB";
    return "RMB";
  }

  if (KEY_LABELS[binding.code]) {
    return KEY_LABELS[binding.code];
  }

  if (binding.code.startsWith("Key")) {
    return binding.code.replace("Key", "").toUpperCase();
  }

  if (binding.code.startsWith("Digit")) {
    return binding.code.replace("Digit", "");
  }

  return binding.code.toUpperCase();
}

export function isSameMonitorBinding(a: MonitorBinding, b: MonitorBinding) {
  if (a.kind !== b.kind) return false;

  if (a.kind === "mouse" && b.kind === "mouse") {
    return a.button === b.button;
  }

  if (a.kind === "keyboard" && b.kind === "keyboard") {
    return a.code === b.code;
  }

  return false;
}

export function buildOverlaySegments(timeline: TimelineCue[], magSize: number): OverlaySegment[] {
  if (magSize <= 0) {
    return [];
  }

  if (timeline.length === 0) {
    return [
      {
        dir: "none",
        label: "",
        widthPct: 100,
      },
    ];
  }

  const segments: OverlaySegment[] = [];
  let currentDir: Direction | "none" = timeline[0]?.dir ?? "none";
  let currentStart = 1;

  for (let bullet = 1; bullet <= magSize; bullet += 1) {
    let activeDir: Direction | "none" = currentDir;

    for (let i = timeline.length - 1; i >= 0; i -= 1) {
      if (timeline[i].bullet <= bullet) {
        activeDir = timeline[i].dir;
        break;
      }
    }

    if (activeDir !== currentDir) {
      const count = bullet - currentStart;
      segments.push({
        dir: currentDir,
        label: getDirectionDisplay(currentDir),
        widthPct: (count / magSize) * 100,
      });
      currentDir = activeDir;
      currentStart = bullet;
    }
  }

  segments.push({
    dir: currentDir,
    label: getDirectionDisplay(currentDir),
    widthPct: ((magSize - currentStart + 1) / magSize) * 100,
  });

  return segments;
}

export function getDirectionDisplay(direction: Direction | "none" | null) {
  if (direction === "left") return "A";
  if (direction === "right") return "D";
  if (direction === "down") return "S";
  return "-";
}

export function buildOverlayState({
  selectedWeapon,
  playbackState,
  timeline,
  waitTime,
  totalDuration,
  statusText,
  triggerBinding,
  overlayScale,
  overlayOpacity,
}: BuildOverlayStateParams): OverlayStatePayload {
  const triggerLabel = formatMonitorBinding(triggerBinding);
  const triggerDelayMs = waitTime * 1000;
  const weaponName = getWeaponLabel(selectedWeapon);

  let displayText = "OFF";
  let helperText = "点击开始后进入监听";
  let accent: OverlayAccent = "neutral";
  let progressPct = 0;

  if (playbackState.status === "monitoring") {
    displayText = triggerLabel;
    helperText = `按下 ${triggerLabel} 触发一次`;
  } else if (playbackState.status === "countdown") {
    const remainingMs = Math.max(0, triggerDelayMs - playbackState.progressMs);
    displayText = remainingMs >= 1000 ? (remainingMs / 1000).toFixed(1) : (remainingMs / 1000).toFixed(2);
    helperText = "触发延迟";
    accent = "countdown";
    progressPct = triggerDelayMs > 0 ? Math.min(100, (playbackState.progressMs / triggerDelayMs) * 100) : 0;
  } else if (playbackState.status === "playing") {
    displayText = getDirectionDisplay(playbackState.currentDirection);
    helperText = playbackState.currentBullet
      ? `第 ${playbackState.currentBullet} / ${selectedWeapon.magSize} 发`
      : `共 ${selectedWeapon.magSize} 发`;
    accent = playbackState.currentDirection ?? "neutral";
    progressPct = totalDuration > 0 ? Math.min(100, (playbackState.progressMs / totalDuration) * 100) : 0;
  }

  return {
    weaponName,
    statusText,
    triggerLabel,
    displayText,
    helperText,
    accent,
    phase: playbackState.status,
    progressPct,
    segments: buildOverlaySegments(timeline, selectedWeapon.magSize),
    overlayScale,
    overlayOpacity,
  };
}
