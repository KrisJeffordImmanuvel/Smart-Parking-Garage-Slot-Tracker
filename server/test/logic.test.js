// Unit tests for logic.js, using Node's built-in test runner.
// Run with:  npm test   (inside the server folder)

const test = require('node:test');
const assert = require('node:assert');
const logic = require('../logic');

test('gate logic matches UP = S + E + V·A and FULL = V·A\'·E\'·S\'', () => {
  for (const row of logic.truthTable()) {
    const { V, A, E, S } = row;
    const expectedUP = S || E || (V && A) ? 1 : 0;
    assert.strictEqual(row.UP, expectedUP, `UP wrong for VAES=${V}${A}${E}${S}`);
    assert.strictEqual(row.GREEN, row.UP);
    assert.strictEqual(row.RED, 1 - row.UP);
    assert.strictEqual(row.FULL, V && !A && !E && !S ? 1 : 0);
  }
});

test('truth table has 16 rows in binary order', () => {
  const rows = logic.truthTable();
  assert.strictEqual(rows.length, 16);
  assert.deepStrictEqual(rows[11], { row: 11, V: 1, A: 0, E: 1, S: 1, UP: 1, GREEN: 1, RED: 0, FULL: 0 });
  assert.strictEqual(rows[8].FULL, 1); // V=1, A=0, E=0, S=0 -> car turned away
  assert.strictEqual(rows[8].UP, 0);
});

test('comparator gives FULL at 0 and EMPTY at capacity', () => {
  assert.deepStrictEqual(logic.comparator(0, 20), { FULL: 1, EMPTY: 0, A: 0 });
  assert.deepStrictEqual(logic.comparator(20, 20), { FULL: 0, EMPTY: 1, A: 1 });
  assert.deepStrictEqual(logic.comparator(7, 20), { FULL: 0, EMPTY: 0, A: 1 });
});

test('BCD conversion and 7-segment decoder', () => {
  assert.deepStrictEqual(logic.toBCD(17), {
    tens: { digit: 1, bcd: '0001' },
    ones: { digit: 7, bcd: '0111' },
  });
  assert.deepStrictEqual(logic.bcdTo7Segment(8), { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1 });
  assert.deepStrictEqual(logic.bcdTo7Segment(1), { a: 0, b: 1, c: 1, d: 0, e: 0, f: 0, g: 0 });
  assert.deepStrictEqual(logic.bcdTo7Segment(12), { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0 }); // invalid -> blank
});

// ------------------------- CO1: minimized logic ------------------------------

test('minimized decoder equations match the truth table for every BCD digit', () => {
  const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  for (let digit = 0; digit <= 9; digit++) {
    const segments = logic.bcdTo7Segment(digit);
    names.forEach((name, i) => {
      assert.strictEqual(segments[name], logic.SEGMENT_TRUTH_TABLE[digit][i], `segment ${name} of ${digit}`);
      // The equation strings shown on the Hardware page must agree as well.
      const vars = { A: (digit >> 3) & 1, B: (digit >> 2) & 1, C: (digit >> 1) & 1, D: digit & 1 };
      const fromString = logic.DECODER_EQUATIONS[name].split('+').some((t) => logic.evalTerm(t.trim(), vars));
      assert.strictEqual(fromString ? 1 : 0, segments[name], `equation string for ${name} at ${digit}`);
    });
  }
});

test('minimized comparator (FULL = Q4\'Q3\'Q2\'Q1\'Q0\', EMPTY = Q4Q2) is correct for 0..20', () => {
  for (let count = 0; count <= 20; count++) {
    const { FULL, EMPTY, A } = logic.comparator(count, 20);
    assert.strictEqual(FULL, count === 0 ? 1 : 0, `FULL at ${count}`);
    assert.strictEqual(EMPTY, count === 20 ? 1 : 0, `EMPTY at ${count}`);
    assert.strictEqual(A, 1 - FULL);
  }
});

// ------------------------- CO3: up/down counter ------------------------------

test('T flip-flop counter counts down/up by one and stops at 0 and 20', () => {
  for (let count = 0; count <= 20; count++) {
    const down = logic.counterStep(count, 'DOWN');
    const up = logic.counterStep(count, 'UP');
    assert.strictEqual(down.next, count === 0 ? 0 : count - 1, `DOWN from ${count}`);
    assert.strictEqual(up.next, count === 20 ? 20 : count + 1, `UP from ${count}`);
    assert.strictEqual(down.EN, count === 0 ? 0 : 1);
    assert.strictEqual(up.EN, count === 20 ? 0 : 1);
  }
  // 8 = 01000 counting down toggles Q3..Q0 -> 00111 = 7
  assert.deepStrictEqual(logic.counterStep(8, 'DOWN').T, { T4: 0, T3: 1, T2: 1, T1: 1, T0: 1 });
});

// ------------------------- CO5: FSM and debouncer ----------------------------

test('entry FSM gives exactly one DEC pulse per car, none when the garage is full', () => {
  const allowed = logic.runEntrySequence(1);
  assert.strictEqual(allowed.DEC, 1);
  assert.deepStrictEqual(allowed.trace.map((s) => s.state), ['IDLE', 'ARMED', 'UNDER', 'COUNT', 'IDLE']);
  assert.strictEqual(allowed.trace.filter((s) => s.DEC).length, 1);

  const full = logic.runEntrySequence(0);
  assert.strictEqual(full.DEC, 0);
  assert.ok(full.trace.every((s) => s.state === 'IDLE'));

  // A car that arrives and then reverses away is not counted.
  assert.strictEqual(logic.entryFsm('ARMED', { V: 0, A: 1, S: 0 }).next, 'IDLE');
});

test('debouncer turns a bouncing press into one clean pulse', () => {
  const raw = [0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0];
  const { clean, pulse } = logic.debounce(raw, 4);
  assert.strictEqual(pulse.reduce((a, b) => a + b, 0), 1); // one press -> one pulse
  assert.strictEqual(clean[raw.length - 1], 0); //            released at the end
  assert.ok(clean.includes(1));
});
