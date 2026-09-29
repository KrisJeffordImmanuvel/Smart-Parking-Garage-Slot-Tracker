// Barrier.jsx
// -----------------------------------------------------------------------------
// Animated entry gate: a boom barrier, a traffic light and a car.
//   up        -> 1 = barrier arm raised, 0 = arm down
//   green/red -> traffic light outputs
//   carPhase  -> where the car is: 'hidden' | 'waiting' | 'passing' | 'leaving'
// -----------------------------------------------------------------------------

// Horizontal position (and visibility) of the car for each phase.
const CAR_POSITIONS = {
  hidden: { left: '-20%', opacity: 0 },
  waiting: { left: '18%', opacity: 1 }, //  stopped just before the barrier (V = 1)
  passing: { left: '105%', opacity: 1 }, // drove through the open barrier
  leaving: { left: '-20%', opacity: 0 }, // turned away, drives back
};

function Car() {
  return (
    <svg viewBox="0 0 80 36" className="h-10 w-20">
      <path d="M8 22 L16 10 Q18 7 22 7 L50 7 Q54 7 57 10 L66 20 L74 22 Q78 23 78 27 L78 29 L2 29 L2 25 Q2 22 8 22 Z" fill="#38bdf8" />
      <path d="M20 11 L48 11 L56 20 L14 20 Z" fill="#0c4a6e" />
      <rect x="34" y="11" width="3" height="9" fill="#38bdf8" />
      <circle cx="18" cy="29" r="6" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="62" cy="29" r="6" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
      <rect x="72" y="23" width="5" height="3" rx="1" fill="#fde68a" />
    </svg>
  );
}

export default function Barrier({ up, green, red, carPhase = 'hidden', shake = false }) {
  const car = CAR_POSITIONS[carPhase];

  return (
    <div className="relative h-44 overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Road with dashed centre line */}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-slate-800">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#facc15_0_18px,transparent_18px_36px)] opacity-60" />
      </div>

      {/* The car */}
      <div
        className={`absolute bottom-6 z-10 ${shake ? 'animate-shake' : ''}`}
        style={{
          left: car.left,
          opacity: car.opacity,
          transition: carPhase === 'hidden' ? 'none' : 'left 1.1s ease-in-out, opacity 1.1s ease-in-out',
        }}
      >
        <Car />
      </div>

      {/* Barrier post + arm (the arm rotates up around its left end) */}
      <div className="absolute bottom-10 left-[46%] z-20">
        <div className="absolute bottom-0 left-0 h-20 w-4 rounded-t bg-slate-400" />
        <div
          className="absolute bottom-16 left-2 h-3 w-40 origin-left rounded-full border border-slate-900 bg-[repeating-linear-gradient(90deg,#ef4444_0_16px,#f8fafc_16px_32px)] shadow sm:w-56"
          style={{ transform: `rotate(${up ? -80 : 0}deg)`, transition: 'transform 0.7s ease-in-out' }}
        />
      </div>

      {/* Traffic light */}
      <div className="absolute top-3 left-[calc(46%-44px)] flex flex-col gap-1.5 rounded-lg bg-black p-1.5">
        <span className={`h-4 w-4 rounded-full ${red ? 'bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.8)]' : 'bg-red-950'}`} />
        <span className={`h-4 w-4 rounded-full ${green ? 'bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.8)]' : 'bg-emerald-950'}`} />
      </div>

      {/* Barrier state label */}
      <div className="absolute top-3 right-3 rounded-md bg-black/60 px-2 py-1 font-mono text-xs">
        BARRIER: <span className={up ? 'text-emerald-400' : 'text-red-400'}>{up ? 'UP' : 'DOWN'}</span>
      </div>
    </div>
  );
}
