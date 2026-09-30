// CombinationalTab.jsx  (CO1)
// -----------------------------------------------------------------------------
// Minimized combinational logic:
//   - FULL / EMPTY comparator on the 5 counter bits (5-variable K-maps)
//   - BCD-to-7-segment decoder (one 4-variable K-map per segment)
// Don't-care cells (X) are what make the equations so small.
// -----------------------------------------------------------------------------
import { useState } from 'react';
import Card from '../Card.jsx';
import { Digit } from '../SevenSegment.jsx';
import KMap, { TermPicker } from './KMap.jsx';
import Expr from './Expr.jsx';

const SEGMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const ALL_ON = { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1 };

// Two 4x4 maps side by side = one 5-variable K-map (Q4 = 0 | Q4 = 1).
function FiveVarMap({ map, group, current }) {
  return (
    <div className="flex flex-wrap gap-4">
      <KMap title="Q4 = 0  (0 – 15)" rowVars="Q3Q2" colVars="Q1Q0" values={map.values} offset={0} group={group} current={current} />
      <KMap title="Q4 = 1  (16 – 31)" rowVars="Q3Q2" colVars="Q1Q0" values={map.values} offset={16} group={group} current={current} />
    </div>
  );
}

export default function CombinationalTab({ design, status }) {
  const [segment, setSegment] = useState('a');
  const [term, setTerm] = useState(0);

  const count = status.freeCount;
  const { Q4, Q3, Q2, Q1, Q0 } = status.counter.bits;
  const seg = design.decoder[segment];
  const ones = status.display.ones.digit;
  const tens = status.display.tens.digit;

  const chooseSegment = (name) => {
    setSegment(name);
    setTerm(0);
  };

  return (
    <div className="space-y-6">
      {/* ------------------------- Comparator ------------------------- */}
      <Card
        title="FULL / EMPTY comparator"
        subtitle={`Counter Q4 Q3 Q2 Q1 Q0 = ${Q4}${Q3}${Q2}${Q1}${Q0} (count ${count}). Outlined box = present count.`}
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="rounded-xl border border-alert/20 bg-alert/10 p-3">
              <p className="text-lg font-bold text-alert">
                <Expr>FULL = Q4'·Q3'·Q2'·Q1'·Q0'</Expr>
              </p>
              <p className="text-muted">
                <Expr>{`= ${Q4}'·${Q3}'·${Q2}'·${Q1}'·${Q0}'`}</Expr> = <b className="text-charcoal">{status.FULL}</b>
              </p>
              <p className="mt-1 text-xs text-muted">One 5-input NOR gate: 1 only when every bit is 0 (count = 0).</p>
            </div>
            <FiveVarMap map={design.comparator.FULL} group={design.comparator.FULL.terms[0].cells} current={count} />
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-cyprus/20 bg-cyprus/5 p-3">
              <p className="text-lg font-bold text-cyprus">
                <Expr>EMPTY = Q4·Q2</Expr>
              </p>
              <p className="text-muted">
                = {Q4}·{Q2} = <b className="text-charcoal">{status.EMPTY}</b>
              </p>
              <p className="mt-1 text-xs text-muted">
                Counts 21–31 never happen, so they are don't cares (X). Grouping the 1 at 20 with those X cells gives
                an 8-cell group: one 2-input AND gate instead of a 5-input AND.
              </p>
            </div>
            <FiveVarMap map={design.comparator.EMPTY} group={design.comparator.EMPTY.terms[0].cells} current={count} />
          </div>
        </div>
      </Card>

      {/* ------------------------- Decoder ------------------------- */}
      <Card title="BCD-to-7-segment decoder" subtitle="Inputs A B C D (A = 8, B = 4, C = 2, D = 1). Codes 10–15 are don't cares.">
        <div className="mb-4 flex flex-wrap gap-2">
          {SEGMENTS.map((name) => (
            <button
              key={name}
              onClick={() => chooseSegment(name)}
              className={
                'h-9 w-9 rounded-lg font-mono font-bold transition ' +
                (segment === name ? 'bg-lime text-charcoal' : 'bg-charcoal/10 text-charcoal/80 hover:bg-charcoal/20')
              }
            >
              {name}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-charcoal p-2">
              <Digit segments={ALL_ON} highlight={segment} className="h-24 w-14" />
            </div>
            <KMap rowVars="AB" colVars="CD" values={seg.values} group={seg.terms[term]?.cells || []} current={ones} />
          </div>

          <div className="space-y-3">
            <p className="text-xl font-bold text-olive">
              {segment} = <Expr>{seg.expression}</Expr>
            </p>
            <p className="text-sm text-muted">Click a product term to see its group on the K-map:</p>
            <TermPicker terms={seg.terms} selected={term} onSelect={setTerm} />
            <p className="text-xs text-muted">
              Outlined box = the ones digit now ({ones}). Every 1 is covered by at least one group, and groups may use X
              cells to become bigger (fewer literals, fewer gates).
            </p>
            <div className="rounded-xl border border-line bg-beige p-3 text-sm">
              {SEGMENTS.map((name) => (
                <p key={name} className={name === segment ? 'text-olive' : 'text-muted'}>
                  {name} = <Expr>{design.decoder[name].expression}</Expr>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Truth table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] text-center font-mono text-sm">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="py-2">Digit</th>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>D</th>
                {SEGMENTS.map((name) => (
                  <th key={name} className={name === segment ? 'text-olive' : ''}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {design.decoderTable.map((row) => {
                const live = row.value === ones || row.value === tens;
                return (
                  <tr
                    key={row.value}
                    className={'border-b border-line/70 ' + (live ? 'bg-cyprus/10' : row.segments ? '' : 'text-charcoal/35')}
                  >
                    <td className="py-1">{row.value}</td>
                    {row.bcd.split('').map((b, i) => (
                      <td key={i}>{b}</td>
                    ))}
                    {SEGMENTS.map((name, i) => {
                      const value = row.segments ? row.segments[i] : 'X';
                      return (
                        <td
                          key={name}
                          className={
                            (name === segment ? 'bg-lime/20 ' : '') +
                            (value === 1 ? 'font-bold text-cyprus' : value === 'X' ? 'text-charcoal/35' : 'text-muted')
                          }
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">
            Highlighted rows = the two digits on the display now ({tens} and {ones}).
          </p>
        </div>
      </Card>
    </div>
  );
}
