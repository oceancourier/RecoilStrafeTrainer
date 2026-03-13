import uiohookModule from "uiohook-napi";

const { uIOhook, UiohookKey } = uiohookModule;
const UIOHOOK_NAME_BY_CODE = new Map(
  Object.entries(UiohookKey)
    .filter((entry) => typeof entry[1] === "number")
    .map(([name, value]) => [value, name]),
);

const UIOHOOK_TO_CODE = new Map([
  [UiohookKey.A, "KeyA"],
  [UiohookKey.B, "KeyB"],
  [UiohookKey.C, "KeyC"],
  [UiohookKey.D, "KeyD"],
  [UiohookKey.E, "KeyE"],
  [UiohookKey.F, "KeyF"],
  [UiohookKey.G, "KeyG"],
  [UiohookKey.H, "KeyH"],
  [UiohookKey.I, "KeyI"],
  [UiohookKey.J, "KeyJ"],
  [UiohookKey.K, "KeyK"],
  [UiohookKey.L, "KeyL"],
  [UiohookKey.M, "KeyM"],
  [UiohookKey.N, "KeyN"],
  [UiohookKey.O, "KeyO"],
  [UiohookKey.P, "KeyP"],
  [UiohookKey.Q, "KeyQ"],
  [UiohookKey.R, "KeyR"],
  [UiohookKey.S, "KeyS"],
  [UiohookKey.T, "KeyT"],
  [UiohookKey.U, "KeyU"],
  [UiohookKey.V, "KeyV"],
  [UiohookKey.W, "KeyW"],
  [UiohookKey.X, "KeyX"],
  [UiohookKey.Y, "KeyY"],
  [UiohookKey.Z, "KeyZ"],
  [UiohookKey["0"], "Digit0"],
  [UiohookKey["1"], "Digit1"],
  [UiohookKey["2"], "Digit2"],
  [UiohookKey["3"], "Digit3"],
  [UiohookKey["4"], "Digit4"],
  [UiohookKey["5"], "Digit5"],
  [UiohookKey["6"], "Digit6"],
  [UiohookKey["7"], "Digit7"],
  [UiohookKey["8"], "Digit8"],
  [UiohookKey["9"], "Digit9"],
  [UiohookKey.Space, "Space"],
  [UiohookKey.Tab, "Tab"],
  [UiohookKey.Enter, "Enter"],
  [UiohookKey.Escape, "Escape"],
  [UiohookKey.Backspace, "Backspace"],
  [UiohookKey.Insert, "Insert"],
  [UiohookKey.Delete, "Delete"],
  [UiohookKey.Home, "Home"],
  [UiohookKey.End, "End"],
  [UiohookKey.PageUp, "PageUp"],
  [UiohookKey.PageDown, "PageDown"],
  [UiohookKey.ArrowLeft, "ArrowLeft"],
  [UiohookKey.ArrowRight, "ArrowRight"],
  [UiohookKey.ArrowUp, "ArrowUp"],
  [UiohookKey.ArrowDown, "ArrowDown"],
  [UiohookKey.Shift, "ShiftLeft"],
  [UiohookKey.ShiftRight, "ShiftRight"],
  [UiohookKey.Ctrl, "ControlLeft"],
  [UiohookKey.CtrlRight, "ControlRight"],
  [UiohookKey.Alt, "AltLeft"],
  [UiohookKey.AltRight, "AltRight"],
  [UiohookKey.Meta, "MetaLeft"],
  [UiohookKey.MetaRight, "MetaRight"],
  [UiohookKey.CapsLock, "CapsLock"],
  [UiohookKey.NumLock, "NumLock"],
  [UiohookKey.ScrollLock, "ScrollLock"],
  [UiohookKey.PrintScreen, "PrintScreen"],
  [UiohookKey.Backquote, "Backquote"],
  [UiohookKey.Minus, "Minus"],
  [UiohookKey.Equal, "Equal"],
  [UiohookKey.BracketLeft, "BracketLeft"],
  [UiohookKey.BracketRight, "BracketRight"],
  [UiohookKey.Backslash, "Backslash"],
  [UiohookKey.Semicolon, "Semicolon"],
  [UiohookKey.Quote, "Quote"],
  [UiohookKey.Comma, "Comma"],
  [UiohookKey.Period, "Period"],
  [UiohookKey.Slash, "Slash"],
  [UiohookKey.F1, "F1"],
  [UiohookKey.F2, "F2"],
  [UiohookKey.F3, "F3"],
  [UiohookKey.F4, "F4"],
  [UiohookKey.F5, "F5"],
  [UiohookKey.F6, "F6"],
  [UiohookKey.F7, "F7"],
  [UiohookKey.F8, "F8"],
  [UiohookKey.F9, "F9"],
  [UiohookKey.F10, "F10"],
  [UiohookKey.F11, "F11"],
  [UiohookKey.F12, "F12"],
  [UiohookKey.Numpad0, "Numpad0"],
  [UiohookKey.Numpad1, "Numpad1"],
  [UiohookKey.Numpad2, "Numpad2"],
  [UiohookKey.Numpad3, "Numpad3"],
  [UiohookKey.Numpad4, "Numpad4"],
  [UiohookKey.Numpad5, "Numpad5"],
  [UiohookKey.Numpad6, "Numpad6"],
  [UiohookKey.Numpad7, "Numpad7"],
  [UiohookKey.Numpad8, "Numpad8"],
  [UiohookKey.Numpad9, "Numpad9"],
  [UiohookKey.NumpadAdd, "NumpadAdd"],
  [UiohookKey.NumpadSubtract, "NumpadSubtract"],
  [UiohookKey.NumpadMultiply, "NumpadMultiply"],
  [UiohookKey.NumpadDivide, "NumpadDivide"],
  [UiohookKey.NumpadDecimal, "NumpadDecimal"],
  [UiohookKey.NumpadEnter, "NumpadEnter"],
]);

function mapNativeMouseButton(button) {
  if (button === 1) {
    return 0;
  }

  if (button === 2) {
    return 2;
  }

  if (button === 3) {
    return 1;
  }

  return null;
}

function mapNativeKeyboardCode(keycode) {
  const directMatch = UIOHOOK_TO_CODE.get(keycode);
  if (directMatch) {
    return directMatch;
  }

  const keyName = UIOHOOK_NAME_BY_CODE.get(keycode);
  if (!keyName) {
    return null;
  }

  if (/^[A-Z]$/.test(keyName)) {
    return `Key${keyName}`;
  }

  if (/^[0-9]$/.test(keyName)) {
    return `Digit${keyName}`;
  }

  if (/^F\d{1,2}$/.test(keyName)) {
    return keyName;
  }

  if (/^Numpad\d$/.test(keyName)) {
    return keyName;
  }

  return null;
}

export function createNativeInputBridge(dispatch) {
  const onKeyDown = (event) => {
    const code = mapNativeKeyboardCode(event.keycode);
    if (!code) {
      return;
    }

    dispatch({
      phase: "down",
      input: {
        kind: "keyboard",
        code,
      },
    });
  };

  const onKeyUp = (event) => {
    const code = mapNativeKeyboardCode(event.keycode);
    if (!code) {
      return;
    }

    dispatch({
      phase: "up",
      input: {
        kind: "keyboard",
        code,
      },
    });
  };

  const onMouseDown = (event) => {
    const button = mapNativeMouseButton(Number(event.button));
    if (button === null) {
      return;
    }

    dispatch({
      phase: "down",
      input: {
        kind: "mouse",
        button,
      },
    });
  };

  const onMouseUp = (event) => {
    const button = mapNativeMouseButton(Number(event.button));
    if (button === null) {
      return;
    }

    dispatch({
      phase: "up",
      input: {
        kind: "mouse",
        button,
      },
    });
  };

  uIOhook.on("keydown", onKeyDown);
  uIOhook.on("keyup", onKeyUp);
  uIOhook.on("mousedown", onMouseDown);
  uIOhook.on("mouseup", onMouseUp);

  return {
    start() {
      uIOhook.start();
    },
    stop() {
      uIOhook.stop();
      uIOhook.off("keydown", onKeyDown);
      uIOhook.off("keyup", onKeyUp);
      uIOhook.off("mousedown", onMouseDown);
      uIOhook.off("mouseup", onMouseUp);
    },
  };
}
