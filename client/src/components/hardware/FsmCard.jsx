// FsmCard.jsx  (CO5)
// -----------------------------------------------------------------------------
// Interactive Moore FSM from hardware/entry_fsm.v. Set the inputs, press
// "Clock", and the server's entryFsm() (same logic as the Verilog) gives the
// next state. The state diagram highlights the present state and the last
// transition taken.
// -----------------------------------------------------------------------------
import { useState } from 'react';
import { api } from '../../api';
import Card from '../Card.jsx';
import ToggleSwitch from '../ToggleSwitch.jsx';

// Circle positions of the four states in the diagram.
const POS = {
  IDLE: [110, 80],
  ARMED: [350, 80],
  UNDER: [350, 220],
  COUNT: [110, 220],
};

// Every transition: path of the arrow, its label and where the label goes.
const EDGES = [
  { key: 'IDLE>ARMED', d: 'M148 70 L310 70', label: 'V·A', at: [229, 60] },
  { key: 'ARMED>IDLE', d: 'M312 92 L150 92', label: "V'·S'", at: [229, 112] },
  { key: 'ARMED>UNDER', d: 'M350 118 L350 180', label: 'S', at: [362, 154] },
  { key: 'UNDER>COUNT', d: 'M312 220 L150 220', label: "S'", at: [229, 210] },
  { key: 'COUNT>IDLE', d: 'M110 182 L110 120', label: '1', at: [96, 154] },
  { key: 'IDLE>IDLE', d: 'M80 58 C30 30, 30 130, 80 102', label: 'else', at: [8, 84] },
  { key: 'ARMED>ARMED', d: 'M380 58 C430 30, 430 130, 380 102', label: "V·S'", at: [424, 84] },
  { key: 'UNDER>UNDER', d: 'M380 198 C430 170, 430 270, 380 242', label: 'S', at: [424, 224] },
];

// Draws X' as X with a line on top inside SVG text.
function SvgLabel({ text }) {
  const parts = text.split(/([A-Z]')/);
  return parts.map((p, i) =>
    p.endsWith("'") ? (
      <tspan key={i} style={{ textDecoration: 'overline' }}>
        {p.slice(0, -1)}
      </tspan>
    ) : (
      <tspan key={i}>{p}</tspan>
    )
  );
}

function FsmDiagram({ state, lastEdge, states }) {
  return (
    <svg viewBox="0 0 470 300" className="w-full max-w-xl">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#8f9497" />
        </marker>
        <marker id="arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#004643" />
        </marker>
      </defs>

      {EDGES.map((edge) => {
        const hot = edge.key === lastEdge;
        return (
          <g key={edge.key}>
            <path
              d={edge.d}
              fill="none"
              stroke={hot ? '#004643' : '#8f9497'}
              strokeWidth={hot ? 3 : 1.6}
              markerEnd={`url(#${hot ? 'arrow-hot' : 'arrow'})`}
            />
            <text
              x={edge.at[0]}
              y={edge.at[1]}
              fontSize="13"
              fontFamily="monospace"
              fill={hot ? '#004643' : '#5f6468'}
              fontWeight={hot ? 'bold' : 'normal'}
              textAnchor={edge.key === 'COUNT>IDLE' ? 'end' : 'start'}
            >
              <SvgLabel text={edge.label} />
            </text>
          </g>
        );
      })}

      {Object.entries(POS).map(([name, [x, y]]) => {
        const active = name === state;
        return (
          <g key={name}>
            <circle
              cx={x}
              cy={y}
              r="38"
              fill={active ? '#cfdc66' : '#fbfaf6'} // present state = Lemon Chartreuse
              stroke={active ? '#004643' : '#dcd7cb'}
              strokeWidth={active ? 3 : 1.5}
            />
            <text x={x} y={y - 4} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#272b2e">
              {name}
            </text>
            <text x={x} y={y + 13} textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#5f6468">
              {states[name].code} · DEC={name === 'COUNT' ? 1 : 0}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function FsmCard({ states, liveA }) {
  const [state, setState] = useState('IDLE');
  const [inputs, setInputs] = useState({ V: 0, S: 0, A: liveA });
  const [lastEdge, setLastEdge] = useState(null);
  const [log, setLog] = useState([]);
  const [cars, setCars] = useState(0);
  const [error, setError] = useState('');

  const setInput = (name, value) => setInputs((old) => ({ ...old, [name]: value ? 1 : 0 }));

  async function clock() {
    try {
      const result = await api.fsmStep({ state, ...inputs });
      setLastEdge(`${state}>${result.next}`);
      setLog((old) => [{ ...inputs, from: state, to: result.next, DEC: result.DEC }, ...old].slice(0, 8));
      if (result.DEC) setCars((c) => c + 1); // the DEC pulse clocks the counter down
      setState(result.next);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  function reset() {
    setState('IDLE');
    setLastEdge(null);
    setLog([]);
    setCars(0);
  }

  return (
    <Card
      title="Entry FSM (Moore machine) · entry_fsm.v"
      subtitle="Counts a car only after the full sequence: at gate (V) → under barrier (S) → passed"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <FsmDiagram state={state} lastEdge={lastEdge} states={states} />
          <p className="mt-2 text-sm text-muted">
            Present state: <b className="text-cyprus">{state}</b> ({states[state].code}): {states[state].meaning}.
          </p>
          <p className="text-xs text-muted">
            Try: V=1 → Clock, S=1 → Clock, V=0 and S=0 → Clock, Clock. With A=0 (garage full) the FSM never leaves IDLE.
          </p>
        </div>

        <div className="space-y-2">
          <ToggleSwitch label="V: vehicle at gate" checked={inputs.V === 1} onChange={(v) => setInput('V', v)} />
          <ToggleSwitch label="S: under barrier" checked={inputs.S === 1} onChange={(v) => setInput('S', v)} />
          <ToggleSwitch label="A: slot available" checked={inputs.A === 1} onChange={(v) => setInput('A', v)} />
          <div className="grid grid-cols-[1fr_auto] gap-2 pt-1">
            <button onClick={clock} className="rounded-xl bg-lime py-2.5 font-semibold text-charcoal hover:bg-lime/85">
              ⏱ Clock
            </button>
            <button onClick={reset} className="rounded-xl border border-line px-3 text-charcoal/80 hover:bg-charcoal/10">
              Reset
            </button>
          </div>
          <p className="rounded-lg bg-beige p-2 text-sm">
            DEC pulses (cars counted): <b className="text-olive">{cars}</b>
          </p>
          {error && <p className="text-sm text-alert">{error}</p>}
          <div className="max-h-44 overflow-y-auto font-mono text-xs">
            {log.map((entry, i) => (
              <p key={i} className={entry.DEC ? 'text-olive' : 'text-muted'}>
                V{entry.V} S{entry.S} A{entry.A}: {entry.from} → {entry.to}
                {entry.DEC ? '  DEC=1' : ''}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
