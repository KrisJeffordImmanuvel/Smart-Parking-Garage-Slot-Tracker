// Dashboard.jsx
// -----------------------------------------------------------------------------
// Main page: 7-segment free-slot counter, FULL/EMPTY lamps, the animated entry
// gate, Car Enters / Car Exits buttons, the E and S switches and the 20 slots.
// -----------------------------------------------------------------------------
import { useState } from 'react';
import { api } from '../api';
import { useParkingStatus } from '../hooks/useParkingStatus';
import Card from '../components/Card.jsx';
import SevenSegmentDisplay from '../components/SevenSegment.jsx';
import IndicatorLight from '../components/IndicatorLight.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import SlotGrid from '../components/SlotGrid.jsx';
import Barrier from '../components/Barrier.jsx';

// Small helper: wait for some milliseconds (used to time the animation).
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Dashboard() {
  const { status, setStatus, error } = useParkingStatus();

  const [busy, setBusy] = useState(false); //            true while a request/animation runs
  const [message, setMessage] = useState(null); //       { text, type: 'ok' | 'warn' | 'error' }
  const [carPhase, setCarPhase] = useState('hidden'); // car position in the gate animation
  const [gateSnapshot, setGateSnapshot] = useState(null); // gate outputs while a car is at the gate
  const [shake, setShake] = useState(false); //          car shakes when refused

  if (!status) {
    return <p className="text-slate-400">{error || 'Loading garage status...'}</p>;
  }

  // While a car is at the gate we show the gate outputs calculated with V = 1
  // (returned by /api/enter). Otherwise we show the live outputs from /api/status.
  const gate = gateSnapshot ? gateSnapshot.gate : status.gate;
  const inputs = gateSnapshot ? gateSnapshot.inputs : status.inputs;

  // ---- Car Enters: animate the car arriving, ask the server, then pass or refuse ----
  async function handleEnter() {
    setBusy(true);
    setMessage(null);
    setCarPhase('waiting'); // car drives up to the barrier (V = 1)

    try {
      // Send the request and let the car drive to the gate at the same time.
      const [result] = await Promise.all([api.enter(), wait(1100)]);

      // Show what the gate logic decided with V = 1.
      setGateSnapshot({ gate: result.gate, inputs: result.gateInputs });
      setStatus(result.status);
      setMessage({ text: result.message, type: result.ok ? 'ok' : 'warn' });
      await wait(800); // time for the barrier arm to move

      if (result.ok) {
        setCarPhase('passing'); // barrier is up -> car drives in
      } else {
        setShake(true); //          refused -> car shakes and turns back
        await wait(900);
        setShake(false);
        setCarPhase('leaving');
      }
      await wait(1200);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }

    // Back to the normal live view.
    setCarPhase('hidden');
    setGateSnapshot(null);
    setBusy(false);
  }

  // ---- Generic helper for the other buttons: call the API, show the result ----
  async function run(action) {
    setBusy(true);
    try {
      const result = await action();
      if (result.status) setStatus(result.status);
      if (result.message) setMessage({ text: result.message, type: result.ok ? 'ok' : 'warn' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
    setBusy(false);
  }

  const handleExit = () => run(api.exit);
  const handleToggleSlot = (id) => run(() => api.toggleSlot(id));
  const handleSwitch = (name, value) => run(() => api.setSwitch({ [name]: value ? 1 : 0 }));
  const handleReset = () => {
    if (window.confirm('Free all slots, turn switches off and clear the history?')) run(api.reset);
  };

  const messageColors = {
    ok: 'border-emerald-700 bg-emerald-950/60 text-emerald-200',
    warn: 'border-amber-700 bg-amber-950/60 text-amber-200',
    error: 'border-red-700 bg-red-950/60 text-red-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="text-slate-400">Live view of the garage, the entry gate and all {status.capacity} slots.</p>
      </div>

      {error && <p className="rounded-xl border border-red-800 bg-red-950/60 p-3 text-red-200">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------- Free-slot counter ---------- */}
        <Card title="Free Slots" subtitle="BCD → 7-segment display">
          <div className="flex flex-col items-center gap-5">
            <SevenSegmentDisplay display={status.display} />
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-slate-100">{status.freeCount}</span> free ·{' '}
              <span className="font-semibold text-slate-100">{status.occupiedCount}</span> occupied
            </p>
            <div className="flex gap-10">
              <IndicatorLight label="FULL" on={status.FULL === 1} color="red" size="h-8 w-8" blink />
              <IndicatorLight label="EMPTY" on={status.EMPTY === 1} color="green" size="h-8 w-8" />
            </div>
          </div>
        </Card>

        {/* ---------- Entry gate ---------- */}
        <Card
          title="Entry Gate"
          subtitle={gateSnapshot ? 'Car at the gate (V = 1)' : 'Live gate outputs'}
          className="lg:col-span-2"
        >
          <Barrier up={gate.UP === 1} green={gate.GREEN === 1} red={gate.RED === 1} carPhase={carPhase} shake={shake} />

          {/* Current inputs and outputs of the gate logic */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-sm">
            <span className="text-slate-400">
              V={inputs.V} A={inputs.A} E={inputs.E} S={inputs.S}
            </span>
            <IndicatorLight label="UP" on={gate.UP === 1} color="sky" size="h-4 w-4" />
            <IndicatorLight label="GREEN" on={gate.GREEN === 1} color="green" size="h-4 w-4" />
            <IndicatorLight label="RED" on={gate.RED === 1} color="red" size="h-4 w-4" />
            <IndicatorLight label="FULL" on={gate.FULL === 1} color="amber" size="h-4 w-4" blink />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={handleEnter}
              disabled={busy}
              className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              🚗 Car Enters
            </button>
            <button
              onClick={handleExit}
              disabled={busy}
              className="rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
            >
              Car Exits ➜
            </button>
          </div>

          {message && (
            <p className={`mt-4 rounded-xl border px-4 py-2 text-sm ${messageColors[message.type]}`}>{message.text}</p>
          )}
        </Card>
      </div>

      {/* ---------- Switches ---------- */}
      <Card title="Control Switches" subtitle="Inputs of the gate logic that the operator controls">
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleSwitch
            label="E - Emergency override"
            description="Forces the barrier UP (e.g. for an ambulance)"
            checked={status.inputs.E === 1}
            disabled={busy}
            onChange={(value) => handleSwitch('E', value)}
          />
          <ToggleSwitch
            label="S - Vehicle under barrier"
            description="Safety sensor: keeps the barrier UP so it cannot hit a car"
            checked={status.inputs.S === 1}
            disabled={busy}
            onChange={(value) => handleSwitch('S', value)}
          />
        </div>
      </Card>

      {/* ---------- Slots ---------- */}
      <Card
        title="Parking Slots"
        subtitle="Click a slot to toggle it (free ↔ occupied)"
        action={
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500" /> Free
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-red-500" /> Occupied
            </span>
            <button
              onClick={handleReset}
              disabled={busy}
              className="rounded-lg border border-slate-700 px-3 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        }
      >
        <SlotGrid slots={status.slots} onToggle={handleToggleSlot} disabled={busy} />
      </Card>
    </div>
  );
}
