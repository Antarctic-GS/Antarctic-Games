(function () {
  var DEFAULT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;
  var COOKIE_CHUNK_SIZE = 2800;
  var COOKIE_CHUNK_COUNT_SUFFIX = "__chunks";
  var COOKIE_CHUNK_PART_PREFIX = "__chunk_";

  function normalizeKey(key) {
    return String(key || "").trim();
  }

  function toArray(value) {
    if (Array.isArray(value)) return value.slice();
    if (value == null) return [];
    return [value];
  }

  function uniqueKeys(keys) {
    var seen = Object.create(null);
    return keys.filter(function (key) {
      var normalized = normalizeKey(key);
      if (!normalized || seen[normalized]) {
        return false;
      }
      seen[normalized] = true;
      return true;
    });
  }

  function normalizeOptions(primaryKey, options) {
    var settings = options || {};
    var primary = normalizeKey(primaryKey);
    return {
      primaryKey: primary,
      legacyKeys: uniqueKeys(toArray(settings.legacyKeys)),
      sessionKeys: uniqueKeys(toArray(settings.sessionKeys)),
      cookieMaxAge: Number(settings.cookieMaxAge) > 0 ? Math.floor(Number(settings.cookieMaxAge)) : DEFAULT_COOKIE_MAX_AGE_SECONDS
    };
  }

  function getLocalStorage() {
    try {
      return window.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function getSessionStorage() {
    try {
      return window.sessionStorage || null;
    } catch (error) {
      return null;
    }
  }

  function readStorage(storage, key) {
    if (!storage) return "";
    try {
      var value = storage.getItem(key);
      return value == null ? "" : String(value);
    } catch (error) {
      return "";
    }
  }

  function writeStorage(storage, key, value) {
    if (!storage) return;
    try {
      storage.setItem(key, String(value));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function removeStorage(storage, key) {
    if (!storage) return;
    try {
      storage.removeItem(key);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function parseCookieMap() {
    var cookieString = "";
    try {
      cookieString = String(document.cookie || "");
    } catch (error) {
      cookieString = "";
    }

    var result = Object.create(null);
    if (!cookieString) return result;

    cookieString.split(/;\s*/).forEach(function (pair) {
      if (!pair) return;
      var separatorIndex = pair.indexOf("=");
      var rawKey = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
      var rawValue = separatorIndex === -1 ? "" : pair.slice(separatorIndex + 1);
      var key = "";

      try {
        key = decodeURIComponent(rawKey);
      } catch (error) {
        key = rawKey;
      }

      result[key] = rawValue;
    });

    return result;
  }

  function secureCookieFlag() {
    try {
      return window.location && window.location.protocol === "https:" ? "; Secure" : "";
    } catch (error) {
      return "";
    }
  }

  function writeCookieAssignment(key, rawValue, maxAgeSeconds) {
    try {
      document.cookie =
        encodeURIComponent(key) +
        "=" +
        String(rawValue || "") +
        "; Path=/; Max-Age=" +
        String(Math.max(0, Math.floor(Number(maxAgeSeconds) || 0))) +
        "; SameSite=Lax" +
        secureCookieFlag();
    } catch (error) {
      // Ignore cookie failures.
    }
  }

  function readCookieValue(key) {
    var normalizedKey = normalizeKey(key);
    if (!normalizedKey) return "";

    var cookies = parseCookieMap();
    var chunkCountRaw = cookies[normalizedKey + COOKIE_CHUNK_COUNT_SUFFIX];
    var chunkCount = 0;

    if (chunkCountRaw) {
      try {
        chunkCount = parseInt(decodeURIComponent(chunkCountRaw), 10) || 0;
      } catch (error) {
        chunkCount = 0;
      }
    }

    if (chunkCount > 0) {
      var encodedValue = "";
      for (var index = 0; index < chunkCount; index += 1) {
        var chunk = cookies[normalizedKey + COOKIE_CHUNK_PART_PREFIX + index];
        if (typeof chunk !== "string") {
          return "";
        }
        encodedValue += chunk;
      }

      try {
        return decodeURIComponent(encodedValue);
      } catch (error) {
        return "";
      }
    }

    var singleValue = cookies[normalizedKey];
    if (typeof singleValue !== "string") {
      return "";
    }

    try {
      return decodeURIComponent(singleValue);
    } catch (error) {
      return "";
    }
  }

  function clearCookieValue(key) {
    var normalizedKey = normalizeKey(key);
    if (!normalizedKey) return;

    var cookies = parseCookieMap();
    var chunkCountRaw = cookies[normalizedKey + COOKIE_CHUNK_COUNT_SUFFIX];
    var chunkCount = 0;

    if (chunkCountRaw) {
      try {
        chunkCount = parseInt(decodeURIComponent(chunkCountRaw), 10) || 0;
      } catch (error) {
        chunkCount = 0;
      }
    }

    writeCookieAssignment(normalizedKey, "", 0);
    writeCookieAssignment(normalizedKey + COOKIE_CHUNK_COUNT_SUFFIX, "", 0);

    for (var index = 0; index < chunkCount; index += 1) {
      writeCookieAssignment(normalizedKey + COOKIE_CHUNK_PART_PREFIX + index, "", 0);
    }
  }

  function writeCookieValue(key, value, maxAgeSeconds) {
    var normalizedKey = normalizeKey(key);
    var stringValue = String(value == null ? "" : value);
    if (!normalizedKey) return;

    clearCookieValue(normalizedKey);

    if (!stringValue) {
      return;
    }

    var encodedValue = encodeURIComponent(stringValue);
    if (encodedValue.length <= COOKIE_CHUNK_SIZE) {
      writeCookieAssignment(normalizedKey, encodedValue, maxAgeSeconds);
      return;
    }

    var parts = [];
    for (var index = 0; index < encodedValue.length; index += COOKIE_CHUNK_SIZE) {
      parts.push(encodedValue.slice(index, index + COOKIE_CHUNK_SIZE));
    }

    writeCookieAssignment(normalizedKey + COOKIE_CHUNK_COUNT_SUFFIX, String(parts.length), maxAgeSeconds);

    parts.forEach(function (part, partIndex) {
      writeCookieAssignment(normalizedKey + COOKIE_CHUNK_PART_PREFIX + partIndex, part, maxAgeSeconds);
    });
  }

  function cleanLegacyKeys(primaryKey, legacyKeys, sessionKeys) {
    var localStorage = getLocalStorage();
    var sessionStorage = getSessionStorage();

    legacyKeys.forEach(function (legacyKey) {
      var key = normalizeKey(legacyKey);
      if (!key || key === primaryKey) return;
      removeStorage(localStorage, key);
      clearCookieValue(key);
    });

    sessionKeys.forEach(function (sessionKey) {
      var key = normalizeKey(sessionKey);
      if (!key) return;
      removeStorage(sessionStorage, key);
    });
  }

  function mirrorToPrimary(primaryKey, value, options) {
    if (!normalizeKey(primaryKey)) {
      return "";
    }

    var stringValue = String(value == null ? "" : value);
    var localStorage = getLocalStorage();
    if (stringValue) {
      writeStorage(localStorage, primaryKey, stringValue);
      writeCookieValue(primaryKey, stringValue, options.cookieMaxAge);
    } else {
      removeStorage(localStorage, primaryKey);
      clearCookieValue(primaryKey);
    }

    cleanLegacyKeys(primaryKey, options.legacyKeys, options.sessionKeys);
    return stringValue;
  }

  function getPersistentItem(primaryKey, options) {
    var settings = normalizeOptions(primaryKey, options);
    if (!settings.primaryKey) return "";

    var localStorage = getLocalStorage();
    var sessionStorage = getSessionStorage();
    var orderedKeys = [settings.primaryKey].concat(settings.legacyKeys);

    for (var index = 0; index < orderedKeys.length; index += 1) {
      var key = orderedKeys[index];
      var localValue = readStorage(localStorage, key);
      if (localValue) {
        return mirrorToPrimary(settings.primaryKey, localValue, settings);
      }

      var cookieValue = readCookieValue(key);
      if (cookieValue) {
        return mirrorToPrimary(settings.primaryKey, cookieValue, settings);
      }
    }

    for (var sessionIndex = 0; sessionIndex < settings.sessionKeys.length; sessionIndex += 1) {
      var sessionValue = readStorage(sessionStorage, settings.sessionKeys[sessionIndex]);
      if (sessionValue) {
        return mirrorToPrimary(settings.primaryKey, sessionValue, settings);
      }
    }

    return "";
  }

  function setPersistentItem(primaryKey, value, options) {
    return mirrorToPrimary(normalizeKey(primaryKey), value, normalizeOptions(primaryKey, options));
  }

  function removePersistentItem(primaryKey, options) {
    mirrorToPrimary(primaryKey, "", options);
  }

  function getPersistentJson(primaryKey, options) {
    var raw = getPersistentItem(primaryKey, options);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function setPersistentJson(primaryKey, value, options) {
    try {
      return setPersistentItem(primaryKey, JSON.stringify(value), options);
    } catch (error) {
      removePersistentItem(primaryKey, options);
      return "";
    }
  }

  var api = {
    getItem: getPersistentItem,
    setItem: setPersistentItem,
    removeItem: removePersistentItem,
    getJson: getPersistentJson,
    setJson: setPersistentJson
  };

  window.AntarcticGamesStorage = api;
  window.PalladiumSiteStorage = api;
})();
