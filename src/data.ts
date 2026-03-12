export type Direction = "left" | "right" | "down";

export type WeaponPattern = {
  id: string;
  game: string;
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

export type PlaybackState = {
  status: "idle" | "countdown" | "playing" | "paused" | "completed";
  currentBullet: number | null;
  currentDirection: Direction | null;
  countdownValue: number | null;
  startedAt: number | null;
  progressMs: number;
};

export const defaultPatterns: WeaponPattern[] = [
  {
    id: "r301",
    game: "Apex Legends",
    weapon: "R-301",
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
    game: "Apex Legends",
    weapon: "Flatline",
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
    game: "Apex Legends",
    weapon: "R-99",
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
    game: "Apex Legends",
    weapon: "C.A.R.",
    rpm: 930,
    magSize: 27,
    turns: [
      { bullet: 1, dir: "left" },
      { bullet: 10, dir: "right" },
      { bullet: 19, dir: "left" },
    ],
  }
];
