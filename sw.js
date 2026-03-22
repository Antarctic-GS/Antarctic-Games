/* global $scramjetLoadWorker */

importScripts("/scram/scramjet.all.js");

const SCRAMJET_PREFIX = "/service/scramjet/";
const SCRAMJET_WASM_PATH = "/scram/scramjet.wasm.wasm";
const workerFactory = typeof $scramjetLoadWorker === "function" ? $scramjetLoadWorker() : null;
const ScramjetServiceWorker = workerFactory && workerFactory.ScramjetServiceWorker;
const scramjet = ScramjetServiceWorker ? new ScramjetServiceWorker() : null;

function shouldHandleScramjetRequest(event) {
  const requestUrl = String(event && event.request && event.request.url ? event.request.url : "");
  const origin = String(self.location && self.location.origin ? self.location.origin : "");
  if (!requestUrl || !origin) return false;
  return requestUrl.startsWith(origin + SCRAMJET_PREFIX) || requestUrl.startsWith(origin + SCRAMJET_WASM_PATH);
}

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  if (!scramjet) return;
  if (!shouldHandleScramjetRequest(event)) {
    return;
  }

  event.respondWith((async function () {
    await scramjet.loadConfig();
    return scramjet.fetch(event);
  })());
});
