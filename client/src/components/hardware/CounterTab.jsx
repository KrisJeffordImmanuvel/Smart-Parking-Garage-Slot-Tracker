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
function FlipFlops({ bits, toggled = {}, size = 'h-11 w-11 text-xl sm:h-14 sm:w-14 sm:text-2xl' }) {
  return (
    <div className="flex gap-1.5 sm:gap-2">
      {BITS.map((name, i) => {
        const value = bits[name];
        const flip = toggled[TS[i]] === 1;
        return (
          <div key={name} className="flex flex-col items-center gap-1">
            <div
              className={
                `grid place-items-center rounded-lg border-2 font-mono font-bold transition ${size} ` +
                (value ? 'border-cyprus bg-cyprus/10 text-cyprus' : 'border-line text-muted') +
                (flip ? ' ring-2 ring-olive ring-offset-2 ring-offset-paper' : '')
              }
            >
              {value}
            </div>
            <span className="font-mono text-xs text-muted">{name}</span>
          </div>
        );
      })}
    </div>
  );
}

// Preview of one clock edge in one direction.
function NextClock({ title, step, color }) {
  return (
    <div className="rounded-xl border border-line bg-beige p-4">
      <p className={`font-semibold ${color}`}>{title}</p>
      <p className="mt-1 font-mono text-sm text-muted">
        EN = <b className="text-charcoal">{step.EN}</b>
        {step.EN === 0 && <span className="text-olive"> (counter stops here)</span>}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 font-mono text-sm">
        {TS.map((t) => (
          <span key={t} className={step.T[t] ? 'font-bold text-olive' : 'text-muted'}>
            {t}={step.T[t]}
          </span>
        ))}
      </div>
      <p className="mt-2 font-mono text-sm">
        {bitString(step.bits)} ({step.count}) → <b className="text-charcoal">{bitString(step.nextBits)}</b> ({step.next})
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
            <p className="font-mono text-muted">
              Q4 Q3 Q2 Q1 Q0 = <b className="text-charcoal">{bitString(bits)}</b>₂ ={' '}
              <b className="text-2xl text-cyprus">{status.freeCount}</b> free slots
            </p>
            <div className="grid w-full grid-cols-2 gap-3">
              <button
                onClick={() => clock('DOWN')}
                disabled={busy}
                className="rounded-xl bg-lime px-3 py-2.5 font-semibold text-charcoal hover:bg-lime/85 disabled:opacity-50"
              >
                Car enters · clock DOWN
              </button>
              <button
                onClick={() => clock('UP')}
                disabled={busy}
                className="rounded-xl bg-cyprus px-3 py-2.5 font-semibold text-sand hover:bg-cyprus/90 disabled:opacity-50"
              >
                Car exits · clock UP
              </button>
            </div>
            {last && (
              <p
                className={`w-full rounded-xl border px-3 py-2 text-sm ${
                  last.ok ? 'border-cyprus/30 bg-cyprus/5 text-cyprus' : 'border-alert/30 bg-alert/10 text-alert'
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
            <NextClock title="If a car ENTERS (DOWN, U = 0)" step={nextDown} color="text-cyprus" />
            <NextClock title="If a car EXITS (UP, U = 1)" step={nextUp} color="text-cyprus" />
          </div>
        </Card>
      </div>

      {/* ---------- Equations ---------- */}
      <Card title="Design equations" subtitle="T flip-flop: Q(next) = Q XOR T. A bit toggles when every lower bit is 1 (up) or 0 (down).">
        <div className="grid gap-2 font-mono sm:grid-cols-2">
          {design.counter.equations.map((eq) => (
            <p key={eq} className="rounded-lg border border-line bg-beige px-3 py-2">
              <Expr>{eq}</Expr>
            </p>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          The count enable EN uses the comparator outputs: counting down is blocked when FULL = 1 (count 0) and counting up
          is blocked when EMPTY = 1 (count 20), so the count always stays between 0 and 20.
        </p>
      </Card>

      {/* ---------- State table ---------- */}
      <Card title="State table" subtitle={`Present state → next state for both directions. Highlighted row = count ${status.freeCount}.`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-center font-mono text-sm">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="py-2">Count</th>
                <th>Q4 Q3 Q2 Q1 Q0</th>
                <th className="border-l border-line text-cyprus">DOWN: T4..T0</th>
                <th className="text-cyprus">next</th>
                <th className="border-l border-line text-cyprus">UP: T4..T0</th>
                <th className="text-cyprus">next</th>
              </tr>
            </thead>
            <tbody>
              {design.counter.table.map((row) => {
                const active = row.count === status.freeCount;
                return (
                  <tr
                    key={row.count}
                    className={'border-b border-line/70 ' + (active ? 'bg-cyprus/10 outline outline-2 outline-cyprus' : '')}
                  >
                    <td className="py-1">{row.count}</td>
                    <td>{bitString(row.down.bits)}</td>
                    <td className="border-l border-line text-charcoal/80">{TS.map((t) => row.down.T[t]).join('')}</td>
                    <td>{row.down.next}</td>
                    <td className="border-l border-line text-charcoal/80">{TS.map((t) => row.up.T[t]).join('')}</td>
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
