const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const helperSource = fs.readFileSync(path.join(FRONTEND_DIR, "games-static.js"), "utf8");

function createHelperContext(overrides) {
  const calls = [];
  const window = (overrides && overrides.window) || {};
  const context = {
    URLSearchParams,
    console,
    fetch: async (url, init) => {
      calls.push({ url, init });
      if (overrides && overrides.fetch) {
        return overrides.fetch(url, init);
      }
      return {
        ok: true,
        async json() {
          return { games: [] };
        }
      };
    },
    window
  };

  vm.runInNewContext(helperSource, context, { filename: "games-static.js" });
  return { api: context.window.PalladiumGames, calls };
}

test("normalizeAssetPath keeps local game assets on the frontend origin", () => {
  const { api } = createHelperContext();

  assert.equal(api.normalizeAssetPath("/games/fnaf/fnaf-1.html"), "games/fnaf/fnaf-1.html");
  assert.equal(api.normalizeAssetPath("images/game-img/fnaf-icon.png"), "images/game-img/fnaf-icon.png");
  assert.equal(api.normalizeAssetPath("https://cdn.example.com/game.html"), "https://cdn.example.com/game.html");
});

test("buildLaunchUri points game launches into the Palladium tab protocol", () => {
  const { api } = createHelperContext();

  assert.equal(
    api.buildLaunchUri("games/platformer/ovo.html", "OvO", "Dedra Games"),
    "palladium://gamelauncher?path=games%2Fplatformer%2Fovo.html&title=OvO&author=Dedra%20Games"
  );
});

test("loadCatalog prefers the committed local manifest", async () => {
  const sampleGames = [{ title: "Brotato", path: "games/bullet-hell/brotato.html" }];
  const { api, calls } = createHelperContext({
    fetch: async () => ({
      ok: true,
      async json() {
        return { games: sampleGames };
      }
    }),
    window: {
      PalladiumBackend: {
        async fetchJson() {
          throw new Error("backend fallback should not run");
        }
      }
    }
  });

  const games = await api.loadCatalog();
  assert.deepEqual(games, sampleGames);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "data/games-catalog.json");
});

test("loadCatalog stays local-only when the manifest is unavailable", async () => {
  const sampleGames = [{ title: "Retro Bowl", path: "games/sports/retro-bowl.html" }];
  let backendCalls = 0;
  const { api } = createHelperContext({
    fetch: async () => ({
      ok: false,
      status: 503,
      async json() {
        return {};
      }
    }),
    window: {
      PalladiumBackend: {
        async fetchJson() {
          backendCalls += 1;
          return { games: sampleGames };
        }
      }
    }
  });

  await assert.rejects(
    () => api.loadCatalog(),
    /Local games catalog request failed with status 503/
  );
  assert.deepEqual(sampleGames, [{ title: "Retro Bowl", path: "games/sports/retro-bowl.html" }]);
  assert.equal(backendCalls, 0);
});
