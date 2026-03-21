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
    document: (overrides && overrides.document) || null,
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
  return { api: context.window.AntarcticGames, calls };
}

test("normalizeAssetPath keeps local game assets on the frontend origin", () => {
  const { api } = createHelperContext();

  assert.equal(api.normalizeAssetPath("/games/fnaf/fnaf-1.html"), "games/fnaf/fnaf-1.html");
  assert.equal(api.normalizeAssetPath("images/game-img/fnaf-icon.png"), "images/game-img/fnaf-icon.png");
  assert.equal(api.normalizeAssetPath("https://cdn.example.com/game.html"), "https://cdn.example.com/game.html");
});

test("buildLaunchUri points game launches into the Antarctic tab protocol", () => {
  const { api } = createHelperContext();

  assert.equal(
    api.buildLaunchUri("games/platformer/ovo.html", "OvO", "Dedra Games"),
    "antarctic://gamelauncher?path=games%2Fplatformer%2Fovo.html&title=OvO&author=Dedra%20Games"
  );
});

test("filterCatalog narrows the library without mutating the source list", () => {
  const { api } = createHelperContext();
  const sampleGames = [
    { title: "OvO", author: "Dedra Games", category: "Platformer", path: "games/platformer/ovo.html" },
    { title: "Brotato", author: "Blobfish", category: "Shooter", path: "games/bullet-hell/brotato.html" }
  ];

  const results = api.filterCatalog(sampleGames, "blobfish");

  assert.deepEqual(results, [sampleGames[1]]);
  assert.deepEqual(sampleGames.map((game) => game.title), ["OvO", "Brotato"]);
});

test("pickFeaturedGame stays stable and prefers entries with artwork", () => {
  const { api } = createHelperContext();
  const sampleGames = [
    { title: "No Image Yet", path: "games/misc/no-image.html" },
    { title: "Featured Pick", image: "images/game-img/featured-pick.png", path: "games/misc/featured-pick.html" }
  ];

  assert.equal(api.pickFeaturedGame(sampleGames), sampleGames[1]);
  assert.equal(api.pickFeaturedGame([]), null);
});

test("loadCatalog prefers the committed local manifest", async () => {
  const sampleGames = [{ title: "Brotato", path: "games/bullet-hell/brotato.html" }];
  const { api, calls } = createHelperContext({
    window: {
      ANTARCTIC_GAMES_CATALOG: { games: sampleGames }
    }
  });

  const games = await api.loadCatalog();
  assert.deepEqual(games, sampleGames);
  assert.equal(calls.length, 0);
});

test("loadCatalog stays local-only when the embedded manifest is unavailable", async () => {
  const { api } = createHelperContext({
    window: {}
  });

  await assert.rejects(
    () => api.loadCatalog(),
    /Embedded games catalog is unavailable/
  );
});
