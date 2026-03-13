export type DesktopVersions = {
  chrome: string;
  electron: string;
  node: string;
};

export type DesktopWindowState = {
  isMiniMode: boolean;
  isAlwaysOnTop: boolean;
  isClickThrough: boolean;
  shortcuts: {
    exitMiniMode: string;
    toggleAlwaysOnTop: string;
    toggleClickThrough: string;
  };
};

export type NativeMonitorBinding =
  | {
      kind: "mouse";
      button: 0 | 1 | 2;
    }
  | {
      kind: "keyboard";
      code: string;
    };

export type NativeInputEvent = {
  phase: "down" | "up";
  input: NativeMonitorBinding;
};

export type OverlayAppearance = {
  scale?: number;
  opacity?: number;
};

export type DesktopApi = {
  isElectron: boolean;
  platform: string;
  versions: DesktopVersions;
  getWindowState: () => Promise<DesktopWindowState>;
  enterMiniMode: (appearance?: OverlayAppearance) => Promise<void>;
  exitMiniMode: () => Promise<void>;
  updateOverlayAppearance: (appearance: OverlayAppearance) => Promise<void>;
  setMiniModeInteractive: (value: boolean) => Promise<void>;
  setAlwaysOnTop: (value: boolean) => Promise<DesktopWindowState>;
  setClickThrough: (value: boolean) => Promise<DesktopWindowState>;
  onWindowState: (listener: (state: DesktopWindowState) => void) => () => void;
  onGlobalInput: (listener: (event: NativeInputEvent) => void) => () => void;
};

export const DEFAULT_DESKTOP_WINDOW_STATE: DesktopWindowState = {
  isMiniMode: false,
  isAlwaysOnTop: true,
  isClickThrough: false,
  shortcuts: {
    exitMiniMode: "F8",
    toggleAlwaysOnTop: "F7",
    toggleClickThrough: "F6",
  },
};

export function getDesktopApi(): DesktopApi | null {
  if (typeof window === "undefined" || typeof window.desktop === "undefined") {
    return null;
  }

  return window.desktop;
}

export function isElectronDesktop() {
  return Boolean(getDesktopApi()?.isElectron);
}
