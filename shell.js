(function () {
  var core = window.AntarcticGamesShellCore || window.PalladiumShellCore;
  if (!core) return;

  var STORAGE_KEY = "antarctic.shell.state.v1";
  var LEGACY_STORAGE_KEY = "palladium.shell.state.v1";
  var PROXY_STORAGE_VERSION_KEY = "antarctic.proxy.storage.version.v1";
  var PROXY_STORAGE_VERSION = "scramjet-storage-2026-03-22";
  var LOCAL_APP_ASSET_PARAM = "antarctic_asset";
  var LOCAL_APP_ASSET_VERSION = "2026-03-22-asset-1";
  var SCRAMJET_PREFIX = "/service/scramjet/";
  var SCRAMJET_SW_PATH = "/sw.js";
  var BAREMUX_WORKER_PATH = "/baremux/worker.js";
  var LIBCURL_TRANSPORT_PATH = "/libcurl/index.mjs";
  var SCRAMJET_FILES = {
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
    wasm: "/scram/scramjet.wasm.wasm"
  };
  /* Same artwork as sidebar Games link; viewBox crops top to hide cord */
  var GAMES_CONTROLLER_PATH_MAIN =
    "M373.1,256.2H267.4v-21.4c0-17,13.9-30.9,30.9-30.9h102.3c30.6,0,55.4-24.9,55.4-55.4s-24.9-55.4-55.4-55.4H111.4c-17,0-30.9-13.9-30.9-30.9V23.8c0-6.8-5.5-12.3-12.3-12.3S56,17.1,56,23.8v38.3c0,30.6,24.9,55.4,55.4,55.4h289.2c17,0,30.9,13.9,30.9,30.9s-13.9,30.9-30.9,30.9H298.3c-30.6,0-55.4,24.9-55.4,55.4v21.4h-104c-67.3,0-122.1,54.8-122.1,122.1c0,67.3,54.8,122.1,122.1,122.1c36.4,0,66.3-16.3,86.8-47.1h60.7c20.6,30.9,50.4,47.1,86.8,47.1c67.3,0,122.1-54.8,122.1-122.1C495.3,311,440.5,256.2,373.1,256.2z M373.1,475.9c-30.4,0-53.1-13.5-69.5-41.1c-2.2-3.7-6.2-6-10.5-6h-74.2c-4.3,0-8.3,2.3-10.5,6c-16.4,27.7-39.1,41.1-69.5,41.1c-53.8,0-97.6-43.8-97.6-97.6c0-53.8,43.8-97.6,97.6-97.6h234.3c53.8,0,97.6,43.8,97.6,97.6C470.8,432.1,427,475.9,373.1,475.9z";
  var GAMES_CONTROLLER_PATH_DPAD =
    "M171.7,361.6h-25v-25c0-6.8-5.5-12.3-12.3-12.3c-6.8,0-12.3,5.5-12.3,12.3v25h-25c-6.8,0-12.3,5.5-12.3,12.3c0,6.8,5.5,12.3,12.3,12.3h25v25c0,6.8,5.5,12.3,12.3,12.3c6.8,0,12.3-5.5,12.3-12.3v-25h25c6.8,0,12.3-5.5,12.3-12.3C184,367,178.5,361.6,171.7,361.6z";
  /* Same artwork as sidebar Settings link; 15×15 gear (filled) */
  var SETTINGS_GEAR_PATH =
    "M7.07.65a.85.85 0 0 0-.828.662l-.238 1.05c-.38.11-.74.262-1.08.448l-.91-.574a.85.85 0 0 0-1.055.118l-.606.606a.85.85 0 0 0-.118 1.054l.574.912c-.186.338-.337.7-.447 1.079l-1.05.238a.85.85 0 0 0-.662.829v.857a.85.85 0 0 0 .662.829l1.05.238c.11.379.261.74.448 1.08l-.575.91a.85.85 0 0 0 .118 1.055l.607.606a.85.85 0 0 0 1.054.118l.911-.574c.339.186.7.337 1.079.447l.238 1.05a.85.85 0 0 0 .829.662h.857a.85.85 0 0 0 .829-.662l.238-1.05c.38-.11.74-.26 1.08-.447l.911.574a.85.85 0 0 0 1.054-.118l.606-.606a.85.85 0 0 0 .118-1.054l-.574-.911c.187-.34.338-.7.448-1.08l1.05-.238a.85.85 0 0 0 .662-.829v-.857a.85.85 0 0 0-.662-.83l-1.05-.237c-.11-.38-.26-.74-.447-1.08l.574-.91a.85.85 0 0 0-.118-1.055l-.606-.606a.85.85 0 0 0-1.055-.118l-.91.574a5.323 5.323 0 0 0-1.08-.448l-.239-1.05A.85.85 0 0 0 7.928.65zM4.92 3.813a4.476 4.476 0 0 1 1.795-.745L7.071 1.5h.857l.356 1.568a4.48 4.48 0 0 1 1.795.744l1.36-.857l.607.606l-.858 1.36c.37.527.628 1.136.744 1.795l1.568.356v.857l-1.568.355a4.475 4.475 0 0 1-.744 1.796l.857 1.36l-.606.606l-1.36-.857a4.476 4.476 0 0 1-1.795.743L7.928 13.5h-.857l-.356-1.568a4.475 4.475 0 0 1-1.794-.744l-1.36.858l-.607-.606l.858-1.36a4.476 4.476 0 0 1-.744-1.796L1.5 7.93v-.857l1.568-.356a4.476 4.476 0 0 1 .744-1.794L2.954 3.56l.606-.606zM9.026 7.5a1.525 1.525 0 1 1-3.05 0a1.525 1.525 0 0 1 3.05 0m.9 0a2.425 2.425 0 1 1-4.85 0a2.425 2.425 0 0 1 4.85 0";
  /* Same artwork as sidebar AI link; Bootstrap Icons robot (16×16) */
  var AI_ROBOT_PATH_FACE =
    "M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a25 25 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135";
  var AI_ROBOT_PATH_BODY =
    "M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5";
  /* Match index.html + styles.css (--sans / --mono); each iframe document needs its own copy. */
  var ANTARCTIC_GFONTS_URL =
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Sora:wght@400;500;600;700&display=swap";
  var ANTARCTIC_IN_FRAME_FONT_CSS =
    'html,body{font-family:"Sora","Avenir Next","Segoe UI",sans-serif} ' +
    'code,kbd,pre,samp{font-family:"JetBrains Mono","JetBrains Mono NL",ui-monospace,monospace}';
  var SETTINGS_THEME_ORDER = [
    "default",
    "color-wash",
    "miami",
    "rainbow",
    "aurora",
    "sunset",
    "forest",
    "oceanic",
    "graphite",
    "arctic",
    "ember",
    "neon"
  ];
  var THEME_DETAILS = {
    "default": {
      label: "Default",
      description: "Polar glass with crisp Antarctic blues.",
      preview: "linear-gradient(135deg, #031120 0%, #0b2f52 55%, #6bb6ff 100%)",
      swatches: ["#3b8cff", "#6bb6ff", "#a8d4ff"]
    },
    "color-wash": {
      label: "Color Wash",
      description: "Lavender dusk with soft cyan highlights.",
      preview: "linear-gradient(135deg, #201438 0%, #5b49c7 48%, #d7f4ff 100%)",
      swatches: ["#7c6cff", "#a898ff", "#d0c8ff"]
    },
    "miami": {
      label: "Miami",
      description: "Hot pink, sunset orange, and poolside aqua.",
      preview: "linear-gradient(135deg, #200822 0%, #ff5c9d 42%, #ffaa3d 72%, #5cfffb 100%)",
      swatches: ["#ff5c9d", "#ffaa3d", "#5cfffb"]
    },
    "rainbow": {
      label: "Rainbow",
      description: "Festival neon with full-spectrum contrast.",
      preview: "linear-gradient(135deg, #23120b 0%, #ff5340 24%, #ffe14a 49%, #3dffc8 75%, #4f8dff 100%)",
      swatches: ["#ff5340", "#ffe14a", "#3dffc8"]
    },
    "aurora": {
      label: "Aurora",
      description: "Northern-light greens over a cold dark sky.",
      preview: "linear-gradient(135deg, #041912 0%, #0d4b38 52%, #2ef5a8 82%, #cafff4 100%)",
      swatches: ["#2ef5a8", "#9dffe8", "#b8fff0"]
    },
    "sunset": {
      label: "Sunset",
      description: "Burnt orange sky fading into warm gold.",
      preview: "linear-gradient(135deg, #2a0907 0%, #7d1e18 44%, #ff6a38 72%, #ffc24a 100%)",
      swatches: ["#ff6a38", "#ffc24a", "#ffe0b8"]
    },
    "forest": {
      label: "Forest",
      description: "Deep spruce panels with bright moss energy.",
      preview: "linear-gradient(135deg, #071108 0%, #163922 55%, #3dff7a 82%, #d4ffe0 100%)",
      swatches: ["#3dff7a", "#9affb0", "#c8ffd8"]
    },
    "oceanic": {
      label: "Oceanic",
      description: "Abyss blues with electric surf accents.",
      preview: "linear-gradient(135deg, #03111e 0%, #0a3150 55%, #2eb0ff 82%, #d2f8ff 100%)",
      swatches: ["#2eb0ff", "#7ad8ff", "#b8f0ff"]
    },
    "graphite": {
      label: "Graphite",
      description: "Minimal monochrome steel and white glow.",
      preview: "linear-gradient(135deg, #090a0c 0%, #20242d 58%, #d4dcf0 100%)",
      swatches: ["#7f8898", "#d4dcf0", "#ffffff"]
    },
    "arctic": {
      label: "Arctic",
      description: "Glacial blues with a bright frozen edge.",
      preview: "linear-gradient(135deg, #071521 0%, #123f62 55%, #5ab8ff 80%, #e8fcff 100%)",
      swatches: ["#5ab8ff", "#c4f2ff", "#e8fcff"]
    },
    "ember": {
      label: "Ember",
      description: "Coal-black reds with furnace-orange heat.",
      preview: "linear-gradient(135deg, #220806 0%, #5e180f 50%, #ff5724 76%, #ffb04a 100%)",
      swatches: ["#ff5724", "#ffb04a", "#ffe0b0"]
    },
    "neon": {
      label: "Neon",
      description: "Cyber violet with bright mint circuitry.",
      preview: "linear-gradient(135deg, #10081d 0%, #341464 52%, #9b6cff 70%, #48fff8 100%)",
      swatches: ["#9b6cff", "#48fff8", "#b8fffc"]
    }
  };
  var CLOAK_PRESETS = [
    {
      id: "classroom",
      title: "Classes",
      favicon: "https://ssl.gstatic.com/classroom/favicon.png",
      description: "Google Classroom"
    },
    {
      id: "docs",
      title: "Quarterly Notes - Google Docs",
      favicon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico",
      description: "Google Docs"
    },
    {
      id: "drive",
      title: "My Drive - Google Drive",
      favicon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
      description: "Google Drive"
    },
    {
      id: "calendar",
      title: "Calendar",
      favicon: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png",
      description: "Google Calendar"
    }
  ];

  var elements = {
    addressForm: document.getElementById("address-form"),
    addressInput: document.getElementById("address-input"),
    aiStatusChip: document.getElementById("ai-status-chip"),
    homeButton: document.getElementById("toolbar-home"),
    newTabButton: document.getElementById("shell-new-tab"),
    paneStack: document.getElementById("pane-stack"),
    proxyStatusChip: document.getElementById("proxy-status-chip"),
    refreshButton: document.getElementById("toolbar-refresh"),
    routeList: document.querySelector(".route-list"),
    shellRoot: document.getElementById("shell-root"),
    stage: document.getElementById("shell-stage"),
    stageOverlay: document.getElementById("stage-overlay"),
    stageOverlayText: document.getElementById("stage-overlay-text"),
    tabList: document.getElementById("tab-list"),
    toolbarSidebarToggle: document.getElementById("sidebar-toggle"),
    addressUndoButton: document.getElementById("toolbar-address-undo"),
    addressRedoButton: document.getElementById("toolbar-address-redo")
  };

  var ADDRESS_HISTORY_LIMIT = 50;
  var addressBarHistoryState = {
    past: [],
    future: [],
    applying: false,
    commitSnapshot: "",
    ready: false
  };

  var state = {
    activeTabId: "",
    config: null,
    gamesCatalog: null,
    proxyHealth: {
      ok: false,
      message: "Booting Scramjet..."
    },
    proxyRuntime: {
      controller: null,
      initPromise: null,
      repairPromise: null,
      ready: false,
      transportUrl: ""
    },
    sidebarCollapsed: false,
    tabs: []
  };

  function cleanText(value) {
    return core.cleanText(value);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getGamesApi() {
    return window.AntarcticGames || window.PalladiumGames || null;
  }

  function getBackendApi() {
    return window.AntarcticGamesBackend || window.PalladiumBackend || null;
  }

  function getSocialApi() {
    return window.AntarcticSocialClient || window.PalladiumSocialClient || null;
  }

  function getSiteStorageApi() {
    return window.AntarcticGamesStorage || window.PalladiumSiteStorage || null;
  }

  var localAppBaseUrlCache = "";

  function resolveDocumentUrl(raw) {
    var text = cleanText(raw);
    if (!text) return "";

    var baseHref = "";
    try {
      baseHref = cleanText((document && document.baseURI) || "");
    } catch (error) {
      baseHref = "";
    }

    if (!baseHref) {
      try {
        baseHref = cleanText((window.location && window.location.href) || "");
      } catch (error) {
        baseHref = "";
      }
    }

    try {
      return baseHref ? new URL(text, baseHref).toString() : new URL(text).toString();
    } catch (error) {
      return "";
    }
  }

  function inferLocalAppBaseUrl() {
    if (document && typeof document.querySelectorAll === "function") {
      var scripts = document.querySelectorAll("script[src]");
      for (var index = 0; index < scripts.length; index += 1) {
        var src = cleanText(scripts[index].getAttribute("src"));
        if (!/(?:^|\/)(?:shell|games-static|site-settings|site-storage|social-client|backend)\.js(?:[?#].*)?$/i.test(src)) {
          continue;
        }

        var resolvedScriptUrl = resolveDocumentUrl(src);
        if (!resolvedScriptUrl) continue;

        try {
          var scriptUrl = new URL(resolvedScriptUrl);
          scriptUrl.search = "";
          scriptUrl.hash = "";
          scriptUrl.pathname = scriptUrl.pathname.replace(/[^/]*$/, "");
          return scriptUrl.toString();
        } catch (error) {
          // Keep trying the next candidate.
        }
      }
    }

    var fallbackUrl = resolveDocumentUrl((window.location && window.location.href) || "");
    if (!fallbackUrl) {
      return "/";
    }

    try {
      var pageUrl = new URL(fallbackUrl);
      pageUrl.search = "";
      pageUrl.hash = "";
      pageUrl.pathname = pageUrl.pathname.replace(/[^/]*$/, "");
      return pageUrl.toString();
    } catch (error) {
      return "/";
    }
  }

  function getLocalAppBaseUrl() {
    if (!localAppBaseUrlCache) {
      localAppBaseUrlCache = inferLocalAppBaseUrl();
    }
    return localAppBaseUrlCache;
  }

  function appendLocalAssetVersion(resolvedUrl) {
    var text = cleanText(resolvedUrl);
    if (!text || /^(?:data|blob):/i.test(text)) {
      return text;
    }

    try {
      var assetUrl = new URL(text, getLocalAppBaseUrl());
      var baseUrl = new URL(getLocalAppBaseUrl());
      if (assetUrl.origin !== baseUrl.origin) {
        return assetUrl.toString();
      }
      assetUrl.searchParams.set(LOCAL_APP_ASSET_PARAM, LOCAL_APP_ASSET_VERSION);
      return assetUrl.toString();
    } catch (error) {
      return text;
    }
  }

  function isRemoteAssetUrl(value) {
    var text = cleanText(value);
    if (!text) return false;
    if (/^(?:data|blob):/i.test(text)) return true;

    try {
      var assetUrl = new URL(text, getLocalAppBaseUrl());
      var baseUrl = new URL(getLocalAppBaseUrl());
      return assetUrl.origin !== baseUrl.origin;
    } catch (error) {
      return /^(?:[a-z]+:)?\/\//i.test(text);
    }
  }

  function resolveLocalAppUrl(value) {
    var text = cleanText(value);
    if (!text) {
      return text;
    }
    if (/^(?:data|blob):/i.test(text)) {
      return text;
    }
    if (isRemoteAssetUrl(text)) {
      try {
        return new URL(text).toString();
      } catch (error) {
        return text;
      }
    }

    var normalized = text.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!normalized) {
      return getLocalAppBaseUrl() || "/";
    }

    try {
      return appendLocalAssetVersion(new URL(normalized, getLocalAppBaseUrl()).toString());
    } catch (error) {
      return appendLocalAssetVersion("/" + normalized);
    }
  }

  function readPersistentValue(key) {
    var storage = getSiteStorageApi();
    if (storage && typeof storage.getItem === "function") {
      return cleanText(storage.getItem(key));
    }

    try {
      return cleanText(window.localStorage.getItem(key));
    } catch (error) {
      return "";
    }
  }

  function writePersistentValue(key, value) {
    var normalized = cleanText(value);
    var storage = getSiteStorageApi();
    if (storage && typeof storage.setItem === "function") {
      storage.setItem(key, normalized);
      return;
    }

    try {
      if (normalized) {
        window.localStorage.setItem(key, normalized);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function injectAntarcticFontsIntoDocument(doc) {
    if (!doc || !doc.head) return;
    if (doc.getElementById("antarctic-font-bridge")) return;
    try {
      var link = doc.createElement("link");
      link.rel = "stylesheet";
      link.href = ANTARCTIC_GFONTS_URL;
      link.id = "antarctic-font-link";
      var style = doc.createElement("style");
      style.id = "antarctic-font-bridge";
      style.textContent = ANTARCTIC_IN_FRAME_FONT_CSS;
      doc.head.appendChild(link);
      doc.head.appendChild(style);
    } catch (err) {
      /* Cross-origin or inert document */
    }
  }

  function attachAntarcticFontBridge(frame) {
    if (!frame || frame.getAttribute("data-antarctic-font-bridge") === "1") return;
    frame.setAttribute("data-antarctic-font-bridge", "1");
    function onLoad() {
      try {
        injectAntarcticFontsIntoDocument(frame.contentDocument);
      } catch (err) {
        /* SecurityError */
      }
    }
    frame.addEventListener("load", onLoad);
    try {
      if (frame.contentDocument && frame.contentDocument.readyState === "complete") {
        onLoad();
      }
    } catch (err) {
      /* ignore */
    }
  }

  function readStorage() {
    var storage = getSiteStorageApi();
    if (storage && typeof storage.getJson === "function") {
      return storage.getJson(STORAGE_KEY, {
        legacyKeys: [LEGACY_STORAGE_KEY],
        sessionKeys: [STORAGE_KEY, LEGACY_STORAGE_KEY]
      });
    }

    try {
      var raw = window.sessionStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(LEGACY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(payload) {
    var storage = getSiteStorageApi();
    if (storage && typeof storage.setJson === "function") {
      storage.setJson(STORAGE_KEY, payload, {
        legacyKeys: [LEGACY_STORAGE_KEY],
        sessionKeys: [STORAGE_KEY, LEGACY_STORAGE_KEY]
      });
      return;
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function cloneTemplate(id) {
    var template = document.getElementById(id);
    if (!template) return null;
    return template.content.firstElementChild.cloneNode(true);
  }

  function makeTabId() {
    return "tab-" + Math.random().toString(36).slice(2, 10);
  }

  function describeUri(value) {
    return core.describeInput(value || core.buildInternalUri("home"));
  }

  function createTab(uri, existingId) {
    var descriptor = describeUri(uri);
    return {
      aiState: {
        busy: false,
        memory: []
      },
      chatState: {
        activeThreadId: "",
        pollHandle: 0,
        wizardStep: 1
      },
      gamesQuery: "",
      id: existingId || makeTabId(),
      paneEl: null,
      title: descriptor.title,
      route: descriptor.route,
      targetUrl: descriptor.targetUrl || "",
      webState: {
        currentTarget: "",
        frameController: null
      },
      path: descriptor.path || "",
      author: descriptor.author || "",
      uri: descriptor.uri,
      view: descriptor.view
    };
  }

  function assignDescriptor(tab, descriptor) {
    tab.title = descriptor.title;
    tab.route = descriptor.route;
    tab.targetUrl = descriptor.targetUrl || "";
    tab.webState = {
      currentTarget: "",
      frameController: null
    };
    tab.path = descriptor.path || "";
    tab.author = descriptor.author || "";
    tab.uri = descriptor.uri;
    tab.view = descriptor.view;
    tab.gamesQuery = tab.view === "games" ? tab.gamesQuery : "";
    if (tab.view !== "ai") {
      tab.aiState = {
        busy: false,
        memory: []
      };
    }
    if (tab.view !== "chat") {
      tab.chatState = {
        activeThreadId: "",
        pollHandle: 0,
        wizardStep: 1
      };
    }
  }

  function getActiveTab() {
    for (var index = 0; index < state.tabs.length; index += 1) {
      if (state.tabs[index].id === state.activeTabId) {
        return state.tabs[index];
      }
    }
    return state.tabs[0] || null;
  }

  function removePane(tab) {
    if (tab && tab.chatState && tab.chatState.pollHandle) {
      window.clearInterval(tab.chatState.pollHandle);
      tab.chatState.pollHandle = 0;
    }
    if (tab && tab.paneEl && typeof tab.paneEl.__socialUnsubscribe === "function") {
      tab.paneEl.__socialUnsubscribe();
      tab.paneEl.__socialUnsubscribe = null;
    }
    if (tab && tab.paneEl && tab.paneEl.parentNode) {
      tab.paneEl.parentNode.removeChild(tab.paneEl);
    }
    if (tab) {
      tab.paneEl = null;
      tab.webState = {
        currentTarget: "",
        frameController: null
      };
    }
  }

  function persistState() {
    writeStorage({
      activeTabId: state.activeTabId,
      sidebarCollapsed: state.sidebarCollapsed,
      tabs: state.tabs.map(function (tab) {
        return {
          id: tab.id,
          uri: tab.uri
        };
      })
    });
  }

  function syncBrowserUrl() {
    var active = getActiveTab();
    try {
      var params = new URLSearchParams(window.location.search || "");
      if (active && active.uri) {
        params.set("uri", active.uri);
      } else {
        params.delete("uri");
      }
      var query = params.toString();
      var nextUrl = window.location.pathname + (query ? "?" + query : "");
      window.history.replaceState(null, "", nextUrl);
    } catch (error) {
      // Ignore history issues.
    }
  }

  function setDocumentTitle(tab) {
    var baseTitle = (tab && tab.title ? tab.title + " | " : "") + "Antarctic Games";
    var siteSettings = getSiteSettingsApi();
    if (siteSettings && typeof siteSettings.decorateTitle === "function") {
      document.title = siteSettings.decorateTitle(baseTitle);
      return;
    }
    document.title = baseTitle;
  }

  function setActiveTab(tabId) {
    state.activeTabId = tabId;
    renderShell();
  }

  function openNewTab(uri) {
    var tab = createTab(uri || core.buildInternalUri("home"));
    state.tabs.push(tab);
    state.activeTabId = tab.id;
    renderShell();
    if (elements.addressInput) {
      elements.addressInput.focus();
      elements.addressInput.select();
    }
  }

  function closeTab(tabId) {
    var nextTabs = [];
    var removedIndex = -1;

    for (var index = 0; index < state.tabs.length; index += 1) {
      var tab = state.tabs[index];
      if (tab.id === tabId) {
        removedIndex = index;
        removePane(tab);
        continue;
      }
      nextTabs.push(tab);
    }

    state.tabs = nextTabs;

    if (!state.tabs.length) {
      openNewTab(core.buildInternalUri("home"));
      return;
    }

    if (state.activeTabId === tabId) {
      var fallbackIndex = Math.max(0, Math.min(removedIndex - 1, state.tabs.length - 1));
      state.activeTabId = state.tabs[fallbackIndex].id;
    }

    renderShell();
  }

  function navigateCurrent(value) {
    var active = getActiveTab();
    var descriptor = describeUri(value);

    if (!active) {
      state.tabs.push(createTab(descriptor.uri));
      state.activeTabId = state.tabs[0].id;
      renderShell();
      return;
    }

    removePane(active);
    assignDescriptor(active, descriptor);
    renderShell();
  }

  function restoreTabs() {
    var restored = readStorage();
    var requestedUri = readRequestedUri();

    if (restored && Array.isArray(restored.tabs) && restored.tabs.length) {
      state.tabs = restored.tabs.map(function (entry) {
        return createTab(entry && entry.uri, entry && entry.id);
      });
      state.activeTabId = restored.activeTabId || state.tabs[0].id;
    }

    state.sidebarCollapsed = Boolean(restored && restored.sidebarCollapsed);

    if (!state.tabs.length) {
      state.tabs = [createTab(requestedUri || core.buildInternalUri("home"))];
      state.activeTabId = state.tabs[0].id;
      return;
    }

    if (requestedUri) {
      navigateCurrent(requestedUri);
    }
  }

  function readRequestedUri() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return cleanText(params.get("uri"));
    } catch (error) {
      return "";
    }
  }

  function renderTabList() {
    if (!elements.tabList) return;
    elements.tabList.innerHTML = "";

    state.tabs.forEach(function (tab) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "tab-card" + (tab.id === state.activeTabId ? " tab-card--active" : "");
      card.dataset.tabId = tab.id;

      var icon = buildTabIcon(tab);

      var body = document.createElement("span");
      body.className = "tab-card__body";

      var title = document.createElement("strong");
      title.className = "tab-card__title";
      title.textContent = tab.title;

      body.appendChild(title);

      var close = document.createElement("button");
      close.type = "button";
      close.className = "tab-card__close";
      close.dataset.closeTab = tab.id;
      close.setAttribute("aria-label", "Close " + tab.title);
      close.appendChild(buildInlineSvgIcon("close", "tab-card__close-icon"));

      card.appendChild(icon);
      card.appendChild(body);
      card.appendChild(close);
      elements.tabList.appendChild(card);
    });
  }

  function buildTabIcon(tab) {
    var icon = document.createElement("span");
    icon.className = "tab-card__icon";

    var faviconUrl = resolveTabFavicon(tab);
    if (!faviconUrl) {
      icon.appendChild(buildInlineSvgIcon(tabIcon(tab), "tab-card__fallback-icon"));
      return icon;
    }

    var img = document.createElement("img");
    img.className = "tab-card__favicon";
    img.src = faviconUrl;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.loading = "lazy";

    img.addEventListener("error", function () {
      icon.innerHTML = "";
      icon.appendChild(buildInlineSvgIcon(tabIcon(tab), "tab-card__fallback-icon"));
    }, { once: true });

    icon.appendChild(img);
    return icon;
  }

  function resolveTabFavicon(tab) {
    if (!tab) return "";
    if (tab.view === "gamelauncher") return "";
    if (tab.view !== "web" || !tab.targetUrl) return "";
    try {
      var origin = new URL(tab.targetUrl).origin;
      return origin.replace(/\/+$/, "") + "/favicon.ico";
    } catch (error) {
      return "";
    }
  }

  function tabIcon(tab) {
    if (tab.view === "home") return "home";
    if (tab.view === "games") return "games";
    if (tab.view === "ai") return "ai";
    if (tab.view === "account") return "account";
    if (tab.view === "chat") return "chat";
    if (tab.view === "settings") return "settings";
    if (tab.view === "gamelauncher") return "games";
    return "web";
  }

  function buildInlineSvgIcon(name, className) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    if (className) svg.setAttribute("class", className);

    function addPath(d) {
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    }

    if (name === "home") {
      addPath("M3 11.5 12 4l9 7.5M6.5 10.5V20h11V10.5");
      return svg;
    }
    if (name === "games") {
      svg.setAttribute("viewBox", "0 58 512 454");
      svg.setAttribute("class", (className ? className + " " : "") + "ui-icon--filled");
      addPath(GAMES_CONTROLLER_PATH_MAIN);
      var circles = [
        [334.8, 373.8, 16.3],
        [413.7, 373.8, 16.3],
        [374.2, 413.3, 16.3],
        [374.2, 334.3, 16.3]
      ];
      for (var gi = 0; gi < circles.length; gi += 1) {
        var cc = circles[gi];
        var circ = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circ.setAttribute("cx", String(cc[0]));
        circ.setAttribute("cy", String(cc[1]));
        circ.setAttribute("r", String(cc[2]));
        svg.appendChild(circ);
      }
      addPath(GAMES_CONTROLLER_PATH_DPAD);
      return svg;
    }
    if (name === "ai") {
      svg.setAttribute("viewBox", "0 0 16 16");
      svg.setAttribute("class", (className ? className + " " : "") + "ui-icon--filled");
      addPath(AI_ROBOT_PATH_FACE);
      addPath(AI_ROBOT_PATH_BODY);
      return svg;
    }
    if (name === "account") {
      addPath("M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z");
      addPath("M4.5 20a7.5 7.5 0 0 1 15 0");
      return svg;
    }
    if (name === "chat") {
      addPath("M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5Z");
      return svg;
    }
    if (name === "play") {
      addPath("M8 6v12l10-6-10-6Z");
      return svg;
    }
    if (name === "settings") {
      svg.setAttribute("viewBox", "0 0 15 15");
      svg.setAttribute("class", (className ? className + " " : "") + "ui-icon--filled");
      var gearPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      gearPath.setAttribute("fill-rule", "evenodd");
      gearPath.setAttribute("clip-rule", "evenodd");
      gearPath.setAttribute("d", SETTINGS_GEAR_PATH);
      svg.appendChild(gearPath);
      return svg;
    }
    if (name === "close") {
      addPath("M7 7l10 10M17 7 7 17");
      return svg;
    }
    addPath("M12 3a9 9 0 1 0 9 9");
    addPath("M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18");
    return svg;
  }

  function trimAddressHistoryPast(value) {
    addressBarHistoryState.past.push(value);
    while (addressBarHistoryState.past.length > ADDRESS_HISTORY_LIMIT) {
      addressBarHistoryState.past.shift();
    }
  }

  function updateAddressBarHistoryButtons() {
    if (elements.addressUndoButton) {
      elements.addressUndoButton.disabled = addressBarHistoryState.past.length === 0;
    }
    if (elements.addressRedoButton) {
      elements.addressRedoButton.disabled = addressBarHistoryState.future.length === 0;
    }
  }

  function syncAddressBarValueFromNavigation(nextUri) {
    if (!elements.addressInput) return;
    var next = cleanText(nextUri) || "";
    if (addressBarHistoryState.applying) {
      elements.addressInput.value = next;
      addressBarHistoryState.commitSnapshot = next;
      updateAddressBarHistoryButtons();
      return;
    }
    var cur = elements.addressInput.value;
    if (addressBarHistoryState.ready && cur !== next) {
      trimAddressHistoryPast(cur);
      addressBarHistoryState.future = [];
    }
    elements.addressInput.value = next;
    addressBarHistoryState.commitSnapshot = next;
    addressBarHistoryState.ready = true;
    updateAddressBarHistoryButtons();
  }

  function addressBarRecordSubmitOverride(active, typedValue) {
    if (!active || addressBarHistoryState.applying || !addressBarHistoryState.ready) return;
    var v = cleanText(typedValue) || "";
    var tabUri = cleanText(active.uri) || "";
    if (v !== tabUri) {
      trimAddressHistoryPast(tabUri);
      addressBarHistoryState.future = [];
    }
  }

  function addressBarUndo() {
    if (!elements.addressInput || addressBarHistoryState.past.length === 0) return;
    addressBarHistoryState.applying = true;
    var cur = elements.addressInput.value;
    var prev = addressBarHistoryState.past.pop();
    addressBarHistoryState.future.push(cur);
    elements.addressInput.value = prev;
    addressBarHistoryState.commitSnapshot = prev;
    addressBarHistoryState.applying = false;
    updateAddressBarHistoryButtons();
  }

  function addressBarRedo() {
    if (!elements.addressInput || addressBarHistoryState.future.length === 0) return;
    addressBarHistoryState.applying = true;
    var cur = elements.addressInput.value;
    var next = addressBarHistoryState.future.pop();
    trimAddressHistoryPast(cur);
    elements.addressInput.value = next;
    addressBarHistoryState.commitSnapshot = next;
    addressBarHistoryState.applying = false;
    updateAddressBarHistoryButtons();
  }

  function renderShell() {
    var active = getActiveTab();

    renderTabList();
    renderPanes();
    renderStageOverlay(active);

    if (elements.addressInput && active) {
      syncAddressBarValueFromNavigation(active.uri);
    }

    renderSidebarState();

    if (elements.stage) {
      elements.stage.classList.toggle("shell-stage--full-bleed", Boolean(active && active.view === "web"));
    }

    setDocumentTitle(active);
    syncBrowserUrl();
    persistState();
  }

  function renderSidebarState() {
    if (elements.shellRoot) {
      elements.shellRoot.classList.toggle("shell--sidebar-collapsed", state.sidebarCollapsed);
    }
    if (elements.toolbarSidebarToggle) {
      var label = state.sidebarCollapsed ? "Expand sidebar" : "Retract sidebar";
      elements.toolbarSidebarToggle.setAttribute("aria-expanded", state.sidebarCollapsed ? "false" : "true");
      elements.toolbarSidebarToggle.setAttribute("aria-label", label);
      elements.toolbarSidebarToggle.setAttribute("title", label);
    }
  }

  function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    renderShell();
  }

  function renderPanes() {
    state.tabs.forEach(function (tab) {
      ensurePane(tab);
      if (tab.paneEl) {
        tab.paneEl.classList.toggle("shell-pane--active", tab.id === state.activeTabId);
      }
    });
  }

  function ensurePane(tab) {
    if (tab.paneEl) return;

    if (tab.view === "home") {
      tab.paneEl = createHomePane(tab);
    } else if (tab.view === "games") {
      tab.paneEl = createGamesPane(tab);
    } else if (tab.view === "ai") {
      tab.paneEl = createAiPane(tab);
    } else if (tab.view === "account") {
      tab.paneEl = createAccountPane(tab);
    } else if (tab.view === "chat") {
      tab.paneEl = createChatPane(tab);
    } else if (tab.view === "settings") {
      tab.paneEl = createSettingsPane(tab);
    } else if (tab.view === "gamelauncher") {
      tab.paneEl = createGameLauncherPane(tab);
    } else {
      tab.paneEl = createWebPane(tab);
    }

    if (tab.paneEl) {
      tab.paneEl.dataset.tabId = tab.id;
      elements.paneStack.appendChild(tab.paneEl);
      if (tab.view === "web") {
        hydrateWebPane(tab);
      }
    }
  }

  function createHomePane() {
    var pane = cloneTemplate("home-pane-template");
    if (!pane) return null;

    pane.addEventListener("click", handlePaneAction);
    var homeForm = pane.querySelector('[data-role="home-search-form"]');
    if (homeForm) {
      homeForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = homeForm.querySelector(".home-search-bar__input");
        var q = cleanText(input && input.value);
        if (q) navigateCurrent(q);
      });
    }
    return pane;
  }

  function createGamesPane(tab) {
    var pane = cloneTemplate("games-pane-template");
    if (!pane) return null;

    pane.addEventListener("click", handlePaneAction);

    var input = pane.querySelector(".games-search-input");
    if (input) {
      input.value = tab.gamesQuery || "";
      input.addEventListener("input", function () {
        tab.gamesQuery = cleanText(input.value);
        renderGamesCatalog(pane, tab);
      });
    }

    loadGamesCatalog().then(function () {
      renderGamesCatalog(pane, tab);
    }).catch(function () {
      renderGamesFailure(pane);
    });

    return pane;
  }

  function createAiPane(tab) {
    var pane = cloneTemplate("ai-pane-template");
    if (!pane) return null;

    pane.addEventListener("click", handlePaneAction);

    var textarea = pane.querySelector(".ai-chat__input");
    var label = pane.querySelector('label[for="ai-input"]');
    if (textarea) {
      var uniqueId = "ai-input-" + tab.id;
      textarea.id = uniqueId;
      if (label) {
        label.setAttribute("for", uniqueId);
      }
      textarea.addEventListener("input", function () {
        syncAiInputHeight(textarea);
      });
      textarea.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submitAiMessage(tab, pane);
        }
      });
      syncAiInputHeight(textarea);
    }

    var form = pane.querySelector('[data-role="ai-form"]');
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitAiMessage(tab, pane);
      });
    }

    if (!tab.aiState.memory.length) {
      tab.aiState.memory.push({
        role: "assistant",
        content: "How can I help?"
      });
    }

    renderAiConversation(pane, tab);
    refreshAiStatus(pane);
    return pane;
  }

  function formatTimestamp(value) {
    var raw = cleanText(value);
    if (!raw) return "";
    try {
      return new Date(raw).toLocaleString();
    } catch (error) {
      return raw;
    }
  }

  function setAccountStatus(pane, message) {
    if (!pane) return;
    var statusEl = pane.querySelector('[data-role="account-status"]');
    if (statusEl) {
      statusEl.textContent = cleanText(message) || "Account ready.";
    }
  }

  var ACCOUNT_WIZARD_STEPS = 2;
  var CHAT_WIZARD_STEPS = 3;

  function setAccountWizardStep(tab, pane, step) {
    if (!tab || !pane) return;
    var next = Math.max(1, Math.min(ACCOUNT_WIZARD_STEPS, step));
    tab.accountWizardStep = next;
    var steps = pane.querySelectorAll("[data-account-step]");
    for (var i = 0; i < steps.length; i += 1) {
      var el = steps[i];
      var s = parseInt(el.getAttribute("data-account-step") || "0", 10);
      el.classList.toggle("is-active", s === next);
    }
    var dots = pane.querySelectorAll(".pane-wizard--account .pane-wizard__dot");
    for (var d = 0; d < dots.length; d += 1) {
      dots[d].classList.toggle("is-active", d === next - 1);
    }
    var backBtn = pane.querySelector("[data-account-wizard-back]");
    var nextBtn = pane.querySelector("[data-account-wizard-next]");
    if (backBtn) backBtn.hidden = next <= 1;
    if (nextBtn) nextBtn.hidden = next >= ACCOUNT_WIZARD_STEPS;
  }

  function wireAccountWizard(tab, pane) {
    if (!pane || pane.dataset.accountWizardBound === "true") return;
    pane.dataset.accountWizardBound = "true";
    var backBtn = pane.querySelector("[data-account-wizard-back]");
    var nextBtn = pane.querySelector("[data-account-wizard-next]");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        var current = tab.accountWizardStep || 1;
        setAccountWizardStep(tab, pane, current - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var current = tab.accountWizardStep || 1;
        setAccountWizardStep(tab, pane, current + 1);
      });
    }
  }

  function setChatWizardStep(tab, pane, step) {
    if (!tab || !pane || !tab.chatState) return;
    var next = Math.max(1, Math.min(CHAT_WIZARD_STEPS, step));
    tab.chatState.wizardStep = next;
    var steps = pane.querySelectorAll("[data-chat-step]");
    for (var i = 0; i < steps.length; i += 1) {
      var el = steps[i];
      var s = parseInt(el.getAttribute("data-chat-step") || "0", 10);
      el.classList.toggle("is-active", s === next);
    }
    var dots = pane.querySelectorAll(".pane-wizard--chat .pane-wizard__dot");
    for (var d = 0; d < dots.length; d += 1) {
      dots[d].classList.toggle("is-active", d === next - 1);
    }
    var backBtn = pane.querySelector("[data-chat-wizard-back]");
    var nextBtn = pane.querySelector("[data-chat-wizard-next]");
    if (backBtn) backBtn.hidden = next <= 1;
    if (nextBtn) nextBtn.hidden = next !== 1;
  }

  function wireChatWizard(tab, pane) {
    if (!pane || pane.dataset.chatWizardBound === "true") return;
    pane.dataset.chatWizardBound = "true";
    var backBtn = pane.querySelector("[data-chat-wizard-back]");
    var nextBtn = pane.querySelector("[data-chat-wizard-next]");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        var current = (tab.chatState && tab.chatState.wizardStep) || 1;
        if (current === 3) {
          setChatWizardStep(tab, pane, 2);
        } else {
          setChatWizardStep(tab, pane, current - 1);
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var current = (tab.chatState && tab.chatState.wizardStep) || 1;
        setChatWizardStep(tab, pane, current + 1);
      });
    }
  }

  function emptyCommunityBootstrap() {
    return {
      threads: [],
      rooms: [],
      saves: [],
      stats: {
        threadCount: 0,
        roomCount: 0,
        joinedRoomCount: 0,
        directCount: 0,
        saveCount: 0
      }
    };
  }

  function bindSocialPaneListener(pane, callback) {
    var socialApi = getSocialApi();
    if (!pane || !socialApi || typeof socialApi.onSessionChange !== "function" || pane.__socialUnsubscribe) {
      return;
    }

    pane.__socialUnsubscribe = socialApi.onSessionChange(function () {
      if (!pane.isConnected) return;
      callback();
    });
  }

  function setPaneAuthenticatedState(pane, authenticated) {
    if (!pane) return;
    pane.classList.toggle("shell-pane--authenticated", Boolean(authenticated));
    var wizard = pane.querySelector(".pane-wizard");
    if (wizard) {
      wizard.classList.toggle("is-authenticated", Boolean(authenticated));
    }
  }

  function createAccountPane(tab) {
    var pane = cloneTemplate("account-pane-template");
    if (!pane) return null;

    if (typeof tab.accountWizardStep !== "number" || tab.accountWizardStep < 1) {
      tab.accountWizardStep = 1;
    }

    var form = pane.querySelector('[data-role="account-auth-form"]');
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitAccountForm(pane, "login", tab);
      });
    }

    pane.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;

      var actionButton = target.closest("[data-account-action]");
      if (actionButton) {
        var action = actionButton.getAttribute("data-account-action");
        if (action === "login") return;
        event.preventDefault();
        submitAccountForm(pane, action, tab);
        return;
      }

      var routeButton = target.closest("[data-account-route]");
      if (routeButton) {
        event.preventDefault();
        openNewTab(routeButton.getAttribute("data-account-route"));
        return;
      }

      var saveLaunchButton = target.closest("[data-save-launch]");
      if (saveLaunchButton) {
        openNewTab(saveLaunchButton.getAttribute("data-save-launch"));
      }
    });

    wireAccountWizard(tab, pane);
    bindSocialPaneListener(pane, function () {
      syncAccountPane(pane, tab, "Account updated.");
    });
    setAccountWizardStep(tab, pane, tab.accountWizardStep);
    syncAccountPane(pane, tab);
    return pane;
  }

  function submitAccountForm(pane, action, tab) {
    var socialApi = getSocialApi();
    if (!socialApi) {
      setAccountStatus(pane, "Account service unavailable.");
      return;
    }

    if (action === "logout") {
      socialApi.logout().then(function () {
        if (tab && pane) setAccountWizardStep(tab, pane, 1);
        syncAccountPane(pane, tab, "Logged out.");
      }).catch(function (error) {
        setAccountStatus(pane, cleanText(error && error.message ? error.message : error));
      });
      return;
    }

    var form = pane.querySelector('[data-role="account-auth-form"]');
    if (!form) return;
    var usernameInput = form.querySelector('[name="account-username"]');
    var passwordInput = form.querySelector('[name="account-password"]');
    var username = cleanText(usernameInput && usernameInput.value);
    var password = cleanText(passwordInput && passwordInput.value);

    setAccountStatus(pane, action === "signup" ? "Creating account..." : "Logging in...");

    var request = action === "signup"
      ? socialApi.signUp(username, password)
      : socialApi.login(username, password);

    request.then(function () {
      if (passwordInput) passwordInput.value = "";
      if (tab && pane) setAccountWizardStep(tab, pane, 2);
      syncAccountPane(pane, tab, action === "signup" ? "Account created." : "Logged in.");
    }).catch(function (error) {
      setAccountStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function renderAccountSummary(pane, session, bootstrap) {
    var summaryEl = pane.querySelector('[data-role="account-summary"]');
    if (!summaryEl) return;

    if (!session || !session.authenticated || !session.user) {
      summaryEl.innerHTML =
        '<div class="empty-state">' +
          "<strong>You are not logged in.</strong>" +
          "<span>Create an account to unlock chat rooms, DMs, and cloud saves.</span>" +
        "</div>";
      return;
    }

    var stats = bootstrap && bootstrap.stats ? bootstrap.stats : emptyCommunityBootstrap().stats;
    summaryEl.innerHTML =
      '<div class="account-summary__hero">' +
        '<div class="account-summary__identity">' +
          '<span class="account-summary__eyebrow">Signed in</span>' +
          '<strong>@' + escapeHtml(session.user.username) + "</strong>" +
          '<span>Joined ' + escapeHtml(formatTimestamp(session.user.createdAt)) + "</span>" +
          '<span>' + escapeHtml(String(stats.threadCount || 0)) + " conversations synced in this browser.</span>" +
        "</div>" +
        '<div class="account-summary__actions">' +
          '<button type="button" class="toolbar-button toolbar-button--accent" data-account-route="antarctic://chat">Open chat</button>' +
          '<button type="button" class="toolbar-button" data-account-action="logout">Log out</button>' +
        "</div>" +
      "</div>";
  }

  function renderAccountMetrics(pane, bootstrap) {
    var metricsEl = pane.querySelector('[data-role="account-metrics"]');
    if (!metricsEl) return;

    var stats = bootstrap && bootstrap.stats ? bootstrap.stats : null;
    if (!stats) {
      metricsEl.innerHTML = "";
      return;
    }

    metricsEl.innerHTML = [
      { label: "Joined chats", value: stats.threadCount || 0 },
      { label: "Direct messages", value: stats.directCount || 0 },
      { label: "Public rooms", value: stats.roomCount || 0 },
      { label: "Cloud saves", value: stats.saveCount || 0 }
    ].map(function (metric) {
      return (
        '<article class="account-metric-card">' +
          '<span class="account-metric-card__label">' + escapeHtml(metric.label) + "</span>" +
          '<strong class="account-metric-card__value">' + escapeHtml(String(metric.value)) + "</strong>" +
        "</article>"
      );
    }).join("");
  }

  function renderAccountQuickActions(pane, session, bootstrap) {
    var quickActionsEl = pane.querySelector('[data-role="account-quick-actions"]');
    if (!quickActionsEl) return;

    if (!session || !session.authenticated) {
      quickActionsEl.innerHTML = "";
      return;
    }

    var stats = bootstrap && bootstrap.stats ? bootstrap.stats : emptyCommunityBootstrap().stats;
    quickActionsEl.innerHTML =
      '<button type="button" class="toolbar-button toolbar-button--accent" data-account-route="antarctic://chat">Jump into ' + escapeHtml(String(stats.threadCount || 0)) + " chats</button>" +
      '<button type="button" class="toolbar-button" data-account-route="antarctic://games">Explore games</button>' +
      '<button type="button" class="toolbar-button" data-account-route="antarctic://home">Back home</button>';
  }

  function renderAccountSaves(pane, saves) {
    var savesEl = pane.querySelector('[data-role="account-saves"]');
    if (!savesEl) return;

    if (!Array.isArray(saves) || !saves.length) {
      savesEl.innerHTML =
        '<div class="empty-state">' +
          "<strong>No cloud saves yet.</strong>" +
          "<span>Launch a game, then use the Cloud Save button in the launcher bar.</span>" +
        "</div>";
      return;
    }

    savesEl.innerHTML = saves.map(function (save) {
      return (
        '<article class="account-save-card">' +
          '<div class="account-save-card__content">' +
            '<strong>' + escapeHtml(core.humanizeSlug(save.gameKey || "")) + "</strong>" +
            '<span>' + escapeHtml(save.summary || save.gameKey || "") + "</span>" +
            '<span>Updated ' + escapeHtml(formatTimestamp(save.updatedAt)) + "</span>" +
          "</div>" +
          '<button type="button" class="toolbar-button" data-save-launch="' + escapeHtml(core.buildGameUri(save.gameKey, core.humanizeSlug(save.gameKey || ""), "")) + '">' +
            "Open" +
          "</button>" +
        "</article>"
      );
    }).join("");
  }

  function syncAccountPane(pane, tab, message, forceRefresh) {
    var socialApi = getSocialApi();
    if (!socialApi) {
      setPaneAuthenticatedState(pane, false);
      setAccountStatus(pane, "Account service unavailable.");
      renderAccountSummary(pane, null, emptyCommunityBootstrap());
      renderAccountMetrics(pane, null);
      renderAccountQuickActions(pane, null, null);
      renderAccountSaves(pane, []);
      return;
    }

    socialApi.getBootstrap(Boolean(forceRefresh)).then(function (community) {
      var authenticated = Boolean(community && community.authenticated && community.user);
      var bootstrap = community && community.bootstrap ? community.bootstrap : emptyCommunityBootstrap();
      setPaneAuthenticatedState(pane, authenticated);
      renderAccountSummary(pane, authenticated ? community : null, bootstrap);
      renderAccountMetrics(pane, authenticated ? bootstrap : null);
      renderAccountQuickActions(pane, authenticated ? community : null, bootstrap);
      renderAccountSaves(pane, authenticated ? bootstrap.saves : []);

      if (!authenticated) {
        if (tab && pane) setAccountWizardStep(tab, pane, 1);
        setAccountStatus(pane, message || "Log in to sync your saves and community profile.");
        return;
      }

      if (tab && pane) setAccountWizardStep(tab, pane, 2);
      setAccountStatus(pane, message || ("Logged in as @" + community.user.username + "."));
    }).catch(function (error) {
      setPaneAuthenticatedState(pane, false);
      renderAccountSummary(pane, null, emptyCommunityBootstrap());
      renderAccountMetrics(pane, null);
      renderAccountQuickActions(pane, null, null);
      renderAccountSaves(pane, []);
      setAccountStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function createChatPane(tab) {
    var pane = cloneTemplate("chat-pane-template");
    if (!pane) return null;

    var form = pane.querySelector('[data-role="chat-form"]');
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitChatMessage(tab, pane);
      });
    }

    var roomForm = pane.querySelector('[data-role="chat-room-form"]');
    if (roomForm) {
      roomForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitRoomCreate(tab, pane);
      });
    }

    var directForm = pane.querySelector('[data-role="chat-direct-form"]');
    if (directForm) {
      directForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitDirectCreate(tab, pane);
      });
    }

    var composer = pane.querySelector(".chat-room__input");
    if (composer) {
      composer.addEventListener("input", function () {
        syncAiInputHeight(composer);
      });
      composer.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submitChatMessage(tab, pane);
        }
      });
      syncAiInputHeight(composer);
    }

    if (typeof tab.chatState.wizardStep !== "number") tab.chatState.wizardStep = 1;
    wireChatWizard(tab, pane);
    bindSocialPaneListener(pane, function () {
      syncChatPane(pane, tab, "Chat updated.");
    });
    setChatWizardStep(tab, pane, tab.chatState.wizardStep);

    pane.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;

      var threadButton = target.closest("[data-chat-thread]");
      if (threadButton) {
        tab.chatState.activeThreadId = cleanText(threadButton.getAttribute("data-chat-thread"));
        setChatWizardStep(tab, pane, 3);
        syncChatPane(pane, tab, "Conversation loaded.");
        return;
      }

      var joinButton = target.closest("[data-chat-join]");
      if (joinButton) {
        joinChatRoom(tab, pane, joinButton.getAttribute("data-chat-join"));
      }
    });

    syncChatPane(pane, tab);
    tab.chatState.pollHandle = window.setInterval(function () {
      if (!pane.isConnected) return;
      if (tab.id !== state.activeTabId) return;
      syncChatPane(pane, tab);
    }, 5000);
    return pane;
  }

  function setChatStatus(pane, message) {
    if (!pane) return;
    var statusEl = pane.querySelector('[data-role="chat-status"]');
    if (statusEl) {
      statusEl.textContent = cleanText(message) || "Chat ready.";
    }
  }

  function renderChatSessionCard(pane, community) {
    var sessionEl = pane.querySelector('[data-role="chat-session"]');
    if (!sessionEl) return;

    if (!community || !community.authenticated || !community.user) {
      sessionEl.innerHTML =
        '<div class="empty-state empty-state--compact">' +
          "<strong>Community locked.</strong>" +
          "<span>Log in from Account to unlock rooms and DMs.</span>" +
        "</div>";
      return;
    }

    var stats = community.bootstrap && community.bootstrap.stats ? community.bootstrap.stats : emptyCommunityBootstrap().stats;
    sessionEl.innerHTML =
      '<div class="chat-session-card">' +
        '<div class="chat-session-card__identity">' +
          '<strong>@' + escapeHtml(community.user.username) + "</strong>" +
          '<span>' + escapeHtml(String(stats.threadCount || 0)) + " joined chats • " + escapeHtml(String(stats.directCount || 0)) + " DMs</span>" +
        "</div>" +
        '<button type="button" class="toolbar-button" data-route="antarctic://account">Account</button>' +
      "</div>";
  }

  function renderChatThreads(pane, tab, payload) {
    var listEl = pane.querySelector('[data-role="chat-thread-list"]');
    var roomCatalogEl = pane.querySelector('[data-role="chat-room-catalog"]');
    if (!listEl || !roomCatalogEl) return;

    var threads = Array.isArray(payload && payload.threads) ? payload.threads : [];
    var rooms = Array.isArray(payload && payload.rooms) ? payload.rooms : [];

    listEl.innerHTML = threads.length
      ? threads.map(function (thread) {
          var label = thread.type === "direct" && thread.peer ? "@" + thread.peer.username : thread.name;
          var preview = thread.lastMessage ? thread.lastMessage.username + ": " + thread.lastMessage.content : "No messages yet.";
          var meta = thread.type === "direct" ? "DM" : "Room";
          return (
            '<button type="button" class="chat-thread-card' + (String(thread.id) === String(tab.chatState.activeThreadId) ? ' chat-thread-card--active' : '') + '" data-chat-thread="' + escapeHtml(thread.id) + '">' +
              '<span class="chat-thread-card__content">' +
                '<strong>' + escapeHtml(label) + "</strong>" +
                '<span>' + escapeHtml(preview) + "</span>" +
              "</span>" +
              '<span class="chat-thread-card__badge">' + escapeHtml(meta) + "</span>" +
            "</button>"
          );
        }).join("")
      : '<div class="empty-state empty-state--stacked"><strong>No joined chats yet.</strong><span>Create a room or start a DM.</span></div>';

    roomCatalogEl.innerHTML =
      '<div class="chat-room-catalog__title">Public rooms</div>' +
      (rooms.length
        ? rooms.map(function (room) {
            return (
              '<div class="chat-room-card">' +
                '<div class="chat-room-card__content">' +
                  '<strong>' + escapeHtml(room.name) + "</strong>" +
                  '<span>' + escapeHtml(String(room.memberCount || 0)) + " members</span>" +
                "</div>" +
                (room.joined
                  ? '<span class="chat-room-card__joined">Joined</span>'
                  : '<button type="button" class="toolbar-button" data-chat-join="' + escapeHtml(room.id) + '">Join</button>') +
              "</div>"
            );
          }).join("")
        : '<div class="empty-state empty-state--stacked"><strong>No rooms yet.</strong><span>Create the first one above.</span></div>');
  }

  function renderChatMessages(pane, thread, messages, currentUserId) {
    var headerEl = pane.querySelector('[data-role="chat-thread-header"]');
    var messagesEl = pane.querySelector('[data-role="chat-messages"]');
    if (!headerEl || !messagesEl) return;

    if (!thread) {
      headerEl.innerHTML =
        '<div class="empty-state empty-state--compact">' +
          "<strong>Select a conversation.</strong>" +
          "<span>Pick a joined room or DM from the left.</span>" +
        "</div>";
      messagesEl.innerHTML = "";
      return;
    }

    headerEl.innerHTML =
      '<div class="chat-room__title-wrap">' +
        '<strong class="chat-room__title">' + escapeHtml(thread.type === "direct" && thread.peer ? "@" + thread.peer.username : thread.name) + "</strong>" +
        '<span class="chat-room__meta">' + escapeHtml(thread.type === "direct" ? "Direct message" : "Public room") + "</span>" +
      "</div>";

    if (!Array.isArray(messages) || !messages.length) {
      messagesEl.innerHTML =
        '<div class="empty-state">' +
          "<strong>No messages yet.</strong>" +
          "<span>Say hi to get things started.</span>" +
        "</div>";
      return;
    }

    messagesEl.innerHTML = messages.map(function (message) {
      var isOwn = String(message.userId) === String(currentUserId);
      return (
        '<article class="chat-message' + (isOwn ? " chat-message--own" : "") + '">' +
          '<div class="chat-message__meta">' + escapeHtml(isOwn ? "You" : ("@" + message.username)) + " • " + escapeHtml(formatTimestamp(message.createdAt)) + "</div>" +
          '<div class="chat-message__body">' + escapeHtml(message.content) + "</div>" +
        "</article>"
      );
    }).join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function syncChatPane(pane, tab, message, forceRefresh) {
    var socialApi = getSocialApi();
    if (!socialApi) {
      setPaneAuthenticatedState(pane, false);
      renderChatSessionCard(pane, null);
      setChatStatus(pane, "Chat service unavailable.");
      renderChatThreads(pane, tab, emptyCommunityBootstrap());
      renderChatMessages(pane, null, [], "");
      return;
    }

    socialApi.getBootstrap(Boolean(forceRefresh)).then(function (community) {
      var authenticated = Boolean(community && community.authenticated && community.user);
      var bootstrap = community && community.bootstrap ? community.bootstrap : emptyCommunityBootstrap();
      var threads = Array.isArray(bootstrap.threads) ? bootstrap.threads : [];
      setPaneAuthenticatedState(pane, authenticated);
      renderChatSessionCard(pane, authenticated ? community : null);

      if (!authenticated) {
        tab.chatState.activeThreadId = "";
        setChatWizardStep(tab, pane, 1);
        renderChatThreads(pane, tab, emptyCommunityBootstrap());
        renderChatMessages(pane, null, [], "");
        setChatStatus(pane, "Log in from Account to use community chat.");
        return null;
      }

      if (tab.chatState.activeThreadId) {
        var stillExists = threads.some(function (thread) {
          return String(thread.id) === String(tab.chatState.activeThreadId);
        });
        if (!stillExists) {
          tab.chatState.activeThreadId = "";
        }
      }

      if (!tab.chatState.activeThreadId && threads.length) {
        tab.chatState.activeThreadId = String(threads[0].id);
      }

      renderChatThreads(pane, tab, bootstrap);
      if (!tab.chatState.activeThreadId) {
        setChatWizardStep(tab, pane, 2);
        renderChatMessages(pane, null, [], community.user && community.user.id);
        setChatStatus(pane, message || "Create a room or open a DM to start talking.");
        return null;
      }

      setChatWizardStep(tab, pane, 3);
      return socialApi.listMessages(tab.chatState.activeThreadId).then(function (messagesPayload) {
        renderChatMessages(
          pane,
          messagesPayload && messagesPayload.thread,
          messagesPayload && messagesPayload.messages,
          community.user && community.user.id
        );
        setChatStatus(pane, message || ("Chatting as @" + community.user.username + "."));
      });
    }).catch(function (error) {
      setPaneAuthenticatedState(pane, false);
      renderChatSessionCard(pane, null);
      renderChatThreads(pane, tab, emptyCommunityBootstrap());
      renderChatMessages(pane, null, [], "");
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function submitRoomCreate(tab, pane) {
    var socialApi = getSocialApi();
    var form = pane.querySelector('[data-role="chat-room-form"]');
    if (!socialApi || !form) return;
    var input = form.querySelector('[name="room-name"]');
    var value = cleanText(input && input.value);
    setChatStatus(pane, "Creating room...");
    socialApi.createRoom(value).then(function (payload) {
      if (input) input.value = "";
      if (payload && payload.thread && payload.thread.id) {
        tab.chatState.activeThreadId = String(payload.thread.id);
        setChatWizardStep(tab, pane, 3);
      }
      syncChatPane(pane, tab, "Room created.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function submitDirectCreate(tab, pane) {
    var socialApi = getSocialApi();
    var form = pane.querySelector('[data-role="chat-direct-form"]');
    if (!socialApi || !form) return;
    var input = form.querySelector('[name="direct-username"]');
    var value = cleanText(input && input.value);
    setChatStatus(pane, "Opening DM...");
    socialApi.createDirect(value).then(function (payload) {
      if (input) input.value = "";
      if (payload && payload.thread) {
        tab.chatState.activeThreadId = String(payload.thread.id);
        setChatWizardStep(tab, pane, 3);
      }
      syncChatPane(pane, tab, "Direct message ready.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function joinChatRoom(tab, pane, threadId) {
    var socialApi = getSocialApi();
    if (!socialApi) return;
    setChatStatus(pane, "Joining room...");
    socialApi.joinRoom(threadId).then(function () {
      tab.chatState.activeThreadId = cleanText(threadId);
      setChatWizardStep(tab, pane, 3);
      syncChatPane(pane, tab, "Joined room.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function submitChatMessage(tab, pane) {
    var socialApi = getSocialApi();
    if (!socialApi || !tab.chatState.activeThreadId) return;
    var input = pane.querySelector(".chat-room__input");
    if (!input) return;

    var value = cleanText(input.value);
    if (!value) return;

    socialApi.sendMessage(tab.chatState.activeThreadId, value).then(function (payload) {
      input.value = "";
      syncAiInputHeight(input);
      renderChatMessages(
        pane,
        payload && payload.thread,
        payload && payload.messages,
        payload && payload.message ? payload.message.userId : ""
      );
      syncChatPane(pane, tab, "Message sent.");
    }).catch(function (error) {
      setChatStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function getSiteSettingsApi() {
    return window.AntarcticGamesSiteSettings || window.PalladiumSiteSettings || null;
  }

  function readSiteSettings() {
    var api = getSiteSettingsApi();
    if (!api || typeof api.getSettings !== "function") {
      return {
        title: "",
        favicon: "",
        theme: "default"
      };
    }

    return api.getSettings();
  }

  function getSettingsThemes() {
    var api = getSiteSettingsApi();
    if (api && Array.isArray(api.themes) && api.themes.length) {
      return api.themes.slice();
    }
    return SETTINGS_THEME_ORDER.slice();
  }

  function fallbackHumanizeThemeName(themeName) {
    return cleanText(themeName)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function (character) {
        return character.toUpperCase();
      });
  }

  function getThemeDetails(themeName) {
    var key = cleanText(themeName).toLowerCase();
    var details = THEME_DETAILS[key] || {};
    return {
      label: cleanText(details.label) || fallbackHumanizeThemeName(key),
      description: cleanText(details.description) || (fallbackHumanizeThemeName(key) + " palette"),
      preview: cleanText(details.preview) || "linear-gradient(135deg, #08101b 0%, #123a58 55%, #6bb6ff 100%)",
      swatches: Array.isArray(details.swatches) && details.swatches.length ? details.swatches.slice(0, 3) : ["#3b8cff", "#6bb6ff", "#a8d4ff"]
    };
  }

  function humanizeThemeName(themeName) {
    return getThemeDetails(themeName).label;
  }

  function buildShellLaunchUrl(uri) {
    try {
      var nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("uri", cleanText(uri) || core.buildInternalUri("home"));
      return nextUrl.toString();
    } catch (error) {
      return window.location.href;
    }
  }

  function resolveSettingsFaviconPreviewUrl(raw) {
    var fav = cleanText(raw);
    if (!fav) fav = "images/favicon.png?v=4";
    return resolveLocalAppUrl(fav);
  }

  function setSettingsStatus(pane, message) {
    if (!pane) return;
    var statusEl = pane.querySelector('[data-role="settings-status"]');
    if (statusEl) {
      statusEl.textContent = cleanText(message) || "Saved with first-party cookies in this browser.";
    }
  }

  function renderThemeGrid(pane, settings) {
    var container = pane.querySelector('[data-role="theme-grid"]');
    if (!container) return;

    var activeTheme = cleanText(settings && settings.theme) || "default";
    var themes = getSettingsThemes();

    container.innerHTML = themes.map(function (themeName) {
      var details = getThemeDetails(themeName);
      var swatches = details.swatches.map(function (color) {
        return '<span class="theme-chip__swatch" style="--theme-swatch:' + escapeHtml(color) + '"></span>';
      }).join("");
      return (
        '<button type="button" class="theme-chip' + (themeName === activeTheme ? ' theme-chip--active' : '') + '" data-theme-option="' + escapeHtml(themeName) + '">' +
          '<span class="theme-chip__preview" style="--theme-preview:' + escapeHtml(details.preview) + '">' +
            '<span class="theme-chip__swatches">' + swatches + "</span>" +
          "</span>" +
          '<span class="theme-chip__content">' +
            '<span class="theme-chip__name">' + escapeHtml(details.label) + "</span>" +
            '<span class="theme-chip__meta">' + escapeHtml(details.description) + "</span>" +
          "</span>" +
        "</button>"
      );
    }).join("");
  }

  function syncAiInputHeight(textarea) {
    if (!textarea) return;

    textarea.style.height = "0px";

    var computed = window.getComputedStyle(textarea);
    var minHeight = parseFloat(computed.minHeight) || 0;
    var maxHeight = parseFloat(computed.getPropertyValue("--ai-input-max-height")) || 176;
    var nextHeight = Math.max(textarea.scrollHeight, minHeight);

    if (maxHeight) {
      nextHeight = Math.min(nextHeight, maxHeight);
    }

    textarea.style.height = nextHeight + "px";
    textarea.style.overflowY = textarea.scrollHeight > nextHeight + 2 ? "auto" : "hidden";
  }

  function renderCloakPresets(pane) {
    var container = pane.querySelector('[data-role="cloak-presets"]');
    if (!container) return;

    container.innerHTML = CLOAK_PRESETS.map(function (preset) {
      return (
        '<button type="button" class="preset-chip" data-cloak-preset="' + escapeHtml(preset.id) + '">' +
          '<span class="preset-chip__title">' + escapeHtml(preset.title) + "</span>" +
          '<span class="preset-chip__meta">' + escapeHtml(preset.description) + "</span>" +
        "</button>"
      );
    }).join("");
  }

  function syncSettingsPane(pane, message) {
    if (!pane) return;

    var settings = readSiteSettings();
    var titleInput = pane.querySelector('[name="cloak-title"]');
    var faviconInput = pane.querySelector('[name="cloak-favicon"]');
    var previewTitle = pane.querySelector('[data-role="settings-preview-title"]');
    var previewFaviconUrl = pane.querySelector('[data-role="settings-preview-favicon-url"]');
    var previewFaviconImg = pane.querySelector('[data-role="settings-preview-favicon-img"]');
    var previewTheme = pane.querySelector('[data-role="settings-preview-theme"]');

    if (titleInput) titleInput.value = cleanText(settings.title);
    if (faviconInput) faviconInput.value = cleanText(settings.favicon);
    if (previewTitle) previewTitle.textContent = cleanText(settings.title) || "Antarctic Games";

    var faviconStored = cleanText(settings.favicon) || "images/favicon.png?v=4";
    if (previewFaviconUrl) previewFaviconUrl.textContent = faviconStored;

    if (previewFaviconImg) {
      previewFaviconImg.alt = "Favicon preview";
      var resolvedFavicon = resolveSettingsFaviconPreviewUrl(settings.favicon);
      previewFaviconImg.onerror = function () {
        previewFaviconImg.style.visibility = "hidden";
      };
      previewFaviconImg.onload = function () {
        previewFaviconImg.style.visibility = "visible";
      };
      previewFaviconImg.src = resolvedFavicon;
    }

    if (previewTheme) previewTheme.textContent = humanizeThemeName(settings.theme || "default");

    renderThemeGrid(pane, settings);
    renderCloakPresets(pane);
    setSettingsStatus(pane, message);
  }

  function applyCloakForm(pane) {
    var api = getSiteSettingsApi();
    if (!api) {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    var titleInput = pane.querySelector('[name="cloak-title"]');
    var faviconInput = pane.querySelector('[name="cloak-favicon"]');

    api.setTitle(titleInput ? titleInput.value : "");
    api.setFavicon(faviconInput ? faviconInput.value : "");
    renderShell();
    syncSettingsPane(pane, "Cloak updated.");
  }

  function applyCloakPreset(pane, presetId) {
    var api = getSiteSettingsApi();
    if (!api) {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    for (var index = 0; index < CLOAK_PRESETS.length; index += 1) {
      var preset = CLOAK_PRESETS[index];
      if (preset.id !== presetId) continue;

      api.setTitle(preset.title);
      api.setFavicon(preset.favicon);
      renderShell();
      syncSettingsPane(pane, "Applied " + preset.description + " cloak.");
      return;
    }
  }

  function applyThemeSetting(pane, themeName) {
    var api = getSiteSettingsApi();
    if (!api || typeof api.setTheme !== "function") {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    api.setTheme(themeName);
    renderShell();
    syncSettingsPane(pane, "Theme updated to " + humanizeThemeName(themeName) + ".");
  }

  function resetCloakSettings(pane) {
    var api = getSiteSettingsApi();
    if (!api) {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    api.setTitle("");
    api.setFavicon("");
    renderShell();
    syncSettingsPane(pane, "Tab cloak reset.");
  }

  function resetAllSettings(pane) {
    var api = getSiteSettingsApi();
    if (!api || typeof api.reset !== "function") {
      syncSettingsPane(pane, "Site settings helper is unavailable.");
      return;
    }

    api.reset();
    renderShell();
    syncSettingsPane(pane, "Theme and cloaking reset.");
  }

  function openSettingsAboutBlank(pane, tab) {
    var api = getSiteSettingsApi();
    if (!api || typeof api.openInAboutBlank !== "function") {
      syncSettingsPane(pane, "About:blank launcher is unavailable.");
      return;
    }

    var result = api.openInAboutBlank(buildShellLaunchUrl(tab && tab.uri));
    if (result && result.ok) {
      syncSettingsPane(pane, "Opened Antarctic Games in about:blank.");
      return;
    }

    syncSettingsPane(pane, result && result.error ? result.error : "Popup blocked by browser.");
  }

  function createSettingsPane(tab) {
    var pane = cloneTemplate("settings-pane-template");
    if (!pane) return null;

    var form = pane.querySelector('[data-role="cloak-form"]');
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        applyCloakForm(pane);
      });
    }

    pane.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;

      var themeButton = target.closest("[data-theme-option]");
      if (themeButton) {
        applyThemeSetting(pane, themeButton.getAttribute("data-theme-option"));
        return;
      }

      var presetButton = target.closest("[data-cloak-preset]");
      if (presetButton) {
        applyCloakPreset(pane, presetButton.getAttribute("data-cloak-preset"));
        return;
      }

      var actionButton = target.closest("[data-settings-action]");
      if (!actionButton) return;

      var action = actionButton.getAttribute("data-settings-action");
      if (action === "reset-cloak") {
        resetCloakSettings(pane);
        return;
      }
      if (action === "reset-all") {
        resetAllSettings(pane);
        return;
      }
      if (action === "aboutblank-shell") {
        openSettingsAboutBlank(pane, tab);
      }
    });

    syncSettingsPane(pane);
    return pane;
  }

  function createGameLauncherPane(tab) {
    var pane = document.createElement("section");
    pane.className = "shell-pane shell-pane--internal shell-pane--gamelauncher";
    pane.addEventListener("click", handlePaneAction);

    var title = cleanText(tab.title) || "Game Launcher";
    var author = cleanText(tab.author);
    var gamePath = cleanText(tab.path);

    var fullscreenDisabled = gamePath ? "" : " disabled";
    var cloudDisabled = gamePath ? "" : " disabled";

    var barHintHtml =
      !gamePath && !author
        ? '<span class="game-launcher__bar-hint"><span class="game-launcher__bar-sep" aria-hidden="true"> -- </span>Pick a game from the library.</span>'
        : "";

    pane.innerHTML =
      '<div class="game-launcher">' +
        '<div class="game-launcher__stage">' +
          '<div class="game-launcher__viewport" data-role="game-launcher-viewport"></div>' +
          '<div class="game-launcher__bar">' +
            '<div class="game-launcher__bar-start">' +
              '<span class="game-launcher__bar-title">' +
                escapeHtml(title) +
                "</span>" +
                (author
                  ? '<span class="game-launcher__bar-sep" aria-hidden="true">\u00A0--\u00A0</span>' +
                    '<span class="game-launcher__bar-author">' +
                    escapeHtml(author) +
                    "</span>"
                  : "") +
              barHintHtml +
            "</div>" +
            '<div class="game-launcher__bar-end">' +
              '<span class="game-launcher__cloud-status" data-role="game-cloud-status">' + (gamePath ? "Cloud save ready." : "Pick a game to enable cloud saves.") + "</span>" +
              '<button type="button" class="game-launcher__action toolbar-button" data-game-load="1"' + cloudDisabled + ">" +
              "Load cloud" +
              "</button>" +
              '<button type="button" class="game-launcher__action toolbar-button" data-game-save="1"' + cloudDisabled + ">" +
              "Save cloud" +
              "</button>" +
              '<button type="button" class="game-launcher__action game-launcher__back toolbar-button" data-route="antarctic://games">' +
              "Back to games" +
              "</button>" +
              '<button type="button" class="game-launcher__action game-launcher__fullscreen-btn toolbar-button"' +
              ' data-game-fullscreen="1" aria-label="Enter fullscreen"' +
              fullscreenDisabled +
              ">" +
              '<svg class="ui-icon ui-icon--filled game-launcher__fullscreen-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
              '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>' +
              "</svg>" +
              "<span>Fullscreen</span>" +
              "</button>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>";

    var viewport = pane.querySelector('[data-role="game-launcher-viewport"]');
    if (!viewport) return pane;

    if (!gamePath) {
      viewport.innerHTML =
        '<div class="empty-state empty-state--launcher">' +
          "<strong>No game selected yet.</strong>" +
          "<span>Open a title from the game library to launch it here.</span>" +
        "</div>";
      return pane;
    }

    var frame = document.createElement("iframe");
    frame.className = "shell-pane__frame game-launcher__frame";
    frame.src = resolveLocalAppUrl(gamePath);
    frame.setAttribute("allow", "clipboard-read; clipboard-write; fullscreen");
    frame.setAttribute("referrerpolicy", "no-referrer");
    viewport.appendChild(frame);
    attachAntarcticFontBridge(frame);

    pane.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;

      var saveButton = target.closest("[data-game-save]");
      if (saveButton) {
        event.preventDefault();
        saveGameCloudState(tab, pane);
        return;
      }

      var loadButton = target.closest("[data-game-load]");
      if (loadButton) {
        event.preventDefault();
        loadGameCloudState(tab, pane);
      }
    });

    return pane;
  }

  function setGameCloudStatus(pane, message) {
    if (!pane) return;
    var statusEl = pane.querySelector('[data-role="game-cloud-status"]');
    if (statusEl) {
      statusEl.textContent = cleanText(message) || "Cloud save ready.";
    }
  }

  function shouldSkipCloudKey(key) {
    var normalized = cleanText(key).toLowerCase();
    return (
      normalized.indexOf("antarctic") === 0 ||
      normalized.indexOf("palladium") === 0 ||
      normalized.indexOf("bare-mux") === 0 ||
      normalized.indexOf("baremux") === 0 ||
      normalized.indexOf("scramjet") === 0
    );
  }

  function captureStorageArea(storageArea) {
    var snapshot = {};
    if (!storageArea) return snapshot;

    for (var index = 0; index < storageArea.length; index += 1) {
      var key = storageArea.key(index);
      if (shouldSkipCloudKey(key)) continue;
      snapshot[key] = storageArea.getItem(key);
    }

    return snapshot;
  }

  function clearStorageArea(storageArea) {
    if (!storageArea) return;
    var keys = [];
    for (var index = 0; index < storageArea.length; index += 1) {
      var key = storageArea.key(index);
      if (shouldSkipCloudKey(key)) continue;
      keys.push(key);
    }
    keys.forEach(function (key) {
      storageArea.removeItem(key);
    });
  }

  function restoreStorageArea(storageArea, entries) {
    clearStorageArea(storageArea);
    if (!storageArea || !entries || typeof entries !== "object") return;
    Object.keys(entries).forEach(function (key) {
      if (shouldSkipCloudKey(key)) return;
      storageArea.setItem(key, String(entries[key]));
    });
  }

  function captureFrameStorageSnapshot(frame) {
    if (!frame || !frame.contentWindow) {
      throw new Error("Game frame is not ready yet.");
    }

    return {
      localStorage: captureStorageArea(frame.contentWindow.localStorage),
      sessionStorage: captureStorageArea(frame.contentWindow.sessionStorage)
    };
  }

  function applyFrameStorageSnapshot(frame, snapshot) {
    if (!frame || !frame.contentWindow) {
      throw new Error("Game frame is not ready yet.");
    }

    restoreStorageArea(frame.contentWindow.localStorage, snapshot && snapshot.localStorage);
    restoreStorageArea(frame.contentWindow.sessionStorage, snapshot && snapshot.sessionStorage);
  }

  function countSnapshotKeys(snapshot) {
    var localKeys = snapshot && snapshot.localStorage ? Object.keys(snapshot.localStorage).length : 0;
    var sessionKeys = snapshot && snapshot.sessionStorage ? Object.keys(snapshot.sessionStorage).length : 0;
    return localKeys + sessionKeys;
  }

  function saveGameCloudState(tab, pane) {
    var socialApi = getSocialApi();
    if (!socialApi) {
      setGameCloudStatus(pane, "Cloud save service unavailable.");
      return;
    }

    var frame = pane.querySelector("iframe.game-launcher__frame");
    if (!frame) {
      setGameCloudStatus(pane, "Game frame is not ready yet.");
      return;
    }

    setGameCloudStatus(pane, "Saving to cloud...");

    socialApi.getSession(true).then(function (session) {
      if (!session || !session.authenticated) {
        throw new Error("Log in from Account to use cloud saves.");
      }
      var snapshot = captureFrameStorageSnapshot(frame);
      return socialApi.putSave(tab.path, snapshot, tab.title + " (" + countSnapshotKeys(snapshot) + " keys)");
    }).then(function (payload) {
      setGameCloudStatus(pane, "Saved " + tab.title + " to cloud.");
      return payload;
    }).catch(function (error) {
      setGameCloudStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function loadGameCloudState(tab, pane) {
    var socialApi = getSocialApi();
    if (!socialApi) {
      setGameCloudStatus(pane, "Cloud save service unavailable.");
      return;
    }

    var frame = pane.querySelector("iframe.game-launcher__frame");
    if (!frame) {
      setGameCloudStatus(pane, "Game frame is not ready yet.");
      return;
    }

    setGameCloudStatus(pane, "Loading cloud save...");

    socialApi.getSession(true).then(function (session) {
      if (!session || !session.authenticated) {
        throw new Error("Log in from Account to use cloud saves.");
      }
      return socialApi.getSave(tab.path);
    }).then(function (payload) {
      if (!payload || !payload.save) {
        throw new Error("No cloud save found for this game.");
      }
      applyFrameStorageSnapshot(frame, payload.save.data);
      frame.src = resolveLocalAppUrl(tab.path);
      setGameCloudStatus(pane, "Cloud save loaded.");
    }).catch(function (error) {
      setGameCloudStatus(pane, cleanText(error && error.message ? error.message : error));
    });
  }

  function createWebPane(tab) {
    var pane = document.createElement("section");
    pane.className = "shell-pane shell-pane--frame shell-pane--proxy";

    var wrap = document.createElement("div");
    wrap.className = "shell-pane__frame-wrap";

    var frame = document.createElement("iframe");
    frame.className = "shell-pane__frame shell-pane__frame--proxy";
    frame.src = "about:blank";
    frame.setAttribute("allow", "clipboard-read; clipboard-write; fullscreen");
    frame.setAttribute("referrerpolicy", "no-referrer");

    wrap.appendChild(frame);
    pane.appendChild(wrap);
    attachAntarcticFontBridge(frame);
    return pane;
  }

  function loadProxyConfig() {
    var backendApi = getBackendApi();
    if (!backendApi || typeof backendApi.getPublicConfig !== "function") {
      return Promise.reject(new Error("Backend helper unavailable."));
    }

    return backendApi.getPublicConfig().then(function (config) {
      state.config = config || state.config;
      return config || {};
    });
  }

  function normalizeBase(value) {
    var raw = cleanText(value);
    if (!raw) return "";
    if (!/^https?:\/\//i.test(raw)) {
      raw = "http://" + raw;
    }
    raw = raw.replace(/\/+$/, "");
    try {
      return new URL(raw).origin;
    } catch (error) {
      return "";
    }
  }

  function normalizeWispPath(value) {
    var raw = cleanText(value || "/wisp/");
    raw = "/" + raw.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
    return raw === "//" ? "/" : raw;
  }

  function toWebSocketUrl(originValue, pathValue) {
    var origin = normalizeBase(originValue);
    if (!origin) return "";

    try {
      var parsed = new URL(origin);
      parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      parsed.pathname = normalizeWispPath(pathValue);
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    } catch (error) {
      return "";
    }
  }

  function resolveWispUrl(config) {
    var explicit = cleanText(config && config.services && config.services.wispUrl);
    if (explicit) return explicit;

    var backendBase = normalizeBase(config && config.backendBase);
    var backendApi = getBackendApi();
    if (!backendBase && backendApi && typeof backendApi.getBaseUrl === "function") {
      backendBase = normalizeBase(backendApi.getBaseUrl());
    }

    if (!backendBase) return "";
    return toWebSocketUrl(backendBase, config && config.services && config.services.wispPath);
  }

  function setProxyHealth(ok, message, chipLabel) {
    state.proxyHealth = {
      ok: Boolean(ok),
      message: cleanText(message) || (ok ? "Scramjet is ready." : "Scramjet is unavailable.")
    };

    if (elements.proxyStatusChip) {
      elements.proxyStatusChip.textContent = chipLabel || (ok ? "Online" : "Offline");
    }

    renderStageOverlay(getActiveTab());
  }

  function decodeScramjetUrl(value) {
    var text = cleanText(value);
    if (!text) return "";
    if (text.indexOf(SCRAMJET_PREFIX) === -1 && text.indexOf(window.location.origin + SCRAMJET_PREFIX) !== 0) {
      return text;
    }
    if (!state.proxyRuntime.controller || typeof state.proxyRuntime.controller.decodeUrl !== "function") {
      return text;
    }

    try {
      return state.proxyRuntime.controller.decodeUrl(text);
    } catch (error) {
      return text;
    }
  }

  function loadScramjetControllerClass() {
    if (typeof window.$scramjetLoadController !== "function") {
      throw new Error("Scramjet bundle is not loaded on the static frontend.");
    }

    var loaded = window.$scramjetLoadController();
    if (!loaded || typeof loaded.ScramjetController !== "function") {
      throw new Error("Scramjet controller factory is unavailable.");
    }

    return loaded.ScramjetController;
  }

  function registerProxyServiceWorker() {
    if (!window.navigator || !window.navigator.serviceWorker) {
      return Promise.reject(new Error("This browser does not support service workers."));
    }

    return window.navigator.serviceWorker.register(SCRAMJET_SW_PATH).then(function () {
      return window.navigator.serviceWorker.ready;
    });
  }

  function getProxyStorageErrorMessage(error) {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (error && typeof error.message === "string") return error.message;
    return String(error);
  }

  function isRecoverableProxyStorageError(error) {
    var message = getProxyStorageErrorMessage(error);
    return /IDBDatabase/i.test(message) || /object stores? was not found/i.test(message) || /NotFoundError/i.test(message);
  }

  function getProxyOrigin() {
    try {
      return cleanText(window.location.origin);
    } catch (error) {
      return "";
    }
  }

  function pushUniqueValue(list, value) {
    var normalized = cleanText(value);
    if (!normalized) return;
    if (list.indexOf(normalized) === -1) {
      list.push(normalized);
    }
  }

  function isProxyDatabaseName(name) {
    var normalized = cleanText(name);
    var origin = getProxyOrigin();
    if (!normalized) {
      return false;
    }

    return normalized === "$scramjet" || normalized === origin + "@$scramjet" || /^EM_FS_/i.test(normalized) || /@EM_FS_/i.test(normalized);
  }

  function getProxyDatabaseNames() {
    var names = [];
    var pathname = "/";
    try {
      pathname = String(window.location.pathname || "/") || "/";
    } catch (error) {
      pathname = "/";
    }

    function pushCandidate(pathValue) {
      var cleanPath = String(pathValue || "/");
      if (!cleanPath) cleanPath = "/";
      var dbName = "EM_FS_" + cleanPath;
      if (names.indexOf(dbName) === -1) {
        names.push(dbName);
      }
    }

    pushCandidate(pathname);
    pushCandidate("/");
    pushCandidate("/index.html");

    if (pathname !== "/" && /\/index\.html$/i.test(pathname)) {
      pushCandidate(pathname.replace(/index\.html$/i, ""));
    } else if (pathname !== "/" && pathname.charAt(pathname.length - 1) === "/") {
      pushCandidate(pathname + "index.html");
    }

    return names;
  }

  function getKnownProxyDatabaseNames() {
    var names = [];
    var origin = getProxyOrigin();
    getProxyDatabaseNames().forEach(function (name) {
      pushUniqueValue(names, name);
      if (origin) {
        pushUniqueValue(names, origin + "@" + name);
      }
    });
    pushUniqueValue(names, "$scramjet");
    if (origin) {
      pushUniqueValue(names, origin + "@$scramjet");
    }
    return names;
  }

  function listProxyDatabaseNames() {
    var knownNames = getKnownProxyDatabaseNames();
    if (!window.indexedDB || typeof window.indexedDB.databases !== "function") {
      return Promise.resolve(knownNames);
    }

    return window.indexedDB.databases().then(function (entries) {
      var names = knownNames.slice();
      (entries || []).forEach(function (entry) {
        var name = cleanText(entry && entry.name);
        if (isProxyDatabaseName(name)) {
          pushUniqueValue(names, name);
        }
      });
      return names;
    }).catch(function () {
      return knownNames;
    });
  }

  function unregisterProxyServiceWorkers() {
    if (
      !window.navigator ||
      !window.navigator.serviceWorker ||
      typeof window.navigator.serviceWorker.getRegistrations !== "function"
    ) {
      return Promise.resolve();
    }

    return window.navigator.serviceWorker.getRegistrations().then(function (registrations) {
      return Promise.all(
        (registrations || []).map(function (registration) {
          var scriptUrl = cleanText(
            (registration && registration.active && registration.active.scriptURL) ||
              (registration && registration.installing && registration.installing.scriptURL) ||
              (registration && registration.waiting && registration.waiting.scriptURL)
          );
          if (!scriptUrl || scriptUrl.indexOf("/sw.js") === -1 || typeof registration.unregister !== "function") {
            return null;
          }
          return registration.unregister().catch(function () {
            return null;
          });
        })
      );
    }).then(function () {
      return null;
    }).catch(function () {
      return null;
    });
  }

  function closeProxyRuntimeHandles() {
    var controller = state.proxyRuntime.controller;
    if (!controller) {
      return Promise.resolve();
    }

    try {
      if (controller.db && typeof controller.db.close === "function") {
        controller.db.close();
      }
    } catch (error) {
      // Ignore close failures; the deletion pass below is still best-effort.
    }

    return Promise.resolve();
  }

  function waitForProxyRepairWindow() {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, 80);
    });
  }

  function deleteIndexedDatabase(name) {
    return new Promise(function (resolve) {
      if (!window.indexedDB || !name) {
        resolve();
        return;
      }

      try {
        var request = window.indexedDB.deleteDatabase(name);
        request.onsuccess = function () {
          resolve();
        };
        request.onerror = function () {
          resolve();
        };
        request.onblocked = function () {
          resolve();
        };
      } catch (error) {
        resolve();
      }
    });
  }

  function repairProxyRuntimeStorage(options) {
    var silent = Boolean(options && options.silent);
    if (state.proxyRuntime.repairPromise) {
      return state.proxyRuntime.repairPromise;
    }

    if (!silent) {
      setProxyHealth(false, "Resetting proxy storage and retrying...", "Repairing");
    }

    state.proxyRuntime.repairPromise = closeProxyRuntimeHandles().then(function () {
      return unregisterProxyServiceWorkers();
    }).then(function () {
      return waitForProxyRepairWindow();
    }).then(function () {
      return listProxyDatabaseNames();
    }).then(function (names) {
      return Promise.all(
        names.map(function (name) {
          return deleteIndexedDatabase(name);
        })
      );
    }).then(function () {
      try {
        window.localStorage.removeItem("bare-mux-path");
      } catch (error) {
        // Ignore storage access failures during recovery.
      }

      state.proxyRuntime.controller = null;
      state.proxyRuntime.ready = false;
      state.proxyRuntime.transportUrl = "";
      writePersistentValue(PROXY_STORAGE_VERSION_KEY, PROXY_STORAGE_VERSION);
    }).then(function () {
      state.proxyRuntime.repairPromise = null;
    }, function (error) {
      state.proxyRuntime.repairPromise = null;
      throw error;
    });

    return state.proxyRuntime.repairPromise;
  }

  function initializeProxyRuntime(config, allowRepair) {
    var wispUrl = resolveWispUrl(config);
    if (!wispUrl) {
      return Promise.reject(new Error("No backend Wisp websocket is configured."));
    }

    if (!window.BareMux || typeof window.BareMux.BareMuxConnection !== "function") {
      return Promise.reject(new Error("BareMux is not available on the static frontend."));
    }

    return registerProxyServiceWorker().then(function () {
      var ScramjetController = loadScramjetControllerClass();
      var controller = state.proxyRuntime.controller;

      if (!controller) {
        controller = new ScramjetController({
          prefix: SCRAMJET_PREFIX,
          files: SCRAMJET_FILES
        });
      }

      return controller.init().then(function () {
        var mux = new window.BareMux.BareMuxConnection(BAREMUX_WORKER_PATH);
        return mux.setTransport(LIBCURL_TRANSPORT_PATH, [{ wisp: wispUrl }]).then(function () {
          state.proxyRuntime.controller = controller;
          state.proxyRuntime.ready = true;
          state.proxyRuntime.transportUrl = wispUrl;
          return state.proxyRuntime;
        });
      });
    }).catch(function (error) {
      if (!allowRepair || !isRecoverableProxyStorageError(error)) {
        throw error;
      }

      return repairProxyRuntimeStorage().then(function () {
        return initializeProxyRuntime(config, false);
      });
    });
  }

  function ensureProxyRuntime() {
    if (state.proxyRuntime.ready && state.proxyRuntime.controller) {
      return Promise.resolve(state.proxyRuntime);
    }

    if (state.proxyRuntime.initPromise) {
      return state.proxyRuntime.initPromise;
    }

    state.proxyRuntime.initPromise = loadProxyConfig().then(function (config) {
      return initializeProxyRuntime(config, true);
    }).then(function (runtime) {
      state.proxyRuntime.initPromise = null;
      return runtime;
    }).catch(function (error) {
      state.proxyRuntime.initPromise = null;
      state.proxyRuntime.ready = false;
      throw error;
    });

    return state.proxyRuntime.initPromise;
  }

  function ensureProxyStorageCompatibility() {
    if (readPersistentValue(PROXY_STORAGE_VERSION_KEY) === PROXY_STORAGE_VERSION) {
      return Promise.resolve();
    }

    return repairProxyRuntimeStorage({ silent: true }).catch(function () {
      return null;
    }).then(function () {
      writePersistentValue(PROXY_STORAGE_VERSION_KEY, PROXY_STORAGE_VERSION);
    });
  }

  function syncWebTabFromUrl(tab, value) {
    var nextUrl = decodeScramjetUrl(value);
    if (!nextUrl) return;

    tab.targetUrl = nextUrl;
    tab.uri = nextUrl;
    tab.title = core.inferWebTitle(nextUrl);
    tab.webState.currentTarget = nextUrl;
    renderShell();
  }

  function navigateWebPane(tab, force) {
    if (!tab || tab.view !== "web" || !tab.webState || !tab.webState.frameController) return;
    var targetUrl = cleanText(tab.targetUrl);
    if (!targetUrl) return;
    if (!force && tab.webState.currentTarget === targetUrl) return;

    tab.webState.currentTarget = targetUrl;

    try {
      tab.webState.frameController.go(targetUrl);
    } catch (error) {
      setProxyHealth(false, error && error.message ? error.message : error, "Offline");
    }
  }

  function hydrateWebPane(tab) {
    if (!tab || tab.view !== "web" || !tab.paneEl) return;

    var frame = tab.paneEl.querySelector("iframe");
    if (!frame) return;

    ensureProxyRuntime().then(function (runtime) {
      if (!tab.paneEl || frame !== tab.paneEl.querySelector("iframe")) return;

      if (!tab.webState.frameController) {
        tab.webState.frameController = runtime.controller.createFrame(frame);
        tab.webState.frameController.addEventListener("urlchange", function (event) {
          syncWebTabFromUrl(tab, event && event.url);
        });
        tab.webState.frameController.addEventListener("navigate", function (event) {
          syncWebTabFromUrl(tab, event && event.url);
        });
      }

      navigateWebPane(tab, true);
    }).catch(function (error) {
      frame.src = "about:blank";
      setProxyHealth(false, error && error.message ? error.message : error, "Offline");
    });
  }

  function buildThumbMarkup(game) {
    var image = cleanText(game && game.image);
    if (image) {
      return '<div class="game-card__thumb"><img src="' + escapeHtml(resolveLocalAppUrl(image)) + '" alt="' + escapeHtml(game.title) + '" loading="lazy" /></div>';
    }
    return '<div class="game-card__thumb"></div>';
  }

  function makeLaunchUri(game) {
    var gamesApi = getGamesApi();
    if (gamesApi && typeof gamesApi.buildLaunchUri === "function") {
      return gamesApi.buildLaunchUri(game.path, game.title, game.author);
    }
    return core.buildGameUri(game.path, game.title, game.author);
  }

  function filterCatalogGames(games, rawQuery) {
    var gamesApi = getGamesApi();
    if (gamesApi && typeof gamesApi.filterCatalog === "function") {
      return gamesApi.filterCatalog(games, rawQuery);
    }
    var query = cleanText(rawQuery).toLowerCase();
    if (!Array.isArray(games)) return [];
    return games.filter(function (game) {
      if (!query) return true;
      var haystack = [
        cleanText(game && game.title),
        cleanText(game && game.author),
        cleanText(game && game.category),
        cleanText(game && game.path)
      ].join(" ").toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  function resolveFeaturedGame(games) {
    var gamesApi = getGamesApi();
    if (gamesApi && typeof gamesApi.pickFeaturedGame === "function") {
      return gamesApi.pickFeaturedGame(games);
    }
    if (!Array.isArray(games) || !games.length) return null;
    return games[0];
  }

  function renderGamesCatalog(pane, tab) {
    var statusEl = pane.querySelector('[data-role="games-status"]');
    var featuredEl = pane.querySelector('[data-role="games-featured"]');
    var gridEl = pane.querySelector('[data-role="games-grid"]');
    var query = cleanText(tab.gamesQuery);

    if (!state.gamesCatalog) {
      if (statusEl) statusEl.textContent = "Loading local catalog...";
      return;
    }

    var games = filterCatalogGames(state.gamesCatalog, query);
    var featuredGame = resolveFeaturedGame(state.gamesCatalog);

    if (statusEl) {
      statusEl.textContent = query
        ? games.length + (games.length === 1 ? " result" : " results")
        : state.gamesCatalog.length + " games";
    }

    if (featuredEl) {
      if (!featuredGame) {
        featuredEl.innerHTML = '<div class="empty-state">No local games are available yet.</div>';
      } else {
        featuredEl.innerHTML =
          '<div class="featured-launch__thumb">' +
            (cleanText(featuredGame.image)
              ? '<img src="' + escapeHtml(resolveLocalAppUrl(featuredGame.image)) + '" alt="' + escapeHtml(featuredGame.title) + '" loading="lazy" />'
              : "") +
          "</div>" +
          '<div class="featured-launch__body">' +
            '<h3 class="featured-launch__title">' + escapeHtml(featuredGame.title) + "</h3>" +
            '<p class="featured-launch__meta">' +
              '<span class="featured-launch__meta-author">' +
              escapeHtml(featuredGame.author || "Unknown") +
              "</span>" +
              '<span class="featured-launch__meta-sep" aria-hidden="true">\u00a0--\u00a0</span>' +
              '<span class="featured-launch__meta-category">' +
              escapeHtml(featuredGame.category || "game") +
              "</span>" +
              "</p>" +
            '<p class="featured-launch__meta">Launch it in its own Antarctic tab.</p>' +
            '<button type="button" class="toolbar-button toolbar-button--accent featured-launch__cta" data-launch-uri="' + escapeHtml(makeLaunchUri(featuredGame)) + '">Play now</button>' +
          "</div>";
      }
    }

    if (!gridEl) return;

    if (!games.length) {
      gridEl.innerHTML = '<div class="empty-state">Try another search or open a fresh tab.</div>';
      return;
    }

    gridEl.innerHTML = games.map(function (game) {
      return (
        '<button type="button" class="game-card" data-launch-uri="' + escapeHtml(makeLaunchUri(game)) + '">' +
          buildThumbMarkup(game) +
          '<div class="game-card__body">' +
            '<h4 class="game-card__title">' + escapeHtml(game.title) + "</h4>" +
            '<div class="game-card__meta">' +
              escapeHtml(game.author || "Unknown") +
              '<span class="game-card__meta-sep" aria-hidden="true">\u00a0--\u00a0</span>' +
              escapeHtml(game.category || "game") +
              "</div>" +
          "</div>" +
        "</button>"
      );
    }).join("");
  }

  function renderGamesFailure(pane) {
    var statusEl = pane.querySelector('[data-role="games-status"]');
    var featuredEl = pane.querySelector('[data-role="games-featured"]');
    var gridEl = pane.querySelector('[data-role="games-grid"]');

    if (statusEl) statusEl.textContent = "Catalog unavailable";
    if (featuredEl) {
      featuredEl.innerHTML = '<div class="empty-state">The games catalog could not be loaded right now.</div>';
    }
    if (gridEl) {
      gridEl.innerHTML = "";
    }
  }

  function handlePaneAction(event) {
    var target = event.target;
    if (!target || typeof target.closest !== "function") return;

    var routeButton = target.closest("[data-route]");
    if (routeButton) {
      navigateCurrent(routeButton.getAttribute("data-route"));
      return;
    }

    var fullscreenBtn = target.closest("[data-game-fullscreen]");
    if (fullscreenBtn) {
      if (fullscreenBtn.disabled) return;
      var gamePane = target.closest(".shell-pane--gamelauncher");
      if (!gamePane) return;
      var gameFrame = gamePane.querySelector("iframe.game-launcher__frame");
      if (!gameFrame) return;
      if (document.fullscreenElement === gameFrame) {
        document.exitFullscreen().catch(function () {});
      } else {
        gameFrame.requestFullscreen().catch(function () {});
      }
      return;
    }

    var launchButton = target.closest("[data-launch-uri]");
    if (launchButton) {
      openNewTab(launchButton.getAttribute("data-launch-uri"));
      return;
    }

    var searchButton = target.closest("[data-query]");
    if (searchButton) {
      navigateCurrent(searchButton.getAttribute("data-query"));
      return;
    }

    var promptButton = target.closest("[data-prompt]");
    if (promptButton) {
      var pane = target.closest(".shell-pane");
      if (!pane) return;
      var active = getActiveTab();
      if (!active || active.id !== pane.dataset.tabId) return;
      var input = pane.querySelector(".ai-chat__input");
      if (!input) return;
      input.value = promptButton.getAttribute("data-prompt");
      syncAiInputHeight(input);
      input.focus();
      if (typeof input.setSelectionRange === "function") {
        var end = input.value.length;
        input.setSelectionRange(end, end);
      }
    }
  }

  function loadGamesCatalog() {
    if (state.gamesCatalog) {
      return Promise.resolve(state.gamesCatalog.slice());
    }

    var gamesApi = getGamesApi();
    if (!gamesApi || typeof gamesApi.loadCatalog !== "function") {
      return Promise.reject(new Error("Games helper not available."));
    }

    return gamesApi.loadCatalog().then(function (games) {
      state.gamesCatalog = Array.isArray(games) ? games : [];
      return state.gamesCatalog.slice();
    });
  }

  function renderAiConversation(pane, tab) {
    var messagesEl = pane.querySelector('[data-role="ai-messages"]');
    if (!messagesEl) return;

    messagesEl.innerHTML = "";
    tab.aiState.memory.forEach(function (message) {
      messagesEl.appendChild(buildAiMessage(message.role, message.content));
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function buildAiMessage(role, text) {
    var bubble = document.createElement("article");
    bubble.className = "ai-message ai-message--" + role;
    bubble.innerHTML =
      '<div class="ai-message__label">' + (role === "user" ? "You" : "Assistant") + "</div>" +
      '<div class="ai-message__body">' + renderMarkdown(text || "") + "</div>";
    return bubble;
  }

  function updateAiMessage(bubble, text) {
    if (!bubble) return;
    var body = bubble.querySelector(".ai-message__body");
    if (!body) return;
    body.innerHTML = renderMarkdown(text || "");
  }

  function renderMarkdown(text) {
    var source = String(text || "").replace(/\r/g, "");
    if (!source) return "<p></p>";

    var lines = source.split("\n");
    var html = [];
    var listOpen = false;
    var codeOpen = false;
    var codeLines = [];

    function closeList() {
      if (listOpen) {
        html.push("</ul>");
        listOpen = false;
      }
    }

    function closeCode() {
      if (codeOpen) {
        html.push("<pre><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
        codeOpen = false;
        codeLines = [];
      }
    }

    for (var index = 0; index < lines.length; index += 1) {
      var line = lines[index];
      var trimmed = line.trim();

      if (/^```/.test(trimmed)) {
        closeList();
        if (codeOpen) {
          closeCode();
        } else {
          codeOpen = true;
        }
        continue;
      }

      if (codeOpen) {
        codeLines.push(line);
        continue;
      }

      if (!trimmed) {
        closeList();
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        if (!listOpen) {
          html.push("<ul>");
          listOpen = true;
        }
        html.push("<li>" + inlineMarkdown(trimmed.replace(/^[-*]\s+/, "")) + "</li>");
        continue;
      }

      closeList();
      html.push("<p>" + inlineMarkdown(trimmed) + "</p>");
    }

    closeCode();
    closeList();
    return html.join("");
  }

  function inlineMarkdown(text) {
    return escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function refreshAiStatus(pane) {
    var statusEl = pane.querySelector('[data-role="ai-status"]');

    var backendApi = getBackendApi();
    if (!backendApi || typeof backendApi.getPublicConfig !== "function") {
      if (statusEl) statusEl.textContent = "Backend helper unavailable";
      if (elements.aiStatusChip) elements.aiStatusChip.textContent = "Backend missing";
      return;
    }

    backendApi.getPublicConfig().then(function (config) {
      state.config = config || state.config;
      var model = cleanText(config && config.services && config.services.defaultAiModel) || "AI";
      if (statusEl) statusEl.textContent = "Online · " + model;
      if (elements.aiStatusChip) elements.aiStatusChip.textContent = model;
    }).catch(function () {
      if (statusEl) statusEl.textContent = "AI backend unavailable";
      if (elements.aiStatusChip) elements.aiStatusChip.textContent = "Offline";
    });
  }

  function submitAiMessage(tab, pane) {
    if (tab.aiState.busy) return;
    var input = pane.querySelector(".ai-chat__input");
    var messagesEl = pane.querySelector('[data-role="ai-messages"]');
    if (!input || !messagesEl) return;

    var text = cleanText(input.value);
    if (!text) return;

    input.value = "";
    syncAiInputHeight(input);
    tab.aiState.busy = true;

    var userMessage = { role: "user", content: text };
    tab.aiState.memory.push(userMessage);
    var userBubble = buildAiMessage(userMessage.role, userMessage.content);
    messagesEl.appendChild(userBubble);

    var assistantBubble = buildAiMessage("assistant", "Thinking...");
    messagesEl.appendChild(assistantBubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    requestAiResponse(tab, text, function (combined) {
      updateAiMessage(assistantBubble, combined || "Thinking...");
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }).then(function (answer) {
      tab.aiState.memory.push({ role: "assistant", content: answer });
      updateAiMessage(assistantBubble, answer);
    }).catch(function (error) {
      updateAiMessage(assistantBubble, "AI error: " + cleanText(error && error.message ? error.message : error));
    }).finally(function () {
      tab.aiState.busy = false;
    });
  }

  function extractAssistantText(rawText) {
    var trimmed = String(rawText || "").trim();
    if (!trimmed) return "";

    function contentFromParsed(parsed) {
      if (!parsed || typeof parsed !== "object") return "";

      if (parsed.message && typeof parsed.message.content === "string") {
        return parsed.message.content;
      }

      if (typeof parsed.response === "string") {
        return parsed.response;
      }

      if (typeof parsed.content === "string") {
        return parsed.content;
      }

      if (Array.isArray(parsed.choices) && parsed.choices.length) {
        var first = parsed.choices[0] || {};
        if (first.message && typeof first.message.content === "string") {
          return first.message.content;
        }
        if (typeof first.text === "string") {
          return first.text;
        }
      }

      return "";
    }

    try {
      return contentFromParsed(JSON.parse(trimmed)) || trimmed;
    } catch (error) {
      return trimmed;
    }
  }

  function extractErrorText(rawText) {
    var trimmed = String(rawText || "").trim();
    if (!trimmed) return "";

    try {
      var parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.error === "string") {
        return parsed.error;
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function isRecoverableStreamError(error) {
    var message = cleanText(error && error.message ? error.message : error).toLowerCase();
    return (
      message.indexOf("failed to fetch") !== -1 ||
      message.indexOf("timed out") !== -1 ||
      message.indexOf("client disconnected") !== -1
    );
  }

  function requestAi(payload, onDelta) {
    return fetch(getBackendApi().apiUrl("/api/ai/chat"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(function (error) {
      if (payload.stream && isRecoverableStreamError(error)) {
        return requestAi(Object.assign({}, payload, { stream: false }), null);
      }
      throw error;
    }).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (raw) {
          throw new Error(extractErrorText(raw) || raw || ("AI request failed: " + response.status));
        });
      }

      if (payload.stream && response.body && typeof response.body.getReader === "function") {
        return streamAiResponse(response, payload, onDelta);
      }

      return response.text().then(function (raw) {
        var err = extractErrorText(raw);
        if (err) throw new Error(err);
        return extractAssistantText(raw);
      });
    });
  }

  function streamAiResponse(response, payload, onDelta) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    var combined = "";

    function applySegment(segment) {
      if (!segment) return;
      combined += segment;
      if (typeof onDelta === "function") {
        onDelta(combined, segment);
      }
    }

    function pump() {
      return reader.read().then(function (chunk) {
        if (chunk.done) {
          if (String(buffer || "").trim()) {
            try {
              var tail = JSON.parse(buffer.trim());
              if (typeof tail.delta === "string") {
                applySegment(tail.delta);
              } else {
                applySegment(extractAssistantText(tail));
              }
            } catch (error) {
              // Ignore malformed trailing bytes.
            }
          }
          return combined;
        }

        buffer += decoder.decode(chunk.value, { stream: true });
        var newlineIndex = buffer.indexOf("\n");

        while (newlineIndex !== -1) {
          var line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line) {
            try {
              var part = JSON.parse(line);
              if (part && part.error) {
                throw new Error(String(part.error));
              }
              if (typeof part.delta === "string") {
                applySegment(part.delta);
              } else {
                applySegment(extractAssistantText(part));
              }
            } catch (error) {
              if (!/Unexpected token|JSON/.test(String(error.message || ""))) {
                throw error;
              }
            }
          }
          newlineIndex = buffer.indexOf("\n");
        }

        return pump();
      });
    }

    return pump().catch(function (error) {
      if (isRecoverableStreamError(error)) {
        return requestAi(Object.assign({}, payload, { stream: false }), null);
      }
      throw error;
    });
  }

  function buildAiSystemPrompt(userText) {
    var lines = [
      "You are a helpful assistant for the Antarctic browser shell.",
      "Never make up games, links, or site features.",
      "Always format replies in Markdown.",
      "Prefer short, direct answers."
    ];

    if (!/\b(game|games|catalog|library|title|author|play)\b/i.test(userText || "")) {
      lines.push("If asked for game suggestions, use only the provided local catalog.");
      return Promise.resolve(lines.join("\n"));
    }

    return loadGamesCatalog().then(function (games) {
      lines.push("When answering about games, use ONLY this catalog.");
      lines.push("Catalog:");
      lines.push(
        games.slice(0, 24).map(function (game) {
          return "- " + game.title + " | " + game.author + " | " + game.path;
        }).join("\n")
      );
      return lines.join("\n");
    }).catch(function () {
      return lines.join("\n");
    });
  }

  function requestAiResponse(tab, userText, onDelta) {
    if (!getBackendApi()) {
      return Promise.reject(new Error("Backend helper not loaded."));
    }

    return buildAiSystemPrompt(userText).then(function (systemPrompt) {
      var messages = [{ role: "system", content: systemPrompt }];
      tab.aiState.memory.slice(-8).forEach(function (message) {
        messages.push(message);
      });

      return requestAi({
        messages: messages,
        stream: true,
        keep_alive: "24h",
        options: {
          num_predict: 64,
          num_ctx: 768,
          temperature: 0.1
        }
      }, onDelta);
    });
  }

  function refreshProxyStatus() {
    setProxyHealth(false, "Checking the backend Scramjet transport...", "Booting");

    var backendApi = getBackendApi();
    if (!backendApi || typeof backendApi.fetchJson !== "function") {
      setProxyHealth(false, "Backend helper unavailable.", "Offline");
      return;
    }

    backendApi.fetchJson("/api/proxy/health").then(function (health) {
      setProxyHealth(true, health && health.message ? health.message : "Backend proxy transport is online.", "Connecting");
      return ensureProxyRuntime();
    }).then(function (runtime) {
      setProxyHealth(true, "Scramjet ready via " + runtime.transportUrl, "Online");
      refreshAllWebFrames();
    }).catch(function (error) {
      setProxyHealth(false, error && error.message ? error.message : error, "Offline");
    });
  }

  function refreshAllWebFrames() {
    state.tabs.forEach(function (tab) {
      if (tab.view !== "web" || !tab.paneEl) return;
      hydrateWebPane(tab);
    });
  }

  function renderStageOverlay(active) {
    if (!elements.stageOverlay || !elements.stageOverlayText) return;

    var show = Boolean(active && active.view === "web" && !state.proxyHealth.ok);
    elements.stageOverlay.hidden = !show;
    elements.stageOverlayText.textContent = state.proxyHealth.message;
  }

  function refreshActivePane() {
    var active = getActiveTab();
    if (!active) return;

    if (active.view === "home") {
      removePane(active);
      ensurePane(active);
    } else if (active.view === "games") {
      state.gamesCatalog = null;
      removePane(active);
      ensurePane(active);
    } else if (active.view === "account") {
      syncAccountPane(active.paneEl, "Account refreshed.");
    } else if (active.view === "chat") {
      syncChatPane(active.paneEl, active, "Chat refreshed.");
    } else if (active.view === "settings") {
      syncSettingsPane(active.paneEl, "Settings refreshed.");
    } else if (active.view === "web") {
      if (active.webState && active.webState.frameController) {
        active.webState.frameController.reload();
      } else {
        hydrateWebPane(active);
      }
    } else if (active.view === "gamelauncher") {
      var gameFrame = active.paneEl && active.paneEl.querySelector("iframe");
      if (gameFrame) gameFrame.src = resolveLocalAppUrl(active.path);
    }

    renderShell();
  }

  function bindEvents() {
    if (elements.addressForm && elements.addressInput) {
      elements.addressForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var active = getActiveTab();
        var typed = elements.addressInput.value;
        addressBarRecordSubmitOverride(active, typed);
        navigateCurrent(typed);
      });
    }

    if (elements.addressUndoButton) {
      elements.addressUndoButton.addEventListener("click", function () {
        addressBarUndo();
      });
    }
    if (elements.addressRedoButton) {
      elements.addressRedoButton.addEventListener("click", function () {
        addressBarRedo();
      });
    }

    if (elements.homeButton) {
      elements.homeButton.addEventListener("click", function () {
        navigateCurrent(core.buildInternalUri("home"));
      });
    }

    if (elements.toolbarSidebarToggle) {
      elements.toolbarSidebarToggle.addEventListener("click", toggleSidebar);
    }

    if (elements.refreshButton) {
      elements.refreshButton.addEventListener("click", refreshActivePane);
    }

    if (elements.newTabButton) {
      elements.newTabButton.addEventListener("click", function () {
        openNewTab(core.buildInternalUri("home"));
      });
    }

    if (elements.tabList) {
      elements.tabList.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== "function") return;

        var closeButton = target.closest("[data-close-tab]");
        if (closeButton) {
          event.stopPropagation();
          closeTab(closeButton.getAttribute("data-close-tab"));
          return;
        }

        var tabCard = target.closest("[data-tab-id]");
        if (tabCard) {
          setActiveTab(tabCard.getAttribute("data-tab-id"));
        }
      });
    }

    if (elements.routeList) {
      elements.routeList.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== "function") return;
        var routeButton = target.closest("[data-route]");
        if (!routeButton) return;
        navigateCurrent(routeButton.getAttribute("data-route"));
      });
    }

    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") {
        event.preventDefault();
        if (elements.addressInput) {
          elements.addressInput.focus();
          elements.addressInput.select();
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
        event.preventDefault();
        openNewTab(core.buildInternalUri("home"));
      }
    });
  }

  function padTimeUnit(value) {
    var n = Number(value);
    return (n < 10 ? "0" : "") + n;
  }

  function startShellClock() {
    var el = document.getElementById("shell-clock");
    if (!el) return;

    function tick() {
      var now = new Date();
      var text =
        padTimeUnit(now.getHours()) +
        ":" +
        padTimeUnit(now.getMinutes()) +
        ":" +
        padTimeUnit(now.getSeconds());
      el.textContent = text;
      try {
        el.setAttribute("datetime", now.toISOString());
      } catch (err) {
        el.removeAttribute("datetime");
      }
    }

    tick();
    window.setInterval(tick, 1000);
  }

  ensureProxyStorageCompatibility().catch(function () {
    return null;
  }).finally(function () {
    restoreTabs();
    bindEvents();
    startShellClock();
    renderShell();
    refreshProxyStatus();
  });
})();
