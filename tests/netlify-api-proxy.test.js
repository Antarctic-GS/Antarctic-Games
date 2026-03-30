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

test("netlify API proxy builds same-origin browsing config without backend fetches", async () => {
  const proxyModule = await loadProxyModule();
  const payload = proxyModule.buildPublicConfig("https://antarctic-games.netlify.app");

  assert.equal(payload.ok, true);
  assert.equal(payload.backendBase, "https://antarctic-games.netlify.app");
  assert.equal(payload.services.proxyMode, "http-fallback");
  assert.equal(payload.services.proxyTransport, "http-fallback");
  assert.equal(payload.services.wispUrl, "");
  assert.equal(payload.services.proxyFetch, "/api/proxy/fetch");
  assert.equal(payload.services.proxyRequest, "/api/proxy/request");
  assert.equal(payload.services.aiChat, "/api/ai/chat");
  assert.equal(payload.discord.inviteUrl, "https://discord.gg/FNACSCcE26");
});

test("netlify API proxy preserves the backend path and query string for non-browsing fallbacks", async () => {
  const proxyModule = await loadProxyModule();

  assert.equal(
    proxyModule.buildBackendUrl("https://antarctic-games.netlify.app/api/account/session?cache=0"),
    "https://api.antarctic.games/api/account/session?cache=0"
  );
});

test("netlify API proxy normalizes browser target URLs safely", async () => {
  const proxyModule = await loadProxyModule();

  assert.equal(proxyModule.normalizeUserUrl("duckduckgo.com"), "https://duckduckgo.com/");
  assert.equal(proxyModule.normalizeUserUrl("javascript:alert(1)"), "");
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

test("netlify API proxy strips frontend-only proxy request headers and forces identity encoding", async () => {
  const proxyModule = await loadProxyModule();
  const headers = proxyModule.parseProxyRequestHeaders(JSON.stringify({
    accept: "text/html",
    cookie: "nope",
    origin: "https://antarctic-games.netlify.app",
    "x-antarctic-proxy-method": "GET"
  }));

  assert.equal(headers.get("accept"), "text/html");
  assert.equal(headers.get("accept-encoding"), "identity");
  assert.equal(headers.has("cookie"), false);
  assert.equal(headers.has("origin"), false);
  assert.equal(headers.has("x-antarctic-proxy-method"), false);
});

test("netlify API proxy answers config/public locally", async () => {
  const proxyModule = await loadProxyModule();
  const originalFetch = global.fetch;
  let calledFetch = false;

  global.fetch = async () => {
    calledFetch = true;
    throw new Error("config route should not hit upstream fetch");
  };

  try {
    const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/config/public"));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.services.proxyFetch, "/api/proxy/fetch");
    assert.equal(calledFetch, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("netlify API proxy answers anonymous account session locally", async () => {
  const proxyModule = await loadProxyModule();
  const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/account/session", {
    headers: {
      origin: "https://www.antarctic.games",
      "x-antarctic-session": "stale-token"
    }
  }));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.authenticated, false);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("access-control-allow-headers") || "", /x-antarctic-session/);
});

test("netlify API proxy answers anonymous community bootstrap locally", async () => {
  const proxyModule = await loadProxyModule();
  const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/community/bootstrap"));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.authenticated, false);
  assert.deepEqual(payload.bootstrap.threads, []);
});

test("netlify API proxy reports browsing readiness locally", async () => {
  const proxyModule = await loadProxyModule();
  const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/proxy/health"));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.transport, "http-fallback");
});

test("netlify API proxy relays upstream responses for GET browsing fetches", async () => {
  const proxyModule = await loadProxyModule();
  const originalFetch = global.fetch;
  let capturedUrl = "";
  let capturedInit = null;

  global.fetch = async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response("<html>ok</html>", {
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "text/html; charset=utf-8"
      }
    });
  };

  try {
    const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/proxy/fetch?url=https%3A%2F%2Fduckduckgo.com%2F"));

    assert.equal(capturedUrl, "https://duckduckgo.com/");
    assert.equal(capturedInit.method, "GET");
    assert.equal(capturedInit.headers.get("accept-encoding"), "identity");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.match(response.headers.get("access-control-expose-headers") || "", /x-antarctic-final-url/);
    assert.equal(response.headers.get("x-antarctic-final-url"), "https://duckduckgo.com/");
    assert.match(await response.text(), /<html>ok<\/html>/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("netlify API proxy streams POST bodies to the direct browsing request endpoint", async () => {
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
      status: 207,
      statusText: "Multi-Status",
      headers: {
        "content-type": "application/octet-stream",
        "x-upstream-method": "POST"
      }
    });
  };

  try {
    const requestBody = new Uint8Array([1, 2, 3, 4]);
    const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/proxy/request?url=https%3A%2F%2Fexample.com%2Fecho", {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "x-antarctic-proxy-method": "POST",
        "x-antarctic-proxy-headers": JSON.stringify({
          accept: "application/json",
          "content-type": "text/plain",
          cookie: "nope"
        })
      },
      body: requestBody
    }));

    assert.equal(capturedUrl, "https://example.com/echo");
    assert.equal(capturedInit.method, "POST");
    assert.equal(capturedInit.duplex, "half");
    assert.equal(capturedInit.headers.get("accept"), "application/json");
    assert.equal(capturedInit.headers.get("content-type"), "text/plain");
    assert.equal(capturedInit.headers.get("accept-encoding"), "identity");
    assert.equal(capturedInit.headers.has("cookie"), false);
    assert.deepEqual(Array.from(capturedBody), [1, 2, 3, 4]);
    assert.equal(response.status, 207);
    assert.equal(response.headers.get("x-antarctic-proxy-status-text"), "Multi-Status");
    assert.deepEqual(Array.from(new Uint8Array(await response.arrayBuffer())), [9, 8, 7]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("netlify API proxy falls back to the backend origin for non-browsing APIs", async () => {
  const proxyModule = await loadProxyModule();
  const originalFetch = global.fetch;
  let capturedUrl = "";

  global.fetch = async (url) => {
    capturedUrl = url;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json"
      }
    });
  };

  try {
    const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/account/login", {
      method: "POST",
      body: JSON.stringify({ username: "guest", password: "guest" }),
      headers: {
        "content-type": "application/json"
      }
    }));

    assert.equal(capturedUrl, "https://api.antarctic.games/api/account/login");
    assert.deepEqual(await response.json(), { ok: true });
  } finally {
    global.fetch = originalFetch;
  }
});

test("netlify API proxy returns a 502 when the backend fallback cannot be reached", async () => {
  const proxyModule = await loadProxyModule();
  const originalFetch = global.fetch;

  global.fetch = async () => {
    throw new Error("connect ECONNREFUSED");
  };

  try {
    const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/account/login", {
      method: "POST",
      body: JSON.stringify({ username: "guest", password: "guest" }),
      headers: {
        "content-type": "application/json"
      }
    }));

    assert.equal(response.status, 502);
    assert.match(await response.text(), /Antarctic API proxy failed: connect ECONNREFUSED/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("netlify API proxy preflight allows custom-domain session headers", async () => {
  const proxyModule = await loadProxyModule();
  const response = await proxyModule.default(new Request("https://antarctic-games.netlify.app/api/community/bootstrap", {
    method: "OPTIONS",
    headers: {
      origin: "https://www.antarctic.games",
      "access-control-request-method": "GET",
      "access-control-request-headers": "x-antarctic-session"
    }
  }));

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("access-control-allow-headers") || "", /x-antarctic-session/);
});
