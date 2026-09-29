// check-install.js
// Runs automatically before "npm run dev" and "npm start".
// It checks that Node.js is new enough and that the server and client
// packages are installed, and prints a clear message if something is missing.

const fs = require('fs');
const path = require('path');

let ok = true;

// node:sqlite (the built-in SQLite used by the server) needs Node.js 22.13+.
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`\n  Node.js ${process.versions.node} is too old. Please install Node.js 22 LTS or newer from https://nodejs.org\n`);
  ok = false;
}

const required = [
  ['server', 'express'],
  ['client', 'vite'],
];
for (const [folder, pkg] of required) {
  if (!fs.existsSync(path.join(__dirname, folder, 'node_modules', pkg))) {
    console.error(`  Missing packages in "${folder}" (${pkg} not found).`);
    ok = false;
  }
}

if (!ok) {
  console.error('\n  Fix: run   npm install   in this folder, and check that it finishes without errors.\n');
  process.exit(1);
}
