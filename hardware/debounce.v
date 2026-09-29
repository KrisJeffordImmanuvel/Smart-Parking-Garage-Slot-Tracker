// debounce.v  (CO5)
// -----------------------------------------------------------------------------
// Push-button debouncer + one-pulse generator.
//
// 1. Synchronizer: two flip-flops bring the asynchronous button into the
//    clock domain (prevents metastability).
// 2. Debounce: the clean output only changes after the input has stayed at the
//    new value for STABLE_COUNT clocks in a row (contact bounce is ignored).
// 3. One-pulse: pulse = clean · clean_previous'  -> exactly one clock-wide
//    pulse per press, so one press = one count.
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module debounce #(
    parameter integer STABLE_COUNT = 1000000   // 10 ms at 100 MHz
) (
    input  wire clk,
    input  wire rst,
    input  wire btn_in,      // raw, bouncing button / sensor
    output reg  btn_clean,   // debounced level
    output wire btn_pulse    // one clock pulse on each press
);
    // 1. two-flip-flop synchronizer
    reg sync0, sync1;
    always @(posedge clk) begin
        if (rst) begin
            sync0 <= 1'b0;
            sync1 <= 1'b0;
        end else begin
            sync0 <= btn_in;
            sync1 <= sync0;
        end
    end

    // 2. stability counter
    reg [$clog2(STABLE_COUNT + 1) - 1:0] count;
    always @(posedge clk) begin
        if (rst) begin
            btn_clean <= 1'b0;
            count     <= 0;
        end else if (sync1 != btn_clean) begin
            if (count == STABLE_COUNT - 1) begin
                btn_clean <= sync1;   // input was stable long enough
                count     <= 0;
            end else begin
                count <= count + 1'b1;
            end
        end else begin
            count <= 0;               // bounced back: start counting again
        end
    end

    // 3. one-pulse (rising-edge detector)
    reg previous;
    always @(posedge clk) begin
        if (rst) previous <= 1'b0;
        else     previous <= btn_clean;
    end
    assign btn_pulse = btn_clean & ~previous;
endmodule
