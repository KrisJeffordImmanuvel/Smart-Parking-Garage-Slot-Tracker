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
