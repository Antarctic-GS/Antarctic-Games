const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const manifestPath = path.join(FRONTEND_DIR, "data", "games-catalog.json");

function readManifest() {
  const raw = fs.readFileSync(manifestPath, "utf8");
  return JSON.parse(raw);
}

test("frontend ships a committed local games manifest and bundled assets", () => {
  assert.ok(fs.existsSync(path.join(FRONTEND_DIR, "games")));
  assert.ok(fs.existsSync(path.join(FRONTEND_DIR, "swf")));
  assert.ok(fs.existsSync(path.join(FRONTEND_DIR, "images", "game-img")));
  assert.ok(fs.existsSync(manifestPath));

  const payload = readManifest();
  assert.equal(payload.ok, true);
  assert.ok(Array.isArray(payload.games));
  assert.ok(payload.games.length >= 30);

  for (const entry of payload.games) {
    assert.match(entry.path, /^games\//);
    assert.match(entry.playerPath, /^game-player\.html\?/);
    assert.ok(fs.existsSync(path.join(FRONTEND_DIR, entry.path)), "Missing local game asset: " + entry.path);

    if (entry.image && !/^(?:[a-z]+:)?\/\//i.test(entry.image)) {
      assert.ok(fs.existsSync(path.join(FRONTEND_DIR, entry.image)), "Missing local game image: " + entry.image);
    }
  }
});

test("games pages load the shared local-games helper", () => {
  const gamesPage = fs.readFileSync(path.join(FRONTEND_DIR, "games.html"), "utf8");
  const playerPage = fs.readFileSync(path.join(FRONTEND_DIR, "game-player.html"), "utf8");
  const aiPage = fs.readFileSync(path.join(FRONTEND_DIR, "ai.html"), "utf8");

  assert.match(gamesPage, /games-static\.js/);
  assert.match(playerPage, /games-static\.js/);
  assert.match(aiPage, /games-static\.js/);
});

test("game player uses a fixed stage and non-scrolling iframe viewport", () => {
  const playerPage = fs.readFileSync(path.join(FRONTEND_DIR, "game-player.html"), "utf8");
  const styles = fs.readFileSync(path.join(FRONTEND_DIR, "styles.css"), "utf8");

  assert.match(playerPage, /player-frame-stage/);
  assert.match(playerPage, /scrolling="no"/);
  assert.match(styles, /\.player-frame-stage/);
  assert.match(styles, /transform-origin:\s*top left/);
});
