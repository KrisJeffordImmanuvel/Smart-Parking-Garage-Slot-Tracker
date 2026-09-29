// check-install.js
// Runs automatically before "npm run dev" and "npm start".
// It checks that Node.js is new enough and that the needed packages (or the
// built website) are there, and prints a clear message if something is missing.
//
//   node check-install.js dev    -> before "npm run dev" (needs Vite)
//   node check-install.js start  -> before "npm start"   (needs client/dist)

const fs = require('fs');
const path = require('path');

const mode = process.argv[2] === 'start' ? 'start' : 'dev';
let ok = true;
let fix = 'run   npm install   in this folder, and check that it finishes without errors.';

// node:sqlite (the built-in SQLite used by the server) needs Node.js 22.13+.
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`\n  Node.js ${process.versions.node} is too old. Please install Node.js 22 LTS or newer from https://nodejs.org\n`);
  ok = false;
}

const required = mode === 'dev' ? [['server', 'express'], ['client', 'vite']] : [['server', 'express']];
for (const [folder, pkg] of required) {
  if (!fs.existsSync(path.join(__dirname, folder, 'node_modules', pkg))) {
    console.error(`  Missing packages in "${folder}" (${pkg} not found).`);
    ok = false;
  }
}

// "npm start" serves the built React app, so it must have been built first.
if (ok && mode === 'start' && !fs.existsSync(path.join(__dirname, 'client', 'dist', 'index.html'))) {
  console.error('  The website has not been built yet (client/dist is missing).');
  fix = 'run   npm run build   first, then   npm start';
  ok = false;
}

if (!ok) {
  console.error(`\n  Fix: ${fix}\n`);
  process.exit(1);
}
