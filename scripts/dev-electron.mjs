import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import http from "node:http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const rendererUrl = "http://127.0.0.1:3000";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const electronBinary = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "electron.cmd" : "electron");

let rendererProcess = null;
let electronProcess = null;
let shuttingDown = false;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForRenderer(url, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const isReady = await new Promise((resolve) => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve(Boolean(response.statusCode && response.statusCode < 500));
      });

      request.on("error", () => resolve(false));
      request.setTimeout(1000, () => {
        request.destroy();
        resolve(false);
      });
    });

    if (isReady) {
      return;
    }

    await wait(500);
  }

  throw new Error("Vite renderer did not become ready in time.");
}

function stopChild(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill();
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopChild(electronProcess);
  stopChild(rendererProcess);
  process.exit(code);
}

async function main() {
  rendererProcess = spawn(npmCommand, ["run", "dev:web"], {
    cwd: rootDir,
    stdio: "inherit",
  });

  rendererProcess.on("exit", (code) => {
    if (!shuttingDown) {
      shutdown(code ?? 1);
    }
  });

  await waitForRenderer(rendererUrl);

  electronProcess = spawn(electronBinary, ["."], {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: rendererUrl,
    },
  });

  electronProcess.on("exit", (code) => {
    shutdown(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error(error);
  shutdown(1);
});
