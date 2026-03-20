const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FRONTEND_DIR = path.resolve(__dirname, "..");

test("frontend ships static Scramjet proxy assets", () => {
  const requiredFiles = [
    "settings-shell.css",
    path.join("scram", "scramjet.all.js"),
    path.join("scram", "scramjet.sync.js"),
    path.join("scram", "scramjet.wasm.wasm"),
    path.join("baremux", "index.js"),
    path.join("baremux", "worker.js"),
    path.join("libcurl", "index.mjs"),
    "sw.js"
  ];

  for (const relativePath of requiredFiles) {
    assert.ok(fs.existsSync(path.join(FRONTEND_DIR, relativePath)), `Missing proxy asset: ${relativePath}`);
  }
});

test("frontend shell references Scramjet assets and sidebar controls", () => {
  const shellPage = fs.readFileSync(path.join(FRONTEND_DIR, "index.html"), "utf8");

  assert.match(shellPage, /id="sidebar-toggle"/);
  assert.match(shellPage, /baremux\/index\.js/);
  assert.match(shellPage, /scram\/scramjet\.all\.js/);
  assert.match(shellPage, /palladium:\/\/settings/);
  assert.match(shellPage, /Open Palladium In About:Blank/);
  assert.match(shellPage, /palladium:\/\/ai/);
});

test("service worker bootstraps Scramjet from the static frontend origin", () => {
  const serviceWorker = fs.readFileSync(path.join(FRONTEND_DIR, "sw.js"), "utf8");

  assert.match(serviceWorker, /importScripts\("\/scram\/scramjet\.all\.js"\)/);
  assert.match(serviceWorker, /scramjet\.route\(event\)/);
  assert.match(serviceWorker, /scramjet\.fetch\(event\)/);
});

test("settings shell keeps the sidebar on a fixed attached rail", () => {
  const settingsShellCss = fs.readFileSync(path.join(FRONTEND_DIR, "settings-shell.css"), "utf8");
  const baseShellCss = fs.readFileSync(path.join(FRONTEND_DIR, "styles.css"), "utf8");

  assert.match(settingsShellCss, /\.shell\s*\{[\s\S]*padding:\s*0;/);
  assert.match(settingsShellCss, /\.shell-sidebar\s*\{[\s\S]*border-radius:\s*0 calc\(var\(--radius-xl\) \+ 0\.35rem\) calc\(var\(--radius-xl\) \+ 0\.35rem\) 0;/);
  assert.match(settingsShellCss, /\.shell-sidebar\s*\{[\s\S]*margin:\s*0;/);
  assert.match(settingsShellCss, /\.shell-sidebar\s*\{[\s\S]*height:\s*100dvh;/);
  assert.match(settingsShellCss, /\.shell-sidebar__row,\s*\.sidebar-toggle-btn,\s*\.tab-card,\s*\.route-link\s*\{[\s\S]*grid-template-columns:\s*var\(--sidebar-row-template\);/);
  assert.match(settingsShellCss, /\.tab-list\s*\{[\s\S]*flex:\s*0 0 auto;/);
  assert.match(settingsShellCss, /\.shell--sidebar-collapsed \.shell-sidebar__row,\s*\.shell--sidebar-collapsed \.sidebar-toggle-btn,\s*\.shell--sidebar-collapsed \.tab-card,\s*\.shell--sidebar-collapsed \.route-link\s*\{[\s\S]*grid-template-columns:\s*var\(--sidebar-row-template\);/);
  assert.doesNotMatch(settingsShellCss, /\.shell--sidebar-collapsed \.shell-sidebar__row\s*\{[\s\S]*justify-content:\s*center;/);
  assert.match(settingsShellCss, /@media \(max-width: 1100px\)\s*\{[\s\S]*\.shell,\s*\.shell--sidebar-collapsed\s*\{[\s\S]*flex-direction:\s*row;/);
  assert.match(settingsShellCss, /\.shell--sidebar-collapsed \.shell-sidebar\s*\{[\s\S]*flex:\s*0 0 var\(--sidebar-collapsed-width\);/);
  assert.match(settingsShellCss, /\.shell-pane--active\.shell-pane--ai\s*\{[\s\S]*display:\s*grid;/);
  assert.match(baseShellCss, /\.shell-pane--active\.shell-pane--home\s*\{[\s\S]*display:\s*flex;/);
});
