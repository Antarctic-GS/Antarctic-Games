(function () {
  var PRIMARY_SCHEME = "antarctic://";
  var INTERNAL_ROUTES = {
    home: "Home",
    newtab: "New Tab",
    games: "Games",
    ai: "AI",
    account: "Account",
    chat: "Group Chats",
    dms: "DMs",
    groupchats: "Group Chats",
    settings: "Settings",
    gamelauncher: "Game Launcher"
  };

  function cleanText(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeSlash(value) {
    return cleanText(value).replace(/\\/g, "/").replace(/^\/+/, "");
  }

  function humanizeSlug(value) {
    return cleanText(value)
      .replace(/\.html(?:[?#].*)?$/i, "")
      .split(/[\/?#]/)
      .pop()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, function (character) {
        return character.toUpperCase();
      })
      .trim();
  }

  function normalizeGamePath(value) {
    var normalized = normalizeSlash(value);
    if (!normalized) return "";
    return normalized;
  }

  function buildInternalUri(route) {
    var normalized = cleanText(route).toLowerCase();
    if (normalized === "newtab") {
      normalized = "home";
    }
    if (!INTERNAL_ROUTES[normalized]) {
      normalized = "home";
    }
    return PRIMARY_SCHEME + normalized;
  }

  function buildGameUri(gamePath, title, author) {
    var normalizedPath = normalizeGamePath(gamePath);
    if (!normalizedPath) {
      return buildInternalUri("gamelauncher");
    }

    var query = ["path=" + encodeURIComponent(normalizedPath)];
    var normalizedTitle = cleanText(title);
    var normalizedAuthor = cleanText(author);

    if (normalizedTitle) {
      query.push("title=" + encodeURIComponent(normalizedTitle));
    }

    if (normalizedAuthor) {
      query.push("author=" + encodeURIComponent(normalizedAuthor));
    }

    return PRIMARY_SCHEME + "gamelauncher?" + query.join("&");
  }

  function parseInternalUri(value) {
    var raw = cleanText(value);
    if (!raw || !/^(?:antarctic|antarcticgames|palladium):\/\//i.test(raw)) {
      return null;
    }

    try {
      var parsed = new URL(raw);
      var route = cleanText(parsed.hostname || parsed.pathname.replace(/^\/+/, "")).toLowerCase();

      if (!route) {
        route = "home";
      }

      if (route === "game" || route === "gamelauncher") {
        var gamePath = normalizeGamePath(parsed.searchParams.get("path"));
        if (!gamePath) {
          return {
            view: "gamelauncher",
            route: "gamelauncher",
            title: INTERNAL_ROUTES.gamelauncher,
            author: "",
            path: "",
            uri: buildInternalUri("gamelauncher")
          };
        }

        var title = cleanText(parsed.searchParams.get("title")) || humanizeSlug(gamePath);
        return {
          view: "gamelauncher",
          route: "gamelauncher",
          title: title,
          author: cleanText(parsed.searchParams.get("author")),
          path: gamePath,
          uri: buildGameUri(gamePath, title, parsed.searchParams.get("author"))
        };
      }

      if (route === "home" || route === "newtab") {
        return {
          view: "home",
          route: "home",
          title: INTERNAL_ROUTES.home,
          uri: buildInternalUri("home")
        };
      }

      if (route === "chat") {
        route = "groupchats";
      }

      if (
        route === "games" ||
        route === "ai" ||
        route === "account" ||
        route === "dms" ||
        route === "groupchats" ||
        route === "settings" ||
        route === "gamelauncher"
      ) {
        return {
          view: route,
          route: route,
          title: INTERNAL_ROUTES[route],
          uri: buildInternalUri(route)
        };
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function looksLikeGamePath(value) {
    var normalized = normalizeGamePath(value);
    return /^games\/.+\.html(?:[?#].*)?$/i.test(normalized);
  }

  function normalizeWebTarget(input) {
    var raw = cleanText(input);
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return "https://" + raw;
    return "https://duckduckgo.com/?q=" + encodeURIComponent(raw);
  }

  function inferWebTitle(targetUrl) {
    try {
      var parsed = new URL(targetUrl);
      return parsed.hostname || parsed.href;
    } catch (error) {
      return cleanText(targetUrl) || "Web";
    }
  }

  function describeInput(input) {
    var raw = cleanText(input);
    if (!raw) {
      return parseInternalUri(buildInternalUri("home"));
    }

    var internal = parseInternalUri(raw);
    if (internal) {
      return internal;
    }

    if (looksLikeGamePath(raw)) {
      var title = humanizeSlug(raw);
      return {
        view: "gamelauncher",
        route: "gamelauncher",
        title: title,
        author: "",
        path: normalizeGamePath(raw),
        uri: buildGameUri(raw, title, "")
      };
    }

    var webTarget = normalizeWebTarget(raw);
    return {
      view: "web",
      route: "web",
      title: inferWebTitle(webTarget),
      targetUrl: webTarget,
      uri: webTarget
    };
  }

  var api = {
    buildGameUri: buildGameUri,
    buildInternalUri: buildInternalUri,
    cleanText: cleanText,
    describeInput: describeInput,
    humanizeSlug: humanizeSlug,
    inferWebTitle: inferWebTitle,
    normalizeGamePath: normalizeGamePath,
    normalizeSlash: normalizeSlash,
    normalizeWebTarget: normalizeWebTarget,
    parseInternalUri: parseInternalUri
  };

  window.AntarcticGamesShellCore = api;
  window.PalladiumShellCore = api;
})();
