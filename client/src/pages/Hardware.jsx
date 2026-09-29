// Hardware.jsx
// -----------------------------------------------------------------------------
// "Hardware Design" page: one tab per Course Outcome.
//   CO1 - minimized combinational logic (comparator + BCD-to-7-segment decoder)
//   CO3 - synchronous up/down counter (T flip-flops)
//   CO5 - Verilog: FSM, debouncing, display multiplexing
// The selected tab is kept in the URL (?co=1, ?co=3, ?co=5).
// -----------------------------------------------------------------------------
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useParkingStatus } from '../hooks/useParkingStatus';
import CombinationalTab from '../components/hardware/CombinationalTab.jsx';
import CounterTab from '../components/hardware/CounterTab.jsx';
import VerilogTab from '../components/hardware/VerilogTab.jsx';

const TABS = [
  { id: '1', label: 'CO1 · Minimized logic', text: 'Minimized combinational logic for FULL/EMPTY detection and the BCD-to-7-segment decoder.' },
  { id: '3', label: 'CO3 · Up/down counter', text: 'Synchronous up/down counter that tracks the number of free slots.' },
  { id: '5', label: 'CO5 · Verilog', text: 'Verilog implementation with an FSM, debouncing and display multiplexing.' },
];

export default function Hardware() {
  const { status, setStatus, error } = useParkingStatus();
  const [design, setDesign] = useState(null);
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get('co')) || TABS[0];

  // K-maps, equations and tables do not change, so load them once.
  useEffect(() => {
    api.getDesign().then(setDesign).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Hardware Design</h1>
        <p className="text-slate-400">The digital circuits behind the garage, one tab per course outcome.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setParams({ co: t.id })}
            className={
              'rounded-xl border px-4 py-2 text-sm font-semibold transition ' +
              (t.id === tab.id
                ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500')
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
        <b className="text-emerald-300">CO{tab.id}:</b> {tab.text}
      </p>

      {error && <p className="rounded-xl border border-red-800 bg-red-950/60 p-3 text-red-200">{error}</p>}

      {!status || !design ? (
        <p className="text-slate-400">Loading design…</p>
      ) : tab.id === '1' ? (
        <CombinationalTab design={design} status={status} />
      ) : tab.id === '3' ? (
        <CounterTab design={design} status={status} onStatus={setStatus} />
      ) : (
        <VerilogTab design={design} status={status} />
      )}
    </div>
  );
}
