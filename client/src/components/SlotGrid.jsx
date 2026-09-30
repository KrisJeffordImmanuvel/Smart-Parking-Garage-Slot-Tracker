// SlotGrid.jsx - the 20 parking slots. Light (Cyprus outline) = free, dark (Charcoal) = occupied.
// Clicking a slot toggles it (like a sensor in that parking space).
export default function SlotGrid({ slots, onToggle, disabled }) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-10">
      {slots.map((slot) => {
        const occupied = slot.occupied === 1;
        return (
          <button
            key={slot.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(slot.id)}
            title={`Slot ${slot.id}: ${occupied ? 'occupied' : 'free'} (click to toggle)`}
            className={
              'flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 font-mono text-sm font-bold transition hover:scale-105 active:scale-95 disabled:cursor-wait ' +
              (occupied
                ? 'border-charcoal bg-charcoal text-lime'
                : 'border-cyprus/40 bg-paper text-cyprus hover:border-cyprus')
            }
          >
            <span>P{String(slot.id).padStart(2, '0')}</span>
            <span className="text-xl leading-none">{occupied ? '🚗' : ''}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
              {occupied ? 'Busy' : 'Free'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
