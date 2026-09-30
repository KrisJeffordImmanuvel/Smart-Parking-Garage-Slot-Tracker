// LogicPanel.jsx
// -----------------------------------------------------------------------------
// Shows the digital logic "inside" the garage:
//   - live values of the inputs V, A, E, S and outputs UP, GREEN, RED, FULL
//   - the Boolean equations with the live values substituted
//   - the comparator and the BCD-to-7-segment decoder
//   - the 16-row truth table with the current row highlighted
// -----------------------------------------------------------------------------
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useParkingStatus } from '../hooks/useParkingStatus';
import Card from '../components/Card.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import { Digit } from '../components/SevenSegment.jsx';

// Text of the variables with a bar on top (complement / NOT), e.g. A'.
const Not = ({ children }) => <span className="overline">{children}</span>;

// A big square showing one bit (1 = lit, 0 = dark).
// Colours from the palette in index.css.
function BitBox({ name, value, description, color = 'cyprus' }) {
  const lit = {
    cyprus: 'border-cyprus bg-cyprus/10 text-cyprus', // inputs and UP
    lime: 'border-olive bg-lime text-charcoal', //       GREEN light
    alert: 'border-alert bg-alert/10 text-alert', //     RED light
    olive: 'border-olive bg-lime/40 text-olive', //      car turned away (FULL)
  }[color];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-beige p-3">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border-2 font-mono text-2xl font-bold ${
          value ? lit : 'border-line text-muted'
        }`}
      >
        {value}
      </div>
      <div>
        <p className="font-mono font-bold">{name}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}

export default function LogicPanel() {
  const { status, setStatus, error } = useParkingStatus();
  const [truthTable, setTruthTable] = useState([]);

  // The truth table never changes, so it is loaded only once.
  useEffect(() => {
    api.getTruthTable().then(setTruthTable).catch(() => {});
  }, []);

  if (!status) {
    return <p className="text-muted">{error || 'Loading logic values...'}</p>;
  }

  const { V, A, E, S } = status.inputs;
  const { UP, GREEN, RED, FULL } = status.gate;
  const currentRow = V * 8 + A * 4 + E * 2 + S; // binary VAES -> row number 0..15

  async function setSwitch(name, value) {
    try {
      const result = await api.setSwitch({ [name]: value ? 1 : 0 });
      setStatus(result.status);
    } catch {
      /* the polling hook shows connection errors */
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cyprus sm:text-3xl">Logic Panel</h1>
        <p className="text-muted">The Boolean logic that controls the entry barrier, updated live.</p>
      </div>

      {error && <p className="rounded-xl border border-alert/30 bg-alert/10 p-3 text-alert">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- Inputs ---------- */}
        <Card title="Inputs" subtitle="Flip V, E or S to try every row of the truth table">
          <div className="grid gap-3 sm:grid-cols-2">
            <BitBox name="V" value={V} description="Vehicle at gate" />
            <BitBox name="A" value={A} description={`Slot available (free = ${status.freeCount})`} />
            <BitBox name="E" value={E} description="Emergency override" />
            <BitBox name="S" value={S} description="Vehicle under barrier" />
          </div>
          <div className="mt-4 grid gap-2">
            <ToggleSwitch label="V switch" description="Pretend a car is waiting at the gate" checked={V === 1} onChange={(v) => setSwitch('V', v)} />
            <ToggleSwitch label="E switch" description="Emergency override" checked={E === 1} onChange={(v) => setSwitch('E', v)} />
            <ToggleSwitch label="S switch" description="Safety sensor under the barrier" checked={S === 1} onChange={(v) => setSwitch('S', v)} />
          </div>
          <p className="mt-3 text-xs text-muted">
            A cannot be switched: it comes from the comparator (A = 1 while the free count is not 0). Fill every slot
            on the Dashboard to make A = 0.
          </p>
        </Card>

        {/* ---------- Outputs + equations ---------- */}
        <div className="space-y-6">
          <Card title="Outputs">
            <div className="grid gap-3 sm:grid-cols-2">
              <BitBox name="UP" value={UP} description="Barrier raised" color="cyprus" />
              <BitBox name="GREEN" value={GREEN} description="Green light" color="lime" />
              <BitBox name="RED" value={RED} description="Red light" color="alert" />
              <BitBox name="FULL" value={FULL} description="Car turned away" color="olive" />
            </div>
          </Card>

          <Card title="Boolean Equations" subtitle="+ = OR,  · = AND,  bar = NOT">
            <div className="space-y-3 font-mono text-sm sm:text-base">
              <div className="rounded-xl border border-cyprus/30 bg-cyprus/5 p-3">
                <p className="text-lg font-bold text-cyprus">UP = S + E + V·A</p>
                <p className="text-muted">
                  = {S} + {E} + {V}·{A} = <span className="font-bold text-charcoal">{UP}</span>
                </p>
              </div>
              <p>
                GREEN = UP = <span className="font-bold">{GREEN}</span>
              </p>
              <p>
                RED = <Not>UP</Not> = <Not>{UP}</Not> = <span className="font-bold">{RED}</span>
              </p>
              <p>
                FULL = V·<Not>A</Not>·<Not>E</Not>·<Not>S</Not> = {V}·<Not>{A}</Not>·<Not>{E}</Not>·<Not>{S}</Not> ={' '}
                <span className="font-bold">{FULL}</span>
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* ---------- Comparator + decoder ---------- */}
      <Card title="Comparator & BCD-to-7-Segment Decoder" subtitle={`Free-slot count = ${status.freeCount}`}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 font-mono text-sm">
            <p className="text-muted">
              Counter Q4 Q3 Q2 Q1 Q0 = {['Q4', 'Q3', 'Q2', 'Q1', 'Q0'].map((q) => status.counter.bits[q]).join(' ')}
            </p>
            <p>
              FULL&nbsp;&nbsp;= <Not>Q4</Not>·<Not>Q3</Not>·<Not>Q2</Not>·<Not>Q1</Not>·<Not>Q0</Not> ={' '}
              <span className="font-bold">{status.FULL}</span>
              <span className="text-muted"> (count = 0)</span>
            </p>
            <p>
              EMPTY = Q4·Q2 = <span className="font-bold">{status.EMPTY}</span>
              <span className="text-muted"> (count = {status.capacity})</span>
            </p>
            <p>
              A&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <Not>FULL</Not> = <span className="font-bold">{A}</span>
            </p>
            <p className="pt-2 text-xs text-muted">
              Minimized with K-maps (see Hardware → CO1). The count is split into two BCD digits; each goes through the
              decoder, which lights segments a–g.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {['tens', 'ones'].map((place) => {
              const d = status.display[place];
              return (
                <div key={place} className="flex items-center gap-3 rounded-xl border border-line bg-beige p-3">
                  <div className="rounded-lg bg-charcoal p-2">
                    <Digit segments={d.segments} className="h-16 w-10" />
                  </div>
                  <div className="font-mono text-xs">
                    <p className="text-muted">{place}</p>
                    <p>
                      digit {d.digit} → BCD <span className="font-bold">{d.bcd}</span>
                    </p>
                    <p className="text-muted">abcdefg</p>
                    <p className="font-bold tracking-normal">{Object.values(d.segments).join('')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ---------- Truth table ---------- */}
      <Card title="Truth Table" subtitle={`4 inputs → 16 rows. Current row: ${currentRow}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-center font-mono text-sm">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="py-2">Row</th>
                <th>V</th>
                <th>A</th>
                <th>E</th>
                <th>S</th>
                <th className="border-l border-line">UP</th>
                <th>GREEN</th>
                <th>RED</th>
                <th>FULL</th>
              </tr>
            </thead>
            <tbody>
              {truthTable.map((row) => {
                const active = row.row === currentRow;
                const cell = (value) => (
                  <td className={value ? 'font-bold text-cyprus' : 'text-muted'}>{value}</td>
                );
                return (
                  <tr
                    key={row.row}
                    className={
                      'border-b border-line/70 ' +
                      (active ? 'bg-cyprus/10 outline outline-2 outline-cyprus' : 'hover:bg-charcoal/5')
                    }
                  >
                    <td className="py-1.5 text-muted">
                      {active ? '▶ ' : ''}
                      {row.row}
                    </td>
                    {cell(row.V)}
                    {cell(row.A)}
                    {cell(row.E)}
                    {cell(row.S)}
                    <td className={`border-l border-line ${row.UP ? 'font-bold text-cyprus' : 'text-muted'}`}>
                      {row.UP}
                    </td>
                    {cell(row.GREEN)}
                    <td className={row.RED ? 'font-bold text-alert' : 'text-muted'}>{row.RED}</td>
                    <td className={row.FULL ? 'font-bold text-olive' : 'text-muted'}>{row.FULL}</td>
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
