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
  return context.window.AntarcticGamesShellCore;
}

test("internal Antarctic routes normalize into view descriptors", () => {
  const core = loadCore();
  const home = core.describeInput("antarctic://home");
  const games = core.describeInput("antarctic://games");
  const account = core.describeInput("antarctic://account");
  const dms = core.describeInput("antarctic://dms");
  const groupChats = core.describeInput("antarctic://groupchats");
  const legacyChat = core.describeInput("antarctic://chat");
  const settings = core.describeInput("antarctic://settings");
  const launcher = core.describeInput("antarctic://gamelauncher");

  assert.equal(home.view, "home");
  assert.equal(home.route, "home");
  assert.equal(home.title, "Home");
  assert.equal(home.uri, "antarctic://home");

  assert.equal(games.view, "games");
  assert.equal(games.route, "games");
  assert.equal(games.title, "Games");
  assert.equal(games.uri, "antarctic://games");

  assert.equal(account.view, "account");
  assert.equal(account.route, "account");
  assert.equal(account.title, "Account");
  assert.equal(account.uri, "antarctic://account");

  assert.equal(dms.view, "dms");
  assert.equal(dms.route, "dms");
  assert.equal(dms.title, "DMs");
  assert.equal(dms.uri, "antarctic://dms");

  assert.equal(groupChats.view, "groupchats");
  assert.equal(groupChats.route, "groupchats");
  assert.equal(groupChats.title, "Group Chats");
  assert.equal(groupChats.uri, "antarctic://groupchats");

  assert.equal(legacyChat.view, "groupchats");
  assert.equal(legacyChat.route, "groupchats");
  assert.equal(legacyChat.title, "Group Chats");
  assert.equal(legacyChat.uri, "antarctic://groupchats");

  assert.equal(settings.view, "settings");
  assert.equal(settings.route, "settings");
  assert.equal(settings.title, "Settings");
  assert.equal(settings.uri, "antarctic://settings");

  assert.equal(launcher.view, "gamelauncher");
  assert.equal(launcher.route, "gamelauncher");
  assert.equal(launcher.title, "Game Launcher");
  assert.equal(launcher.uri, "antarctic://gamelauncher");
});

test("game launcher routes carry the game path inside the Antarctic protocol", () => {
  const core = loadCore();
  const descriptor = core.describeInput(
    "antarctic://gamelauncher?path=games%2Fplatformer%2Fachievement-unlocked.html&title=Achievement%20Unlocked"
  );

  assert.equal(descriptor.view, "gamelauncher");
  assert.equal(descriptor.route, "gamelauncher");
  assert.equal(descriptor.path, "games/platformer/achievement-unlocked.html");
  assert.equal(descriptor.title, "Achievement Unlocked");
});

test("legacy game routes still normalize into the new Antarctic launcher route", () => {
  const core = loadCore();
  const descriptor = core.describeInput(
    "palladium://game?path=games%2Fplatformer%2Fovo.html&title=OvO"
  );

  assert.equal(descriptor.view, "gamelauncher");
  assert.equal(descriptor.route, "gamelauncher");
  assert.equal(descriptor.uri, "antarctic://gamelauncher?path=games%2Fplatformer%2Fovo.html&title=OvO");
});

test("empty input and palladium://newtab both resolve to home", () => {
  const core = loadCore();
  const empty = core.describeInput("");
  const legacyNewTab = core.describeInput("palladium://newtab");

  assert.equal(empty.view, "home");
  assert.equal(empty.route, "home");
  assert.equal(empty.uri, "antarctic://home");

  assert.equal(legacyNewTab.view, "home");
  assert.equal(legacyNewTab.route, "home");
  assert.equal(legacyNewTab.uri, "antarctic://home");
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
