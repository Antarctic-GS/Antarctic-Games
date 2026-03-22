const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(FRONTEND_DIR, "site-storage.js"), "utf8");

function createStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    dump() {
      return new Map(map);
    }
  };
}

function createDocument() {
  const cookies = new Map();

  return {
    get cookie() {
      return Array.from(cookies.entries())
        .map(([key, value]) => encodeURIComponent(key) + "=" + value)
        .join("; ");
    },
    set cookie(value) {
      const parts = String(value || "").split(";");
      const first = parts.shift() || "";
      const separatorIndex = first.indexOf("=");
      const rawKey = separatorIndex === -1 ? first : first.slice(0, separatorIndex);
      const rawValue = separatorIndex === -1 ? "" : first.slice(separatorIndex + 1);
      const key = decodeURIComponent(rawKey);
      const attributes = parts.map((part) => part.trim());
      const maxAge = attributes.find((part) => /^Max-Age=/i.test(part));

      if (maxAge && Number(maxAge.split("=")[1]) <= 0) {
        cookies.delete(key);
        return;
      }

      cookies.set(key, rawValue);
    },
    dumpCookies() {
      return new Map(cookies);
    }
  };
}

function loadStorage() {
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const document = createDocument();
  const context = {
    console,
    document,
    window: {
      document,
      localStorage,
      sessionStorage,
      location: {
        protocol: "https:"
      }
    }
  };

  vm.runInNewContext(source, context, { filename: "site-storage.js" });

  return {
    api: context.window.AntarcticGamesStorage,
    document,
    localStorage,
    sessionStorage
  };
}

test("persistent storage mirrors values into localStorage and first-party cookies", () => {
  const { api, document, localStorage } = loadStorage();

  api.setItem("antarctic.site.theme", "miami");

  assert.equal(localStorage.getItem("antarctic.site.theme"), "miami");
  assert.match(document.cookie, /antarctic\.site\.theme=miami/);
  assert.equal(api.getItem("antarctic.site.theme"), "miami");
});

test("persistent storage migrates legacy session data into the new cookie-backed key", () => {
  const { api, document, localStorage, sessionStorage } = loadStorage();
  const legacyPayload = JSON.stringify({
    activeTabId: "tab-1",
    sidebarCollapsed: true,
    tabs: [{ id: "tab-1", uri: "antarctic://home" }]
  });

  sessionStorage.setItem("palladium.shell.state.v1", legacyPayload);

  const restored = api.getJson("antarctic.shell.state.v1", {
    legacyKeys: ["palladium.shell.state.v1"],
    sessionKeys: ["antarctic.shell.state.v1", "palladium.shell.state.v1"]
  });

  assert.equal(JSON.stringify(restored), legacyPayload);
  assert.equal(localStorage.getItem("antarctic.shell.state.v1"), legacyPayload);
  assert.match(document.cookie, /antarctic\.shell\.state\.v1=/);
  assert.equal(sessionStorage.getItem("palladium.shell.state.v1"), null);
});

test("persistent storage chunks oversized values across cookies and restores them", () => {
  const { api, document } = loadStorage();
  const largeValue = "antarctic-tabs-".repeat(800);

  api.setItem("antarctic.shell.state.v1", largeValue);

  assert.match(document.cookie, /antarctic\.shell\.state\.v1__chunks=/);
  assert.equal(api.getItem("antarctic.shell.state.v1"), largeValue);
});
