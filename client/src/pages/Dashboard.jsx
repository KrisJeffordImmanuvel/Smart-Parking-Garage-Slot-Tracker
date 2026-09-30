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
  const [fsmTrace, setFsmTrace] = useState(null); //      states the entry FSM went through

  if (!status) {
    return <p className="text-muted">{error || 'Loading garage status...'}</p>;
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

      // Show what the gate logic decided with V = 1, and the entry FSM path.
      setGateSnapshot({ gate: result.gate, inputs: result.gateInputs });
      setFsmTrace(result.fsm?.trace || null);
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
    ok: 'border-cyprus/30 bg-cyprus/5 text-cyprus',
    warn: 'border-alert/30 bg-alert/10 text-alert',
    error: 'border-alert/30 bg-alert/10 text-alert',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cyprus sm:text-3xl">Dashboard</h1>
        <p className="text-muted">Live view of the garage, the entry gate and all {status.capacity} slots.</p>
      </div>

      {error && <p className="rounded-xl border border-alert/30 bg-alert/10 p-3 text-alert">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------- Free-slot counter ---------- */}
        <Card title="Free Slots" subtitle="BCD → 7-segment display">
          <div className="flex flex-col items-center gap-5">
            <SevenSegmentDisplay display={status.display} />
            <p className="text-sm text-muted">
              <span className="font-semibold text-charcoal">{status.freeCount}</span> free ·{' '}
              <span className="font-semibold text-charcoal">{status.occupiedCount}</span> occupied
            </p>
            <p className="font-mono text-xs text-muted" title="5-bit up/down counter (see Hardware → CO3)">
              Counter Q4..Q0 ={' '}
              <span className="text-cyprus">
                {['Q4', 'Q3', 'Q2', 'Q1', 'Q0'].map((q) => status.counter.bits[q]).join('')}
              </span>
            </p>
            <div className="flex gap-10">
              <IndicatorLight label="FULL" on={status.FULL === 1} color="alert" size="h-8 w-8" blink />
              <IndicatorLight label="EMPTY" on={status.EMPTY === 1} color="lime" size="h-8 w-8" />
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
            <span className="text-muted">
              V={inputs.V} A={inputs.A} E={inputs.E} S={inputs.S}
            </span>
            <IndicatorLight label="UP" on={gate.UP === 1} color="cyprus" size="h-4 w-4" />
            <IndicatorLight label="GREEN" on={gate.GREEN === 1} color="lime" size="h-4 w-4" />
            <IndicatorLight label="RED" on={gate.RED === 1} color="alert" size="h-4 w-4" />
            <IndicatorLight label="FULL" on={gate.FULL === 1} color="olive" size="h-4 w-4" blink />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={handleEnter}
              disabled={busy}
              className="rounded-xl bg-lime px-4 py-3 font-semibold text-charcoal transition hover:bg-lime/85 disabled:opacity-50"
            >
              🚗 Car Enters
            </button>
            <button
              onClick={handleExit}
              disabled={busy}
              className="rounded-xl bg-cyprus px-4 py-3 font-semibold text-sand transition hover:bg-cyprus/90 disabled:opacity-50"
            >
              Car Exits ➜
            </button>
          </div>

          {message && (
            <p className={`mt-4 rounded-xl border px-4 py-2 text-sm ${messageColors[message.type]}`}>{message.text}</p>
          )}

          {/* Path of the entry FSM for the last car (see Hardware → CO5) */}
          {fsmTrace && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-muted">Entry FSM:</span>
              {fsmTrace.map((step, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-charcoal/35">→</span>}
                  <span
                    className={
                      'rounded-md border px-1.5 py-0.5 ' +
                      (step.DEC ? 'border-olive bg-lime/40 text-olive' : 'border-line text-charcoal/80')
                    }
                  >
                    {step.state}
                    {step.DEC ? ' · DEC' : ''}
                  </span>
                </span>
              ))}
            </div>
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
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border-2 border-cyprus/40 bg-paper" /> Free
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-charcoal" /> Occupied
            </span>
            <button
              onClick={handleReset}
              disabled={busy}
              className="rounded-lg border border-line px-3 py-1 text-charcoal/80 hover:bg-charcoal/10 disabled:opacity-50"
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
