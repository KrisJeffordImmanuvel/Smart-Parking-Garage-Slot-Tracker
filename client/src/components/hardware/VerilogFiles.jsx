// VerilogFiles.jsx  (CO5) - shows the Verilog source files from /hardware.
import { useEffect, useState } from 'react';
import { api } from '../../api';
import Card from '../Card.jsx';

// Show the files in the order a student would explain them.
const ORDER = [
  'parking_top.v',
  'comparator.v',
  'bcd_to_7seg.v',
  'updown_counter.v',
  'entry_fsm.v',
  'debounce.v',
  'display_mux.v',
  'gate_logic.v',
  'bin2bcd.v',
  'tb_parking_top.v',
  'basys3.xdc',
];

// Grey comments (// and ##), normal code.
function Code({ text }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-xl border border-slate-800 bg-black/60 p-4 text-[13px] leading-relaxed">
      {text.split('\n').map((line, i) => {
        const at = line.search(/\/\/|##/);
        const code = at === -1 ? line : line.slice(0, at);
        const comment = at === -1 ? '' : line.slice(at);
        return (
          <div key={i} className="whitespace-pre">
            <span className="mr-4 inline-block w-7 text-right text-slate-600 select-none">{i + 1}</span>
            <span className="text-slate-100">{code}</span>
            <span className="text-emerald-400/70">{comment}</span>
          </div>
        );
      })}
    </pre>
  );
}

export default function VerilogFiles() {
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState('parking_top.v');

  useEffect(() => {
    api
      .getVerilog()
      .then((list) => setFiles([...list].sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name))))
      .catch(() => {});
  }, []);

  const file = files.find((f) => f.name === open) || files[0];

  return (
    <Card title="Verilog source" subtitle="hardware/ folder: simulate with Icarus Verilog, or build for a Basys 3 FPGA in Vivado">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {files.map((f) => (
          <button
            key={f.name}
            onClick={() => setOpen(f.name)}
            className={
              'rounded-lg px-2.5 py-1 font-mono text-xs transition ' +
              (file?.name === f.name ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
            }
          >
            {f.name}
          </button>
        ))}
      </div>
      {file ? <Code text={file.code} /> : <p className="text-slate-500">No Verilog files found in /hardware.</p>}

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm">
        <p className="mb-2 font-semibold">Run the testbench (in the hardware folder)</p>
        <pre className="overflow-x-auto font-mono text-xs text-sky-300">
          {`iverilog -g2005 -o sim tb_parking_top.v parking_top.v gate_logic.v comparator.v updown_counter.v bin2bcd.v bcd_to_7seg.v debounce.v entry_fsm.v display_mux.v
vvp sim
gtkwave parking.vcd`}
        </pre>
        <p className="mt-2 text-slate-400">
          Expected: <span className="font-mono text-emerald-300">RESULT: 177 checks passed, 0 failed</span>
        </p>
      </div>
    </Card>
  );
}
