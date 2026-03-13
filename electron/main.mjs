import { app, BrowserWindow, globalShortcut, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createNativeInputBridge } from "./native-input.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rendererDevUrl = process.env.VITE_DEV_SERVER_URL;

const GET_WINDOW_STATE_CHANNEL = "desktop:get-window-state";
const ENTER_MINI_MODE_CHANNEL = "desktop:enter-mini-mode";
const EXIT_MINI_MODE_CHANNEL = "desktop:exit-mini-mode";
const UPDATE_OVERLAY_APPEARANCE_CHANNEL = "desktop:update-overlay-appearance";
const SET_MINI_MODE_INTERACTIVE_CHANNEL = "desktop:set-mini-mode-interactive";
const SET_ALWAYS_ON_TOP_CHANNEL = "desktop:set-always-on-top";
const SET_CLICK_THROUGH_CHANNEL = "desktop:set-click-through";
const WINDOW_STATE_EVENT = "desktop:window-state";
const GLOBAL_INPUT_EVENT = "desktop:global-input";

const MINI_MODE_SHORTCUTS = {
  exitMiniMode: "F8",
  toggleAlwaysOnTop: "F7",
  toggleClickThrough: "F6",
};

const MINI_MODE_SHORTCUT_FALLBACKS = {
  exitMiniMode: ["CommandOrControl+Shift+X"],
  toggleAlwaysOnTop: ["CommandOrControl+Shift+T"],
  toggleClickThrough: ["CommandOrControl+Shift+C"],
};

const windowState = {
  isMiniMode: false,
  isAlwaysOnTop: true,
  isClickThrough: false,
  isMiniModeInteractive: false,
  overlayScale: 1,
  overlayOpacity: 0.92,
};

let mainWindow = null;
let overlayWindow = null;

function getPreloadPath() {
  return path.join(__dirname, "preload.mjs");
}

function getIndexHtmlPath() {
  return path.join(__dirname, "..", "dist", "index.html");
}

function getWindowStatePayload() {
  return {
    isMiniMode: windowState.isMiniMode,
    isAlwaysOnTop: windowState.isAlwaysOnTop,
    isClickThrough: windowState.isClickThrough,
    shortcuts: MINI_MODE_SHORTCUTS,
  };
}

function getOverlayWindowBounds(scale = windowState.overlayScale) {
  return {
    width: Math.round(400 * scale),
    height: Math.round(118 * scale),
  };
}

function getMainWindowOptions(overrides = {}) {
  return {
    title: "RecoilStrafeTrainer",
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    autoHideMenuBar: true,
    backgroundColor: "#131823",
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
    ...overrides,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      ...(overrides.webPreferences ?? {}),
    },
  };
}

function getOverlayWindowOptions() {
  const bounds = getOverlayWindowBounds();

  return {
    title: "RecoilStrafeTrainer Mini Overlay",
    width: bounds.width,
    height: bounds.height,
    minWidth: 240,
    minHeight: 96,
    frame: false,
    titleBarStyle: "hidden",
    transparent: false,
    resizable: true,
    alwaysOnTop: windowState.isAlwaysOnTop,
    skipTaskbar: false,
    autoHideMenuBar: true,
    hasShadow: false,
    backgroundColor: "#07090d",
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  };
}

function buildRendererUrl(overlay = false) {
  if (rendererDevUrl) {
    const url = new URL(rendererDevUrl);
    if (overlay) {
      url.searchParams.set("overlay", "1");
    }
    return url.toString();
  }

  const fileUrl = pathToFileURL(getIndexHtmlPath());
  if (overlay) {
    fileUrl.searchParams.set("overlay", "1");
  }
  return fileUrl.toString();
}

async function loadRenderer(window, overlay = false) {
  const url = buildRendererUrl(overlay);
  await window.loadURL(url);
}

function sendToWindow(window, channel, payload) {
  if (!window || window.isDestroyed()) {
    return;
  }

  window.webContents.send(channel, payload);
}

function broadcastWindowState() {
  const payload = getWindowStatePayload();
  sendToWindow(mainWindow, WINDOW_STATE_EVENT, payload);
  sendToWindow(overlayWindow, WINDOW_STATE_EVENT, payload);
}

function applyOverlayWindowState() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  const bounds = getOverlayWindowBounds();
  const shouldIgnoreMouseEvents = windowState.isClickThrough && !windowState.isMiniModeInteractive;
  const canFocusOverlay = !windowState.isClickThrough || windowState.isMiniModeInteractive;
  overlayWindow.setAlwaysOnTop(windowState.isAlwaysOnTop, windowState.isAlwaysOnTop ? "screen-saver" : "normal");
  overlayWindow.setIgnoreMouseEvents(shouldIgnoreMouseEvents, { forward: true });
  overlayWindow.setFocusable(canFocusOverlay);
  overlayWindow.setOpacity(windowState.overlayOpacity);
  overlayWindow.setBounds({
    ...overlayWindow.getBounds(),
    width: bounds.width,
    height: bounds.height,
  });

  if (canFocusOverlay) {
    overlayWindow.focus();
  }
}

function openExternalIfNeeded(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return false;
  }

  void shell.openExternal(url);
  return true;
}

function wireNavigation(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (openExternalIfNeeded(url)) {
      return { action: "deny" };
    }

    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (rendererDevUrl) {
      const allowedOrigin = new URL(rendererDevUrl).origin;
      if (new URL(url).origin === allowedOrigin) {
        return;
      }
    }

    if (openExternalIfNeeded(url)) {
      event.preventDefault();
    }
  });
}

function registerMiniModeShortcuts() {
  const registerShortcutSet = (accelerators, handler, label) => {
    accelerators.forEach((accelerator) => {
      const registered = globalShortcut.register(accelerator, handler);
      if (!registered) {
        console.warn(`Failed to register shortcut: ${label} (${accelerator})`);
      }
    });
  };

  registerShortcutSet(
    [MINI_MODE_SHORTCUTS.exitMiniMode, ...MINI_MODE_SHORTCUT_FALLBACKS.exitMiniMode],
    () => {
      if (windowState.isMiniMode) {
        void exitMiniMode();
      }
    },
    "exit mini mode",
  );

  registerShortcutSet(
    [MINI_MODE_SHORTCUTS.toggleAlwaysOnTop, ...MINI_MODE_SHORTCUT_FALLBACKS.toggleAlwaysOnTop],
    () => {
      if (windowState.isMiniMode) {
        setAlwaysOnTop(!windowState.isAlwaysOnTop);
      }
    },
    "toggle always on top",
  );

  registerShortcutSet(
    [MINI_MODE_SHORTCUTS.toggleClickThrough, ...MINI_MODE_SHORTCUT_FALLBACKS.toggleClickThrough],
    () => {
      if (windowState.isMiniMode) {
        setClickThrough(!windowState.isClickThrough);
      }
    },
    "toggle click through",
  );
}

function resetMiniModeState() {
  windowState.isMiniMode = false;
  windowState.isClickThrough = false;
  windowState.isMiniModeInteractive = false;
}

function cleanupOverlayWindow() {
  overlayWindow = null;
  resetMiniModeState();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }

  broadcastWindowState();
}

async function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return overlayWindow;
  }

  overlayWindow = new BrowserWindow(getOverlayWindowOptions());
  wireNavigation(overlayWindow);

  overlayWindow.once("ready-to-show", () => {
    applyOverlayWindowState();
    overlayWindow?.show();
    broadcastWindowState();
  });

  overlayWindow.on("closed", () => {
    cleanupOverlayWindow();
  });

  await loadRenderer(overlayWindow, true);
  return overlayWindow;
}

async function createMainWindow() {
  mainWindow = new BrowserWindow(getMainWindowOptions());
  wireNavigation(mainWindow);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    broadcastWindowState();
  });

  await loadRenderer(mainWindow, false);
  return mainWindow;
}

async function enterMiniMode(appearance = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (typeof appearance.scale === "number" && Number.isFinite(appearance.scale)) {
    windowState.overlayScale = appearance.scale;
  }

  if (typeof appearance.opacity === "number" && Number.isFinite(appearance.opacity)) {
    windowState.overlayOpacity = appearance.opacity;
  }

  windowState.isMiniMode = true;
  windowState.isAlwaysOnTop = true;
  windowState.isClickThrough = false;
  windowState.isMiniModeInteractive = false;

  const miniWindow = await createOverlayWindow();
  applyOverlayWindowState();
  mainWindow.hide();
  miniWindow.focus();
  broadcastWindowState();
}

async function exitMiniMode() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    resetMiniModeState();
    broadcastWindowState();
    return;
  }

  const target = overlayWindow;
  overlayWindow = null;
  target.removeAllListeners("closed");
  target.close();
  cleanupOverlayWindow();
}

function setAlwaysOnTop(value) {
  windowState.isAlwaysOnTop = Boolean(value);
  applyOverlayWindowState();
  broadcastWindowState();
  return getWindowStatePayload();
}

function setClickThrough(value) {
  windowState.isClickThrough = Boolean(value);
  if (!windowState.isClickThrough) {
    windowState.isMiniModeInteractive = false;
  }
  applyOverlayWindowState();
  broadcastWindowState();
  return getWindowStatePayload();
}

function setMiniModeInteractive(value) {
  windowState.isMiniModeInteractive = Boolean(value) && windowState.isClickThrough;
  applyOverlayWindowState();
}

function updateOverlayAppearance(appearance = {}) {
  if (typeof appearance.scale === "number" && Number.isFinite(appearance.scale)) {
    windowState.overlayScale = appearance.scale;
  }

  if (typeof appearance.opacity === "number" && Number.isFinite(appearance.opacity)) {
    windowState.overlayOpacity = appearance.opacity;
  }

  applyOverlayWindowState();
}

function registerIpcHandlers() {
  ipcMain.handle(GET_WINDOW_STATE_CHANNEL, () => getWindowStatePayload());
  ipcMain.handle(ENTER_MINI_MODE_CHANNEL, (_event, appearance) => enterMiniMode(appearance));
  ipcMain.handle(EXIT_MINI_MODE_CHANNEL, () => exitMiniMode());
  ipcMain.handle(UPDATE_OVERLAY_APPEARANCE_CHANNEL, (_event, appearance) => {
    updateOverlayAppearance(appearance);
  });
  ipcMain.handle(SET_MINI_MODE_INTERACTIVE_CHANNEL, (_event, value) => {
    setMiniModeInteractive(value);
  });
  ipcMain.handle(SET_ALWAYS_ON_TOP_CHANNEL, (_event, value) => setAlwaysOnTop(value));
  ipcMain.handle(SET_CLICK_THROUGH_CHANNEL, (_event, value) => setClickThrough(value));
}

function forwardGlobalInput(payload) {
  sendToWindow(mainWindow, GLOBAL_INPUT_EVENT, payload);
  sendToWindow(overlayWindow, GLOBAL_INPUT_EVENT, payload);
}

const nativeInputBridge = createNativeInputBridge(forwardGlobalInput);

app.whenReady().then(async () => {
  registerIpcHandlers();
  registerMiniModeShortcuts();
  nativeInputBridge.start();

  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  nativeInputBridge.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
