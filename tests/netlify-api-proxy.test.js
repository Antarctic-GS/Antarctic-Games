const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const API_PROXY_PATH = path.join(__dirname, "..", "netlify", "functions", "api-proxy.mjs");

let cachedModulePromise = null;

function loadProxyModule() {
  if (!cachedModulePromise) {
    cachedModulePromise = import(pathToFileURL(API_PROXY_PATH).href);
  }
  return cachedModulePromise;
}

test("netlify API proxy function claims the same-origin /api route", async () => {
  const proxyModule = await loadProxyModule();

  assert.equal(proxyModule.config && proxyModule.config.path, "/api/*");
});

test("netlify API proxy preserves the backend path and query string", async () => {
  const proxyModule = await loadProxyModule();

  assert.equal(
    proxyModule.buildBackendUrl("https://antarctic-games.netlify.app/api/config/public?cache=0"),
    "https://api.antarctic.games/api/config/public?cache=0"
  );
});

test("netlify API proxy forwards request headers without hop-by-hop metadata", async () => {
  const proxyModule = await loadProxyModule();
  const forwarded = proxyModule.copyProxyHeaders(new Headers({
    accept: "application/json",
    connection: "keep-alive",
    host: "antarctic-games.netlify.app",
    "x-nf-request-id": "123"
  }));

  assert.equal(forwarded.get("accept"), "application/json");
  assert.equal(forwarded.has("connection"), false);
  assert.equal(forwarded.has("host"), false);
  assert.equal(forwarded.has("x-nf-request-id"), false);
});

test("netlify API proxy relays upstream responses for GET requests", async () => {
  const proxyModule = await loadProxyModule();
  const originalFetch = global.fetch;
  let capturedUrl = "";
  let capturedInit = null;

  global.fetch = async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        connection: "keep-alive"
      }
    });
  };

  try {
    const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/config/public?cache=0", {
      headers: {
        accept: "application/json",
        host: "antarctic-games.netlify.app"
      }
    }));

    assert.equal(capturedUrl, "https://api.antarctic.games/api/config/public?cache=0");
    assert.equal(capturedInit.method, "GET");
    assert.equal(capturedInit.headers.get("accept"), "application/json");
    assert.equal(capturedInit.headers.has("host"), false);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json");
    assert.equal(response.headers.has("connection"), false);
    assert.deepEqual(await response.json(), { ok: true });
  } finally {
    global.fetch = originalFetch;
  }
});

test("netlify API proxy streams POST bodies to the backend proxy endpoint", async () => {
  const proxyModule = await loadProxyModule();
  const originalFetch = global.fetch;
  let capturedUrl = "";
  let capturedInit = null;
  let capturedBody = null;

  global.fetch = async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    capturedBody = new Uint8Array(await new Response(init.body).arrayBuffer());
    return new Response(new Uint8Array([9, 8, 7]), {
      status: 200,
      headers: {
        "content-type": "application/octet-stream"
      }
    });
  };

  try {
    const requestBody = new Uint8Array([1, 2, 3, 4]);
    const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/proxy/request", {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream"
      },
      body: requestBody
    }));

    assert.equal(capturedUrl, "https://api.antarctic.games/api/proxy/request");
    assert.equal(capturedInit.method, "POST");
    assert.equal(capturedInit.duplex, "half");
    assert.deepEqual(Array.from(capturedBody), [1, 2, 3, 4]);
    assert.deepEqual(Array.from(new Uint8Array(await response.arrayBuffer())), [9, 8, 7]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("netlify API proxy returns a 502 when the backend cannot be reached", async () => {
  const proxyModule = await loadProxyModule();
  const originalFetch = global.fetch;

  global.fetch = async () => {
    throw new Error("connect ECONNREFUSED");
  };

  try {
    const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/config/public"));

    assert.equal(response.status, 502);
    assert.match(await response.text(), /Antarctic API proxy failed: connect ECONNREFUSED/);
  } finally {
    global.fetch = originalFetch;
  }
});
