// bin2bcd.v
// -----------------------------------------------------------------------------
// Converts the 5-bit count (0..20) into two BCD digits for the display.
//   e.g. 17 = 10001  ->  tens = 0001, ones = 0111
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module bin2bcd (
    input  wire [4:0] bin,
    output reg  [3:0] tens,
    output reg  [3:0] ones
);
    reg [4:0] rest;

    always @(*) begin
        if (bin >= 5'd20) begin
            tens = 4'd2;
            rest = bin - 5'd20;
        end else if (bin >= 5'd10) begin
            tens = 4'd1;
            rest = bin - 5'd10;
        end else begin
            tens = 4'd0;
            rest = bin;
        end
        ones = rest[3:0];
    end
endmodule
