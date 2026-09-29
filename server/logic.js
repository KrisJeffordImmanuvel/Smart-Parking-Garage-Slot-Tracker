// logic.js
// -----------------------------------------------------------------------------
// The DIGITAL LOGIC of the Smart Parking Garage.
//
// Every signal here is a single bit, 0 or 1, exactly like a wire in a circuit.
// The same designs are written in Verilog in the /hardware folder.
//
//   COMBINATIONAL (CO1)
//   1. gateLogic()      -> barrier controller (UP, GREEN, RED, FULL)
//   2. comparator()     -> minimized FULL / EMPTY detection on the counter bits
//   3. toBCD()          -> splits the free-slot count into two BCD digits
//   4. bcdTo7Segment()  -> minimized BCD-to-7-segment decoder
//   5. truthTable()     -> all 16 input combinations of the gate logic
//
//   SEQUENTIAL (CO3)
//   6. counterStep()    -> 5-bit synchronous up/down counter (T flip-flops)
//
//   HARDWARE CONTROL (CO5 - same behaviour as the Verilog modules)
//   7. entryFsm()       -> Moore FSM that detects one complete car entry
//   8. debounce()       -> counter-based push-button debouncer
//
//   9. designInfo()     -> K-maps, equations and tables for the Hardware page
// -----------------------------------------------------------------------------

// Converts any true/false value into a bit (1 or 0).
const bit = (value) => (value ? 1 : 0);

// =============================================================================
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
// =============================================================================
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

// Splits a number 0..31 into its 5 counter bits Q4 (MSB) .. Q0 (LSB).
function toBits(count) {
  return {
    Q4: (count >> 4) & 1,
    Q3: (count >> 3) & 1,
    Q2: (count >> 2) & 1,
    Q1: (count >> 1) & 1,
    Q0: count & 1,
  };
}

// =============================================================================
// 2. COMPARATOR (CO1) - minimized FULL / EMPTY detection
// The free-slot count lives in a 5-bit counter Q4 Q3 Q2 Q1 Q0 (0..20).
//
//   FULL  = 1 when count = 0  (00000):  FULL  = Q4'·Q3'·Q2'·Q1'·Q0'  (a 5-input NOR)
//   EMPTY = 1 when count = 20 (10100):  EMPTY = Q4·Q2
//
// Why is EMPTY only Q4·Q2? The counter never reaches 21..31, so those values
// are DON'T CARES (X) in the K-map. Among the real values 0..20, the only one
// with Q4 = 1 AND Q2 = 1 is 20, so one AND gate is enough.
// The slot available input of the gate is A = FULL'.
// =============================================================================
function comparator(freeCount, capacity = 20) {
  const { Q4, Q3, Q2, Q1, Q0 } = toBits(freeCount);

  const FULL = !Q4 && !Q3 && !Q2 && !Q1 && !Q0; // FULL  = Q4'·Q3'·Q2'·Q1'·Q0'
  // The minimized EMPTY equation is designed for a capacity of 20. For any
  // other capacity fall back to a plain equality check.
  const EMPTY = capacity === 20 ? Q4 && Q2 : freeCount === capacity; // EMPTY = Q4·Q2

  return { FULL: bit(FULL), EMPTY: bit(EMPTY), A: bit(!FULL) };
}

// =============================================================================
// 3. BINARY -> BCD
// A 7-segment display shows one decimal digit, so a number like 17 is split
// into two BCD (Binary Coded Decimal) digits: tens = 1 (0001), ones = 7 (0111).
// =============================================================================
function toBCD(number) {
  const tens = Math.floor(number / 10) % 10;
  const ones = number % 10;
  return {
    tens: { digit: tens, bcd: tens.toString(2).padStart(4, '0') },
    ones: { digit: ones, bcd: ones.toString(2).padStart(4, '0') },
  };
}

// =============================================================================
// 4. BCD-TO-7-SEGMENT DECODER (CO1) - minimized equations
// Segment names:        aaa
//                      f   b
//                       ggg
//                      e   c
//                       ddd
// Inputs A B C D are the 4 BCD bits (A = 8, B = 4, C = 2, D = 1).
// Inputs 10..15 never occur in BCD, so they are DON'T CARES (X) in each K-map.
// Using them gives these minimized sum-of-products equations:
// =============================================================================
const DECODER_EQUATIONS = {
  a: "A + C + BD + B'D'",
  b: "B' + C'D' + CD",
  c: "B + C' + D",
  d: "A + B'D' + B'C + CD' + BC'D",
  e: "B'D' + CD'",
  f: "A + C'D' + BC' + BD'",
  g: "A + B'C + BC' + CD'",
};

function bcdTo7Segment(digit) {
  // Invalid BCD (10..15, or anything else) blanks the display.
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
    return { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0 };
  }
  const A = Boolean(digit & 8);
  const B = Boolean(digit & 4);
  const C = Boolean(digit & 2);
  const D = Boolean(digit & 1);

  return {
    a: bit(A || C || (B && D) || (!B && !D)), //                  a = A + C + BD + B'D'
    b: bit(!B || (!C && !D) || (C && D)), //                      b = B' + C'D' + CD
    c: bit(B || !C || D), //                                      c = B + C' + D
    d: bit(A || (!B && !D) || (!B && C) || (C && !D) || (B && !C && D)), // d = A + B'D' + B'C + CD' + BC'D
    e: bit((!B && !D) || (C && !D)), //                           e = B'D' + CD'
    f: bit(A || (!C && !D) || (B && !C) || (B && !D)), //         f = A + C'D' + BC' + BD'
    g: bit(A || (!B && C) || (B && !C) || (C && !D)), //          g = A + B'C + BC' + CD'
  };
}

// The decoder's TRUTH TABLE (what each digit must look like). The minimized
// equations above are checked against this table in test/logic.test.js.
const SEGMENT_TRUTH_TABLE = {
  //  a  b  c  d  e  f  g
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

// Convenience helper: builds everything needed to draw a 2-digit display.
function twoDigitDisplay(number) {
  const { tens, ones } = toBCD(number);
  return {
    tens: { ...tens, segments: bcdTo7Segment(tens.digit) },
    ones: { ...ones, segments: bcdTo7Segment(ones.digit) },
  };
}

// =============================================================================
// 5. TRUTH TABLE of the gate logic
// 4 inputs -> 2^4 = 16 rows. Row number = V·8 + A·4 + E·2 + S·1 (binary VAES).
// =============================================================================
function truthTable() {
  const rows = [];
  for (let n = 0; n < 16; n++) {
    const V = (n >> 3) & 1;
    const A = (n >> 2) & 1;
    const E = (n >> 1) & 1;
    const S = n & 1;
    rows.push({ row: n, V, A, E, S, ...gateLogic({ V, A, E, S }) });
  }
  return rows;
}

// =============================================================================
// 6. SYNCHRONOUS UP/DOWN COUNTER (CO3)
// Five T flip-flops Q4..Q0 hold the free-slot count. All of them share one
// clock, so they change together (synchronous).
//   UP   (U = 1): a car EXITS  -> count + 1
//   DOWN (U = 0): a car ENTERS -> count - 1
//
// A T flip-flop toggles when T = 1:   Q(next) = Q XOR T
//
// Count enable (stops the counter at the limits):
//   EN = U·EMPTY' + U'·FULL'     (no counting up at 20, no counting down at 0)
//
// T inputs (bit i toggles when all lower bits are 1 going up, or all 0 going down):
//   T0 = EN
//   T1 = EN·(U·Q0  + U'·Q0')
//   T2 = EN·(U·Q0·Q1  + U'·Q0'·Q1')
//   T3 = EN·(U·Q0·Q1·Q2  + U'·Q0'·Q1'·Q2')
//   T4 = EN·(U·Q0·Q1·Q2·Q3  + U'·Q0'·Q1'·Q2'·Q3')
// =============================================================================
function counterStep(count, direction, capacity = 20) {
  const U = direction === 'UP';
  const q = toBits(count);
  const { FULL, EMPTY } = comparator(count, capacity);
  const { Q4, Q3, Q2, Q1, Q0 } = q;

  const EN = (U && !EMPTY) || (!U && !FULL);

  const T = {
    T4: bit(EN && ((U && Q0 && Q1 && Q2 && Q3) || (!U && !Q0 && !Q1 && !Q2 && !Q3))),
    T3: bit(EN && ((U && Q0 && Q1 && Q2) || (!U && !Q0 && !Q1 && !Q2))),
    T2: bit(EN && ((U && Q0 && Q1) || (!U && !Q0 && !Q1))),
    T1: bit(EN && ((U && Q0) || (!U && !Q0))),
    T0: bit(EN),
  };

  // Clock edge: every flip-flop does Q(next) = Q XOR T.
  const nextBits = {
    Q4: Q4 ^ T.T4,
    Q3: Q3 ^ T.T3,
    Q2: Q2 ^ T.T2,
    Q1: Q1 ^ T.T1,
    Q0: Q0 ^ T.T0,
  };
  const next = nextBits.Q4 * 16 + nextBits.Q3 * 8 + nextBits.Q2 * 4 + nextBits.Q1 * 2 + nextBits.Q0;

  return { direction: U ? 'UP' : 'DOWN', count, bits: q, EN: bit(EN), T, nextBits, next };
}

// =============================================================================
// 7. ENTRY FSM (CO5) - Moore machine, same as hardware/entry_fsm.v
// It watches the two sensors and produces ONE count-down pulse (DEC) for every
// car that really drives in: at the gate (V) -> under the barrier (S) -> gone.
//
//   State  Code  Meaning                        Next state
//   IDLE    00   waiting for a car              V·A  -> ARMED   (else stay)
//   ARMED   01   car allowed, barrier up        S    -> UNDER,  V' -> IDLE
//   UNDER   10   car is under the barrier       S'   -> COUNT   (else stay)
//   COUNT   11   car is in: DEC = 1 (1 clock)   always -> IDLE
// Output (Moore, depends only on the state):  DEC = 1 only in COUNT.
// =============================================================================
const FSM_STATES = {
  IDLE: { code: '00', meaning: 'Waiting for a car' },
  ARMED: { code: '01', meaning: 'Car allowed in, barrier up' },
  UNDER: { code: '10', meaning: 'Car is under the barrier' },
  COUNT: { code: '11', meaning: 'Car is in: DEC = 1 for one clock' },
};

function entryFsm(state, { V, A, S }) {
  let next = state;
  if (state === 'IDLE') next = V && A ? 'ARMED' : 'IDLE';
  else if (state === 'ARMED') next = S ? 'UNDER' : !V ? 'IDLE' : 'ARMED';
  else if (state === 'UNDER') next = S ? 'UNDER' : 'COUNT';
  else if (state === 'COUNT') next = 'IDLE';
  else next = 'IDLE'; // unknown state -> safe reset

  return { state, next, DEC: bit(state === 'COUNT') };
}

// Runs the FSM through the sensor sequence of one car driving in:
// car arrives (V=1) -> drives under the barrier (S=1) -> has passed (V=0, S=0).
// Returns every clock step and whether a DEC pulse was produced.
function runEntrySequence(A) {
  const inputs = [
    { V: 1, S: 0 }, // car arrives at the gate
    { V: 1, S: 1 }, // car drives under the barrier
    { V: 0, S: 0 }, // car has passed the barrier
    { V: 0, S: 0 }, // one more clock
  ];
  let state = 'IDLE';
  let dec = 0;
  const trace = [];
  for (const input of inputs) {
    const step = entryFsm(state, { ...input, A });
    trace.push({ ...input, A, state, next: step.next, DEC: step.DEC });
    dec = dec || step.DEC;
    state = step.next;
  }
  trace.push({ V: 0, S: 0, A, state, next: state, DEC: 0 }); // resting state again
  return { trace, DEC: dec };
}

// =============================================================================
// 8. DEBOUNCER (CO5) - same idea as hardware/debounce.v
// A mechanical button "bounces" (0101...) for a few milliseconds. The clean
// output only changes after the input has stayed at the new value for
// `stableCount` samples in a row. A one-pulse (edge detector) then gives
// exactly one clock-wide pulse per press:  pulse = clean · clean_previous'
// =============================================================================
function debounce(samples, stableCount = 4) {
  let clean = 0;
  let counter = 0;
  let previous = 0;
  const cleanOut = [];
  const pulseOut = [];

  for (const raw of samples) {
    if (raw !== clean) {
      counter++;
      if (counter >= stableCount) {
        clean = raw;
        counter = 0;
      }
    } else {
      counter = 0;
    }
    cleanOut.push(clean);
    pulseOut.push(bit(clean && !previous));
    previous = clean;
  }
  return { clean: cleanOut, pulse: pulseOut };
}

// =============================================================================
// 9. DESIGN INFO for the Hardware Design page (K-maps, tables, equations)
// =============================================================================

// Evaluates one product term such as "B'D'" or "Q4Q2" for the given variables.
function evalTerm(term, vars) {
  const literals = term.match(/(Q\d|[A-D])'?/g) || [];
  return literals.every((literal) => {
    const name = literal.replace("'", '');
    const value = Boolean(vars[name]);
    return literal.endsWith("'") ? !value : value;
  });
}

// Returns, for a sum-of-products string, each term and the minterms it covers.
function termsWithCells(expression, variables) {
  const size = 2 ** variables.length;
  return expression.split('+').map((raw) => {
    const label = raw.trim();
    const cells = [];
    for (let m = 0; m < size; m++) {
      const vars = {};
      variables.forEach((name, i) => (vars[name] = (m >> (variables.length - 1 - i)) & 1));
      if (evalTerm(label, vars)) cells.push(m);
    }
    return { label, cells };
  });
}

function designInfo(capacity = 20) {
  // ---- Decoder: K-map values for each segment (minterm 0..15) ----
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const decoder = {};
  letters.forEach((seg, i) => {
    const values = [];
    for (let m = 0; m < 16; m++) values.push(m <= 9 ? SEGMENT_TRUTH_TABLE[m][i] : 'X');
    decoder[seg] = {
      expression: DECODER_EQUATIONS[seg],
      values,
      terms: termsWithCells(DECODER_EQUATIONS[seg], ['A', 'B', 'C', 'D']),
    };
  });

  // ---- Comparator: 5-variable K-maps (minterm 0..31) ----
  const comparatorMaps = {};
  const comparatorEquations = { FULL: "Q4'Q3'Q2'Q1'Q0'", EMPTY: 'Q4Q2' };
  for (const name of ['FULL', 'EMPTY']) {
    const values = [];
    for (let m = 0; m < 32; m++) {
      if (m > capacity) values.push('X');
      else values.push(name === 'FULL' ? bit(m === 0) : bit(m === capacity));
    }
    comparatorMaps[name] = {
      expression: comparatorEquations[name],
      values,
      terms: termsWithCells(comparatorEquations[name], ['Q4', 'Q3', 'Q2', 'Q1', 'Q0']),
    };
  }

  // ---- Counter state table (every count, next state for DOWN and UP) ----
  const counterTable = [];
  for (let n = 0; n <= capacity; n++) {
    counterTable.push({ count: n, down: counterStep(n, 'DOWN', capacity), up: counterStep(n, 'UP', capacity) });
  }

  // ---- Truth table of the decoder (0..15, X for invalid BCD) ----
  const decoderTable = [];
  for (let m = 0; m < 16; m++) {
    decoderTable.push({
      value: m,
      bcd: m.toString(2).padStart(4, '0'),
      segments: m <= 9 ? SEGMENT_TRUTH_TABLE[m] : null,
    });
  }

  return {
    decoder,
    decoderTable,
    comparator: comparatorMaps,
    counter: {
      equations: [
        "EN = U·EMPTY' + U'·FULL'",
        'T0 = EN',
        "T1 = EN·(U·Q0 + U'·Q0')",
        "T2 = EN·(U·Q0·Q1 + U'·Q0'·Q1')",
        "T3 = EN·(U·Q0·Q1·Q2 + U'·Q0'·Q1'·Q2')",
        "T4 = EN·(U·Q0·Q1·Q2·Q3 + U'·Q0'·Q1'·Q2'·Q3')",
      ],
      table: counterTable,
    },
    fsm: FSM_STATES,
  };
}

module.exports = {
  gateLogic,
  toBits,
  comparator,
  toBCD,
  bcdTo7Segment,
  SEGMENT_TRUTH_TABLE,
  DECODER_EQUATIONS,
  twoDigitDisplay,
  truthTable,
  counterStep,
  FSM_STATES,
  entryFsm,
  runEntrySequence,
  debounce,
  evalTerm,
  designInfo,
};
