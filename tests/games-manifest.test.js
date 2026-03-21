const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const manifestPath = path.join(FRONTEND_DIR, "data", "games-catalog.json");
const manifestScriptPath = path.join(FRONTEND_DIR, "data", "games-catalog.js");

function readManifest() {
  const raw = fs.readFileSync(manifestPath, "utf8");
  return JSON.parse(raw);
}

test("frontend ships a committed local games manifest and bundled assets", () => {
  assert.ok(fs.existsSync(path.join(FRONTEND_DIR, "games")));
  assert.ok(fs.existsSync(path.join(FRONTEND_DIR, "swf")));
  assert.ok(fs.existsSync(path.join(FRONTEND_DIR, "images", "game-img")));
  assert.ok(fs.existsSync(manifestPath));
  assert.ok(fs.existsSync(manifestScriptPath));

  const payload = readManifest();
  assert.equal(payload.ok, true);
  assert.ok(Array.isArray(payload.games));
  assert.ok(payload.games.length >= 30);

  for (const entry of payload.games) {
    assert.match(entry.path, /^games\//);
    assert.match(entry.launchUri, /^antarctic:\/\/gamelauncher\?/);
    assert.ok(fs.existsSync(path.join(FRONTEND_DIR, entry.path)), "Missing local game asset: " + entry.path);

    if (entry.image && !/^(?:[a-z]+:)?\/\//i.test(entry.image)) {
      assert.ok(fs.existsSync(path.join(FRONTEND_DIR, entry.image)), "Missing local game image: " + entry.image);
    }
  }
});

test("frontend shell loads the shared local-games and shell helpers", () => {
  const shellPage = fs.readFileSync(path.join(FRONTEND_DIR, "index.html"), "utf8");

  assert.match(shellPage, /games-static\.js/);
  assert.match(shellPage, /shell-core\.js/);
  assert.match(shellPage, /shell\.js/);
  assert.match(shellPage, /Search games, authors, or categories/);
});

test("frontend root keeps a single app shell entrypoint", () => {
  const topLevelHtmlFiles = fs
    .readdirSync(FRONTEND_DIR)
    .filter((entry) => entry.endsWith(".html"))
    .sort();

  assert.deepEqual(topLevelHtmlFiles, ["index.html"]);
});
