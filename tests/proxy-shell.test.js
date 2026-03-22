const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FRONTEND_DIR = path.resolve(__dirname, "..");

test("frontend ships static Scramjet proxy assets", () => {
  const requiredFiles = [
    "netlify.toml",
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

test("frontend ships a Netlify config for the static shell", () => {
  const netlifyConfig = fs.readFileSync(path.join(FRONTEND_DIR, "netlify.toml"), "utf8");

  assert.match(netlifyConfig, /\[build\]\s*[\s\S]*publish = "\."/);
  assert.match(netlifyConfig, /\[build\]\s*[\s\S]*command = "npm run verify"/);
  assert.match(netlifyConfig, /\[\[headers\]\]\s*[\s\S]*for = "\/sw\.js"[\s\S]*Service-Worker-Allowed = "\/"/);
  assert.match(netlifyConfig, /\[\[headers\]\]\s*[\s\S]*for = "\/scram\/\*"[\s\S]*immutable/);
  assert.match(netlifyConfig, /\[\[redirects\]\]\s*[\s\S]*from = "\/\*"[\s\S]*to = "\/index\.html"[\s\S]*status = 200/);
});

test("frontend shell references Scramjet assets and sidebar controls", () => {
  const shellPage = fs.readFileSync(path.join(FRONTEND_DIR, "index.html"), "utf8");
  const shellScript = fs.readFileSync(path.join(FRONTEND_DIR, "shell.js"), "utf8");
  const gamesHelper = fs.readFileSync(path.join(FRONTEND_DIR, "games-static.js"), "utf8");
  const socialClient = fs.readFileSync(path.join(FRONTEND_DIR, "social-client.js"), "utf8");
  const backendHelper = fs.readFileSync(path.join(FRONTEND_DIR, "backend.js"), "utf8");

  assert.match(shellPage, /id="sidebar-toggle"/);
  assert.match(shellPage, /<script src="site-storage\.js"><\/script>\s*<script src="site-settings\.js"><\/script>/);
  assert.match(shellPage, /<script src="social-client\.js"><\/script>/);
  assert.match(shellPage, /baremux\/index\.js/);
  assert.match(shellPage, /scram\/scramjet\.all\.js/);
  assert.match(shellPage, /<script src="data\/games-catalog\.js" data-antarctic-games-catalog="true" data-palladium-games-catalog="true"><\/script>/);
  assert.match(shellPage, /antarctic:\/\/settings/);
  assert.match(shellPage, /antarctic:\/\/account/);
  assert.match(shellPage, /antarctic:\/\/dms/);
  assert.match(shellPage, /antarctic:\/\/groupchats/);
  assert.match(shellPage, /Open Antarctic In About:Blank/);
  assert.match(shellPage, /antarctic:\/\/ai/);
  assert.match(shellPage, /Cloud Saves/);
  assert.match(shellPage, /Direct Messages/);
  assert.match(shellPage, /Group Chats/);
  assert.match(shellPage, /data-role="account-metrics"/);
  assert.match(shellPage, /data-role="account-quick-actions"/);
  assert.match(shellPage, /data-role="chat-intro-eyebrow"/);
  assert.match(shellPage, /data-role="chat-list-title"/);
  assert.match(shellPage, /data-role="chat-session"/);
  assert.match(shellPage, /data-role="chat-incoming-requests"/);
  assert.match(shellPage, /name="room-visibility"/);
  assert.match(shellPage, /data-role="room-invites-field"/);
  assert.match(shellPage, /name="room-invites"/);
  assert.match(shellPage, /data-role="chat-message-counter"/);
  assert.match(shellPage, /maxlength="2000"/);
  assert.match(shellPage, /Send DM request/);
  assert.match(shellPage, /prompt-list--composer/);
  assert.doesNotMatch(shellPage, /data-account-wizard-next/);
  assert.doesNotMatch(shellPage, /data-role="ai-status"/);
  assert.match(shellScript, /function isRecoverableProxyStorageError\(error\)/);
  assert.match(shellScript, /var PROXY_STORAGE_VERSION_KEY = "antarctic\.proxy\.storage\.version\.v1"/);
  assert.match(shellScript, /window\.AntarcticGamesStorage \|\| window\.PalladiumSiteStorage/);
  assert.match(shellScript, /window\.AntarcticSocialClient \|\| window\.PalladiumSocialClient/);
  assert.match(shellScript, /var LOCAL_APP_ASSET_PARAM = "antarctic_asset"/);
  assert.match(shellScript, /var LOCAL_APP_ASSET_VERSION = "2026-03-22-asset-1"/);
  assert.match(shellScript, /async function requestAi\(payload, onDelta\)/);
  assert.match(shellScript, /function readAiResponseText\(response\)/);
  assert.match(shellScript, /function flattenAssistantContent\(value\)/);
  assert.match(shellScript, /function buildCatalogAiResponseFromCatalog\(userText, games\)/);
  assert.match(shellScript, /function buildShellHelpAiResponse\(userText\)/);
  assert.match(shellScript, /function findCatalogCategoryInQuery\(userText, games\)/);
  assert.match(shellScript, /function extractRequestedGameCount\(userText\)/);
  assert.match(shellScript, /function resolveLocalAppUrl\(value\)/);
  assert.match(shellScript, /function getLocalAppBaseUrl\(\)/);
  assert.match(shellScript, /function appendLocalAssetVersion\(resolvedUrl\)/);
  assert.match(shellScript, /function appendProxyRuntimeAssetVersion\(value\)/);
  assert.match(shellScript, /function resolveProxyRequestUrl\(config\)/);
  assert.match(shellScript, /function resolveProxyFetchUrl\(config\)/);
  assert.match(shellScript, /function probeWispTransport\(wispUrl\)/);
  assert.match(shellScript, /function createHttpProxyTransport\(config\)/);
  assert.match(shellScript, /function waitForProxyServiceWorkerController\(\)/);
  assert.match(shellScript, /function shouldSkipFrontendProxyHeader\(name\)/);
  assert.match(shellScript, /assetUrl\.searchParams\.set\(LOCAL_APP_ASSET_PARAM, LOCAL_APP_ASSET_VERSION\)/);
  assert.match(shellScript, /new URL\(normalized, getLocalAppBaseUrl\(\)\)\.toString\(\)/);
  assert.match(shellScript, /function renderAccountMetrics\(pane, bootstrap\)/);
  assert.match(shellScript, /function renderAccountQuickActions\(pane, session, bootstrap\)/);
  assert.match(shellScript, /function renderChatSessionCard\(pane, community\)/);
  assert.match(shellScript, /function getChatModeConfig\(tab\)/);
  assert.match(shellScript, /function applyChatPaneMode\(tab, pane\)/);
  assert.match(shellScript, /function filterThreadsForChatMode\(threads, tab\)/);
  assert.match(shellScript, /incomingDirectRequestCount/);
  assert.match(shellScript, /var CHAT_MESSAGE_MAX_LENGTH = 2000;/);
  assert.match(shellScript, /function syncRoomInviteField\(pane\)/);
  assert.match(shellScript, /function syncChatMessageCounter\(pane\)/);
  assert.match(shellScript, /function isChatRoomJoinable\(room\)/);
  assert.match(shellScript, /function shouldRenderChatRoomCard\(room\)/);
  assert.match(shellScript, /function renderChatRoomAction\(room\)/);
  assert.match(shellScript, /room && room\.invited \? "Accept invite" : "Join"/);
  assert.match(shellScript, /var threads = filterThreadsForChatMode\(payload && payload\.threads, tab\);/);
  assert.match(shellScript, /var visibleRooms = modeConfig\.showRoomCatalog/);
  assert.doesNotMatch(shellScript, /roomCatalogEl\.innerHTML[\s\S]*\(rooms\.length/);
  assert.match(shellScript, /function leaveChatRoom\(tab, pane, threadId\)/);
  assert.match(shellScript, /data-chat-leave/);
  assert.match(shellScript, /function acceptIncomingDirectRequest\(tab, pane, requestId\)/);
  assert.match(shellScript, /function denyIncomingDirectRequest\(tab, pane, requestId\)/);
  assert.match(shellScript, /data-chat-request-accept/);
  assert.match(shellScript, /data-chat-request-deny/);
  assert.match(shellScript, /accountState:\s*\{\s*allowAutoOpen:\s*true\s*\}/);
  assert.match(shellScript, /if \(tab && tab\.accountState\) \{\s*tab\.accountState\.allowAutoOpen = true;\s*\}/);
  assert.match(shellScript, /if \(tab && pane && tab\.accountState && tab\.accountState\.allowAutoOpen\) \{\s*setAccountWizardStep\(tab, pane, 2\);\s*tab\.accountState\.allowAutoOpen = false;\s*\}/);
  assert.match(shellScript, /if \(current === 3\) \{\s*tab\.chatState\.activeThreadId = "";\s*setChatWizardStep\(tab, pane, 2\);/);
  assert.doesNotMatch(shellScript, /if \(!tab\.chatState\.activeThreadId && threads\.length\) \{\s*tab\.chatState\.activeThreadId = String\(threads\[0\]\.id\);\s*\}/);
  assert.match(shellScript, /"antarctic:\/\/chat" as a legacy shortcut to group chats/);
  assert.match(shellScript, /socialApi\.getBootstrap\(Boolean\(forceRefresh\)\)/);
  assert.match(shellScript, /storage\.setJson\(STORAGE_KEY, payload/);
  assert.match(shellScript, /ensureProxyStorageCompatibility\(\)/);
  assert.match(shellScript, /data-game-save="1"/);
  assert.match(shellScript, /data-game-load="1"/);
  assert.match(shellScript, /game-launcher__action toolbar-button/);
  assert.match(shellScript, /frame\.src = resolveLocalAppUrl\(gamePath\)/);
  assert.match(shellScript, /frame\.src = resolveLocalAppUrl\(tab\.path\)/);
  assert.match(shellScript, /escapeHtml\(resolveLocalAppUrl\(image\)\)/);
  assert.match(shellScript, /keep_alive:\s*"48h"/);
  assert.match(shellScript, /num_predict:\s*48/);
  assert.match(shellScript, /num_ctx:\s*512/);
  assert.match(shellScript, /temperature:\s*0/);
  assert.match(shellScript, /matchedCategory\.toLowerCase\(\) \+ " games in the Antarctic catalog\."/);
  assert.match(shellScript, /I only used the local Antarctic catalog for this answer\./);
  assert.match(shellScript, /normalized === "\$scramjet"/);
  assert.match(shellScript, /window\.indexedDB\.databases\(\)/);
  assert.match(shellScript, /window\.navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(shellScript, /controller\.db && typeof controller\.db\.close === "function"/);
  assert.match(shellScript, /controller\.db\.close\(\)/);
  assert.match(shellScript, /window\.indexedDB\.deleteDatabase\(name\)/);
  assert.match(shellScript, /Resetting proxy storage and retrying/);
  assert.match(shellScript, /var PROXY_REPAIR_RELOAD_KEY = "antarctic\.proxy\.repair\.reload\.v1"/);
  assert.match(shellScript, /var PROXY_STORAGE_VERSION = "scramjet-storage-2026-03-22-proxy-2"/);
  assert.match(shellScript, /var PROXY_RUNTIME_ASSET_VERSION = "2026-03-22-proxy-2"/);
  assert.match(shellScript, /function scheduleProxyRepairReload\(\)/);
  assert.match(shellScript, /window\.location\.reload\(\)/);
  assert.match(shellScript, /config && config\.services && config\.services\.proxyRequest/);
  assert.match(shellScript, /config && config\.services && \(config\.services\.proxyFetch \|\| config\.services\.proxy\)/);
  assert.match(shellScript, /\.setRemoteTransport\(createHttpProxyTransport\(config\), proxyRequestUrl \|\| "antarctic-http-fallback"\)/);
  assert.match(shellScript, /state\.proxyRuntime\.transportMode = "http-fallback"/);
  assert.match(shellScript, /window\.navigator\.serviceWorker\.register\(appendProxyRuntimeAssetVersion\(SCRAMJET_SW_PATH\)\)/);
  assert.match(shellScript, /new window\.BareMux\.BareMuxConnection\(appendProxyRuntimeAssetVersion\(BAREMUX_WORKER_PATH\)\)/);
  assert.match(shellScript, /mux\.setTransport\(appendProxyRuntimeAssetVersion\(LIBCURL_TRANSPORT_PATH\), \[\{ wisp: wispUrl \}\]\)/);
  assert.match(shellScript, /name === "cookie"/);
  assert.match(shellScript, /normalizedMethod === "GET" \|\| normalizedMethod === "HEAD"/);
  assert.match(shellScript, /var fetchUrl = new URL\(proxyFetchUrl\);/);
  assert.match(shellScript, /"x-antarctic-proxy-method": normalizedMethod/);
  assert.match(shellScript, /if \(state\.proxyRuntime\.reloadScheduled\) \{\s*throw new Error\("Restarting proxy runtime\.\.\."\);\s*\}/);
  assert.match(shellScript, /writeProxyRepairReloadMarker\(""\)/);
  assert.match(shellScript, /return initializeProxyRuntime\(config, false\);/);
  assert.match(gamesHelper, /var LOCAL_MANIFEST_ASSET_PARAM = "antarctic_asset"/);
  assert.match(gamesHelper, /var LOCAL_MANIFEST_VERSION = "2026-03-22-asset-1"/);
  assert.match(gamesHelper, /function resolveCatalogScriptUrl\(\)/);
  assert.match(gamesHelper, /script\.src = resolveCatalogScriptUrl\(\);/);
  assert.match(gamesHelper, /manifestUrl\.searchParams\.set\(LOCAL_MANIFEST_ASSET_PARAM, LOCAL_MANIFEST_VERSION\)/);
  assert.match(socialClient, /function getBootstrap\(forceRefresh\)/);
  assert.match(socialClient, /incomingDirectRequests:\s*\[\]/);
  assert.match(socialClient, /createRoom:\s*function \(name, options\)/);
  assert.match(socialClient, /visibility:\s*cleanText\(roomOptions\.visibility \|\| "public"\)/);
  assert.match(socialClient, /invitedUsers:\s*invitedUsers/);
  assert.match(socialClient, /leaveRoom:\s*function \(threadId\)/);
  assert.match(socialClient, /acceptDirectRequest:\s*function \(requestId\)/);
  assert.match(socialClient, /denyDirectRequest:\s*function \(requestId\)/);
  assert.match(socialClient, /function hasStoredToken\(\)/);
  assert.match(socialClient, /if \(!hasStoredToken\(\)\) \{/);
  assert.match(socialClient, /requestJson\("\/api\/community\/bootstrap"/);
  assert.match(socialClient, /credentials:\s*"same-origin"/);
  assert.match(socialClient, /return currentCommunityState\(\);/);
  assert.match(backendHelper, /host === "sethpang\.com" \|\| host === "www\.sethpang\.com"/);
  assert.match(backendHelper, /return "https:\/\/sethpang\.com";/);
  assert.doesNotMatch(backendHelper, /https:\/\/api\.sethpang\.com/);
});

test("service worker bootstraps Scramjet from the static frontend origin", () => {
  const serviceWorker = fs.readFileSync(path.join(FRONTEND_DIR, "sw.js"), "utf8");

  assert.match(serviceWorker, /importScripts\("\/scram\/scramjet\.all\.js"\)/);
  assert.match(serviceWorker, /if \(!scramjet\.route\(event\)\) \{\s*return;\s*\}/);
  assert.match(serviceWorker, /await scramjet\.loadConfig\(\);\s*return scramjet\.fetch\(event\);/);
  assert.doesNotMatch(serviceWorker, /await scramjet\.loadConfig\(\);[\s\S]*return fetch\(event\.request\);/);
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
  assert.match(settingsShellCss, /\.shell-pane--account,\s*\.shell-pane--chat\s*\{[\s\S]*display:\s*none;/);
  assert.doesNotMatch(settingsShellCss, /\.shell-pane--internal\.shell-pane--account,\s*\.shell-pane--internal\.shell-pane--chat\s*\{[^}]*display:\s*flex;/);
  assert.match(settingsShellCss, /\.ai-chat__composer\s*\{/);
  assert.match(settingsShellCss, /\.account-summary__hero\s*\{/);
  assert.match(settingsShellCss, /\.account-metric-card\s*\{/);
  assert.match(settingsShellCss, /\.chat-session-card\s*\{/);
  assert.match(settingsShellCss, /\.chat-request-list\s*\{/);
  assert.match(settingsShellCss, /\.chat-request-card__actions\s*\{/);
  assert.match(settingsShellCss, /\.chat-room__counter\s*\{/);
  assert.match(settingsShellCss, /\.chat-room__header-actions\s*\{/);
  assert.match(settingsShellCss, /\.chat-thread-card__badge\s*\{/);
  assert.match(settingsShellCss, /\.chat-message--own\s*\{/);
  assert.match(settingsShellCss, /\.game-launcher__action\s*\{/);
  assert.match(settingsShellCss, /\.theme-chip__preview\s*\{/);
  assert.match(settingsShellCss, /\[data-theme\] body\s*\{/);
  assert.match(shellPage, /sidebar-block__header sidebar-block__header--tabs shell-sidebar__row[\s\S]*shell-sidebar__rail shell-sidebar__rail--action[\s\S]*id="shell-new-tab"/);
  assert.match(baseShellCss, /\.shell-pane--active\.shell-pane--home\s*\{[\s\S]*display:\s*flex;/);
  assert.match(baseShellCss, /body\s*\{[\s\S]*animation:\s*none;/);
  assert.match(baseShellCss, /body::before\s*\{[\s\S]*animation:\s*none;/);
  assert.match(baseShellCss, /body::after\s*\{[\s\S]*animation:\s*none;/);
});
