(function () {
  var core = window.AntarcticGamesShellCore || window.PalladiumShellCore;
  if (!core) return;

  var STORAGE_KEY = "palladium.shell.state.v1";
  var SCRAMJET_PREFIX = "/service/scramjet/";
  var SCRAMJET_SW_PATH = "/sw.js";
  var BAREMUX_WORKER_PATH = "/baremux/worker.js";
  var LIBCURL_TRANSPORT_PATH = "/libcurl/index.mjs";
  var SCRAMJET_FILES = {
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
    wasm: "/scram/scramjet.wasm.wasm"
  };
  var SETTINGS_THEME_ORDER = [
    "default",
    "oceanic",
    "forest",
    "sunset",
    "graphite",
    "neon"
  ];
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
    toolbarSidebarToggle: document.getElementById("sidebar-toggle")
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

  function readStorage() {
    try {
      var raw = window.sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(payload) {
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
    return core.describeInput(value || core.buildInternalUri("newtab"));
  }

  function createTab(uri, existingId) {
    var descriptor = describeUri(uri);
    return {
      aiState: {
        busy: false,
        memory: []
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
    var siteSettings = window.AntarcticGamesSiteSettings || window.PalladiumSiteSettings;
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
    var tab = createTab(uri || core.buildInternalUri("newtab"));
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
      openNewTab(core.buildInternalUri("newtab"));
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
      state.tabs = [createTab(requestedUri || core.buildInternalUri("newtab"))];
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
    if (tab.view === "gamelauncher") return "images/favicon.png";
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
    if (tab.view === "settings") return "settings";
    if (tab.view === "gamelauncher") return "play";
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
      addPath("M6.5 9h11a3.5 3.5 0 0 1 3.5 3.5v0A3.5 3.5 0 0 1 17.5 16H6.5A3.5 3.5 0 0 1 3 12.5v0A3.5 3.5 0 0 1 6.5 9Z");
      addPath("M8.5 12.5h3M10 11v3M15.5 12h0M17.5 13.5h0");
      return svg;
    }
    if (name === "ai") {
      addPath("M12 3v4M12 17v4M4.8 7.2l2.8 2.8M16.4 14.8l2.8 2.8M3 12h4M17 12h4M4.8 16.8l2.8-2.8M16.4 9.2l2.8-2.8");
      addPath("M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z");
      return svg;
    }
    if (name === "play") {
      addPath("M8 6v12l10-6-10-6Z");
      return svg;
    }
    if (name === "settings") {
      addPath("M12 3.5 14 5l2.5-.2 1 2.3 2 1.5-.8 2.4.8 2.4-2 1.5-1 2.3L14 19l-2 1.5L10 19l-2.5.2-1-2.3-2-1.5.8-2.4-.8-2.4 2-1.5 1-2.3L10 5l2-1.5Z");
      addPath("M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z");
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

  function renderShell() {
    var active = getActiveTab();

    renderTabList();
    renderPanes();
    renderStageOverlay(active);

    if (elements.addressInput && active) {
      elements.addressInput.value = active.uri;
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
    fillHomeLibrary(pane);
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
        content: "Ask me about Antarctic Games, the game catalog, or anything else you want."
      });
    }

    renderAiConversation(pane, tab);
    refreshAiStatus(pane);
    return pane;
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

  function humanizeThemeName(themeName) {
    return cleanText(themeName)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function (character) {
        return character.toUpperCase();
      });
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

  function setSettingsStatus(pane, message) {
    if (!pane) return;
    var statusEl = pane.querySelector('[data-role="settings-status"]');
    if (statusEl) {
      statusEl.textContent = cleanText(message) || "Saved locally in this browser.";
    }
  }

  function renderThemeGrid(pane, settings) {
    var container = pane.querySelector('[data-role="theme-grid"]');
    if (!container) return;

    var activeTheme = cleanText(settings && settings.theme) || "default";
    var themes = getSettingsThemes();

    container.innerHTML = themes.map(function (themeName) {
      var displayName = humanizeThemeName(themeName);
      return (
        '<button type="button" class="theme-chip' + (themeName === activeTheme ? ' theme-chip--active' : '') + '" data-theme-option="' + escapeHtml(themeName) + '">' +
          '<span class="theme-chip__name">' + escapeHtml(displayName) + "</span>" +
          '<span class="theme-chip__meta">' + escapeHtml(themeName === "default" ? "Antarctic Games default" : displayName + " palette") + "</span>" +
        "</button>"
      );
    }).join("");
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
    var previewFavicon = pane.querySelector('[data-role="settings-preview-favicon"]');
    var previewTheme = pane.querySelector('[data-role="settings-preview-theme"]');

    if (titleInput) titleInput.value = cleanText(settings.title);
    if (faviconInput) faviconInput.value = cleanText(settings.favicon);
    if (previewTitle) previewTitle.textContent = cleanText(settings.title) || "Antarctic Games";
    if (previewFavicon) previewFavicon.textContent = cleanText(settings.favicon) || "images/favicon.png?v=4";
    if (previewTheme) previewTheme.textContent = "Theme: " + humanizeThemeName(settings.theme || "default");

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
    var details = [];

    if (author) details.push(author);
    if (gamePath) details.push(gamePath);

    pane.innerHTML =
      '<div class="game-launcher">' +
        '<div class="game-launcher__header">' +
          '<div class="game-launcher__copy">' +
            '<p class="game-launcher__eyebrow">antarctic://gamelauncher</p>' +
            '<h2 class="game-launcher__title">' + escapeHtml(title) + "</h2>" +
            '<p class="game-launcher__meta">' + escapeHtml(details.join(" · ") || "Pick a game from the library to launch it here.") + "</p>" +
          "</div>" +
          '<div class="game-launcher__actions">' +
            '<button type="button" class="toolbar-button" data-route="antarctic://games">Game Library</button>' +
          "</div>" +
        "</div>" +
        '<div class="game-launcher__viewport" data-role="game-launcher-viewport"></div>' +
      "</div>";

    var viewport = pane.querySelector('[data-role="game-launcher-viewport"]');
    if (!viewport) return pane;

    if (!gamePath) {
      viewport.innerHTML =
        '<div class="empty-state empty-state--launcher">' +
          "<strong>No game selected yet.</strong>" +
          "<span>Open a title from antarctic://games and it will launch here.</span>" +
        "</div>";
      return pane;
    }

    var frame = document.createElement("iframe");
    frame.className = "shell-pane__frame game-launcher__frame";
    frame.src = gamePath;
    frame.setAttribute("allow", "clipboard-read; clipboard-write; fullscreen");
    frame.setAttribute("referrerpolicy", "no-referrer");
    viewport.appendChild(frame);
    return pane;
  }

  function createWebPane(tab) {
    var pane = document.createElement("section");
    pane.className = "shell-pane shell-pane--frame shell-pane--proxy";

    var frame = document.createElement("iframe");
    frame.className = "shell-pane__frame shell-pane__frame--proxy";
    frame.src = "about:blank";
    frame.setAttribute("allow", "clipboard-read; clipboard-write; fullscreen");
    frame.setAttribute("referrerpolicy", "no-referrer");
    pane.appendChild(frame);
    return pane;
  }

  function loadProxyConfig() {
    if (!window.PalladiumBackend || typeof window.PalladiumBackend.getPublicConfig !== "function") {
      return Promise.reject(new Error("Backend helper unavailable."));
    }

    return window.PalladiumBackend.getPublicConfig().then(function (config) {
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
    if (!backendBase && window.PalladiumBackend && typeof window.PalladiumBackend.getBaseUrl === "function") {
      backendBase = normalizeBase(window.PalladiumBackend.getBaseUrl());
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

  function ensureProxyRuntime() {
    if (state.proxyRuntime.ready && state.proxyRuntime.controller) {
      return Promise.resolve(state.proxyRuntime);
    }

    if (state.proxyRuntime.initPromise) {
      return state.proxyRuntime.initPromise;
    }

    state.proxyRuntime.initPromise = loadProxyConfig().then(function (config) {
      var wispUrl = resolveWispUrl(config);
      if (!wispUrl) {
        throw new Error("No backend Wisp websocket is configured.");
      }

      if (!window.BareMux || typeof window.BareMux.BareMuxConnection !== "function") {
        throw new Error("BareMux is not available on the static frontend.");
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
      });
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
      return '<div class="game-card__thumb"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(game.title) + '" loading="lazy" /></div>';
    }
    return '<div class="game-card__thumb"></div>';
  }

  function buildMiniThumbMarkup(game) {
    var image = cleanText(game && game.image);
    if (image) {
      return '<div class="mini-game-card__thumb"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(game.title) + '" loading="lazy" /></div>';
    }
    return '<div class="mini-game-card__thumb"></div>';
  }

  function makeLaunchUri(game) {
    if (window.PalladiumGames && typeof window.PalladiumGames.buildLaunchUri === "function") {
      return window.PalladiumGames.buildLaunchUri(game.path, game.title, game.author);
    }
    return core.buildGameUri(game.path, game.title, game.author);
  }

  function filterCatalogGames(games, rawQuery) {
    if (window.PalladiumGames && typeof window.PalladiumGames.filterCatalog === "function") {
      return window.PalladiumGames.filterCatalog(games, rawQuery);
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
    if (window.PalladiumGames && typeof window.PalladiumGames.pickFeaturedGame === "function") {
      return window.PalladiumGames.pickFeaturedGame(games);
    }
    if (!Array.isArray(games) || !games.length) return null;
    return games[0];
  }

  function fillHomeLibrary(pane) {
    var container = pane.querySelector('[data-role="home-library"]');
    if (!container) return;

    loadGamesCatalog().then(function (games) {
      var sample = games.slice(0, 6);
      if (!sample.length) {
        container.innerHTML = '<div class="empty-state">No local games are available yet.</div>';
        return;
      }

      container.innerHTML = sample.map(function (game) {
        return (
          '<button type="button" class="mini-game-card" data-launch-uri="' + escapeHtml(makeLaunchUri(game)) + '">' +
            buildMiniThumbMarkup(game).replace("game-card__", "mini-game-card__") +
            '<div class="mini-game-card__body">' +
              '<h4 class="mini-game-card__title">' + escapeHtml(game.title) + '</h4>' +
              '<div class="mini-game-card__meta">' + escapeHtml(game.author || "Unknown") + "</div>" +
            "</div>" +
          "</button>"
        );
      }).join("");
    }).catch(function () {
      container.innerHTML = '<div class="empty-state">The local games catalog could not be loaded.</div>';
    });
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
              ? '<img src="' + escapeHtml(featuredGame.image) + '" alt="' + escapeHtml(featuredGame.title) + '" loading="lazy" />'
              : "") +
          "</div>" +
          '<div class="featured-launch__body">' +
            '<h3 class="featured-launch__title">' + escapeHtml(featuredGame.title) + "</h3>" +
            '<p class="featured-launch__meta">' + escapeHtml(featuredGame.author || "Unknown") + " · " + escapeHtml(featuredGame.category || "game") + "</p>" +
            '<p class="featured-launch__meta">Launch it in its own Antarctic Games tab.</p>' +
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
            '<div class="game-card__meta">' + escapeHtml(game.author || "Unknown") + " · " + escapeHtml(game.category || "game") + "</div>" +
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
      input.focus();
    }
  }

  function loadGamesCatalog() {
    if (state.gamesCatalog) {
      return Promise.resolve(state.gamesCatalog.slice());
    }

    if (!window.PalladiumGames || typeof window.PalladiumGames.loadCatalog !== "function") {
      return Promise.reject(new Error("Games helper not available."));
    }

    return window.PalladiumGames.loadCatalog().then(function (games) {
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
      '<div class="ai-message__label">' + (role === "user" ? "You" : "Antarctic Games AI") + "</div>" +
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

    if (!window.PalladiumBackend || typeof window.PalladiumBackend.getPublicConfig !== "function") {
      if (statusEl) statusEl.textContent = "Backend helper unavailable";
      if (elements.aiStatusChip) elements.aiStatusChip.textContent = "Backend missing";
      return;
    }

    window.PalladiumBackend.getPublicConfig().then(function (config) {
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
    return fetch(window.PalladiumBackend.apiUrl("/api/ai/chat"), {
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
      "You are Antarctic Games AI for the Antarctic Games browser shell.",
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
        games.slice(0, 40).map(function (game) {
          return "- " + game.title + " | " + game.author + " | " + game.path;
        }).join("\n")
      );
      return lines.join("\n");
    }).catch(function () {
      return lines.join("\n");
    });
  }

  function requestAiResponse(tab, userText, onDelta) {
    if (!window.PalladiumBackend) {
      return Promise.reject(new Error("Backend helper not loaded."));
    }

    return buildAiSystemPrompt(userText).then(function (systemPrompt) {
      var messages = [{ role: "system", content: systemPrompt }];
      tab.aiState.memory.forEach(function (message) {
        messages.push(message);
      });
      messages.push({ role: "user", content: userText });

      return requestAi({
        messages: messages,
        stream: true
      }, onDelta);
    });
  }

  function refreshProxyStatus() {
    setProxyHealth(false, "Checking the backend Scramjet transport...", "Booting");

    if (!window.PalladiumBackend || typeof window.PalladiumBackend.fetchJson !== "function") {
      setProxyHealth(false, "Backend helper unavailable.", "Offline");
      return;
    }

    window.PalladiumBackend.fetchJson("/api/proxy/health").then(function (health) {
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
      if (gameFrame) gameFrame.src = active.path;
    }

    renderShell();
  }

  function bindEvents() {
    if (elements.addressForm && elements.addressInput) {
      elements.addressForm.addEventListener("submit", function (event) {
        event.preventDefault();
        navigateCurrent(elements.addressInput.value);
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
        openNewTab(core.buildInternalUri("newtab"));
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
        openNewTab(core.buildInternalUri("newtab"));
      }
    });
  }

  restoreTabs();
  bindEvents();
  renderShell();
  refreshProxyStatus();
})();
