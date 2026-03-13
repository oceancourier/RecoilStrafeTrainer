export type Direction = "left" | "right" | "down";

export type WeaponPattern = {
  id: string;
  game: string;
  name?: string;
  weapon: string;
  rpm: number;
  magSize: number;
  turns: {
    bullet: number;
    dir: Direction;
    intensity?: number;
    noteType?: string;
    label?: string;
  }[];
  audioPack?: string;
};

export type TimelineCue = {
  bullet: number;
  timeMs: number;
  dir: Direction;
  intensity?: number;
  noteType?: string;
};

export type MonitorBinding =
  | {
      kind: "mouse";
      button: 0 | 1 | 2;
    }
  | {
      kind: "keyboard";
      code: string;
    };

export type PlaybackState = {
  status: "idle" | "monitoring" | "countdown" | "playing";
  currentBullet: number | null;
  currentDirection: Direction | null;
  countdownValue: number | null;
  startedAt: number | null;
  progressMs: number;
};

const BUILT_IN_PATTERN_META: Record<string, { game: string; name: string; weapon: string }> = {
  r301: {
    game: "RecoilStrafeTrainer",
    name: "Carbine Alpha",
    weapon: "Carbine Alpha",
  },
  flatline: {
    game: "RecoilStrafeTrainer",
    name: "Rifle Beta",
    weapon: "Rifle Beta",
  },
  r99: {
    game: "RecoilStrafeTrainer",
    name: "SMG Gamma",
    weapon: "SMG Gamma",
  },
  car: {
    game: "RecoilStrafeTrainer",
    name: "Compact Delta",
    weapon: "Compact Delta",
  },
};

export const defaultPatterns: WeaponPattern[] = [
  {
    id: "r301",
    game: "RecoilStrafeTrainer",
    name: "Carbine Alpha",
    weapon: "Carbine Alpha",
    rpm: 810,
    magSize: 28,
    turns: [
      { bullet: 1, dir: "right" },
      { bullet: 10, dir: "left" },
      { bullet: 18, dir: "right" },
    ],
  },
  {
    id: "flatline",
    game: "RecoilStrafeTrainer",
    name: "Rifle Beta",
    weapon: "Rifle Beta",
    rpm: 600,
    magSize: 30,
    turns: [
      { bullet: 1, dir: "left" },
      { bullet: 12, dir: "right" },
      { bullet: 22, dir: "left" },
    ],
  },
  {
    id: "r99",
    game: "RecoilStrafeTrainer",
    name: "SMG Gamma",
    weapon: "SMG Gamma",
    rpm: 1080,
    magSize: 27,
    turns: [
      { bullet: 1, dir: "right" },
      { bullet: 8, dir: "left" },
      { bullet: 16, dir: "right" },
    ],
  },
  {
    id: "car",
    game: "RecoilStrafeTrainer",
    name: "Compact Delta",
    weapon: "Compact Delta",
    rpm: 930,
    magSize: 27,
    turns: [
      { bullet: 1, dir: "left" },
      { bullet: 10, dir: "right" },
      { bullet: 19, dir: "left" },
    ],
  },
];

function isDirection(value: unknown): value is Direction {
  return value === "left" || value === "right" || value === "down";
}

function toNonNegativeInteger(value: unknown, fallback = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

function sanitizeTurn(turn: WeaponPattern["turns"][number], magSize: number): WeaponPattern["turns"][number] {
  const bullet = Math.max(1, toNonNegativeInteger(turn.bullet, 1));

  return {
    ...turn,
    bullet: magSize > 0 ? Math.min(bullet, magSize) : bullet,
    dir: isDirection(turn.dir) ? turn.dir : "left",
    intensity:
      typeof turn.intensity === "number" && Number.isFinite(turn.intensity) ? Math.max(0, turn.intensity) : undefined,
    noteType: typeof turn.noteType === "string" ? turn.noteType : undefined,
    label: typeof turn.label === "string" ? turn.label : undefined,
  };
}

export function sanitizeWeaponPattern(pattern: WeaponPattern): WeaponPattern {
  const rpm = toNonNegativeInteger(pattern.rpm, 0);
  const magSize = toNonNegativeInteger(pattern.magSize, 0);
  const turns = Array.isArray(pattern.turns)
    ? pattern.turns.map((turn) => sanitizeTurn(turn, magSize)).sort((a, b) => a.bullet - b.bullet)
    : [];

  return {
    ...pattern,
    rpm,
    magSize,
    turns,
  };
}

export function createCustomWeaponPattern(existingPatterns: WeaponPattern[]) {
  let suffix = existingPatterns.length + 1;
  let nextId = `custom-${suffix}`;

  while (existingPatterns.some((pattern) => pattern.id === nextId)) {
    suffix += 1;
    nextId = `custom-${suffix}`;
  }

  const name = `Custom Weapon ${suffix}`;

  return normalizeWeaponPattern({
    id: nextId,
    game: "RecoilStrafeTrainer",
    name,
    weapon: name,
    rpm: 600,
    magSize: 30,
    turns: [
      { bullet: 1, dir: "left" },
      { bullet: 11, dir: "right" },
    ],
  });
}

export function normalizeWeaponPattern(pattern: WeaponPattern): WeaponPattern {
  const sanitizedPattern = sanitizeWeaponPattern(pattern);
  const builtInMeta = BUILT_IN_PATTERN_META[sanitizedPattern.id];

  if (builtInMeta) {
    return {
      ...sanitizedPattern,
      game: builtInMeta.game,
      name: builtInMeta.name,
      weapon: builtInMeta.weapon,
    };
  }

  return {
    ...sanitizedPattern,
    name: sanitizedPattern.name ?? sanitizedPattern.weapon,
    game: sanitizedPattern.game || "RecoilStrafeTrainer",
  };
}

export function normalizeWeaponPatterns(patterns: WeaponPattern[]) {
  return patterns.map(normalizeWeaponPattern);
}
