// db.js
// -----------------------------------------------------------------------------
// DATABASE layer (SQLite, using the better-sqlite3 package).
//
// Three small tables:
//   slots    -> one row per parking slot: id (1..20) and occupied (0/1)
//   switches -> the input switches V, E and S with their value (0/1)
//   history  -> a log of every entry / exit event with its time
//
// The free-slot count is NOT stored separately: it is always calculated by
// counting the free slots, so the count and the slot boxes can never disagree.
// -----------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { CAPACITY, DB_FILE } = require('./config');

// Make sure the folder for the database file exists, then open the database.
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new Database(DB_FILE);

// Create the tables the first time the server starts.
db.exec(`
  CREATE TABLE IF NOT EXISTS slots (
    id       INTEGER PRIMARY KEY,
    occupied INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS switches (
    name  TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event      TEXT    NOT NULL,   -- ENTRY, EXIT or DENIED
    slot       INTEGER,            -- slot number (empty for DENIED)
    free_after INTEGER NOT NULL,   -- free-slot count after the event
    source     TEXT    NOT NULL,   -- what caused it (gate button / slot click)
    time       TEXT    NOT NULL    -- ISO date-time string
  );
`);

// Make sure there is exactly one row for every slot 1..CAPACITY.
// (If CAPACITY is made smaller in config.js, extra slots are removed.)
const insertSlot = db.prepare('INSERT OR IGNORE INTO slots (id, occupied) VALUES (?, 0)');
for (let id = 1; id <= CAPACITY; id++) insertSlot.run(id);
db.prepare('DELETE FROM slots WHERE id > ?').run(CAPACITY);

// Make sure the three switches exist (all start at 0).
const insertSwitch = db.prepare('INSERT OR IGNORE INTO switches (name, value) VALUES (?, 0)');
['V', 'E', 'S'].forEach((name) => insertSwitch.run(name));

// ----------------------------- slots ----------------------------------------

function getSlots() {
  return db.prepare('SELECT id, occupied FROM slots ORDER BY id').all();
}

function getSlot(id) {
  return db.prepare('SELECT id, occupied FROM slots WHERE id = ?').get(id);
}

function setSlot(id, occupied) {
  db.prepare('UPDATE slots SET occupied = ? WHERE id = ?').run(occupied ? 1 : 0, id);
}

function countFreeSlots() {
  return db.prepare('SELECT COUNT(*) AS free FROM slots WHERE occupied = 0').get().free;
}

// Lowest-numbered free slot (a new car parks in the first free space).
function firstFreeSlot() {
  return db.prepare('SELECT id FROM slots WHERE occupied = 0 ORDER BY id LIMIT 1').get();
}

// Highest-numbered occupied slot (the car that leaves when "Car Exits" is used).
function lastOccupiedSlot() {
  return db.prepare('SELECT id FROM slots WHERE occupied = 1 ORDER BY id DESC LIMIT 1').get();
}

// ----------------------------- switches -------------------------------------

// Returns an object like { V: 0, E: 1, S: 0 }.
function getSwitches() {
  const rows = db.prepare('SELECT name, value FROM switches').all();
  const result = {};
  rows.forEach((row) => (result[row.name] = row.value));
  return result;
}

function setSwitch(name, value) {
  db.prepare('UPDATE switches SET value = ? WHERE name = ?').run(value ? 1 : 0, name);
}

// ----------------------------- history --------------------------------------

function addHistory(event, slot, freeAfter, source) {
  db.prepare(
    'INSERT INTO history (event, slot, free_after, source, time) VALUES (?, ?, ?, ?, ?)'
  ).run(event, slot, freeAfter, source, new Date().toISOString());
}

// Newest events first.
function getHistory() {
  return db.prepare('SELECT * FROM history ORDER BY id DESC').all();
}

// ----------------------------- reset ----------------------------------------

// Frees every slot, turns every switch off and clears the history.
function resetAll() {
  db.exec(`
    UPDATE slots SET occupied = 0;
    UPDATE switches SET value = 0;
    DELETE FROM history;
  `);
}

module.exports = {
  getSlots,
  getSlot,
  setSlot,
  countFreeSlots,
  firstFreeSlot,
  lastOccupiedSlot,
  getSwitches,
  setSwitch,
  addHistory,
  getHistory,
  resetAll,
};
