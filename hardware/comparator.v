// comparator.v  (CO1)
// -----------------------------------------------------------------------------
// Minimized FULL / EMPTY detection on the 5-bit free-slot count q[4:0].
//
//   FULL  = 1 when q = 0  (00000)   FULL  = Q4'·Q3'·Q2'·Q1'·Q0'   (5-input NOR)
//   EMPTY = 1 when q = 20 (10100)   EMPTY = Q4·Q2
//
// The counter never holds 21..31, so those codes are DON'T CARES in the K-map.
// Among 0..20 only 20 has Q4 = 1 and Q2 = 1, so a single AND gate is enough.
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module comparator (
    input  wire [4:0] q,
    output wire       full,   // no free slot
    output wire       empty,  // every slot free
    output wire       avail   // A = FULL' (slot available)
);
    assign full  = ~q[4] & ~q[3] & ~q[2] & ~q[1] & ~q[0];
    assign empty =  q[4] &  q[2];
    assign avail = ~full;
endmodule
