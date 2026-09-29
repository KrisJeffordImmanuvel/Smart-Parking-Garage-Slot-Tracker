// CounterTab.jsx  (CO3)
// -----------------------------------------------------------------------------
// The 5-bit synchronous up/down counter made of T flip-flops.
//   - live flip-flop outputs Q4..Q0
//   - what the next clock would do for a car ENTERING (DOWN) or EXITING (UP)
//   - buttons that really clock the counter (same as the Dashboard buttons)
//   - the T equations and the full state table
// -----------------------------------------------------------------------------
import { useState } from 'react';
import { api } from '../../api';
import Card from '../Card.jsx';
import Expr from './Expr.jsx';

const BITS = ['Q4', 'Q3', 'Q2', 'Q1', 'Q0'];
const TS = ['T4', 'T3', 'T2', 'T1', 'T0'];
const bitString = (bits) => BITS.map((b) => bits[b]).join('');

// A row of five flip-flop boxes. `toggled` marks the ones whose T input was 1.
function FlipFlops({ bits, toggled = {}, size = 'h-14 w-14 text-2xl' }) {
  return (
    <div className="flex gap-2">
      {BITS.map((name, i) => {
        const value = bits[name];
        const flip = toggled[TS[i]] === 1;
        return (
          <div key={name} className="flex flex-col items-center gap-1">
            <div
              className={
                `grid place-items-center rounded-lg border-2 font-mono font-bold transition ${size} ` +
                (value ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300' : 'border-slate-700 text-slate-500') +
                (flip ? ' ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : '')
              }
            >
              {value}
            </div>
            <span className="font-mono text-xs text-slate-400">{name}</span>
          </div>
        );
      })}
    </div>
  );
}

// Preview of one clock edge in one direction.
function NextClock({ title, step, color }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className={`font-semibold ${color}`}>{title}</p>
      <p className="mt-1 font-mono text-sm text-slate-400">
        EN = <b className="text-slate-100">{step.EN}</b>
        {step.EN === 0 && <span className="text-amber-300"> (counter stops here)</span>}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 font-mono text-sm">
        {TS.map((t) => (
          <span key={t} className={step.T[t] ? 'font-bold text-amber-300' : 'text-slate-500'}>
            {t}={step.T[t]}
          </span>
        ))}
      </div>
      <p className="mt-2 font-mono text-sm">
        {bitString(step.bits)} ({step.count}) → <b className="text-slate-100">{bitString(step.nextBits)}</b> ({step.next})
      </p>
    </div>
  );
}

export default function CounterTab({ design, status, onStatus }) {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null); // result of the last clock

  async function clock(direction) {
    setBusy(true);
    try {
      const result = direction === 'DOWN' ? await api.enter() : await api.exit();
      onStatus(result.status);
      setLast({ direction, ok: result.ok, message: result.message, counter: result.counter });
    } catch (err) {
      setLast({ direction, ok: false, message: err.message });
    }
    setBusy(false);
  }

  const { nextDown, nextUp, bits } = status.counter;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- Live flip-flops ---------- */}
        <Card title="Flip-flop outputs (live)" subtitle="Five T flip-flops share one clock, so they change together">
          <div className="flex flex-col items-center gap-4">
            <FlipFlops bits={bits} toggled={last?.ok ? last.counter?.T : {}} />
            <p className="font-mono text-slate-400">
              Q4 Q3 Q2 Q1 Q0 = <b className="text-slate-100">{bitString(bits)}</b>₂ ={' '}
              <b className="text-2xl text-emerald-300">{status.freeCount}</b> free slots
            </p>
            <div className="grid w-full grid-cols-2 gap-3">
              <button
                onClick={() => clock('DOWN')}
                disabled={busy}
                className="rounded-xl bg-emerald-500 px-3 py-2.5 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Car enters · clock DOWN
              </button>
              <button
                onClick={() => clock('UP')}
                disabled={busy}
                className="rounded-xl bg-sky-500 px-3 py-2.5 font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
              >
                Car exits · clock UP
              </button>
            </div>
            {last && (
              <p
                className={`w-full rounded-xl border px-3 py-2 text-sm ${
                  last.ok ? 'border-emerald-800 bg-emerald-950/50 text-emerald-200' : 'border-amber-800 bg-amber-950/50 text-amber-200'
                }`}
              >
                {last.ok && last.counter
                  ? `Clock ${last.direction}: ${bitString(last.counter.bits)} → ${bitString(last.counter.nextBits)}. Ringed flip-flops had T = 1 and toggled.`
                  : last.message}
              </p>
            )}
          </div>
        </Card>

        {/* ---------- Next clock preview ---------- */}
        <Card title="What the next clock edge will do" subtitle="U = 0 counts DOWN (car enters), U = 1 counts UP (car exits)">
          <div className="grid gap-3">
            <NextClock title="If a car ENTERS (DOWN, U = 0)" step={nextDown} color="text-emerald-300" />
            <NextClock title="If a car EXITS (UP, U = 1)" step={nextUp} color="text-sky-300" />
          </div>
        </Card>
      </div>

      {/* ---------- Equations ---------- */}
      <Card title="Design equations" subtitle="T flip-flop: Q(next) = Q XOR T. A bit toggles when every lower bit is 1 (up) or 0 (down).">
        <div className="grid gap-2 font-mono sm:grid-cols-2">
          {design.counter.equations.map((eq) => (
            <p key={eq} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <Expr>{eq}</Expr>
            </p>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-400">
          The count enable EN uses the comparator outputs: counting down is blocked when FULL = 1 (count 0) and counting up
          is blocked when EMPTY = 1 (count 20), so the count always stays between 0 and 20.
        </p>
      </Card>

      {/* ---------- State table ---------- */}
      <Card title="State table" subtitle={`Present state → next state for both directions. Highlighted row = count ${status.freeCount}.`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-center font-mono text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-700">
                <th className="py-2">Count</th>
                <th>Q4 Q3 Q2 Q1 Q0</th>
                <th className="border-l border-slate-700 text-emerald-300">DOWN: T4..T0</th>
                <th className="text-emerald-300">next</th>
                <th className="border-l border-slate-700 text-sky-300">UP: T4..T0</th>
                <th className="text-sky-300">next</th>
              </tr>
            </thead>
            <tbody>
              {design.counter.table.map((row) => {
                const active = row.count === status.freeCount;
                return (
                  <tr
                    key={row.count}
                    className={'border-b border-slate-800/70 ' + (active ? 'bg-emerald-500/20 outline outline-2 outline-emerald-400' : '')}
                  >
                    <td className="py-1">{row.count}</td>
                    <td>{bitString(row.down.bits)}</td>
                    <td className="border-l border-slate-700 text-slate-300">{TS.map((t) => row.down.T[t]).join('')}</td>
                    <td>{row.down.next}</td>
                    <td className="border-l border-slate-700 text-slate-300">{TS.map((t) => row.up.T[t]).join('')}</td>
                    <td>{row.up.next}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
