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

// The car is drawn in the palette: Lemon Chartreuse body, Charcoal windows.
function Car() {
  return (
    <svg viewBox="0 0 80 36" className="h-10 w-20">
      <path d="M8 22 L16 10 Q18 7 22 7 L50 7 Q54 7 57 10 L66 20 L74 22 Q78 23 78 27 L78 29 L2 29 L2 25 Q2 22 8 22 Z" fill="#cfdc66" />
      <path d="M20 11 L48 11 L56 20 L14 20 Z" fill="#272b2e" />
      <rect x="34" y="11" width="3" height="9" fill="#cfdc66" />
      <circle cx="18" cy="29" r="6" fill="#272b2e" stroke="#f0ede5" strokeWidth="2" />
      <circle cx="62" cy="29" r="6" fill="#272b2e" stroke="#f0ede5" strokeWidth="2" />
      <rect x="72" y="23" width="5" height="3" rx="1" fill="#f0ede5" />
    </svg>
  );
}

export default function Barrier({ up, green, red, carPhase = 'hidden', shake = false }) {
  const car = CAR_POSITIONS[carPhase];

  return (
    <div className="relative h-44 overflow-hidden rounded-xl border border-line bg-gradient-to-b from-beige to-sand">
      {/* Charcoal road with a dashed chartreuse centre line */}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-charcoal">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#cfdc66_0_18px,transparent_18px_36px)] opacity-70" />
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
        <div className="absolute bottom-0 left-0 h-20 w-4 rounded-t bg-charcoal/60" />
        <div
          className="absolute bottom-16 left-2 h-3 w-40 origin-left rounded-full border border-charcoal/30 bg-[repeating-linear-gradient(90deg,#c0392b_0_16px,#fbfaf6_16px_32px)] shadow sm:w-56"
          style={{ transform: `rotate(${up ? -80 : 0}deg)`, transition: 'transform 0.7s ease-in-out' }}
        />
      </div>

      {/* Traffic light */}
      <div className="absolute top-3 left-[calc(46%-44px)] flex flex-col gap-1.5 rounded-lg bg-charcoal p-1.5">
        <span className={`h-4 w-4 rounded-full ${red ? 'bg-alert shadow-[0_0_10px_2px_rgba(192,57,43,0.9)]' : 'bg-alert/25'}`} />
        <span className={`h-4 w-4 rounded-full ${green ? 'bg-lime shadow-[0_0_10px_2px_rgba(207,220,102,0.9)]' : 'bg-lime/20'}`} />
      </div>

      {/* Barrier state label */}
      <div className="absolute top-3 right-3 rounded-md bg-charcoal px-2 py-1 font-mono text-xs text-sand">
        BARRIER: <span className={up ? 'font-bold text-lime' : 'font-bold text-sand'}>{up ? 'UP' : 'DOWN'}</span>
      </div>
    </div>
  );
}
