// bcd_to_7seg.v  (CO1)
// -----------------------------------------------------------------------------
// Minimized BCD-to-7-segment decoder (active-HIGH outputs).
// Inputs A B C D = bcd[3:0]. Codes 10..15 are DON'T CARES.
//
//        aaa         a = A + C + BD + B'D'
//       f   b        b = B' + C'D' + CD
//        ggg         c = B + C' + D
//       e   c        d = A + B'D' + B'C + CD' + BC'D
//        ddd         e = B'D' + CD'
//                    f = A + C'D' + BC' + BD'
//                    g = A + B'C + BC' + CD'
//
// Output order matches the Basys 3 board: seg[0] = a ... seg[6] = g.
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module bcd_to_7seg (
    input  wire [3:0] bcd,
    output wire [6:0] seg
);
    wire A = bcd[3];
    wire B = bcd[2];
    wire C = bcd[1];
    wire D = bcd[0];

    wire a = A | C | (B & D) | (~B & ~D);
    wire b = ~B | (~C & ~D) | (C & D);
    wire c = B | ~C | D;
    wire d = A | (~B & ~D) | (~B & C) | (C & ~D) | (B & ~C & D);
    wire e = (~B & ~D) | (C & ~D);
    wire f = A | (~C & ~D) | (B & ~C) | (B & ~D);
    wire g = A | (~B & C) | (B & ~C) | (C & ~D);

    assign seg = {g, f, e, d, c, b, a};
endmodule
