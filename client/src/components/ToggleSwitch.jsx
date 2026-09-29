// ToggleSwitch.jsx - an on/off switch used for the E, S and V inputs.
export default function ToggleSwitch({ label, description, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left transition hover:border-slate-600 disabled:opacity-50"
    >
      <div>
        <p className="font-semibold">{label}</p>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-mono text-sm ${checked ? 'text-emerald-400' : 'text-slate-500'}`}>
          {checked ? '1' : '0'}
        </span>
        {/* The track and the sliding knob */}
        <span
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}
        >
          <span
            className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-5' : ''
            }`}
          />
        </span>
      </div>
    </button>
  );
}
