(function () {
  var STORAGE_KEY = "antarctic.account.session.v1";
  var LEGACY_STORAGE_KEY = "palladium.account.session.v1";
  var SESSION_HEADER = "x-antarctic-session";
  var cachedSession = undefined;
  var listeners = [];

  function cleanText(value) {
    return String(value == null ? "" : value).trim();
  }

  function getStorageApi() {
    return window.AntarcticGamesStorage || window.PalladiumSiteStorage || null;
  }

  function getBackendApi() {
    return window.AntarcticGamesBackend || window.PalladiumBackend || null;
  }

  function readStoredToken() {
    var storage = getStorageApi();
    if (storage && typeof storage.getItem === "function") {
      return cleanText(storage.getItem(STORAGE_KEY, { legacyKeys: [LEGACY_STORAGE_KEY] }));
    }

    try {
      return cleanText(window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY));
    } catch (error) {
      return "";
    }
  }

  function writeStoredToken(token) {
    var normalized = cleanText(token);
    var storage = getStorageApi();
    if (storage && typeof storage.setItem === "function") {
      storage.setItem(STORAGE_KEY, normalized, { legacyKeys: [LEGACY_STORAGE_KEY] });
      return normalized;
    }

    try {
      if (normalized) {
        window.localStorage.setItem(STORAGE_KEY, normalized);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      // Ignore storage failures.
    }

    return normalized;
  }

  function emitSessionChange(session) {
    listeners.slice().forEach(function (listener) {
      try {
        listener(session || null);
      } catch (error) {
        // Ignore listener failures.
      }
    });
  }

  function setSessionFromResponse(payload) {
    var token = cleanText(payload && payload.token);
    if (token) {
      writeStoredToken(token);
    }
    cachedSession = payload && payload.authenticated ? {
      authenticated: true,
      token: token || readStoredToken(),
      user: payload.user || null
    } : {
      authenticated: false,
      token: "",
      user: null
    };
    emitSessionChange(cachedSession);
    return cachedSession;
  }

  async function requestJson(pathValue, init) {
    var backendApi = getBackendApi();
    if (!backendApi || typeof backendApi.apiUrl !== "function") {
      throw new Error("Backend helper unavailable.");
    }

    var options = init || {};
    var headers = {};
    var inputHeaders = options.headers || {};
    Object.keys(inputHeaders).forEach(function (key) {
      headers[key] = inputHeaders[key];
    });

    var token = readStoredToken();
    if (token && !headers[SESSION_HEADER] && !headers["authorization"]) {
      headers[SESSION_HEADER] = token;
    }

    var response = await fetch(backendApi.apiUrl(pathValue), Object.assign({}, options, { headers: headers }));
    var text = await response.text();
    var payload = {};

    try {
      payload = text ? JSON.parse(text) : {};
    } catch (error) {
      payload = {};
    }

    if (response.status === 401) {
      setSessionFromResponse({ authenticated: false, user: null, token: "" });
    }

    if (!response.ok) {
      throw new Error(cleanText(payload && payload.error) || ("Request failed with status " + response.status));
    }

    return payload;
  }

  async function getSession(forceRefresh) {
    if (!forceRefresh && cachedSession !== undefined) {
      return cachedSession;
    }

    try {
      var payload = await requestJson("/api/account/session", { method: "GET" });
      return setSessionFromResponse(payload);
    } catch (error) {
      if (!readStoredToken()) {
        cachedSession = { authenticated: false, token: "", user: null };
        return cachedSession;
      }
      throw error;
    }
  }

  async function signUp(username, password) {
    var payload = await requestJson("/api/account/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: cleanText(username), password: cleanText(password) })
    });
    return setSessionFromResponse(payload);
  }

  async function login(username, password) {
    var payload = await requestJson("/api/account/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: cleanText(username), password: cleanText(password) })
    });
    return setSessionFromResponse(payload);
  }

  async function logout() {
    try {
      await requestJson("/api/account/logout", { method: "POST" });
    } finally {
      writeStoredToken("");
      cachedSession = { authenticated: false, token: "", user: null };
      emitSessionChange(cachedSession);
    }
    return cachedSession;
  }

  function requirePathSegment(value) {
    var normalized = cleanText(value);
    if (!normalized) {
      throw new Error("Missing path value.");
    }
    return normalized;
  }

  var api = {
    onSessionChange: function (listener) {
      if (typeof listener !== "function") {
        return function () {};
      }
      listeners.push(listener);
      return function () {
        listeners = listeners.filter(function (candidate) {
          return candidate !== listener;
        });
      };
    },
    getSession: getSession,
    signUp: signUp,
    login: login,
    logout: logout,
    searchUsers: function (query) {
      return requestJson("/api/account/search-users?q=" + encodeURIComponent(cleanText(query)), { method: "GET" });
    },
    listThreads: function () {
      return requestJson("/api/chat/threads", { method: "GET" });
    },
    createRoom: function (name) {
      return requestJson("/api/chat/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: cleanText(name) })
      });
    },
    createDirect: function (username) {
      return requestJson("/api/chat/dms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: cleanText(username) })
      });
    },
    joinRoom: function (threadId) {
      return requestJson("/api/chat/threads/" + encodeURIComponent(String(threadId)) + "/join", { method: "POST" });
    },
    listMessages: function (threadId) {
      return requestJson("/api/chat/threads/" + encodeURIComponent(String(threadId)) + "/messages", { method: "GET" });
    },
    sendMessage: function (threadId, content) {
      return requestJson("/api/chat/threads/" + encodeURIComponent(String(threadId)) + "/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: cleanText(content) })
      });
    },
    listSaves: function () {
      return requestJson("/api/saves", { method: "GET" });
    },
    getSave: function (gameKey) {
      return requestJson("/api/saves/" + encodeURIComponent(requirePathSegment(gameKey)), { method: "GET" });
    },
    putSave: function (gameKey, data, summary) {
      return requestJson("/api/saves/" + encodeURIComponent(requirePathSegment(gameKey)), {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: data, summary: cleanText(summary) })
      });
    },
    deleteSave: function (gameKey) {
      return requestJson("/api/saves/" + encodeURIComponent(requirePathSegment(gameKey)), { method: "DELETE" });
    }
  };

  window.AntarcticSocialClient = api;
  window.PalladiumSocialClient = api;
})();
