(function () {
  var LAUNCH_SCHEME = "antarctic://";
  var PRIMARY_CATALOG_GLOBAL = "ANTARCTIC_GAMES_CATALOG";
  var LEGACY_CATALOG_GLOBAL = "PALLADIUM_GAMES_CATALOG";
  var LOCAL_MANIFEST_PATH = "data/games-catalog.js";
  var catalogCache = null;
  var catalogLoadPromise = null;

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
      return LAUNCH_SCHEME + "gamelauncher";
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

    return LAUNCH_SCHEME + "gamelauncher?" + parts.join("&");
  }

  function matchesCatalogQuery(game, rawQuery) {
    var query = sanitizeText(rawQuery).toLowerCase();
    if (!query) return true;

    var haystack = [
      sanitizeText(game && game.title),
      sanitizeText(game && game.author),
      sanitizeText(game && game.category),
      normalizeGamePath(game && game.path)
    ].join(" ").toLowerCase();

    return haystack.indexOf(query) !== -1;
  }

  function filterCatalog(games, rawQuery) {
    if (!Array.isArray(games)) return [];
    return games.filter(function (game) {
      return matchesCatalogQuery(game, rawQuery);
    });
  }

  function pickFeaturedGame(games) {
    if (!Array.isArray(games) || !games.length) {
      return null;
    }

    for (var index = 0; index < games.length; index += 1) {
      if (sanitizeText(games[index] && games[index].image)) {
        return games[index];
      }
    }

    return games[0];
  }

  function readEmbeddedCatalog() {
    var payload = window[PRIMARY_CATALOG_GLOBAL] || window[LEGACY_CATALOG_GLOBAL];
    return Array.isArray(payload && payload.games) ? payload.games : null;
  }

  function resolveCatalogFromWindow() {
    var games = readEmbeddedCatalog();
    if (!games) {
      throw new Error("Embedded games catalog is unavailable.");
    }
    catalogCache = games.slice();
    return catalogCache.slice();
  }

  function ensureCatalogScript() {
    if (readEmbeddedCatalog()) {
      return Promise.resolve(resolveCatalogFromWindow());
    }

    if (catalogLoadPromise) {
      return catalogLoadPromise;
    }

    catalogLoadPromise = new Promise(function (resolve, reject) {
      if (!document || typeof document.createElement !== "function") {
        reject(new Error("Embedded games catalog is unavailable."));
        return;
      }

      var selector = 'script[data-palladium-games-catalog="true"]';
      var script = document.querySelector(selector);
      var settled = false;

      function finishWithCatalog() {
        if (settled) return;
        settled = true;
        try {
          resolve(resolveCatalogFromWindow());
        } catch (error) {
          reject(error);
        }
      }

      function failLoad() {
        if (settled) return;
        settled = true;
        reject(new Error("Embedded games catalog script could not be loaded."));
      }

      if (!script) {
        script = document.createElement("script");
        script.src = LOCAL_MANIFEST_PATH;
        script.async = true;
        script.setAttribute("data-palladium-games-catalog", "true");
        script.addEventListener("load", finishWithCatalog, { once: true });
        script.addEventListener("error", failLoad, { once: true });
        (document.head || document.body || document.documentElement).appendChild(script);
        return;
      }

      script.addEventListener("load", finishWithCatalog, { once: true });
      script.addEventListener("error", failLoad, { once: true });
    }).finally(function () {
      catalogLoadPromise = null;
    });

    return catalogLoadPromise;
  }

  async function loadLocalCatalog(forceRefresh) {
    if (!forceRefresh && catalogCache) {
      return catalogCache.slice();
    }

    if (forceRefresh) {
      catalogCache = null;
    }

    if (readEmbeddedCatalog()) {
      return resolveCatalogFromWindow();
    }

    return ensureCatalogScript();
  }

  async function loadCatalog(options) {
    var settings = options || {};
    return loadLocalCatalog(Boolean(settings.forceRefresh));
  }

  var api = {
    buildLaunchUri: buildLaunchUri,
    filterCatalog: filterCatalog,
    getCachedCatalog: function () {
      return catalogCache ? catalogCache.slice() : [];
    },
    loadCatalog: loadCatalog,
    manifestPath: LOCAL_MANIFEST_PATH,
    normalizeAssetPath: normalizeAssetPath,
    normalizeGamePath: normalizeGamePath,
    pickFeaturedGame: pickFeaturedGame
  };

  window.AntarcticGames = api;
  window.PalladiumGames = api;
})();
