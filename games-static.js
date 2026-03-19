(function () {
  var LOCAL_MANIFEST_PATH = "data/games-catalog.json";
  var catalogCache = null;

  function sanitizeText(value) {
    return String(value == null ? "" : value).trim();
  }

  function isRemoteAsset(value) {
    return /^(?:[a-z]+:)?\/\//i.test(value) || /^(?:data|blob):/i.test(value);
  }

  function normalizeAssetPath(value) {
    var text = sanitizeText(value);
    if (!text || isRemoteAsset(text)) return text;
    return text.replace(/^\/+/, "");
  }

  function normalizeGamePath(value) {
    return normalizeAssetPath(value).replace(/\\/g, "/");
  }

  function buildLaunchUri(gamePath, title, author) {
    var normalizedPath = normalizeGamePath(gamePath);
    if (!normalizedPath) {
      return "palladium://gamelauncher";
    }

    var parts = ["path=" + encodeURIComponent(normalizedPath)];
    var normalizedTitle = sanitizeText(title);
    var normalizedAuthor = sanitizeText(author);

    if (normalizedTitle) {
      parts.push("title=" + encodeURIComponent(normalizedTitle));
    }

    if (normalizedAuthor) {
      parts.push("author=" + encodeURIComponent(normalizedAuthor));
    }

    return "palladium://gamelauncher?" + parts.join("&");
  }

  async function loadLocalCatalog(forceRefresh) {
    if (!forceRefresh && catalogCache) {
      return catalogCache.slice();
    }

    var response = await fetch(LOCAL_MANIFEST_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Local games catalog request failed with status " + response.status);
    }

    var payload = await response.json();
    catalogCache = Array.isArray(payload && payload.games) ? payload.games : [];
    return catalogCache.slice();
  }

  async function loadCatalog(options) {
    var settings = options || {};
    return loadLocalCatalog(Boolean(settings.forceRefresh));
  }

  window.PalladiumGames = {
    buildLaunchUri: buildLaunchUri,
    getCachedCatalog: function () {
      return catalogCache ? catalogCache.slice() : [];
    },
    loadCatalog: loadCatalog,
    manifestPath: LOCAL_MANIFEST_PATH,
    normalizeAssetPath: normalizeAssetPath,
    normalizeGamePath: normalizeGamePath
  };
})();
