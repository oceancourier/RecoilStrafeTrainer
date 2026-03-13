import { contextBridge, ipcRenderer } from "electron";

const GET_WINDOW_STATE_CHANNEL = "desktop:get-window-state";
const ENTER_MINI_MODE_CHANNEL = "desktop:enter-mini-mode";
const EXIT_MINI_MODE_CHANNEL = "desktop:exit-mini-mode";
const UPDATE_OVERLAY_APPEARANCE_CHANNEL = "desktop:update-overlay-appearance";
const SET_MINI_MODE_INTERACTIVE_CHANNEL = "desktop:set-mini-mode-interactive";
const SET_ALWAYS_ON_TOP_CHANNEL = "desktop:set-always-on-top";
const SET_CLICK_THROUGH_CHANNEL = "desktop:set-click-through";
const WINDOW_STATE_EVENT = "desktop:window-state";
const GLOBAL_INPUT_EVENT = "desktop:global-input";

contextBridge.exposeInMainWorld("desktop", {
  isElectron: true,
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
  getWindowState() {
    return ipcRenderer.invoke(GET_WINDOW_STATE_CHANNEL);
  },
  enterMiniMode(appearance) {
    return ipcRenderer.invoke(ENTER_MINI_MODE_CHANNEL, appearance);
  },
  exitMiniMode() {
    return ipcRenderer.invoke(EXIT_MINI_MODE_CHANNEL);
  },
  updateOverlayAppearance(appearance) {
    return ipcRenderer.invoke(UPDATE_OVERLAY_APPEARANCE_CHANNEL, appearance);
  },
  setMiniModeInteractive(value) {
    return ipcRenderer.invoke(SET_MINI_MODE_INTERACTIVE_CHANNEL, value);
  },
  setAlwaysOnTop(value) {
    return ipcRenderer.invoke(SET_ALWAYS_ON_TOP_CHANNEL, value);
  },
  setClickThrough(value) {
    return ipcRenderer.invoke(SET_CLICK_THROUGH_CHANNEL, value);
  },
  onWindowState(listener) {
    const wrapped = (_event, payload) => {
      listener(payload);
    };

    ipcRenderer.on(WINDOW_STATE_EVENT, wrapped);

    return () => {
      ipcRenderer.removeListener(WINDOW_STATE_EVENT, wrapped);
    };
  },
  onGlobalInput(listener) {
    const wrapped = (_event, payload) => {
      listener(payload);
    };

    ipcRenderer.on(GLOBAL_INPUT_EVENT, wrapped);

    return () => {
      ipcRenderer.removeListener(GLOBAL_INPUT_EVENT, wrapped);
    };
  },
});
