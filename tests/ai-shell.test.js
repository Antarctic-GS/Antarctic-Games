const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(FRONTEND_DIR, "shell.js"), "utf8");

function extractFunctionSource(name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  if (start === -1) {
    throw new Error(`Could not find function ${name}`);
  }

  let braceIndex = source.indexOf("{", start);
  let depth = 0;
  let end = braceIndex;
  for (; end < source.length; end += 1) {
    const char = source[end];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end += 1;
        break;
      }
    }
  }

  return source.slice(start, end);
}

function loadAiHelpers() {
  const context = {};
  const script = [
    "var AI_COUNT_WORDS = " + JSON.stringify({
      a: 1,
      an: 1,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12
    }) + ";",
    "var AI_CATALOG_STOPWORDS = " + JSON.stringify({
      a: true,
      all: true,
      an: true,
      and: true,
      any: true,
      best: true,
      do: true,
      five: true,
      for: true,
      four: true,
      from: true,
      game: true,
      games: true,
      give: true,
      have: true,
      i: true,
      in: true,
      list: true,
      me: true,
      of: true,
      recommendations: true,
      recommend: true,
      show: true,
      six: true,
      some: true,
      suggest: true,
      ten: true,
      the: true,
      three: true,
      two: true,
      what: true,
      which: true,
      with: true,
      you: true
    }) + ";",
    extractFunctionSource("flattenAssistantContent"),
    extractFunctionSource("extractAssistantText"),
    extractFunctionSource("normalizeCatalogAiText"),
    extractFunctionSource("tokenizeCatalogAiText"),
    extractFunctionSource("extractRequestedGameCount"),
    extractFunctionSource("findCatalogCategoryInQuery"),
    extractFunctionSource("scoreCatalogGameForAi"),
    extractFunctionSource("buildShellHelpAiResponse"),
    extractFunctionSource("buildCatalogAiResponseFromCatalog"),
    "this.flattenAssistantContent = flattenAssistantContent;",
    "this.extractAssistantText = extractAssistantText;",
    "this.buildShellHelpAiResponse = buildShellHelpAiResponse;",
    "this.buildCatalogAiResponseFromCatalog = buildCatalogAiResponseFromCatalog;"
  ].join("\n\n");

  vm.runInNewContext(script, context, { filename: "shell-ai-helpers.js" });
  return context;
}

test("extractAssistantText ignores metadata-only AI stream objects", () => {
  const { extractAssistantText } = loadAiHelpers();

  assert.equal(
    extractAssistantText({ ok: true, done: true, source: "chat", model: "qwen3.5:0.8b" }),
    ""
  );
});

test("extractAssistantText flattens structured message content without leaking objects", () => {
  const { extractAssistantText } = loadAiHelpers();

  assert.equal(
    extractAssistantText({
      message: {
        content: [
          { text: "Hello! " },
          { content: "How can I assist you today?" }
        ]
      }
    }),
    "Hello! How can I assist you today?"
  );
});

test("extractAssistantText still supports JSON string payloads", () => {
  const { extractAssistantText } = loadAiHelpers();

  assert.equal(
    extractAssistantText('{"message":{"content":"Hello from Antarctic"}}'),
    "Hello from Antarctic"
  );
});

test("buildCatalogAiResponseFromCatalog answers horror requests from the real catalog only", () => {
  const { buildCatalogAiResponseFromCatalog } = loadAiHelpers();
  const games = [
    { title: "Baldi's Basics", category: "Horror", author: "Mystman12", path: "games/baldi/baldis-basics.html" },
    { title: "Five Nights at Freddy's 1", category: "Horror", author: "Scott Cawthon", path: "games/fnaf/fnaf-1.html" },
    { title: "Five Nights at Freddy's 2", category: "Horror", author: "Scott Cawthon", path: "games/fnaf/fnaf-2.html" },
    { title: "Five Nights at Freddy's 3", category: "Horror", author: "Scott Cawthon", path: "games/fnaf/fnaf-3.html" },
    { title: "Five Nights at Freddy's 4", category: "Horror", author: "Scott Cawthon", path: "games/fnaf/fnaf-4.html" },
    { title: "OvO", category: "Platformer", author: "Dedra Games", path: "games/platformer/ovo.html" }
  ];

  const answer = buildCatalogAiResponseFromCatalog("give me 5 horror games", games);

  assert.match(answer, /\*\*5\*\* horror games/);
  assert.match(answer, /Baldi's Basics/);
  assert.match(answer, /Five Nights at Freddy's 4/);
  assert.doesNotMatch(answer, /The Walking Dead/);
  assert.match(answer, /I only used the local Antarctic catalog/);
});

test("buildCatalogAiResponseFromCatalog can answer category counts", () => {
  const { buildCatalogAiResponseFromCatalog } = loadAiHelpers();
  const games = [
    { title: "Baldi's Basics", category: "Horror", author: "Mystman12", path: "games/baldi/baldis-basics.html" },
    { title: "Five Nights at Freddy's 1", category: "Horror", author: "Scott Cawthon", path: "games/fnaf/fnaf-1.html" },
    { title: "OvO", category: "Platformer", author: "Dedra Games", path: "games/platformer/ovo.html" }
  ];

  const answer = buildCatalogAiResponseFromCatalog("how many horror games do you have", games);

  assert.equal(answer, "There are **2** horror games in the Antarctic catalog.");
});

test("buildShellHelpAiResponse explains supported address bar inputs", () => {
  const { buildShellHelpAiResponse } = loadAiHelpers();

  const answer = buildShellHelpAiResponse("What can I type in the Antarctic Games address bar?");

  assert.match(answer, /antarctic:\/\/home/);
  assert.match(answer, /antarctic:\/\/chats/);
  assert.match(answer, /antarctic:\/\/games/);
  assert.match(answer, /https:\/\/duckduckgo\.com/);
  assert.match(answer, /plain search terms/);
  assert.match(answer, /without exposing the remote web URL in the real browser URL bar/);
});
