// MuxCard.jsx  (CO5)
// -----------------------------------------------------------------------------
// Display multiplexing (hardware/display_mux.v): both digits share ONE decoder
// and the same 7 segment wires. A select signal switches between the digits;
// only one digit is lit at any moment. Slow it down to see it, speed it up and
// your eyes see both digits at once (persistence of vision).
// -----------------------------------------------------------------------------
import { useEffect, useState } from 'react';
import Card from '../Card.jsx';
import { Digit } from '../SevenSegment.jsx';

const SPEEDS = [1, 2, 5, 10, 25, 60]; // full refresh cycles per second (Hz)
const OFF = { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0 };

export default function MuxCard({ display }) {
  const [speedIndex, setSpeedIndex] = useState(0);
  const [sel, setSel] = useState(0); // 0 = ones digit, 1 = tens digit
  const hz = SPEEDS[speedIndex];

  // Toggle the select line twice per refresh cycle.
  useEffect(() => {
    const timer = setInterval(() => setSel((s) => 1 - s), 1000 / (2 * hz));
    return () => clearInterval(timer);
  }, [hz]);

  const shown = sel ? display.tens : display.ones; // 2-to-1 multiplexer
  const segBits = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((s) => shown.segments[s]).join('');

  return (
    <Card title="Display multiplexing · display_mux.v" subtitle="Two digits, one decoder, one set of segment wires">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2 rounded-xl border border-slate-700 bg-black px-4 py-3">
            <div className="flex flex-col items-center">
              <Digit segments={sel ? display.tens.segments : OFF} className="h-24 w-14" />
              <span className={`mt-1 font-mono text-xs ${sel ? 'text-emerald-300' : 'text-slate-600'}`}>an[1]</span>
            </div>
            <div className="flex flex-col items-center">
              <Digit segments={sel ? OFF : display.ones.segments} className="h-24 w-14" />
              <span className={`mt-1 font-mono text-xs ${sel ? 'text-slate-600' : 'text-emerald-300'}`}>an[0]</span>
            </div>
          </div>
          <label className="w-full text-sm text-slate-300">
            Refresh rate: <b className="text-amber-300">{hz} Hz</b>
            <input
              type="range"
              min="0"
              max={SPEEDS.length - 1}
              value={speedIndex}
              onChange={(e) => setSpeedIndex(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500"
            />
          </label>
          <p className="text-xs text-slate-500">
            At 1–5 Hz you can see the digits take turns. From about 50 Hz they look steady. The FPGA uses about 380 Hz.
          </p>
        </div>

        <div className="space-y-2 font-mono text-sm">
          <p>
            sel = <b className="text-amber-300">{sel}</b> → showing the <b>{sel ? 'TENS' : 'ONES'}</b> digit
          </p>
          <p>
            an[1:0] = <b>{sel ? '01' : '10'}</b> <span className="text-slate-500">(active-low: 0 = digit on)</span>
          </p>
          <p>
            MUX output (BCD) = <b>{shown.bcd}</b> = {shown.digit}
          </p>
          <p>
            decoder a..g = <b className="text-emerald-300">{segBits}</b>
          </p>
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 font-sans text-sm text-slate-400">
            Without multiplexing: 2 decoders and 14 segment wires. With multiplexing: <b className="text-slate-200">1 decoder</b>, 7
            segment wires and 2 digit-enable wires. The saving grows with more digits: a 4-digit display still needs only 7 + 4
            wires.
          </div>
        </div>
      </div>
    </Card>
  );
}
