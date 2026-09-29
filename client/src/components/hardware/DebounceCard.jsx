// DebounceCard.jsx  (CO5)
// -----------------------------------------------------------------------------
// Timing diagram of one button press: the raw bouncing signal, the debounced
// (clean) signal and the one-clock pulse sent to the counter. The data comes
// from logic.debounce() on the server (same algorithm as hardware/debounce.v).
// -----------------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import Card from '../Card.jsx';

const ROWS = [
  { key: 'raw', label: 'raw btn_in', color: '#f87171' },
  { key: 'clean', label: 'btn_clean', color: '#34d399' },
  { key: 'pulse', label: 'btn_pulse', color: '#fbbf24' },
];

function Waveforms({ data }) {
  const n = data.raw.length;
  const left = 90;
  const width = 620;
  const step = (width - left - 10) / n;
  const rowHeight = 46;

  return (
    <svg viewBox={`0 0 ${width} ${ROWS.length * rowHeight + 20}`} className="w-full">
      {/* clock ticks */}
      {data.raw.map((_, i) => (
        <line key={i} x1={left + i * step} x2={left + i * step} y1="4" y2={ROWS.length * rowHeight + 4} stroke="#1e293b" />
      ))}
      {ROWS.map((row, r) => {
        const base = 10 + r * rowHeight + 30; // y of logic 0
        const high = base - 24; //                y of logic 1
        let d = '';
        data[row.key].forEach((v, i) => {
          const y = v ? high : base;
          const x = left + i * step;
          d += i === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
          d += ` L${x + step} ${y}`;
        });
        return (
          <g key={row.key}>
            <text x="4" y={base - 8} fontSize="12" fontFamily="monospace" fill="#cbd5e1">
              {row.label}
            </text>
            <path d={d} fill="none" stroke={row.color} strokeWidth="2.2" />
          </g>
        );
      })}
    </svg>
  );
}

export default function DebounceCard() {
  const [data, setData] = useState(null);

  const press = useCallback(() => {
    api.getDebounceDemo().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    press();
  }, [press]);

  return (
    <Card
      title="Debouncing · debounce.v"
      subtitle="A mechanical button bounces (0101…) for a few milliseconds when pressed and released"
      action={
        <button onClick={press} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700">
          🔘 Press the button again
        </button>
      }
    >
      {data && (
        <>
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <Waveforms data={data} />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm">
              Raw signal: <b className="text-red-300">{data.risingEdges} rising edges</b>. Without debouncing, the
              counter would count {data.risingEdges} cars for one press!
            </p>
            <p className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm">
              Debounced: the output changes only after {data.stableCount} equal samples in a row →{' '}
              <b className="text-emerald-300">
                {data.pulses} pulse{data.pulses === 1 ? '' : 's'}
              </b>{' '}
              (pulse = clean · previous').
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
