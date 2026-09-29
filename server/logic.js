// logic.js
// -----------------------------------------------------------------------------
// The DIGITAL LOGIC of the Smart Parking Garage.
//
// Everything in this file behaves like a combinational circuit: the outputs
// depend only on the present inputs (no memory). Every signal is a single bit,
// 0 or 1, exactly like a wire in a real circuit.
//
//   1. gateLogic()      -> barrier controller (the four Boolean equations)
//   2. comparator()     -> magnitude comparator for FULL / EMPTY lamps
//   3. toBCD()          -> splits the free-slot count into two BCD digits
//   4. bcdTo7Segment()  -> BCD-to-7-segment decoder (like the IC 7447/7448)
//   5. truthTable()     -> all 16 input combinations of the gate logic
// -----------------------------------------------------------------------------

// Converts any true/false value into a bit (1 or 0).
const bit = (value) => (value ? 1 : 0);

// -----------------------------------------------------------------------------
// 1. GATE LOGIC
// Inputs:
//   V = vehicle at gate          (1 = a car is waiting at the entry)
//   A = slot available           (1 = free count is not 0)
//   E = emergency override       (1 = emergency switch ON)
//   S = vehicle under barrier    (1 = safety sensor sees a car under the arm)
//
// Boolean equations (+ means OR, · means AND, ' means NOT):
//   UP    = S + E + V·A        barrier goes up
//   GREEN = UP                 green light when the barrier is up
//   RED   = UP'                red light when the barrier is down
//   FULL  = V·A'·E'·S'         car is waiting but the garage is full
// -----------------------------------------------------------------------------
function gateLogic({ V, A, E, S }) {
  // Turn the inputs into real booleans so the JavaScript operators
  // || (OR), && (AND) and ! (NOT) behave exactly like logic gates.
  V = Boolean(V);
  A = Boolean(A);
  E = Boolean(E);
  S = Boolean(S);

  const UP = S || E || (V && A); // UP    = S + E + V·A
  const GREEN = UP; //               GREEN = UP
  const RED = !UP; //                RED   = NOT UP
  const FULL = V && !A && !E && !S; // FULL = V · A' · E' · S'

  return { UP: bit(UP), GREEN: bit(GREEN), RED: bit(RED), FULL: bit(FULL) };
}

// -----------------------------------------------------------------------------
// 2. COMPARATOR
// Compares the free-slot count with two fixed numbers:
//   FULL  = 1 when count = 0         (no free slot left)
//   EMPTY = 1 when count = capacity  (every slot is free)
// The "slot available" input A of the gate is simply NOT FULL.
// -----------------------------------------------------------------------------
function comparator(freeCount, capacity) {
  const FULL = freeCount === 0;
  const EMPTY = freeCount === capacity;
  return { FULL: bit(FULL), EMPTY: bit(EMPTY), A: bit(!FULL) };
}

// -----------------------------------------------------------------------------
// 3. BINARY -> BCD
// A 7-segment display shows one decimal digit, so a number like 17 is split
// into two BCD (Binary Coded Decimal) digits: tens = 1 (0001), ones = 7 (0111).
// -----------------------------------------------------------------------------
function toBCD(number) {
  const tens = Math.floor(number / 10) % 10;
  const ones = number % 10;
  return {
    tens: { digit: tens, bcd: tens.toString(2).padStart(4, '0') },
    ones: { digit: ones, bcd: ones.toString(2).padStart(4, '0') },
  };
}

// -----------------------------------------------------------------------------
// 4. BCD-TO-7-SEGMENT DECODER
// Segment names of a 7-segment display:
//
//        aaa
//       f   b
//       f   b
//        ggg
//       e   c
//       e   c
//        ddd
//
// This lookup table IS the truth table of the decoder: 4 BCD inputs give the
// 7 outputs a..g (1 = segment lit). Inputs 10..15 are not valid BCD, so the
// display is blanked (all segments off) for them.
// -----------------------------------------------------------------------------
const SEGMENT_TABLE = {
  //     a  b  c  d  e  f  g
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 1, 1, 0, 0, 0, 0],
  2: [1, 1, 0, 1, 1, 0, 1],
  3: [1, 1, 1, 1, 0, 0, 1],
  4: [0, 1, 1, 0, 0, 1, 1],
  5: [1, 0, 1, 1, 0, 1, 1],
  6: [1, 0, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 0, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 1, 1],
};

function bcdTo7Segment(digit) {
  const row = SEGMENT_TABLE[digit] || [0, 0, 0, 0, 0, 0, 0]; // invalid -> blank
  const [a, b, c, d, e, f, g] = row;
  return { a, b, c, d, e, f, g };
}

// Convenience helper: builds everything needed to draw a 2-digit display.
function twoDigitDisplay(number) {
  const { tens, ones } = toBCD(number);
  return {
    tens: { ...tens, segments: bcdTo7Segment(tens.digit) },
    ones: { ...ones, segments: bcdTo7Segment(ones.digit) },
  };
}

// -----------------------------------------------------------------------------
// 5. TRUTH TABLE
// 4 inputs -> 2^4 = 16 rows. Row number = V·8 + A·4 + E·2 + S·1 (binary VAES).
// -----------------------------------------------------------------------------
function truthTable() {
  const rows = [];
  for (let n = 0; n < 16; n++) {
    const V = (n >> 3) & 1; // bit 3
    const A = (n >> 2) & 1; // bit 2
    const E = (n >> 1) & 1; // bit 1
    const S = n & 1; //        bit 0
    rows.push({ row: n, V, A, E, S, ...gateLogic({ V, A, E, S }) });
  }
  return rows;
}

module.exports = {
  gateLogic,
  comparator,
  toBCD,
  bcdTo7Segment,
  twoDigitDisplay,
  truthTable,
};
