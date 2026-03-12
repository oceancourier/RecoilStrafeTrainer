import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { defaultPatterns, WeaponPattern, TimelineCue, PlaybackState, Direction } from "./data";

interface AppContextType {
  patterns: WeaponPattern[];
  setPatterns: (p: WeaponPattern[]) => void;
  selectedWeapon: WeaponPattern;
  setSelectedWeapon: (w: WeaponPattern) => void;
  playbackState: PlaybackState;
  togglePlaying: () => void;
  pausePlaying: () => void;
  resumePlaying: () => void;
  replayPlaying: () => void;
  resetPlaying: () => void;
  volume: number;
  setVolume: (v: number) => void;
  waitTime: number;
  setWaitTime: (v: number) => void;
  timeline: TimelineCue[];
  totalDuration: number;
  statusText: string;
}

const AppContext = createContext<AppContextType | null>(null);

class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      
      const compressor = this.ctx.createDynamicsCompressor();
      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);
      
      // Play silent buffer to unlock audio
      const silentBuffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(this.ctx.destination);
      source.start();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  scheduleCue(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    
    const t = Math.max(time, this.ctx.currentTime);
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + duration);
  }

  stopAll() {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.disconnect();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    const compressor = this.ctx.createDynamicsCompressor();
    this.masterGain.connect(compressor);
    compressor.connect(this.ctx.destination);
  }
}

const audio = new AudioEngine();

const STORAGE_KEY = "apex_strafe_patterns";
const SELECTED_STORAGE_KEY = "apex_strafe_selected";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patterns, setPatterns] = useState<WeaponPattern[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load patterns from local storage", e);
    }
    return defaultPatterns;
  });

  const [selectedWeapon, setSelectedWeapon] = useState<WeaponPattern>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load selected weapon from local storage", e);
    }
    
    // Fallback to the first pattern from local storage if available
    try {
      const savedPatterns = localStorage.getItem(STORAGE_KEY);
      if (savedPatterns) {
        const parsedPatterns = JSON.parse(savedPatterns);
        if (Array.isArray(parsedPatterns) && parsedPatterns.length > 0) {
          return parsedPatterns[0];
        }
      }
    } catch (e) {}
    
    return defaultPatterns[0];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  }, [patterns]);

  useEffect(() => {
    localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(selectedWeapon));
  }, [selectedWeapon]);

  const [volume, setVolume] = useState(0.8);
  const [waitTime, setWaitTime] = useState(0.5);
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: "idle",
    currentBullet: null,
    currentDirection: null,
    countdownValue: null,
    startedAt: null,
    progressMs: 0,
  });

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const scheduledCuesRef = useRef<Set<string>>(new Set());
  const countdownRef = useRef<number>(0);
  const loopCountRef = useRef<number>(0);

  // Calculate timeline
  const intervalMs = 60000 / selectedWeapon.rpm;
  const magDuration = selectedWeapon.magSize * intervalMs;
  const timeline: TimelineCue[] = selectedWeapon.turns.map(t => ({
    bullet: t.bullet,
    timeMs: (t.bullet - 1) * intervalMs,
    dir: t.dir,
    intensity: t.intensity,
    noteType: t.noteType
  })).sort((a, b) => a.bullet - b.bullet);

  const totalDuration = magDuration + waitTime * 1000; // Link R to waitTime

  let statusText = "等待中";
  if (playbackState.status === "countdown" && playbackState.countdownValue !== null) {
    statusText = `倒计时: ${playbackState.countdownValue}`;
  } else if (playbackState.status === "playing" || playbackState.status === "paused") {
    if (playbackState.currentDirection) {
      const dirMap = { left: "向左压枪", right: "向右压枪", down: "向下压枪" };
      statusText = dirMap[playbackState.currentDirection];
    } else {
      statusText = "射击中";
    }
    if (playbackState.progressMs >= magDuration) {
      statusText = "换弹中";
    }
  }

  const loop = (time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    setPlaybackState(prev => {
      if (prev.status === "idle" || prev.status === "completed" || prev.status === "paused") {
        return prev;
      }

      let nextState = { ...prev };
      
      if (prev.status === "countdown") {
        nextState.progressMs += deltaTime;
        const totalWait = waitTime * 1000;
        const countdownPhaseLength = 1500; // 3 beeps, 500ms each
        const totalIntro = totalWait + countdownPhaseLength;

        // Schedule countdown beeps
        for (let i = 0; i < 3; i++) {
          const beepTimeMs = totalWait + i * 500;
          const beepId = `countdown-${i}`;
          if (nextState.progressMs + 150 >= beepTimeMs && nextState.progressMs <= beepTimeMs + 150 && !scheduledCuesRef.current.has(beepId)) {
            const timeToPlay = (beepTimeMs - nextState.progressMs) / 1000;
            const playTime = audio.ctx ? audio.ctx.currentTime + Math.max(0, timeToPlay) : 0;
            if (audio.ctx) audio.scheduleCue(playTime, 500, 0.15, volume);
            scheduledCuesRef.current.add(beepId);
          }
        }

        if (nextState.progressMs < totalWait) {
          // Waiting
        } else if (nextState.progressMs < totalIntro) {
          const introElapsed = nextState.progressMs - totalWait;
          const count = 3 - Math.floor(introElapsed / 500);
          if (count !== countdownRef.current) {
            countdownRef.current = count;
            nextState.countdownValue = count;
          }
        } else {
          // Start playing
          nextState.status = "playing";
          nextState.progressMs = nextState.progressMs - totalIntro; // carry over remainder
          nextState.countdownValue = null;
          countdownRef.current = 0;
          loopCountRef.current = 0;
          scheduledCuesRef.current.clear();
        }
      } 
      
      if (nextState.status === "playing") {
        if (prev.status === "playing") {
          nextState.progressMs += deltaTime;
        }
        
        // Find current bullet for UI
        const currentBulletNum = Math.floor(nextState.progressMs / intervalMs) + 1;
        if (currentBulletNum <= selectedWeapon.magSize) {
          nextState.currentBullet = currentBulletNum;
          // Update current direction for UI
          let activeDir = timeline[0]?.dir || "none";
          for (let i = timeline.length - 1; i >= 0; i--) {
            if (timeline[i].bullet <= currentBulletNum) {
              activeDir = timeline[i].dir;
              break;
            }
          }
          nextState.currentDirection = activeDir as Direction;
        } else {
          nextState.currentBullet = null;
        }

        // Schedule cues for CURRENT loop
        for (let i = 0; i < timeline.length; i++) {
          const cue = timeline[i];
          const cueId = `${loopCountRef.current}-${i}`;
          if (nextState.progressMs + 150 >= cue.timeMs && nextState.progressMs <= cue.timeMs + 150 && !scheduledCuesRef.current.has(cueId)) {
            const timeToPlay = (cue.timeMs - nextState.progressMs) / 1000;
            const playTime = audio.ctx ? audio.ctx.currentTime + Math.max(0, timeToPlay) : 0;
            
            let freq = 1500;
            if (cue.dir === 'left') freq = 400;
            else if (cue.dir === 'right') freq = 800;
            else if (cue.dir === 'down') freq = 1200;
            
            if (audio.ctx) audio.scheduleCue(playTime, freq, 0.15, volume);
            scheduledCuesRef.current.add(cueId);
          }
        }

        // Schedule reload for CURRENT loop
        const reloadId = `${loopCountRef.current}-reload`;
        if (nextState.progressMs + 150 >= magDuration && nextState.progressMs <= magDuration + 150 && !scheduledCuesRef.current.has(reloadId)) {
          const timeToPlay = (magDuration - nextState.progressMs) / 1000;
          const playTime = audio.ctx ? audio.ctx.currentTime + Math.max(0, timeToPlay) : 0;
          // Softer reload sound: 600Hz, lower volume, duration linked to waitTime
          const reloadDuration = Math.min(0.9, waitTime);
          if (audio.ctx) audio.scheduleCue(playTime, 600, reloadDuration, volume * 0.4);
          scheduledCuesRef.current.add(reloadId);
        }

        // Schedule cues for NEXT loop (Lookahead across loop boundary)
        if (nextState.progressMs + 150 >= totalDuration) {
          for (let i = 0; i < timeline.length; i++) {
            const cue = timeline[i];
            const cueId = `${loopCountRef.current + 1}-${i}`;
            const cueTimeInNextLoop = cue.timeMs + totalDuration;
            if (nextState.progressMs + 150 >= cueTimeInNextLoop && !scheduledCuesRef.current.has(cueId)) {
              const timeToPlay = (cueTimeInNextLoop - nextState.progressMs) / 1000;
              const playTime = audio.ctx ? audio.ctx.currentTime + Math.max(0, timeToPlay) : 0;
              
              let freq = 1500;
              if (cue.dir === 'left') freq = 400;
              else if (cue.dir === 'right') freq = 800;
              else if (cue.dir === 'down') freq = 1200;
              
              if (audio.ctx) audio.scheduleCue(playTime, freq, 0.15, volume);
              scheduledCuesRef.current.add(cueId);
            }
          }
        }

        if (nextState.progressMs >= totalDuration) {
          // Loop
          nextState.progressMs = nextState.progressMs - totalDuration;
          loopCountRef.current += 1;
        }
      }

      return nextState;
    });

    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [selectedWeapon, volume, waitTime]);

  const togglePlaying = () => {
    setPlaybackState(prev => {
      if (prev.status === "idle" || prev.status === "completed") {
        audio.init();
        countdownRef.current = 0;
        loopCountRef.current = 0;
        scheduledCuesRef.current.clear();
        return { ...prev, status: "countdown", progressMs: 0, countdownValue: 3, currentBullet: null, currentDirection: null };
      } else if (prev.status === "playing" || prev.status === "countdown") {
        audio.stopAll();
        return { ...prev, status: "idle", progressMs: 0, countdownValue: null, currentBullet: null, currentDirection: null };
      }
      return prev;
    });
  };

  const pausePlaying = () => {
    audio.stopAll();
    setPlaybackState(prev => prev.status === "playing" ? { ...prev, status: "paused" } : prev);
  };

  const resumePlaying = () => {
    // When resuming, we need to clear scheduled cues so they get rescheduled correctly from the new time
    scheduledCuesRef.current.clear();
    setPlaybackState(prev => prev.status === "paused" ? { ...prev, status: "playing" } : prev);
  };

  const replayPlaying = () => {
    audio.init();
    audio.stopAll();
    scheduledCuesRef.current.clear();
    countdownRef.current = 0;
    loopCountRef.current = 0;
    setPlaybackState(prev => ({ ...prev, status: "countdown", progressMs: 0, countdownValue: 3, currentBullet: null, currentDirection: null }));
  };

  const resetPlaying = () => {
    audio.stopAll();
    scheduledCuesRef.current.clear();
    loopCountRef.current = 0;
    setPlaybackState({ status: "idle", currentBullet: null, currentDirection: null, countdownValue: null, startedAt: null, progressMs: 0 });
  };

  return (
    <AppContext.Provider
      value={{
        patterns,
        setPatterns,
        selectedWeapon,
        setSelectedWeapon,
        playbackState,
        togglePlaying,
        pausePlaying,
        resumePlaying,
        replayPlaying,
        resetPlaying,
        volume,
        setVolume,
        waitTime,
        setWaitTime,
        timeline,
        totalDuration,
        statusText,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
}
