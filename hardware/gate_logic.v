// gate_logic.v
// -----------------------------------------------------------------------------
// Barrier controller - pure combinational logic (the four Boolean equations).
//   UP    = S + E + V·A
//   GREEN = UP
//   RED   = UP'
//   FULL  = V·A'·E'·S'   (car waiting but the garage is full)
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module gate_logic (
    input  wire v,      // vehicle at gate
    input  wire a,      // slot available (from the comparator)
    input  wire e,      // emergency override switch
    input  wire s,      // vehicle under barrier (safety sensor)
    output wire up,
    output wire green,
    output wire red,
    output wire full
);
    assign up    = s | e | (v & a);
    assign green = up;
    assign red   = ~up;
    assign full  = v & ~a & ~e & ~s;
endmodule
