import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  defaultPatterns,
  type Direction,
  type MonitorBinding,
  normalizeWeaponPattern,
  normalizeWeaponPatterns,
  type PlaybackState,
  type TimelineCue,
  type WeaponPattern,
} from "./data";
import { getDesktopApi, isElectronDesktop } from "./desktop";
import { isSameMonitorBinding } from "./overlay";

interface AppContextType {
  patterns: WeaponPattern[];
  setPatterns: (patterns: WeaponPattern[]) => void;
  selectedWeapon: WeaponPattern;
  setSelectedWeapon: (weapon: WeaponPattern) => void;
  playbackState: PlaybackState;
  togglePlaying: () => void;
  volume: number;
  setVolume: (value: number) => void;
  waitTime: number;
  setWaitTime: (value: number) => void;
  timeline: TimelineCue[];
  totalDuration: number;
  statusText: string;
  triggerBinding: MonitorBinding;
  setTriggerBinding: (binding: MonitorBinding) => void;
  overlayScale: number;
  setOverlayScale: (value: number) => void;
  overlayOpacity: number;
  setOverlayOpacity: (value: number) => void;
  triggerScopeNotice: string;
}

const AppContext = createContext<AppContextType | null>(null);

class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ??
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;

      const compressor = this.ctx.createDynamicsCompressor();
      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);

      const silentBuffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(this.ctx.destination);
      source.start();
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  scheduleCue(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.masterGain) {
      return;
    }

    const startTime = Math.max(time, this.ctx.currentTime);
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  stopAll() {
    if (!this.ctx || !this.masterGain) {
      return;
    }

    this.masterGain.disconnect();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;

    const compressor = this.ctx.createDynamicsCompressor();
    this.masterGain.connect(compressor);
    compressor.connect(this.ctx.destination);
  }
}

const audio = new AudioEngine();

const STORAGE_KEY = "recoil_strafe_trainer_patterns";
const SELECTED_STORAGE_KEY = "recoil_strafe_trainer_selected";
const SETTINGS_STORAGE_KEY = "recoil_strafe_trainer_settings";
const PRESET_VERSION_STORAGE_KEY = "recoil_strafe_trainer_preset_version";
const DEFAULT_PRESET_VERSION = "2026-03-ak47-release";
const LEGACY_STORAGE_SUFFIXES = {
  patterns: "_strafe_patterns",
  selected: "_strafe_selected",
  settings: "_strafe_settings",
} as const;
const DEFAULT_TRIGGER_BINDING: MonitorBinding = { kind: "mouse", button: 0 };
const DEFAULT_OVERLAY_SCALE = 0.88;
const DEFAULT_OVERLAY_OPACITY = 0.92;
const IDLE_PLAYBACK_STATE: PlaybackState = {
  status: "idle",
  currentBullet: null,
  currentDirection: null,
  countdownValue: null,
  startedAt: null,
  progressMs: 0,
};

function parseMonitorBinding(value: unknown): MonitorBinding | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<MonitorBinding>;

  if (candidate.kind === "mouse" && (candidate.button === 0 || candidate.button === 1 || candidate.button === 2)) {
    return {
      kind: "mouse",
      button: candidate.button,
    };
  }

  if (candidate.kind === "keyboard" && typeof candidate.code === "string" && candidate.code.length > 0) {
    return {
      kind: "keyboard",
      code: candidate.code,
    };
  }

  return null;
}

function readStoredValue(primaryKey: string, legacySuffix?: string) {
  const currentValue = localStorage.getItem(primaryKey);
  if (currentValue) {
    return currentValue;
  }

  if (!legacySuffix) {
    return null;
  }

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.endsWith(legacySuffix)) {
      continue;
    }

    const legacyValue = localStorage.getItem(key);
    if (legacyValue) {
      return legacyValue;
    }
  }

  return null;
}

function readStoredSettings() {
  try {
    const raw = readStoredValue(SETTINGS_STORAGE_KEY, LEGACY_STORAGE_SUFFIXES.settings);
    if (!raw) {
      return {
        triggerBinding: DEFAULT_TRIGGER_BINDING,
        overlayScale: DEFAULT_OVERLAY_SCALE,
        overlayOpacity: DEFAULT_OVERLAY_OPACITY,
      };
    }

    const parsed = JSON.parse(raw) as {
      triggerBinding?: unknown;
      overlayScale?: unknown;
      overlayOpacity?: unknown;
    };

    const triggerBinding = parseMonitorBinding(parsed.triggerBinding) ?? DEFAULT_TRIGGER_BINDING;
    const overlayScale =
      typeof parsed.overlayScale === "number" && Number.isFinite(parsed.overlayScale) ? parsed.overlayScale : DEFAULT_OVERLAY_SCALE;
    const overlayOpacity =
      typeof parsed.overlayOpacity === "number" && Number.isFinite(parsed.overlayOpacity)
        ? parsed.overlayOpacity
        : DEFAULT_OVERLAY_OPACITY;

    return {
      triggerBinding,
      overlayScale,
      overlayOpacity,
    };
  } catch {
    return {
      triggerBinding: DEFAULT_TRIGGER_BINDING,
      overlayScale: DEFAULT_OVERLAY_SCALE,
      overlayOpacity: DEFAULT_OVERLAY_OPACITY,
    };
  }
}

function hasCurrentPresetVersion() {
  return localStorage.getItem(PRESET_VERSION_STORAGE_KEY) === DEFAULT_PRESET_VERSION;
}

function getCueFrequency(direction: Direction) {
  if (direction === "left") {
    return 400;
  }

  if (direction === "right") {
    return 800;
  }

  return 1200;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const hasNativeDesktop = isElectronDesktop();

  const [patterns, setPatterns] = useState<WeaponPattern[]>(() => {
    if (!hasCurrentPresetVersion()) {
      return normalizeWeaponPatterns(defaultPatterns);
    }

    try {
      const saved = readStoredValue(STORAGE_KEY, LEGACY_STORAGE_SUFFIXES.patterns);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeWeaponPatterns(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load patterns from local storage", error);
    }

    return normalizeWeaponPatterns(defaultPatterns);
  });

  const [selectedWeapon, setSelectedWeapon] = useState<WeaponPattern>(() => {
    if (!hasCurrentPresetVersion()) {
      return normalizeWeaponPattern(defaultPatterns[0]);
    }

    try {
      const saved = readStoredValue(SELECTED_STORAGE_KEY, LEGACY_STORAGE_SUFFIXES.selected);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          return normalizeWeaponPattern(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load selected weapon from local storage", error);
    }

    try {
      const savedPatterns = readStoredValue(STORAGE_KEY, LEGACY_STORAGE_SUFFIXES.patterns);
      if (savedPatterns) {
        const parsedPatterns = JSON.parse(savedPatterns);
        if (Array.isArray(parsedPatterns) && parsedPatterns.length > 0) {
          return normalizeWeaponPattern(parsedPatterns[0]);
        }
      }
    } catch {
      // Ignore fallback parsing errors.
    }

    return normalizeWeaponPattern(defaultPatterns[0]);
  });

  const [initialSettings] = useState(() => readStoredSettings());
  const [volume, setVolume] = useState(0.8);
  const [waitTime, setWaitTime] = useState(0);
  const [triggerBinding, setTriggerBinding] = useState<MonitorBinding>(initialSettings.triggerBinding);
  const [overlayScale, setOverlayScale] = useState(initialSettings.overlayScale);
  const [overlayOpacity, setOverlayOpacity] = useState(initialSettings.overlayOpacity);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(IDLE_PLAYBACK_STATE);

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef(0);
  const scheduledCuesRef = useRef<Set<string>>(new Set());
  const isTriggerHeldRef = useRef(false);
  const activeTriggerRef = useRef<MonitorBinding | null>(null);
  const triggerBindingRef = useRef(triggerBinding);
  const waitTimeRef = useRef(waitTime);
  const statusRef = useRef<PlaybackState["status"]>(playbackState.status);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
    localStorage.setItem(PRESET_VERSION_STORAGE_KEY, DEFAULT_PRESET_VERSION);
  }, [patterns]);

  useEffect(() => {
    localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(selectedWeapon));
  }, [selectedWeapon]);

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        triggerBinding,
        overlayScale,
        overlayOpacity,
      }),
    );
  }, [triggerBinding, overlayScale, overlayOpacity]);

  useEffect(() => {
    triggerBindingRef.current = triggerBinding;
  }, [triggerBinding]);

  useEffect(() => {
    waitTimeRef.current = waitTime;
  }, [waitTime]);

  useEffect(() => {
    statusRef.current = playbackState.status;
  }, [playbackState.status]);

  const safeRpm = Math.max(0, selectedWeapon.rpm);
  const safeMagSize = Math.max(0, selectedWeapon.magSize);
  const intervalMs = safeRpm > 0 ? 60000 / safeRpm : 0;
  const totalDuration = safeMagSize * intervalMs;
  const timeline: TimelineCue[] = selectedWeapon.turns
    .filter((turn) => turn.bullet >= 1 && turn.bullet <= safeMagSize)
    .map((turn) => ({
      bullet: turn.bullet,
      timeMs: (turn.bullet - 1) * intervalMs,
      dir: turn.dir,
      intensity: turn.intensity,
      noteType: turn.noteType,
    }))
    .sort((a, b) => a.bullet - b.bullet);

  const stopPlayback = (nextStatus: "idle" | "monitoring") => {
    audio.stopAll();
    scheduledCuesRef.current.clear();
    setPlaybackState({
      ...IDLE_PLAYBACK_STATE,
      status: nextStatus,
    });
  };

  const startTriggeredPlayback = () => {
    if (statusRef.current === "idle") {
      return;
    }

    audio.init();
    audio.stopAll();
    scheduledCuesRef.current.clear();
    lastTimeRef.current = performance.now();

    const nextStatus = waitTimeRef.current > 0 ? "countdown" : "playing";

    setPlaybackState({
      status: nextStatus,
      currentBullet: null,
      currentDirection: null,
      countdownValue: null,
      startedAt: Date.now(),
      progressMs: 0,
    });
  };

  const handleInputDown = (input: MonitorBinding) => {
    if (!isSameMonitorBinding(input, triggerBindingRef.current)) {
      return;
    }

    if (statusRef.current === "idle" || isTriggerHeldRef.current) {
      return;
    }

    isTriggerHeldRef.current = true;
    activeTriggerRef.current = input;
    startTriggeredPlayback();
  };

  const handleInputUp = (input: MonitorBinding) => {
    if (!activeTriggerRef.current || !isSameMonitorBinding(input, activeTriggerRef.current)) {
      return;
    }

    isTriggerHeldRef.current = false;
    activeTriggerRef.current = null;

    if (statusRef.current !== "idle") {
      stopPlayback("monitoring");
    }
  };

  const releaseActiveTrigger = () => {
    isTriggerHeldRef.current = false;
    activeTriggerRef.current = null;

    if (statusRef.current === "playing" || statusRef.current === "countdown") {
      stopPlayback("monitoring");
    }
  };

  useEffect(() => {
    const desktopApi = getDesktopApi();

    if (desktopApi?.isElectron) {
      return desktopApi.onGlobalInput((event) => {
        const binding = parseMonitorBinding(event.input);
        if (!binding) {
          return;
        }

        if (event.phase === "down") {
          handleInputDown(binding);
        } else {
          handleInputUp(binding);
        }
      });
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      handleInputDown({ kind: "keyboard", code: event.code });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      handleInputUp({ kind: "keyboard", code: event.code });
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button > 2) {
        return;
      }

      if (triggerBindingRef.current.kind === "mouse" && triggerBindingRef.current.button === event.button && event.button === 2) {
        event.preventDefault();
      }

      handleInputDown({ kind: "mouse", button: event.button as 0 | 1 | 2 });
    };

    const onMouseUp = (event: MouseEvent) => {
      if (event.button > 2) {
        return;
      }

      handleInputUp({ kind: "mouse", button: event.button as 0 | 1 | 2 });
    };

    const onContextMenu = (event: MouseEvent) => {
      if (triggerBindingRef.current.kind === "mouse" && triggerBindingRef.current.button === 2) {
        event.preventDefault();
      }
    };

    const onBlur = () => {
      releaseActiveTrigger();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    const loop = (time: number) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setPlaybackState((previousState) => {
        if (previousState.status === "idle" || previousState.status === "monitoring") {
          return previousState;
        }

        let nextState = { ...previousState };

        if (previousState.status === "countdown") {
          nextState.progressMs += deltaTime;

          const triggerDelayMs = waitTime * 1000;
          if (nextState.progressMs >= triggerDelayMs) {
            nextState = {
              ...nextState,
              status: "playing",
              progressMs: nextState.progressMs - triggerDelayMs,
              countdownValue: null,
            };
            scheduledCuesRef.current.clear();
          }
        }

        if (nextState.status === "playing") {
          if (intervalMs <= 0 || safeMagSize <= 0) {
            audio.stopAll();
            scheduledCuesRef.current.clear();

            return {
              ...IDLE_PLAYBACK_STATE,
              status: "monitoring",
            };
          }

          if (previousState.status === "playing") {
            nextState.progressMs += deltaTime;
          }

          const currentBullet = Math.floor(nextState.progressMs / intervalMs) + 1;

          if (currentBullet <= safeMagSize) {
            nextState.currentBullet = currentBullet;

            let activeDirection = timeline[0]?.dir ?? null;
            for (let i = timeline.length - 1; i >= 0; i -= 1) {
              if (timeline[i].bullet <= currentBullet) {
                activeDirection = timeline[i].dir;
                break;
              }
            }

            nextState.currentDirection = activeDirection;
          } else {
            nextState.currentBullet = null;
            nextState.currentDirection = null;
          }

          for (let i = 0; i < timeline.length; i += 1) {
            const cue = timeline[i];
            const cueId = `cue-${i}`;

            if (
              nextState.progressMs + 150 >= cue.timeMs &&
              nextState.progressMs <= cue.timeMs + 150 &&
              !scheduledCuesRef.current.has(cueId)
            ) {
              const timeToPlay = (cue.timeMs - nextState.progressMs) / 1000;
              const playTime = audio.ctx ? audio.ctx.currentTime + Math.max(0, timeToPlay) : 0;

              if (audio.ctx) {
                audio.scheduleCue(playTime, getCueFrequency(cue.dir), 0.15, volume);
              }

              scheduledCuesRef.current.add(cueId);
            }
          }

          if (nextState.progressMs >= totalDuration) {
            audio.stopAll();
            scheduledCuesRef.current.clear();

            return {
              ...IDLE_PLAYBACK_STATE,
              status: "monitoring",
            };
          }
        }

        return nextState;
      });

      requestRef.current = window.requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    requestRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (requestRef.current !== undefined) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };
  }, [intervalMs, safeMagSize, selectedWeapon, totalDuration, volume, waitTime]);

  const togglePlaying = () => {
    setPlaybackState((previousState) => {
      isTriggerHeldRef.current = false;
      activeTriggerRef.current = null;
      scheduledCuesRef.current.clear();

      if (previousState.status === "idle") {
        audio.init();
        return {
          ...IDLE_PLAYBACK_STATE,
          status: "monitoring",
        };
      }

      audio.stopAll();
      return IDLE_PLAYBACK_STATE;
    });
  };

  const triggerScopeNotice = hasNativeDesktop
    ? "已启用原生全局监听，可在游戏或其他窗口中直接触发。"
    : "当前只能监听本页面获得焦点时的键鼠事件。";

  let statusText = "未开始";
  if (playbackState.status === "monitoring") {
    statusText = "监听中";
  } else if (playbackState.status === "countdown") {
    statusText = "触发延迟";
  } else if (playbackState.status === "playing") {
    if (playbackState.currentDirection === "left") {
      statusText = "向左压枪";
    } else if (playbackState.currentDirection === "right") {
      statusText = "向右压枪";
    } else if (playbackState.currentDirection === "down") {
      statusText = "向下压枪";
    } else {
      statusText = "播放中";
    }
  }

  return (
    <AppContext.Provider
      value={{
        patterns,
        setPatterns,
        selectedWeapon,
        setSelectedWeapon,
        playbackState,
        togglePlaying,
        volume,
        setVolume,
        waitTime,
        setWaitTime,
        timeline,
        totalDuration,
        statusText,
        triggerBinding,
        setTriggerBinding,
        overlayScale,
        setOverlayScale,
        overlayOpacity,
        setOverlayOpacity,
        triggerScopeNotice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppProvider");
  }
  return context;
}
