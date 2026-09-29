// parking_top.v  (CO5)
// -----------------------------------------------------------------------------
// TOP LEVEL of the Smart Parking Garage for an FPGA board (Basys 3 pin names).
//
//   buttons/sensors -> debounce -> entry FSM -> up/down counter -> comparator
//                                                          |
//                                   bin2bcd -> display_mux (mux + 7-seg decoder)
//
//   btnC  = V  vehicle at gate          (hold while the car waits)
//   btnU  = S  vehicle under barrier    (hold while the car is under the arm)
//   btnR  =    exit sensor              (press once per car leaving)
//   btnD  =    reset (all 20 slots free)
//   sw[0] = E  emergency override
//
//   LEDs: 0 UP, 1 GREEN, 2 RED, 3 gate FULL, 4 comparator FULL, 5 EMPTY,
//         7:6 FSM state, 12:8 counter Q4..Q0, 13 V, 14 S, 15 E
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module parking_top #(
    parameter integer DEBOUNCE_COUNT = 1000000, // 10 ms at 100 MHz
    parameter integer REFRESH_BITS   = 18       // display refresh
) (
    input  wire        clk,     // 100 MHz board clock
    input  wire        btnC,
    input  wire        btnU,
    input  wire        btnR,
    input  wire        btnD,
    input  wire [0:0]  sw,
    output wire [6:0]  seg,     // active-low segments a..g
    output wire [3:0]  an,      // active-low digit enables
    output wire [15:0] led
);
    // ---- reset and emergency switch: 2-flip-flop synchronizers ----
    reg rst_s0 = 1'b0, rst = 1'b0;
    reg e_s0 = 1'b0, e = 1'b0;
    always @(posedge clk) begin
        rst_s0 <= btnD;  rst <= rst_s0;
        e_s0   <= sw[0]; e   <= e_s0;
    end

    // ---- debounced sensors ----
    wire v, s, exit_pulse;
    debounce #(.STABLE_COUNT(DEBOUNCE_COUNT)) db_v (.clk(clk), .rst(rst), .btn_in(btnC), .btn_clean(v), .btn_pulse());
    debounce #(.STABLE_COUNT(DEBOUNCE_COUNT)) db_s (.clk(clk), .rst(rst), .btn_in(btnU), .btn_clean(s), .btn_pulse());
    debounce #(.STABLE_COUNT(DEBOUNCE_COUNT)) db_x (.clk(clk), .rst(rst), .btn_in(btnR), .btn_clean(),  .btn_pulse(exit_pulse));

    // ---- counter + comparator (the comparator output feeds back as enable) ----
    wire [4:0] q;
    wire full, empty, avail, dec;
    comparator     cmp (.q(q), .full(full), .empty(empty), .avail(avail));
    updown_counter cnt (.clk(clk), .rst(rst), .up(exit_pulse), .down(dec),
                        .full(full), .empty(empty), .q(q));

    // ---- entry FSM: one DEC pulse per car that drives in ----
    wire [1:0] state;
    entry_fsm fsm (.clk(clk), .rst(rst), .v(v), .a(avail), .s(s), .dec(dec), .state(state));

    // ---- barrier controller ----
    wire up, green, red, gate_full;
    gate_logic gate (.v(v), .a(avail), .e(e), .s(s),
                     .up(up), .green(green), .red(red), .full(gate_full));

    // ---- display: binary -> BCD -> multiplexed 7-segment ----
    wire [3:0] tens, ones;
    wire       sel;
    bin2bcd b2b (.bin(q), .tens(tens), .ones(ones));
    display_mux #(.REFRESH_BITS(REFRESH_BITS)) mux (
        .clk(clk), .rst(rst), .tens(tens), .ones(ones), .seg_n(seg), .an_n(an), .sel(sel));

    // ---- LEDs ----
    assign led = {e, s, v, q, state, empty, full, gate_full, red, green, up};
endmodule
