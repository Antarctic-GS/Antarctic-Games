#!/usr/bin/env node

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const LOCAL_MANIFEST_PATH = path.join(FRONTEND_DIR, "data", "games-catalog.json");
const SYNC_TARGETS = [
  {
    sourcePath: "games",
    targetPath: path.join(FRONTEND_DIR, "games")
  },
  {
    sourcePath: path.join("images", "game-img"),
    targetPath: path.join(FRONTEND_DIR, "images", "game-img")
  },
  {
    sourcePath: "swf",
    targetPath: path.join(FRONTEND_DIR, "swf")
  }
];

async function main() {
  const backendDir = resolveBackendDir();
  const backendCatalogPath = path.join(backendDir, "config", "game-catalog.json");

  for (const target of SYNC_TARGETS) {
    await syncDirectory(path.join(backendDir, target.sourcePath), target.targetPath);
  }

  const gamesDir = path.join(backendDir, "games");
  const gameImageDir = path.join(backendDir, "images", "game-img");
  const overrides = await readJsonObject(backendCatalogPath);
  const games = await buildCatalog(gamesDir, gameImageDir, overrides);

  await fsp.mkdir(path.dirname(LOCAL_MANIFEST_PATH), { recursive: true });
  await fsp.writeFile(
    LOCAL_MANIFEST_PATH,
    JSON.stringify(
      {
        ok: true,
        source: "local-sync",
        generatedAt: new Date().toISOString(),
        games: games
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    "Synced %d games into %s using backend assets from %s",
    games.length,
    FRONTEND_DIR,
    backendDir
  );
}

function resolveBackendDir() {
  const candidates = [
    path.resolve(FRONTEND_DIR, "..", "palladium-backend"),
    path.resolve(FRONTEND_DIR, "..", "backend")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "apps.js"))) {
      return candidate;
    }
  }

  throw new Error(
    "Could not find a sibling backend checkout. Expected apps.js under ../palladium-backend or ../backend."
  );
}

async function syncDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error("Missing source directory: " + sourceDir);
  }

  await fsp.rm(targetDir, { recursive: true, force: true });
  await copyDirectory(sourceDir, targetDir);
}

async function copyDirectory(sourceDir, targetDir) {
  await fsp.mkdir(targetDir, { recursive: true });
  const entries = await fsp.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      await fsp.copyFile(sourcePath, targetPath);
    }
  }
}

async function buildCatalog(gamesDir, gameImageDir, overrides) {
  const files = await walkFiles(gamesDir);
  const entries = [];

  for (const absolutePath of files) {
    if (!absolutePath.endsWith(".html")) continue;

    const relativeGamePath = normalizeSlash(path.relative(gamesDir, absolutePath));
    const gamePath = "games/" + relativeGamePath;
    const override = overrides[gamePath] || {};
    const metadata = await extractGameMetadata(absolutePath);
    const title =
      safeText(override.title, 160) ||
      safeText(metadata.title, 160) ||
      humanizeFilename(path.basename(relativeGamePath, ".html"));
    const author =
      safeText(override.author, 120) ||
      safeText(metadata.author, 120) ||
      "Unknown";
    const image =
      normalizeAssetPath(override.image) ||
      normalizeAssetPath(metadata.image) ||
      inferGameImagePath(relativeGamePath, gameImageDir);
    const category =
      safeText(override.category, 80) ||
      safeText(metadata.category, 80) ||
      inferCategory(gamePath);

    entries.push({
      file: path.basename(relativeGamePath),
      title: title,
      author: author,
      category: category,
      path: gamePath,
      image: image,
      launchUri: buildLaunchUri(gamePath, title, author)
    });
  }

  return entries.sort((left, right) => left.title.localeCompare(right.title));
}

async function walkFiles(rootDir) {
  const files = [];
  const pending = [rootDir];

  while (pending.length) {
    const currentDir = pending.pop();
    const entries = await fsp.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === ".DS_Store") continue;

      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }

  return files.sort();
}

async function readJsonObject(filePath) {
  try {
    const raw = await fsp.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    throw new Error("Failed to read game catalog overrides from " + filePath + ": " + error.message);
  }
}

async function extractGameMetadata(filePath) {
  try {
    const source = await fsp.readFile(filePath, "utf8");
    return {
      title:
        decodeHtmlEntities(findMetaContent(source, "og:title")) ||
        decodeHtmlEntities(findTagText(source, "title")) ||
        "",
      author:
        decodeHtmlEntities(findMetaNameContent(source, "author")) ||
        decodeHtmlEntities(findMetaContent(source, "author")) ||
        "",
      image: decodeHtmlEntities(findMetaContent(source, "og:image")) || "",
      category: ""
    };
  } catch {
    return {
      title: "",
      author: "",
      image: "",
      category: ""
    };
  }
}

function findTagText(source, tagName) {
  const match = source.match(new RegExp("<" + tagName + "[^>]*>([\\s\\S]*?)</" + tagName + ">", "i"));
  return match ? cleanWhitespace(match[1]) : "";
}

function findMetaContent(source, propertyName) {
  return findMetaMatch(
    source,
    new RegExp(
      '<meta[^>]+(?:property|name)=["\\\']' + escapeRegExp(propertyName) + '["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\'][^>]*>',
      "i"
    )
  );
}

function findMetaNameContent(source, nameValue) {
  return findMetaMatch(
    source,
    new RegExp(
      '<meta[^>]+name=["\\\']' + escapeRegExp(nameValue) + '["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\'][^>]*>',
      "i"
    )
  );
}

function findMetaMatch(source, pattern) {
  const match = source.match(pattern);
  return match ? cleanWhitespace(match[1]) : "";
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeSlash(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function normalizeAssetPath(value) {
  const text = safeText(value, 512);
  if (!text || /^(?:[a-z]+:)?\/\//i.test(text) || /^(?:data|blob):/i.test(text)) {
    return text;
  }
  return normalizeSlash(text);
}

function inferGameImagePath(relativeGamePath, gameImageDir) {
  const baseName = path.basename(relativeGamePath, ".html");
  const candidates = [".png", ".jpg", ".jpeg", ".webp"];

  for (const extension of candidates) {
    const fileName = baseName + extension;
    if (fs.existsSync(path.join(gameImageDir, fileName))) {
      return normalizeSlash(path.join("images", "game-img", fileName));
    }
  }

  return "";
}

function inferCategory(gamePath) {
  const parts = normalizeSlash(gamePath).split("/");
  return parts.length >= 2 ? parts[1] : "other";
}

function humanizeFilename(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, function (character) {
      return character.toUpperCase();
    })
    .trim();
}

function buildLaunchUri(gamePath, title, author) {
  return (
    "palladium://gamelauncher?path=" +
    encodeURIComponent(gamePath) +
    "&title=" +
    encodeURIComponent(title) +
    "&author=" +
    encodeURIComponent(author)
  );
}

function safeText(value, maxLength) {
  const text = String(value == null ? "" : value).trim();
  return text.slice(0, maxLength || text.length);
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
