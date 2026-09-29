// display_mux.v  (CO5)
// -----------------------------------------------------------------------------
// Time-multiplexed 2-digit 7-segment display.
//
// Both digits share the SAME segment wires and ONE decoder. A refresh counter
// switches quickly between them:
//   sel = 0 -> show the ONES digit (an[0] on)
//   sel = 1 -> show the TENS digit (an[1] on)
// Each digit is lit only half the time, but it switches hundreds of times per
// second, so the eye sees both digits on at once (persistence of vision).
//
// Basys 3: segments and digit enables (anodes) are ACTIVE-LOW.
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module display_mux #(
    parameter integer REFRESH_BITS = 18   // 2^17 clocks per digit ~ 1.3 ms at 100 MHz
) (
    input  wire       clk,
    input  wire       rst,
    input  wire [3:0] tens,
    input  wire [3:0] ones,
    output wire [6:0] seg_n,  // active-low segments, seg_n[0] = a
    output wire [3:0] an_n,   // active-low digit enables, an_n[0] = rightmost
    output wire       sel     // which digit is shown now
);
    reg [REFRESH_BITS - 1:0] refresh = 0;
    always @(posedge clk) begin
        if (rst) refresh <= 0;
        else     refresh <= refresh + 1'b1;
    end
    assign sel = refresh[REFRESH_BITS - 1];

    // 2-to-1 multiplexer (4 bits wide) chooses the digit to show
    wire [3:0] digit = sel ? tens : ones;

    // One shared decoder for both digits
    wire [6:0] seg;
    bcd_to_7seg decoder (.bcd(digit), .seg(seg));

    assign seg_n = ~seg;
    assign an_n  = sel ? 4'b1101 : 4'b1110;  // only one digit enabled at a time
endmodule
