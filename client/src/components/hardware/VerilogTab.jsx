// VerilogTab.jsx  (CO5) - block diagram, FSM, debouncer, multiplexing, source.
import Card from '../Card.jsx';
import FsmCard from './FsmCard.jsx';
import DebounceCard from './DebounceCard.jsx';
import MuxCard from './MuxCard.jsx';
import VerilogFiles from './VerilogFiles.jsx';

const BLOCKS = [
  { name: 'Buttons / sensors', file: 'btnC, btnU, btnR', co: '' },
  { name: 'Debounce', file: 'debounce.v', co: 'CO5' },
  { name: 'Entry FSM', file: 'entry_fsm.v', co: 'CO5' },
  { name: 'Up/down counter', file: 'updown_counter.v', co: 'CO3' },
  { name: 'Comparator + BCD', file: 'comparator.v, bin2bcd.v', co: 'CO1' },
  { name: 'MUX + 7-seg decoder', file: 'display_mux.v, bcd_to_7seg.v', co: 'CO1 · CO5' },
  { name: '2-digit display', file: 'seg[6:0], an[3:0]', co: '' },
];

export default function VerilogTab({ design, status }) {
  return (
    <div className="space-y-6">
      <Card title="Block diagram · parking_top.v" subtitle="How the Verilog modules connect on the FPGA">
        <div className="flex flex-wrap items-stretch gap-2">
          {BLOCKS.map((block, i) => (
            <div key={block.name} className="flex items-center gap-2">
              <div className="rounded-xl border border-line bg-beige px-3 py-2">
                <p className="text-sm font-semibold">{block.name}</p>
                <p className="font-mono text-[11px] text-muted">{block.file}</p>
                {block.co && <p className="text-[11px] font-semibold text-cyprus">{block.co}</p>}
              </div>
              {i < BLOCKS.length - 1 && <span className="text-muted">➜</span>}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          The comparator's FULL/EMPTY outputs feed back into the counter's enable, and A = FULL' goes to the FSM and the
          barrier logic (UP = S + E + V·A).
        </p>
      </Card>

      <FsmCard states={design.fsm} liveA={status.inputs.A} />
      <DebounceCard />
      <MuxCard display={status.display} />
      <VerilogFiles />
    </div>
  );
}
