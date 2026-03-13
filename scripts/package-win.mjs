import packager from "@electron/packager";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const releaseDir = path.join(rootDir, "release");

const ignoredPatterns = [
  /^\/\.git(?:\/|$)/,
  /^\/\.github(?:\/|$)/,
  /^\/\.npm-cache(?:\/|$)/,
  /^\/app(?:\/|$)/,
  /^\/coverage(?:\/|$)/,
  /^\/release(?:\/|$)/,
  /^\/scripts(?:\/|$)/,
  /^\/src(?:\/|$)/,
];

await fs.rm(releaseDir, { recursive: true, force: true });

await packager({
  dir: rootDir,
  out: releaseDir,
  overwrite: true,
  platform: "win32",
  arch: "x64",
  name: "RecoilStrafeTrainer",
  executableName: "RecoilStrafeTrainer",
  appVersion: "0.0.0",
  prune: true,
  asar: false,
  ignore: ignoredPatterns,
});
