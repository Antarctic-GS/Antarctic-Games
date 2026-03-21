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
  assert.ok(!payload.games.some((entry) => /stick-war/i.test(entry.path)), "Stick War games should not remain in the local manifest.");

  const adventureCapitalist = payload.games.find((entry) => entry.path === "games/clickers/adventure-capitalist.html");
  assert.ok(adventureCapitalist, "Expected AdVenture Capitalist! in the local manifest");
  assert.equal(adventureCapitalist.title, "AdVenture Capitalist!");
  assert.equal(adventureCapitalist.author, "Hyper Hippo Games");
  assert.equal(adventureCapitalist.image, "images/game-img/adventure-capitalist.png");

  const baldisBasics = payload.games.find((entry) => entry.path === "games/baldi/baldis-basics.html");
  assert.ok(baldisBasics, "Expected Baldi's Basics in the local manifest");
  assert.equal(baldisBasics.title, "Baldi's Basics");
  assert.equal(baldisBasics.author, "Basically Games");
  assert.equal(baldisBasics.image, "images/game-img/baldis-basics.png");

  const cookieClicker = payload.games.find((entry) => entry.title === "Cookie Clicker");
  assert.ok(cookieClicker, "Expected Cookie Clicker in the local manifest");
  assert.equal(cookieClicker.path, "games/clickers/cookie-clicker.zip/index.html");

  const hollowKnight = payload.games.find((entry) => entry.path === "games/platformer/hollow-knight.html");
  assert.ok(hollowKnight, "Expected Hollow Knight in the local manifest");
  assert.equal(hollowKnight.title, "Hollow Knight");
  assert.equal(hollowKnight.author, "Team Cherry");
  assert.equal(hollowKnight.image, "images/game-img/hollow-knight.jpeg");

  for (const entry of payload.games) {
    assert.match(entry.path, /^games\//);
    assert.match(entry.launchUri, /^antarctic:\/\/gamelauncher\?/);
    assert.ok(
      !/^Index of\b/i.test(entry.title || ""),
      "Catalog should not list Apache/nginx directory listings as games: " + entry.path
    );
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

test("frontend Cookie Clicker launcher stays on the bundled local mirror", () => {
  const launcher = fs.readFileSync(path.join(FRONTEND_DIR, "games", "clickers", "cookie-clicker.html"), "utf8");
  const bundledIndex = path.join(FRONTEND_DIR, "games", "clickers", "cookie-clicker.zip", "index.html");
  const bundledSource = fs.readFileSync(bundledIndex, "utf8");

  assert.ok(fs.existsSync(bundledIndex));
  assert.match(launcher, /\.\/cookie-clicker\.zip\/index\.html/);
  assert.doesNotMatch(launcher, /http-equiv="refresh"/i);
  assert.doesNotMatch(launcher, /rawcdn\.githack\.com\/bubbls\/UGS-Assets/);
  assert.doesNotMatch(launcher, /cdn\.jsdelivr\.net\/gh\/bubbls\/UGS-Assets/);
  assert.doesNotMatch(bundledSource, /<script src="\/js\/main\.js"><\/script>/);
});

test("Unity launchers stay free of the injected sidebar ad script", () => {
  const baldisBasics = fs.readFileSync(
    path.join(FRONTEND_DIR, "games", "baldi", "baldis-basics.html"),
    "utf8"
  );
  const adventureCapitalist = fs.readFileSync(
    path.join(FRONTEND_DIR, "games", "clickers", "adventure-capitalist.html"),
    "utf8"
  );
  const hollowKnight = fs.readFileSync(
    path.join(FRONTEND_DIR, "games", "platformer", "hollow-knight.html"),
    "utf8"
  );

  for (const source of [baldisBasics, adventureCapitalist, hollowKnight]) {
    assert.doesNotMatch(source, /googletagmanager\.com/);
    assert.doesNotMatch(source, /sidebarad1/);
    assert.doesNotMatch(source, /dupedisgay|duplace\.net|breadisgay/i);
  }
});
