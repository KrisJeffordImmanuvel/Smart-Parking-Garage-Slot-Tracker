// updown_counter.v  (CO3)
// -----------------------------------------------------------------------------
// 5-bit SYNCHRONOUS up/down counter built from T flip-flops.
// It holds the number of FREE slots (0..20). All flip-flops share one clock.
//
//   up   pulse (a car EXITS)  -> count + 1     (U = 1)
//   down pulse (a car ENTERS) -> count - 1     (U = 0)
//
//   Count enable:  EN = U·EMPTY' + U'·FULL'   (never above 20, never below 0)
//   T0 = EN
//   T1 = EN·(U·Q0          + U'·Q0')
//   T2 = EN·(U·Q0·Q1       + U'·Q0'·Q1')
//   T3 = EN·(U·Q0·Q1·Q2    + U'·Q0'·Q1'·Q2')
//   T4 = EN·(U·Q0·Q1·Q2·Q3 + U'·Q0'·Q1'·Q2'·Q3')
//   T flip-flop:  Q(next) = Q XOR T
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module updown_counter #(
    parameter [4:0] RESET_VALUE = 5'd20   // all 20 slots free after reset
) (
    input  wire       clk,
    input  wire       rst,     // synchronous reset
    input  wire       up,      // one-clock pulse: car exits
    input  wire       down,    // one-clock pulse: car enters
    input  wire       full,    // from the comparator
    input  wire       empty,   // from the comparator
    output reg  [4:0] q = RESET_VALUE
);
    // If both pulses arrive in the same clock, the count does not change.
    wire count_up   = up & ~down;
    wire count_down = down & ~up;
    wire u          = count_up;                                   // direction U
    wire en         = (count_up & ~empty) | (count_down & ~full); // count enable

    wire [4:0] t;
    assign t[0] = en;
    assign t[1] = en & ((u & q[0])                      | (~u & ~q[0]));
    assign t[2] = en & ((u & q[0] & q[1])               | (~u & ~q[0] & ~q[1]));
    assign t[3] = en & ((u & q[0] & q[1] & q[2])        | (~u & ~q[0] & ~q[1] & ~q[2]));
    assign t[4] = en & ((u & q[0] & q[1] & q[2] & q[3]) | (~u & ~q[0] & ~q[1] & ~q[2] & ~q[3]));

    // Five T flip-flops, clocked together.
    always @(posedge clk) begin
        if (rst) q <= RESET_VALUE;
        else     q <= q ^ t;       // Q(next) = Q XOR T
    end
endmodule
