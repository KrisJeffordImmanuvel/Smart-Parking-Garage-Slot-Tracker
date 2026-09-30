// IndicatorLight.jsx - a round LED lamp that glows when "on" is 1.
// Colours come from the palette in index.css.
const COLORS = {
  alert: { on: 'bg-alert shadow-[0_0_12px_2px_rgba(192,57,43,0.55)]', off: 'bg-alert/15' }, //   red: FULL, RED light
  lime: { on: 'bg-lime shadow-[0_0_14px_3px_rgba(207,220,102,0.95)]', off: 'bg-lime/25' }, //    chartreuse: EMPTY, GREEN light
  olive: { on: 'bg-olive shadow-[0_0_12px_2px_rgba(92,106,12,0.5)]', off: 'bg-olive/15' }, //    car turned away (gate FULL)
  cyprus: { on: 'bg-cyprus shadow-[0_0_12px_2px_rgba(0,70,67,0.45)]', off: 'bg-cyprus/15' }, // barrier UP
};

export default function IndicatorLight({ label, on, color = 'alert', size = 'h-6 w-6', blink = false }) {
  const style = COLORS[color];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`${size} rounded-full border border-charcoal/20 transition ${on ? style.on : style.off} ${
          on && blink ? 'animate-pulse' : ''
        }`}
      />
      {label && <span className="text-xs font-semibold tracking-wide text-charcoal/80">{label}</span>}
    </div>
  );
}
