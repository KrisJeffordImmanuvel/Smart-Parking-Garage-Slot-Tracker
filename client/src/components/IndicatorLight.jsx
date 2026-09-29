// IndicatorLight.jsx - a round LED lamp that glows when "on" is 1.
const COLORS = {
  red: { on: 'bg-red-500 shadow-[0_0_14px_3px_rgba(239,68,68,0.7)]', off: 'bg-red-950' },
  green: { on: 'bg-emerald-400 shadow-[0_0_14px_3px_rgba(52,211,153,0.7)]', off: 'bg-emerald-950' },
  amber: { on: 'bg-amber-400 shadow-[0_0_14px_3px_rgba(251,191,36,0.7)]', off: 'bg-amber-950' },
  sky: { on: 'bg-sky-400 shadow-[0_0_14px_3px_rgba(56,189,248,0.7)]', off: 'bg-sky-950' },
};

export default function IndicatorLight({ label, on, color = 'red', size = 'h-6 w-6', blink = false }) {
  const style = COLORS[color];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`${size} rounded-full border border-black/40 transition ${on ? style.on : style.off} ${
          on && blink ? 'animate-pulse' : ''
        }`}
      />
      {label && <span className="text-xs font-semibold tracking-wide text-slate-300">{label}</span>}
    </div>
  );
}
