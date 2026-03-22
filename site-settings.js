(function () {
  var TITLE_KEY = "antarctic.site.title";
  var LEGACY_TITLE_KEY = "palladium.site.title";
  var FAVICON_KEY = "antarctic.site.favicon";
  var LEGACY_FAVICON_KEY = "palladium.site.favicon";
  var THEME_KEY = "antarctic.site.theme";
  var LEGACY_THEME_KEY = "palladium.site.theme";
  var DEFAULT_TITLE = "Antarctic Games";
  var DEFAULT_FAVICON = "images/favicon.png?v=4";
  var DEFAULT_THEME = "default";
  var storage = window.AntarcticGamesStorage || window.PalladiumSiteStorage || null;
  var ALLOWED_THEMES = {
    "default": true,
    "color-wash": true,
    "miami": true,
    "rainbow": true,
    "aurora": true,
    "sunset": true,
    "forest": true,
    "oceanic": true,
    "graphite": true,
    "arctic": true,
    "ember": true,
    "neon": true
  };

  function safeGetStorage(key) {
    try {
      return String(localStorage.getItem(key) || "").trim();
    } catch (error) {
      return "";
    }
  }

  function safeSetStorage(key, value) {
    try {
      if (String(value || "").trim()) {
        localStorage.setItem(key, String(value).trim());
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      // Ignore storage write failures.
    }
  }

  function getStoredSetting(primaryKey, legacyKey) {
    if (storage && typeof storage.getItem === "function") {
      return String(storage.getItem(primaryKey, { legacyKeys: [legacyKey] }) || "").trim();
    }
    return safeGetStorage(primaryKey) || safeGetStorage(legacyKey);
  }

  function setStoredSetting(primaryKey, legacyKey, value) {
    var normalizedValue = String(value == null ? "" : value).trim();
    if (storage && typeof storage.setItem === "function") {
      storage.setItem(primaryKey, normalizedValue, { legacyKeys: [legacyKey] });
      return;
    }

    safeSetStorage(primaryKey, normalizedValue);
    if (legacyKey) {
      safeSetStorage(legacyKey, "");
    }
  }

  function normalizeFavicon(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    if (/^(data:image\/|https?:\/\/|\/|\.{1,2}\/)/i.test(raw)) return raw;
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return "https://" + raw;
    return raw;
  }

  function inferFaviconType(href) {
    var value = String(href || "").toLowerCase();
    if (/\.ico([?#].*)?$/.test(value)) return "image/x-icon";
    if (/\.svg([?#].*)?$/.test(value)) return "image/svg+xml";
    if (/\.jpe?g([?#].*)?$/.test(value)) return "image/jpeg";
    if (/\.webp([?#].*)?$/.test(value)) return "image/webp";
    if (/^data:image\/svg\+xml/i.test(value)) return "image/svg+xml";
    if (/^data:image\/x-icon/i.test(value)) return "image/x-icon";
    if (/^data:image\/jpeg/i.test(value)) return "image/jpeg";
    if (/^data:image\/webp/i.test(value)) return "image/webp";
    if (/^data:image\//i.test(value)) return "image/png";
    if (/\.png([?#].*)?$/.test(value)) return "image/png";
    return "";
  }

  function cacheBust(href) {
    var raw = String(href || "").trim();
    if (!raw || /^data:image\//i.test(raw)) return raw;
    var divider = raw.indexOf("?") === -1 ? "?" : "&";
    return raw + divider + "antarctic_fv=" + Date.now();
  }

  function normalizeTheme(value) {
    var raw = String(value || "").trim().toLowerCase();
    if (!raw) return DEFAULT_THEME;
    return ALLOWED_THEMES[raw] ? raw : DEFAULT_THEME;
  }

  function applyTheme(themeName) {
    var theme = normalizeTheme(themeName);
    document.documentElement.setAttribute("data-theme", theme);
  }

  function getSettings() {
    return {
      title: getStoredSetting(TITLE_KEY, LEGACY_TITLE_KEY),
      favicon: normalizeFavicon(getStoredSetting(FAVICON_KEY, LEGACY_FAVICON_KEY)),
      theme: normalizeTheme(getStoredSetting(THEME_KEY, LEGACY_THEME_KEY))
    };
  }

  function decorateTitle(originalTitle) {
    var source = String(originalTitle || "").trim();
    var customTitle = getSettings().title;
    if (customTitle) return customTitle;
    return source || DEFAULT_TITLE;
  }

  function applyTitle(customTitle) {
    var title = String(customTitle || "").trim();
    if (title) {
      document.title = title;
      return;
    }

    var current = String(document.title || "").trim();
    document.title = current || DEFAULT_TITLE;
  }

  function setLinkRel(rel, href, type) {
    var links = document.querySelectorAll('link[rel="' + rel + '"]');
    if (!links.length) {
      var created = document.createElement("link");
      created.rel = rel;
      if (type) created.type = type;
      created.href = href;
      document.head.appendChild(created);
      return;
    }

    for (var i = 0; i < links.length; i += 1) {
      links[i].href = href;
      if (type) links[i].type = type;
    }
  }

  function applyFavicon(faviconUrl) {
    var rawHref = normalizeFavicon(faviconUrl) || DEFAULT_FAVICON;
    var displayHref = cacheBust(rawHref);
    var type = inferFaviconType(rawHref);
    setLinkRel("icon", displayHref, type || "image/png");
    setLinkRel("shortcut icon", displayHref, type || "image/x-icon");
    setLinkRel("apple-touch-icon", displayHref, type || "image/png");
  }

  function applyDocumentSettings() {
    var settings = getSettings();
    applyTheme(settings.theme);
    applyTitle(settings.title);
    applyFavicon(settings.favicon);
  }

  function setTitle(value) {
    setStoredSetting(TITLE_KEY, LEGACY_TITLE_KEY, value);
    applyDocumentSettings();
  }

  function setFavicon(value) {
    setStoredSetting(FAVICON_KEY, LEGACY_FAVICON_KEY, normalizeFavicon(value));
    applyDocumentSettings();
  }

  function setTheme(value) {
    var normalized = normalizeTheme(value);
    if (normalized === DEFAULT_THEME) {
      setStoredSetting(THEME_KEY, LEGACY_THEME_KEY, "");
    } else {
      setStoredSetting(THEME_KEY, LEGACY_THEME_KEY, normalized);
    }
    applyDocumentSettings();
  }

  function reset() {
    setStoredSetting(TITLE_KEY, LEGACY_TITLE_KEY, "");
    setStoredSetting(FAVICON_KEY, LEGACY_FAVICON_KEY, "");
    setStoredSetting(THEME_KEY, LEGACY_THEME_KEY, "");
    applyDocumentSettings();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function openInAboutBlank(targetUrl) {
    var target = String(targetUrl || window.location.href || "").trim();
    if (!target) return { ok: false, error: "Missing target URL." };

    var newTab = window.open("about:blank", "_blank");
    if (!newTab) {
      return { ok: false, error: "Popup blocked by browser." };
    }

    var settings = getSettings();
    var title = settings.title || DEFAULT_TITLE;
    var favicon = settings.favicon || DEFAULT_FAVICON;

    var html = [
      "<!doctype html>",
      "<html>",
      "<head>",
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      "<title>" + escapeHtml(title) + "</title>",
      '<link rel="icon" href="' + escapeHtml(favicon) + '" />',
      "<style>",
      "html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}",
      "iframe{width:100%;height:100%;border:0;display:block}",
      "</style>",
      "</head>",
      "<body>",
      '<iframe src="' + escapeHtml(target) + '" allow="clipboard-read; clipboard-write; fullscreen"></iframe>',
      "</body>",
      "</html>"
    ].join("");

    newTab.document.open();
    newTab.document.write(html);
    newTab.document.close();
    return { ok: true };
  }

  function attachLeaveWarning() {
    if (window.__antarcticGamesLeaveWarningAttached) return;
    window.__antarcticGamesLeaveWarningAttached = true;
    var suppressPrompt = false;
    var suppressTimer = null;

    function suppressForNavigation() {
      suppressPrompt = true;
      if (suppressTimer) {
        clearTimeout(suppressTimer);
      }
      suppressTimer = setTimeout(function () {
        suppressPrompt = false;
        suppressTimer = null;
      }, 1800);
    }

    document.addEventListener("click", function (event) {
      if (!event || event.defaultPrevented) return;
      if (!event.target || typeof event.target.closest !== "function") return;

      var anchor = event.target.closest("a[href]");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;

      var target = String(anchor.getAttribute("target") || "").trim().toLowerCase();
      if (target && target !== "_self") return;

      var href = String(anchor.getAttribute("href") || "").trim();
      if (!href || href === "#" || /^javascript:/i.test(href)) return;

      suppressForNavigation();
    }, true);

    document.addEventListener("submit", function () {
      suppressForNavigation();
    }, true);

    window.addEventListener("beforeunload", function (event) {
      if (suppressPrompt) return;

      var message = "Are you sure you want to leave this page? Changes you made might not be saved.";
      event.preventDefault();
      event.returnValue = message;
      return message;
    });
  }

  var api = {
    defaultTitle: DEFAULT_TITLE,
    defaultFavicon: DEFAULT_FAVICON,
    defaultTheme: DEFAULT_THEME,
    themes: Object.keys(ALLOWED_THEMES),
    getSettings: getSettings,
    setTitle: setTitle,
    setFavicon: setFavicon,
    setTheme: setTheme,
    reset: reset,
    decorateTitle: decorateTitle,
    applyDocumentSettings: applyDocumentSettings,
    openInAboutBlank: openInAboutBlank
  };

  window.AntarcticGamesSiteSettings = api;
  window.PalladiumSiteSettings = api;

  attachLeaveWarning();
  applyDocumentSettings();
})();
