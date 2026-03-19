const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(FRONTEND_DIR, "shell-core.js"), "utf8");

function loadCore() {
  const context = {
    URL,
    encodeURIComponent,
    console,
    window: {}
  };

  vm.runInNewContext(source, context, { filename: "shell-core.js" });
  return context.window.PalladiumShellCore;
}

test("internal Palladium routes normalize into view descriptors", () => {
  const core = loadCore();
  const home = core.describeInput("palladium://home");
  const games = core.describeInput("palladium://games");
  const settings = core.describeInput("palladium://settings");
  const launcher = core.describeInput("palladium://gamelauncher");

  assert.equal(home.view, "home");
  assert.equal(home.route, "home");
  assert.equal(home.title, "Home");
  assert.equal(home.uri, "palladium://home");

  assert.equal(games.view, "games");
  assert.equal(games.route, "games");
  assert.equal(games.title, "Games");
  assert.equal(games.uri, "palladium://games");

  assert.equal(settings.view, "settings");
  assert.equal(settings.route, "settings");
  assert.equal(settings.title, "Settings");
  assert.equal(settings.uri, "palladium://settings");

  assert.equal(launcher.view, "gamelauncher");
  assert.equal(launcher.route, "gamelauncher");
  assert.equal(launcher.title, "Game Launcher");
  assert.equal(launcher.uri, "palladium://gamelauncher");
});

test("game launcher routes carry the game path inside the Palladium protocol", () => {
  const core = loadCore();
  const descriptor = core.describeInput(
    "palladium://gamelauncher?path=games%2Fplatformer%2Fachievement-unlocked.html&title=Achievement%20Unlocked"
  );

  assert.equal(descriptor.view, "gamelauncher");
  assert.equal(descriptor.route, "gamelauncher");
  assert.equal(descriptor.path, "games/platformer/achievement-unlocked.html");
  assert.equal(descriptor.title, "Achievement Unlocked");
});

test("legacy game routes still normalize into the new game launcher route", () => {
  const core = loadCore();
  const descriptor = core.describeInput(
    "palladium://game?path=games%2Fplatformer%2Fovo.html&title=OvO"
  );

  assert.equal(descriptor.view, "gamelauncher");
  assert.equal(descriptor.route, "gamelauncher");
  assert.equal(descriptor.uri, "palladium://gamelauncher?path=games%2Fplatformer%2Fovo.html&title=OvO");
});

test("plain browser input falls back to web navigation or search", () => {
  const core = loadCore();

  const urlDescriptor = core.describeInput("example.com/docs");
  assert.equal(urlDescriptor.view, "web");
  assert.equal(urlDescriptor.targetUrl, "https://example.com/docs");

  const searchDescriptor = core.describeInput("best horror games");
  assert.equal(searchDescriptor.view, "web");
  assert.match(searchDescriptor.targetUrl, /^https:\/\/duckduckgo\.com\/\?q=/);
});
