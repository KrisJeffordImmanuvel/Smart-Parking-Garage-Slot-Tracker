// SevenSegment.jsx
// -----------------------------------------------------------------------------
// Draws 7-segment digits with SVG. The component does NOT decide which
// segments to light: it receives the a..g outputs of the BCD-to-7-segment
// decoder (logic.js on the server) and simply lights the segments that are 1.
//
//        aaa
//       f   b
//        ggg
//       e   c
//        ddd
// -----------------------------------------------------------------------------

// Shape (polygon points) of each segment inside a 60 x 100 box.
const SEGMENT_SHAPES = {
  a: '12,4 48,4 52,8 48,12 12,12 8,8',
  b: '52,12 56,16 56,44 52,48 48,44 48,16',
  c: '52,52 56,56 56,84 52,88 48,84 48,56',
  d: '12,88 48,88 52,92 48,96 12,96 8,92',
  e: '8,52 12,56 12,84 8,88 4,84 4,56',
  f: '8,12 12,16 12,44 8,48 4,44 4,16',
  g: '12,46 48,46 52,50 48,54 12,54 8,50',
};

export function Digit({ segments, className = 'h-24 w-14' }) {
  return (
    <svg viewBox="0 0 60 100" className={className}>
      <g transform="skewX(-6) translate(6 0)">
        {Object.entries(SEGMENT_SHAPES).map(([name, points]) => {
          const on = segments?.[name] === 1;
          return (
            <polygon
              key={name}
              points={points}
              fill={on ? '#ef4444' : '#3b1414'}
              style={on ? { filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.9))' } : undefined}
            />
          );
        })}
      </g>
    </svg>
  );
}

// Two digits side by side (tens and ones) inside a dark display panel.
export default function SevenSegmentDisplay({ display, size = 'h-24 w-14' }) {
  return (
    <div className="inline-flex gap-2 rounded-xl border border-slate-700 bg-black px-4 py-3 shadow-inner">
      <Digit segments={display?.tens.segments} className={size} />
      <Digit segments={display?.ones.segments} className={size} />
    </div>
  );
}
