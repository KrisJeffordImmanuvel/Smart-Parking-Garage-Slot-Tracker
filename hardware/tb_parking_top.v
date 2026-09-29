// tb_parking_top.v
// -----------------------------------------------------------------------------
// Self-checking testbench. Run it with Icarus Verilog:
//   iverilog -g2005 -o sim tb_parking_top.v parking_top.v gate_logic.v comparator.v \
//            updown_counter.v bin2bcd.v bcd_to_7seg.v debounce.v entry_fsm.v display_mux.v
//   vvp sim
// It prints PASS/FAIL for every check and writes parking.vcd for GTKWave.
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module tb_parking_top;
    // Small parameters so the simulation is fast
    localparam integer DB = 4;   // debounce: 4 stable clocks

    reg clk = 0;
    reg btnC = 0, btnU = 0, btnR = 0, btnD = 0;
    reg [0:0] sw = 0;
    wire [6:0] seg;
    wire [3:0] an;
    wire [15:0] led;

    parking_top #(.DEBOUNCE_COUNT(DB), .REFRESH_BITS(3)) dut (
        .clk(clk), .btnC(btnC), .btnU(btnU), .btnR(btnR), .btnD(btnD),
        .sw(sw), .seg(seg), .an(an), .led(led));

    always #5 clk = ~clk;   // 100 MHz

    integer passed = 0, failed = 0;
    task check(input condition, input [8*60-1:0] message);
        begin
            if (condition) passed = passed + 1;
            else begin
                failed = failed + 1;
                $display("FAIL: %0s  (time %0t, count %0d)", message, $time, dut.q);
            end
        end
    endtask

    // ---- drive one button with contact bounce, then hold it stable ----
    task drive(input integer which, input value);
        case (which)
            0: btnC = value;
            1: btnU = value;
            2: btnR = value;
        endcase
    endtask

    task set_button(input integer which, input value);
        integer i;
        begin
            for (i = 0; i < 6; i = i + 1) begin   // bounce: value, ~value, value ...
                drive(which, (i % 2) ? ~value : value);
                @(posedge clk);
            end
            drive(which, value);
            repeat (DB + 8) @(posedge clk);      // stable long enough to be accepted
        end
    endtask

    // One car driving in: V=1 -> S=1 -> V=0 -> S=0
    task car_enter;
        begin
            set_button(0, 1);
            set_button(1, 1);
            set_button(0, 0);
            set_button(1, 0);
            repeat (4) @(posedge clk);
        end
    endtask

    task car_exit;
        begin
            set_button(2, 1);
            set_button(2, 0);
            repeat (4) @(posedge clk);
        end
    endtask

    // ---- stand-alone combinational blocks for exhaustive tests ----
    reg  [3:0] bcd_in;
    wire [6:0] seg_out;
    bcd_to_7seg t_dec (.bcd(bcd_in), .seg(seg_out));

    reg  [4:0] cmp_q;
    wire cmp_full, cmp_empty, cmp_avail;
    comparator t_cmp (.q(cmp_q), .full(cmp_full), .empty(cmp_empty), .avail(cmp_avail));

    reg  gv, ga, ge, gs;
    wire g_up, g_green, g_red, g_full;
    gate_logic t_gate (.v(gv), .a(ga), .e(ge), .s(gs),
                       .up(g_up), .green(g_green), .red(g_red), .full(g_full));

    // expected segments {g,f,e,d,c,b,a} for digits 0..9
    function [6:0] expected_seg(input [3:0] digit);
        case (digit)
            0: expected_seg = 7'b0111111;
            1: expected_seg = 7'b0000110;
            2: expected_seg = 7'b1011011;
            3: expected_seg = 7'b1001111;
            4: expected_seg = 7'b1100110;
            5: expected_seg = 7'b1101101;
            6: expected_seg = 7'b1111101;
            7: expected_seg = 7'b0000111;
            8: expected_seg = 7'b1111111;
            9: expected_seg = 7'b1101111;
            default: expected_seg = 7'b0000000;
        endcase
    endfunction

    integer i, before;

    initial begin
        $dumpfile("parking.vcd");
        $dumpvars(0, tb_parking_top);

        // ================= CO1: combinational blocks =================
        for (i = 0; i <= 9; i = i + 1) begin
            bcd_in = i; #1;
            check(seg_out == expected_seg(i), "BCD-to-7-segment decoder digit");
        end
        for (i = 0; i <= 20; i = i + 1) begin
            cmp_q = i; #1;
            check(cmp_full  == (i == 0),  "comparator FULL");
            check(cmp_empty == (i == 20), "comparator EMPTY");
            check(cmp_avail == (i != 0),  "comparator A");
        end
        for (i = 0; i < 16; i = i + 1) begin
            {gv, ga, ge, gs} = i; #1;
            check(g_up   == (gs | ge | (gv & ga)),     "gate UP = S + E + V.A");
            check(g_red  == ~g_up,                     "gate RED = UP'");
            check(g_full == (gv & ~ga & ~ge & ~gs),    "gate FULL = V.A'.E'.S'");
        end

        // ================= reset =================
        btnD = 1; repeat (4) @(posedge clk); btnD = 0; repeat (4) @(posedge clk);
        check(dut.q == 20,     "reset: 20 free slots");
        check(dut.empty == 1,  "reset: EMPTY lamp on");
        check(dut.full == 0,   "reset: FULL lamp off");

        // ================= CO3 + CO5: cars entering / exiting =================
        car_enter; car_enter; car_enter;
        check(dut.q == 17,     "3 cars in: count 17");
        check(dut.tens == 1 && dut.ones == 7, "BCD digits 1 and 7");

        car_exit;
        check(dut.q == 18,     "1 car out: count 18 (bouncing button counted once)");

        // car arrives and reverses away without driving under the barrier
        set_button(0, 1); set_button(0, 0); repeat (4) @(posedge clk);
        check(dut.q == 18,     "car that reverses is not counted");
        check(dut.state == 2'b00, "FSM back in IDLE");

        // fill the garage completely
        for (i = 0; i < 18; i = i + 1) car_enter;
        check(dut.q == 0,      "garage full: count 0");
        check(dut.full == 1,   "comparator FULL lamp on");

        // one more car while full: barrier stays down, count stays 0
        set_button(0, 1);
        check(dut.up == 0 && dut.gate_full == 1, "full: barrier DOWN, gate FULL on");
        set_button(1, 1); set_button(0, 0); set_button(1, 0); repeat (4) @(posedge clk);
        check(dut.q == 0,      "full: count never goes below 0");

        // emergency override: barrier up, but still no count
        sw[0] = 1; repeat (4) @(posedge clk);
        check(dut.up == 1,     "E = 1 forces the barrier UP");
        car_enter;
        check(dut.q == 0,      "override while full: count stays 0");
        sw[0] = 0; repeat (4) @(posedge clk);

        // empty the garage and try one extra exit
        for (i = 0; i < 21; i = i + 1) car_exit;
        check(dut.q == 20,     "count never goes above 20");
        check(dut.empty == 1,  "EMPTY lamp on again");

        // ================= CO5: display multiplexing =================
        // q = 20 -> tens digit 2 on an[1], ones digit 0 on an[0]
        for (i = 0; i < 40; i = i + 1) begin
            @(negedge clk);
            if (an == 4'b1110) check(seg == ~expected_seg(0), "mux: ones digit shows 0");
            else if (an == 4'b1101) check(seg == ~expected_seg(2), "mux: tens digit shows 2");
            else check(0, "mux: exactly one digit enabled");
        end

        $display("--------------------------------------------");
        $display("RESULT: %0d checks passed, %0d failed", passed, failed);
        $display("--------------------------------------------");
        $finish;
    end
endmodule
