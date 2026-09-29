# Hardware (Verilog): CO1, CO3, CO5

The same parking-garage logic as the web app, written in Verilog for an FPGA
(pin file for the Digilent **Basys 3**).

```
btnC (V) ─┐
btnU (S) ─┼─► debounce ─► entry_fsm ──DEC──► updown_counter ──q[4:0]──► comparator ─► FULL / EMPTY / A
btnR (exit)┘                                  ▲ up (exit pulse)     │
                                              └──────────────────────┘
q[4:0] ─► bin2bcd ─► display_mux (2:1 mux + ONE bcd_to_7seg) ─► seg[6:0], an[3:0]
```

| File | CO | What it is |
| --- | --- | --- |
| `comparator.v` | CO1 | Minimized `FULL = Q4'Q3'Q2'Q1'Q0'`, `EMPTY = Q4·Q2` (21–31 are don't cares) |
| `bcd_to_7seg.v` | CO1 | Minimized BCD-to-7-segment decoder (10–15 are don't cares) |
| `gate_logic.v` | CO1 | `UP = S + E + V·A`, `GREEN = UP`, `RED = UP'`, `FULL = V·A'·E'·S'` |
| `updown_counter.v` | CO3 | 5-bit synchronous up/down counter from T flip-flops, stops at 0 and 20 |
| `debounce.v` | CO5 | 2-FF synchronizer + stability counter + one-pulse |
| `entry_fsm.v` | CO5 | Moore FSM IDLE → ARMED → UNDER → COUNT: one DEC pulse per car |
| `display_mux.v` | CO5 | Time-multiplexed 2-digit display sharing one decoder |
| `bin2bcd.v` | | 0..20 → tens and ones BCD digits |
| `parking_top.v` | | Top level: connects everything to the board pins |
| `tb_parking_top.v` | | Self-checking testbench (177 checks) |
| `basys3.xdc` | | Pin constraints for the Basys 3 |

## Simulate (Icarus Verilog + GTKWave)

Install [Icarus Verilog](https://bleyer.org/icarus/) (Windows installer, it includes GTKWave). Then, in this folder:

```bash
iverilog -g2005 -o sim tb_parking_top.v parking_top.v gate_logic.v comparator.v updown_counter.v bin2bcd.v bcd_to_7seg.v debounce.v entry_fsm.v display_mux.v
vvp sim
gtkwave parking.vcd
```

Expected output:

```
RESULT: 177 checks passed, 0 failed
```

The testbench checks:
- the decoder for every digit, the comparator for 0–20, and all 16 gate-logic rows;
- cars entering and exiting with **bouncing buttons** (each press is counted once);
- a car that reverses away without being counted;
- the counter stopping at 0 when full and at 20 when empty;
- the emergency override;
- the multiplexed display.

In GTKWave, add `dut.q`, `dut.state`, `dut.v`, `dut.s`, `dut.dec`, `btnC` and `dut.db_v.btn_clean` to see the
bouncing input, the clean signal, the FSM states and the counter together.

## Run on a Basys 3 (Vivado)

1. Create a project for the Basys 3 part `xc7a35tcpg236-1`.
2. Add every `.v` file **except** `tb_parking_top.v` as design sources, and `basys3.xdc` as constraints.
3. Set `parking_top` as the top module, then run *Generate Bitstream* and program the board.
4. Controls:
   - **btnD:** reset. The display shows `20`.
   - **Car entering:** hold **btnC** (car at gate, V), press **btnU** (under barrier, S), release btnC, release btnU. The count goes down by 1.
   - **btnR:** a car exits. The count goes up by 1.
   - **sw0:** emergency override (E).
5. LEDs, from `led[0]` upward: UP, GREEN, RED, gate FULL, comparator FULL, EMPTY, FSM state (2 LEDs),
   counter Q0–Q4 (5 LEDs), V, S, E.
