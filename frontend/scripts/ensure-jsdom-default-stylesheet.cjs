"use strict";

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const sourcePath = path.join(
  rootDir,
  "node_modules",
  "jsdom",
  "lib",
  "jsdom",
  "browser",
  "default-stylesheet.css"
);

const targets = [
  path.join(rootDir, ".next", "browser", "default-stylesheet.css"),
  path.join(
    rootDir,
    ".next",
    "standalone",
    ".next",
    "browser",
    "default-stylesheet.css"
  ),
];

if (!fs.existsSync(sourcePath)) {
  console.warn(`Missing jsdom stylesheet at ${sourcePath}`);
  process.exit(0);
}

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(sourcePath, target);
}
