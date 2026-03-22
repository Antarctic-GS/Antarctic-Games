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
    extractFunctionSource("flattenAssistantContent"),
    extractFunctionSource("extractAssistantText"),
    "this.flattenAssistantContent = flattenAssistantContent;",
    "this.extractAssistantText = extractAssistantText;"
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
