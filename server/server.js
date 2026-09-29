// server.js
// -----------------------------------------------------------------------------
// EXPRESS REST API of the Smart Parking Garage Slot Tracker.
//
//   GET  /api/status       -> free count, 20 slot states, FULL/EMPTY, gate outputs
//   POST /api/enter        -> a car enters   (free count - 1, never below 0)
//   POST /api/exit         -> a car exits    (free count + 1, never above 20)
//   POST /api/slot/:id     -> toggle one slot between occupied and free
//   POST /api/switch       -> set the E (emergency) and S (safety) switches
//   GET  /api/history      -> list of entry / exit events with time
//
// Extra helper routes used by the frontend:
//   GET  /api/truth-table  -> the 16-row truth table produced by logic.js
//   GET  /api/design       -> K-maps, equations, counter table, FSM states
//   POST /api/fsm/step     -> one clock tick of the entry FSM
//   GET  /api/debounce-demo-> a simulated bouncing button press, debounced
//   GET  /api/verilog      -> the Verilog files from the /hardware folder
//   POST /api/reset        -> free all slots, switches off, clear history
// -----------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const express = require('express');

const { CAPACITY, PORT } = require('./config');
const logic = require('./logic');
const db = require('./db');

const app = express();
app.use(express.json()); // lets us read JSON request bodies (req.body)

// -----------------------------------------------------------------------------
// buildStatus(): reads the database and runs it through the logic circuits.
// Every route returns this object so the frontend always gets fresh data.
// -----------------------------------------------------------------------------
function buildStatus() {
  const slots = db.getSlots();
  const freeCount = slots.filter((slot) => slot.occupied === 0).length;
  const { V, E, S } = db.getSwitches();

  // Comparator: FULL when count = 0, EMPTY when count = CAPACITY.
  const comp = logic.comparator(freeCount, CAPACITY);

  // A (slot available) comes from the comparator: A = NOT FULL.
  const inputs = { V, A: comp.A, E, S };

  return {
    capacity: CAPACITY,
    freeCount,
    occupiedCount: CAPACITY - freeCount,
    slots,
    FULL: comp.FULL, // comparator output (garage full lamp)
    EMPTY: comp.EMPTY, // comparator output (garage empty lamp)
    inputs, // V, A, E, S
    gate: logic.gateLogic(inputs), // UP, GREEN, RED, FULL
    display: logic.twoDigitDisplay(freeCount), // BCD + 7-segment outputs
    counter: {
      bits: logic.toBits(freeCount), // the 5 flip-flops Q4..Q0
      nextDown: logic.counterStep(freeCount, 'DOWN', CAPACITY), // what a car ENTERING would do
      nextUp: logic.counterStep(freeCount, 'UP', CAPACITY), //     what a car EXITING would do
    },
  };
}

// Accepts 0/1 or true/false and returns 0/1. Anything else -> null (invalid).
function parseBit(value) {
  if (value === 1 || value === true || value === '1') return 1;
  if (value === 0 || value === false || value === '0') return 0;
  return null;
}

// ----------------------------- GET /api/status -------------------------------
app.get('/api/status', (req, res) => {
  res.json(buildStatus());
});

// ----------------------------- POST /api/enter -------------------------------
// A car drives in. Three digital blocks work together, as in the hardware:
//   1. Gate logic   : with the car at the gate (V = 1), is the barrier UP?
//   2. Entry FSM    : IDLE -> ARMED -> UNDER -> COUNT gives one DEC pulse
//                     only if the car was allowed in (V·A = 1).
//   3. Counter (CO3): the DEC pulse clocks the up/down counter DOWN by one.
app.post('/api/enter', (req, res) => {
  const freeCount = db.countFreeSlots();
  const { E, S } = db.getSwitches();
  const A = logic.comparator(freeCount, CAPACITY).A;

  // 1. Evaluate the gate with the car waiting at the gate (V = 1).
  const gate = logic.gateLogic({ V: 1, A, E, S });
  const gateInputs = { V: 1, A, E, S };

  // 2. Run the entry FSM through the sensor sequence of one car.
  const fsm = logic.runEntrySequence(A);

  // Case 1: barrier stays DOWN (garage full, no override) -> car is turned away.
  if (!gate.UP) {
    db.addHistory('DENIED', null, freeCount, 'Entry gate (garage FULL)');
    return res.json({ ok: false, message: 'Garage is FULL - barrier stays down.', gate, gateInputs, fsm, status: buildStatus() });
  }

  // Case 2: barrier went UP only because of E or S, but A = 0, so the FSM never
  // arms and there is no DEC pulse: the count must never go below 0.
  if (!fsm.DEC) {
    db.addHistory('DENIED', null, freeCount, 'Entry gate (override, no free slot)');
    return res.json({
      ok: false,
      message: 'Barrier opened by override, but there is no free slot (count stays 0).',
      gate,
      gateInputs,
      fsm,
      status: buildStatus(),
    });
  }

  // Case 3: normal entry. 3. The DEC pulse clocks the counter DOWN.
  const counter = logic.counterStep(freeCount, 'DOWN', CAPACITY);
  const slot = db.firstFreeSlot();
  db.setSlot(slot.id, 1);
  db.addHistory('ENTRY', slot.id, counter.next, 'Entry gate');

  res.json({
    ok: true,
    message: `Car entered and parked in slot ${slot.id}.`,
    slot: slot.id,
    gate,
    gateInputs,
    fsm,
    counter,
    status: buildStatus(),
  });
});

// ----------------------------- POST /api/exit --------------------------------
// A car leaves: the exit sensor pulse clocks the counter UP by one.
// The counter's enable (EN = U·EMPTY') stops it from going above CAPACITY.
app.post('/api/exit', (req, res) => {
  const freeCount = db.countFreeSlots();
  const counter = logic.counterStep(freeCount, 'UP', CAPACITY);

  if (!counter.EN) {
    return res.json({ ok: false, message: 'Garage is already EMPTY - no car to exit.', counter, status: buildStatus() });
  }

  const slot = db.lastOccupiedSlot();
  db.setSlot(slot.id, 0);
  db.addHistory('EXIT', slot.id, counter.next, 'Exit gate');

  res.json({ ok: true, message: `Car exited from slot ${slot.id}.`, slot: slot.id, counter, status: buildStatus() });
});

// ----------------------------- POST /api/slot/:id ----------------------------
// Toggles one slot, like a sensor in that parking space detecting a car.
app.post('/api/slot/:id', (req, res) => {
  const id = Number(req.params.id);
  const slot = Number.isInteger(id) ? db.getSlot(id) : undefined;

  if (!slot) {
    return res.status(400).json({ ok: false, message: `Slot must be a number from 1 to ${CAPACITY}.` });
  }

  const nowOccupied = slot.occupied ? 0 : 1; // flip 0 <-> 1
  db.setSlot(id, nowOccupied);
  db.addHistory(nowOccupied ? 'ENTRY' : 'EXIT', id, db.countFreeSlots(), 'Slot clicked');

  res.json({
    ok: true,
    message: `Slot ${id} is now ${nowOccupied ? 'occupied' : 'free'}.`,
    status: buildStatus(),
  });
});

// ----------------------------- POST /api/switch ------------------------------
// Body example: { "E": 1 }  or  { "E": 0, "S": 1 }
// E = emergency override, S = vehicle under barrier (safety sensor).
// V (vehicle at gate) is also accepted so the Logic Panel can test every row.
app.post('/api/switch', (req, res) => {
  const body = req.body || {};
  const names = ['V', 'E', 'S'].filter((name) => body[name] !== undefined);

  if (names.length === 0) {
    return res.status(400).json({ ok: false, message: 'Send at least one of E, S or V (0 or 1).' });
  }

  // First check every value, so nothing is saved if one of them is wrong.
  for (const name of names) {
    if (parseBit(body[name]) === null) {
      return res.status(400).json({ ok: false, message: `${name} must be 0 or 1.` });
    }
  }
  names.forEach((name) => db.setSwitch(name, parseBit(body[name])));

  res.json({ ok: true, message: 'Switches updated.', status: buildStatus() });
});

// ----------------------------- GET /api/history ------------------------------
app.get('/api/history', (req, res) => {
  res.json(db.getHistory());
});

// ----------------------------- extra routes ----------------------------------
app.get('/api/truth-table', (req, res) => {
  res.json(logic.truthTable());
});

// ----------------------------- Hardware Design page --------------------------

// K-maps, minimized equations, counter state table and FSM states.
app.get('/api/design', (req, res) => {
  res.json(logic.designInfo(CAPACITY));
});

// One clock tick of the entry FSM. Body: { state, V, A, S }
app.post('/api/fsm/step', (req, res) => {
  const { state = 'IDLE' } = req.body || {};
  if (!logic.FSM_STATES[state]) {
    return res.status(400).json({ ok: false, message: `Unknown state ${state}.` });
  }
  const V = parseBit(req.body.V) ?? 0;
  const A = parseBit(req.body.A) ?? 1;
  const S = parseBit(req.body.S) ?? 0;
  res.json({ ok: true, ...logic.entryFsm(state, { V, A, S }), inputs: { V, A, S } });
});

// Simulates one push-button press that bounces, and debounces it.
app.get('/api/debounce-demo', (req, res) => {
  const random = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const raw = [];
  const push = (value, times) => {
    for (let i = 0; i < times; i++) raw.push(value);
  };
  const bounce = (times) => {
    for (let i = 0; i < times; i++) push(i % 2, random(1, 2));
  };
  push(0, 4); //           button not pressed
  bounce(random(4, 7)); // contacts bounce when pressed
  push(1, random(12, 16)); // held down
  bounce(random(4, 6)); // contacts bounce when released
  push(0, 8); //           released
  const stableCount = 4;
  const { clean, pulse } = logic.debounce(raw, stableCount);
  const risingEdges = raw.filter((v, i) => v === 1 && raw[i - 1] === 0).length;
  res.json({ raw, clean, pulse, stableCount, risingEdges, pulses: pulse.filter(Boolean).length });
});

// The Verilog source files from the /hardware folder.
const HARDWARE_DIR = path.join(__dirname, '..', 'hardware');
app.get('/api/verilog', (req, res) => {
  if (!fs.existsSync(HARDWARE_DIR)) return res.json([]);
  const files = fs
    .readdirSync(HARDWARE_DIR)
    .filter((name) => /\.(v|xdc)$/.test(name))
    .sort()
    .map((name) => ({ name, code: fs.readFileSync(path.join(HARDWARE_DIR, name), 'utf8') }));
  res.json(files);
});

app.post('/api/reset', (req, res) => {
  db.resetAll();
  res.json({ ok: true, message: 'Garage reset: all slots free, switches off, history cleared.', status: buildStatus() });
});

// Unknown /api route -> 404 in JSON.
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, message: `No API route for ${req.method} ${req.originalUrl}` });
});

// -----------------------------------------------------------------------------
// If the React app has been built (client/dist), serve it from this server too,
// so the whole project can run on a single port with "npm start".
// -----------------------------------------------------------------------------
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const hasBuiltClient = fs.existsSync(clientDist);
if (hasBuiltClient) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  // In development the website is served by Vite on port 5173, not here.
  // Show a short help page instead of "Cannot GET /".
  app.get('/', (req, res) => {
    res.send(`
      <body style="font-family: system-ui, sans-serif; background: #020617; color: #e2e8f0; padding: 40px;">
        <h1>Smart Parking API is running ✅</h1>
        <p>This port (${PORT}) is only the backend. Open the website here:</p>
        <p style="font-size: 1.4em;"><a style="color: #34d399;" href="http://localhost:5173">http://localhost:5173</a></p>
        <p>Test the API: <a style="color: #38bdf8;" href="/api/status">/api/status</a></p>
      </body>`);
  });
}

// Any unexpected error -> 500 in JSON (instead of crashing the server).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, message: 'Server error: ' + err.message });
});

app.listen(PORT, () => {
  console.log(`Parking API running at http://localhost:${PORT}  (capacity ${CAPACITY} slots)`);
  if (hasBuiltClient) {
    console.log(`Open the website at http://localhost:${PORT}`);
  } else {
    console.log('Open the website at http://localhost:5173 (served by the client dev server)');
  }
});
