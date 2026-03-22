const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FRONTEND_DIR = path.resolve(__dirname, "..");

test("frontend ships static Scramjet proxy assets", () => {
  const requiredFiles = [
    "settings-shell.css",
    "site-storage.js",
    "social-client.js",
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
  const shellScript = fs.readFileSync(path.join(FRONTEND_DIR, "shell.js"), "utf8");

  assert.match(shellPage, /id="sidebar-toggle"/);
  assert.match(shellPage, /<script src="site-storage\.js"><\/script>\s*<script src="site-settings\.js"><\/script>/);
  assert.match(shellPage, /<script src="social-client\.js"><\/script>/);
  assert.match(shellPage, /baremux\/index\.js/);
  assert.match(shellPage, /scram\/scramjet\.all\.js/);
  assert.match(shellPage, /<script src="data\/games-catalog\.js" data-antarctic-games-catalog="true" data-palladium-games-catalog="true"><\/script>/);
  assert.match(shellPage, /antarctic:\/\/settings/);
  assert.match(shellPage, /antarctic:\/\/account/);
  assert.match(shellPage, /antarctic:\/\/chat/);
  assert.match(shellPage, /Open Antarctic In About:Blank/);
  assert.match(shellPage, /antarctic:\/\/ai/);
  assert.match(shellPage, /Cloud Saves/);
  assert.match(shellPage, /Community Chat/);
  assert.match(shellPage, /prompt-list--composer/);
  assert.doesNotMatch(shellPage, /data-role="ai-status"/);
  assert.match(shellScript, /function isRecoverableProxyStorageError\(error\)/);
  assert.match(shellScript, /window\.AntarcticGamesStorage \|\| window\.PalladiumSiteStorage/);
  assert.match(shellScript, /window\.AntarcticSocialClient \|\| window\.PalladiumSocialClient/);
  assert.match(shellScript, /storage\.setJson\(STORAGE_KEY, payload/);
  assert.match(shellScript, /data-game-save="1"/);
  assert.match(shellScript, /data-game-load="1"/);
  assert.match(shellScript, /normalized === "\$scramjet"/);
  assert.match(shellScript, /window\.indexedDB\.databases\(\)/);
  assert.match(shellScript, /window\.navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(shellScript, /window\.indexedDB\.deleteDatabase\(name\)/);
  assert.match(shellScript, /Resetting proxy storage and retrying/);
  assert.match(shellScript, /return initializeProxyRuntime\(config, false\);/);
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
  const shellPage = fs.readFileSync(path.join(FRONTEND_DIR, "index.html"), "utf8");

  assert.match(settingsShellCss, /\.shell\s*\{[\s\S]*padding:\s*0;/);
  assert.match(settingsShellCss, /\.shell-sidebar\s*\{[\s\S]*border-radius:\s*0 calc\(var\(--radius-xl\) \+ 0\.35rem\) calc\(var\(--radius-xl\) \+ 0\.35rem\) 0;/);
  assert.match(settingsShellCss, /\.shell-sidebar\s*\{[\s\S]*margin:\s*0;/);
  assert.match(settingsShellCss, /\.shell-sidebar\s*\{[\s\S]*height:\s*100dvh;/);
  assert.match(settingsShellCss, /\.shell-sidebar__row,\s*\.sidebar-toggle-btn,\s*\.tab-card,\s*\.route-link\s*\{[\s\S]*grid-template-columns:\s*var\(--sidebar-row-template\);/);
  assert.match(settingsShellCss, /\.tab-list\s*\{[\s\S]*flex:\s*0 0 auto;/);
  assert.match(settingsShellCss, /\.sidebar-block--links,\s*\.shell--sidebar-collapsed \.sidebar-block--links\s*\{[\s\S]*margin-top:\s*auto;/);
  assert.match(settingsShellCss, /\.shell-sidebar__rail--action \.sidebar-block__action--icon\s*\{[\s\S]*width:\s*var\(--sidebar-tile\);/);
  assert.match(settingsShellCss, /--sidebar-active-inset:\s*calc\(0\.04rem \+ var\(--gutter\)\);/);
  assert.match(settingsShellCss, /\.tab-card::before\s*\{[\s\S]*inset-inline:\s*var\(--sidebar-active-inset\) var\(--sidebar-active-inset\);/);
  assert.match(settingsShellCss, /\.shell--sidebar-collapsed \.shell-sidebar__row,\s*\.shell--sidebar-collapsed \.sidebar-toggle-btn,\s*\.shell--sidebar-collapsed \.tab-card,\s*\.shell--sidebar-collapsed \.route-link\s*\{[\s\S]*grid-template-columns:\s*var\(--sidebar-row-template\);/);
  assert.doesNotMatch(settingsShellCss, /\.shell--sidebar-collapsed \.shell-sidebar__row\s*\{[\s\S]*justify-content:\s*center;/);
  assert.doesNotMatch(settingsShellCss, /\.shell--sidebar-collapsed \.sidebar-block__header--tabs \.shell-sidebar__actions\s*\{/);
  assert.doesNotMatch(baseShellCss, /\.shell--sidebar-collapsed \.shell-sidebar__row\s*\{[\s\S]*grid-template-columns:\s*var\(--sidebar-rail-width\) 0 minmax\(0, max-content\);/);
  assert.doesNotMatch(baseShellCss, /\.shell--sidebar-collapsed \.tab-card,\s*\.shell--sidebar-collapsed \.route-link\s*\{[\s\S]*justify-content:\s*center;/);
  assert.match(settingsShellCss, /@media \(max-width: 1100px\)\s*\{[\s\S]*\.shell,\s*\.shell--sidebar-collapsed\s*\{[\s\S]*flex-direction:\s*row;/);
  assert.match(settingsShellCss, /\.shell--sidebar-collapsed \.shell-sidebar\s*\{[\s\S]*flex:\s*0 0 var\(--sidebar-collapsed-width\);/);
  assert.match(settingsShellCss, /\.shell-pane--active\.shell-pane--ai\s*\{[\s\S]*display:\s*grid;/);
  assert.match(settingsShellCss, /\.ai-chat__composer\s*\{/);
  assert.match(settingsShellCss, /\.theme-chip__preview\s*\{/);
  assert.match(settingsShellCss, /\[data-theme\] body\s*\{/);
  assert.match(shellPage, /sidebar-block__header sidebar-block__header--tabs shell-sidebar__row[\s\S]*shell-sidebar__rail shell-sidebar__rail--action[\s\S]*id="shell-new-tab"/);
  assert.match(baseShellCss, /\.shell-pane--active\.shell-pane--home\s*\{[\s\S]*display:\s*flex;/);
  assert.match(baseShellCss, /body\s*\{[\s\S]*animation:\s*none;/);
  assert.match(baseShellCss, /body::before\s*\{[\s\S]*animation:\s*none;/);
  assert.match(baseShellCss, /body::after\s*\{[\s\S]*animation:\s*none;/);
});
