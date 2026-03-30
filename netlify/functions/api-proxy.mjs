const BACKEND_ORIGIN = "https://api.antarctic.games";
const DEFAULT_AI_MODEL = "qwen3.5:0.8b";
const DEFAULT_DISCORD_INVITE_URL = "https://discord.gg/FNACSCcE26";
const DEFAULT_DISCORD_WIDGET_URL = "https://discord.com/api/guilds/1479914434460913707/widget.json";
const DEFAULT_COMMIT_CHANNEL_ID = "1480022214303682700";
const DEFAULT_LINK_COMMAND_CHANNEL_IDS = "1480327216826155059,1480329637660983408";
const DEFAULT_WELCOME_CHANNEL_ID = "1480334877961355304";
const DEFAULT_RULES_CHANNEL_ID = "1480324913561862184";
const PROXY_TIMEOUT_MS = 25_000;
const BROWSER_FETCH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
const PROXY_REQUEST_HEADER_METHOD = "x-antarctic-proxy-method";
const PROXY_REQUEST_HEADER_HEADERS = "x-antarctic-proxy-headers";
const PROXY_ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const EXPOSED_PROXY_HEADERS = [
  "content-type",
  "x-antarctic-final-url",
  "x-palladium-final-url",
  "x-antarctic-proxy-status-text",
  "x-palladium-proxy-status-text"
].join(",");
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-nf-client-connection-ip",
  "x-nf-request-id"
]);

export const config = {
  path: "/api/*"
};

export function buildBackendUrl(requestUrl) {
  const incomingUrl = new URL(requestUrl);
  return new URL(incomingUrl.pathname + incomingUrl.search, BACKEND_ORIGIN).toString();
}

export function normalizeUserUrl(value) {
  let raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (!/^https?:\/\//i.test(raw)) {
    raw = "https://" + raw;
  }

  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function shouldBlockProxyRequestHeader(headerName) {
  return (
    !headerName ||
    headerName === "accept-encoding" ||
    headerName === "connection" ||
    headerName === "content-length" ||
    headerName === "cookie" ||
    headerName === "host" ||
    headerName === "origin" ||
    headerName === "referer" ||
    headerName === "transfer-encoding" ||
    headerName === "upgrade" ||
    headerName.startsWith("proxy-") ||
    headerName.startsWith("sec-") ||
    headerName.startsWith("x-antarctic-") ||
    headerName.startsWith("x-palladium-")
  );
}

export function shouldBlockResponseHeader(headerName) {
  return (
    !headerName ||
    headerName === "connection" ||
    headerName === "content-length" ||
    headerName === "keep-alive" ||
    headerName === "proxy-authenticate" ||
    headerName === "proxy-authorization" ||
    headerName === "te" ||
    headerName === "trailer" ||
    headerName === "transfer-encoding" ||
    headerName === "upgrade"
  );
}

export function copyProxyHeaders(headers) {
  const outgoing = new Headers();

  if (!headers || typeof headers.forEach !== "function") {
    return outgoing;
  }

  headers.forEach((value, name) => {
    const normalizedName = String(name || "").toLowerCase();
    if (!normalizedName || HOP_BY_HOP_HEADERS.has(normalizedName)) {
      return;
    }
    outgoing.set(name, value);
  });

  return outgoing;
}

export function copyResponseHeaders(headers) {
  const outgoing = new Headers();

  if (!headers || typeof headers.forEach !== "function") {
    return outgoing;
  }

  headers.forEach((value, name) => {
    const normalizedName = String(name || "").toLowerCase();
    if (!normalizedName || shouldBlockResponseHeader(normalizedName)) {
      return;
    }
    outgoing.set(name, value);
  });

  return outgoing;
}

export function parseProxyRequestHeaders(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return new Headers({ "accept-encoding": "identity" });
  }

  let parsed = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Headers({ "accept-encoding": "identity" });
  }

  const headers = new Headers({ "accept-encoding": "identity" });
  Object.entries(parsed || {}).forEach(([name, headerValue]) => {
    const normalizedName = String(name || "").trim().toLowerCase();
    if (!normalizedName || shouldBlockProxyRequestHeader(normalizedName)) {
      return;
    }
    const normalizedValue = Array.isArray(headerValue)
      ? headerValue.map((item) => String(item == null ? "" : item)).join(", ")
      : String(headerValue == null ? "" : headerValue);
    if (!normalizedValue) {
      return;
    }
    headers.set(normalizedName, normalizedValue);
  });

  return headers;
}

export function buildPublicConfig(siteOrigin) {
  return {
    ok: true,
    backendBase: siteOrigin,
    services: {
      proxy: "/api/proxy/fetch",
      proxyFetch: "/api/proxy/fetch",
      proxyRequest: "/api/proxy/request",
      proxyBase: siteOrigin,
      proxyMode: "http-fallback",
      proxyTransport: "http-fallback",
      wispPath: "",
      wispUrl: "",
      aiChat: "/api/ai/chat",
      defaultAiModel: DEFAULT_AI_MODEL,
      accountSession: "/api/account/session",
      accountLogin: "/api/account/login",
      accountSignup: "/api/account/signup",
      communityBootstrap: "/api/community/bootstrap",
      chatThreads: "/api/chat/threads",
      saves: "/api/saves"
    },
    discord: {
      commitBotConfigured: false,
      linkBotConfigured: false,
      communityBotConfigured: false,
      inviteUrl: DEFAULT_DISCORD_INVITE_URL,
      widgetUrl: DEFAULT_DISCORD_WIDGET_URL,
      commitChannelId: DEFAULT_COMMIT_CHANNEL_ID,
      linkCommandChannelIds: DEFAULT_LINK_COMMAND_CHANNEL_IDS,
      welcomeChannelId: DEFAULT_WELCOME_CHANNEL_ID,
      rulesChannelId: DEFAULT_RULES_CHANNEL_ID
    }
  };
}

function buildAnonymousCommunityPayload() {
  return {
    ok: true,
    authenticated: false,
    user: null,
    bootstrap: {
      threads: [],
      rooms: [],
      saves: [],
      incomingDirectRequests: [],
      stats: {
        threadCount: 0,
        roomCount: 0,
        joinedRoomCount: 0,
        directCount: 0,
        incomingDirectRequestCount: 0,
        saveCount: 0
      }
    }
  };
}

function buildBaseHeaders(extraHeaders = {}) {
  const headers = new Headers(extraHeaders);
  headers.set("cache-control", headers.get("cache-control") || "no-store");
  headers.set("access-control-allow-origin", headers.get("access-control-allow-origin") || "*");
  headers.set(
    "access-control-allow-methods",
    headers.get("access-control-allow-methods") || "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  headers.set(
    "access-control-allow-headers",
    headers.get("access-control-allow-headers") ||
      [
        "authorization",
        "content-type",
        "x-antarctic-session",
        "x-palladium-session",
        PROXY_REQUEST_HEADER_METHOD,
        PROXY_REQUEST_HEADER_HEADERS
      ].join(",")
  );
  headers.set("access-control-expose-headers", headers.get("access-control-expose-headers") || EXPOSED_PROXY_HEADERS);
  headers.set("x-content-type-options", "nosniff");
  return headers;
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: buildBaseHeaders({
      "content-type": "application/json; charset=utf-8"
    })
  });
}

function textResponse(status, text) {
  return new Response(String(text || ""), {
    status,
    headers: buildBaseHeaders({
      "content-type": "text/plain; charset=utf-8"
    })
  });
}

function requestSupportsBody(method) {
  const normalizedMethod = String(method || "GET").toUpperCase();
  return normalizedMethod !== "GET" && normalizedMethod !== "HEAD";
}

function createTimeoutSignal() {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(PROXY_TIMEOUT_MS);
  }
  return undefined;
}

function buildProxyResponseHeaders(upstream, fallbackUrl) {
  const headers = buildBaseHeaders(copyResponseHeaders(upstream && upstream.headers));
  const finalUrl = (upstream && upstream.url) || fallbackUrl || "";
  headers.set("x-antarctic-final-url", finalUrl);
  headers.set("x-palladium-final-url", finalUrl);
  headers.set("x-antarctic-proxy-status-text", (upstream && upstream.statusText) || "");
  headers.set("x-palladium-proxy-status-text", (upstream && upstream.statusText) || "");
  return headers;
}

async function handleProxyHealth() {
  return jsonResponse(200, {
    ok: true,
    service: "netlify",
    transport: "http-fallback",
    message: "Built-in web browsing is ready."
  });
}

async function handleConfig(requestUrl) {
  const incomingUrl = new URL(requestUrl);
  return jsonResponse(200, buildPublicConfig(incomingUrl.origin));
}

async function handleAnonymousCommunityState() {
  return jsonResponse(200, buildAnonymousCommunityPayload());
}

async function handleProxyFetch(request, url) {
  const target = normalizeUserUrl(url.searchParams.get("url") || "");
  if (!target) {
    return textResponse(400, "Missing or invalid url parameter");
  }

  const upstreamMethod = request.method === "HEAD" ? "HEAD" : "GET";
  const upstreamHeaders = new Headers({
    "user-agent": BROWSER_FETCH_USER_AGENT,
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "accept-encoding": "identity"
  });

  try {
    let upstream = await fetch(target, {
      method: upstreamMethod,
      headers: upstreamHeaders,
      redirect: "follow",
      signal: createTimeoutSignal()
    });

    if (request.method === "HEAD" && [400, 403, 405, 501].includes(upstream.status)) {
      upstream = await fetch(target, {
        method: "GET",
        headers: upstreamHeaders,
        redirect: "follow",
        signal: createTimeoutSignal()
      });
    }

    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: buildProxyResponseHeaders(upstream, target)
    });
  } catch (error) {
    return textResponse(502, String(error && error.message ? error.message : "Proxy fetch failed."));
  }
}

async function handleProxyRequest(request, url) {
  const target = normalizeUserUrl(url.searchParams.get("url") || "");
  if (!target) {
    return jsonResponse(400, { ok: false, error: "Missing or invalid url parameter" });
  }

  const upstreamMethod = String(request.headers.get(PROXY_REQUEST_HEADER_METHOD) || "").trim().toUpperCase();
  if (!PROXY_ALLOWED_METHODS.has(upstreamMethod)) {
    return jsonResponse(400, { ok: false, error: "Missing or invalid upstream method." });
  }

  const init = {
    method: upstreamMethod,
    headers: parseProxyRequestHeaders(request.headers.get(PROXY_REQUEST_HEADER_HEADERS)),
    redirect: "manual",
    signal: createTimeoutSignal()
  };
  if (requestSupportsBody(upstreamMethod) && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const upstream = await fetch(target, init);
    return new Response(upstreamMethod === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: buildProxyResponseHeaders(upstream, target)
    });
  } catch (error) {
    return jsonResponse(502, {
      ok: false,
      error: String(error && error.message ? error.message : "Proxy request failed.")
    });
  }
}

async function proxyBackendRequest(request) {
  const targetUrl = buildBackendUrl(request.url);
  const init = {
    method: request.method,
    headers: copyProxyHeaders(request.headers),
    signal: request.signal
  };

  if (requestSupportsBody(request.method) && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const upstream = await fetch(targetUrl, init);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: copyResponseHeaders(upstream.headers)
    });
  } catch (error) {
    const message = error && error.message ? error.message : "Unknown proxy failure";
    return new Response("Antarctic API proxy failed: " + message, {
      status: 502,
      headers: buildBaseHeaders({
        "content-type": "text/plain; charset=utf-8"
      })
    });
  }
}

export default async function apiProxy(request) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildBaseHeaders()
    });
  }

  if (url.pathname === "/api/config/public" && (request.method === "GET" || request.method === "HEAD")) {
    return handleConfig(request.url);
  }

  if (url.pathname === "/api/proxy/health" && (request.method === "GET" || request.method === "HEAD")) {
    return handleProxyHealth();
  }

  if (url.pathname === "/api/proxy/fetch" && (request.method === "GET" || request.method === "HEAD")) {
    return handleProxyFetch(request, url);
  }

  if (url.pathname === "/api/proxy/request" && request.method === "POST") {
    return handleProxyRequest(request, url);
  }

  if (url.pathname === "/api/account/session" && (request.method === "GET" || request.method === "HEAD")) {
    return handleAnonymousCommunityState();
  }

  if (url.pathname === "/api/community/bootstrap" && (request.method === "GET" || request.method === "HEAD")) {
    return handleAnonymousCommunityState();
  }

  return proxyBackendRequest(request);
}
