// entry_fsm.v  (CO5)
// -----------------------------------------------------------------------------
// Moore FSM that recognises ONE complete car entry and outputs one DEC pulse:
//   car at the gate (V) -> car under the barrier (S) -> car has passed
//
//   State  Code  Next state                         Output
//   IDLE    00   V·A  -> ARMED, else IDLE           DEC = 0
//   ARMED   01   S -> UNDER, V' -> IDLE, else ARMED  DEC = 0
//   UNDER   10   S' -> COUNT, else UNDER             DEC = 0
//   COUNT   11   -> IDLE                             DEC = 1 (one clock)
//
// When the garage is full (A = 0) the FSM never leaves IDLE, so no car is
// counted even if the emergency switch forces the barrier up.
// -----------------------------------------------------------------------------
`timescale 1ns / 1ps

module entry_fsm (
    input  wire       clk,
    input  wire       rst,
    input  wire       v,        // vehicle at gate (debounced)
    input  wire       a,        // slot available
    input  wire       s,        // vehicle under barrier (debounced)
    output wire       dec,      // count-down pulse for the counter
    output reg  [1:0] state = 2'b00
);
    localparam IDLE  = 2'b00;
    localparam ARMED = 2'b01;
    localparam UNDER = 2'b10;
    localparam COUNT = 2'b11;

    // Next-state logic (combinational)
    reg [1:0] next;
    always @(*) begin
        case (state)
            IDLE:    next = (v & a) ? ARMED : IDLE;
            ARMED:   next = s ? UNDER : (~v ? IDLE : ARMED);
            UNDER:   next = s ? UNDER : COUNT;
            COUNT:   next = IDLE;
            default: next = IDLE;
        endcase
    end

    // State register (sequential)
    always @(posedge clk) begin
        if (rst) state <= IDLE;
        else     state <= next;
    end

    // Moore output: depends only on the present state
    assign dec = (state == COUNT);
endmodule
