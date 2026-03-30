const BACKEND_ORIGIN = "https://api.antarctic.games";

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
  return copyProxyHeaders(headers);
}

function requestSupportsBody(method) {
  const normalizedMethod = String(method || "GET").toUpperCase();
  return normalizedMethod !== "GET" && normalizedMethod !== "HEAD";
}

export default async function apiProxy(request) {
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
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }
}
