// History.jsx - table of every entry / exit event stored in SQLite.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import Card from '../components/Card.jsx';

// Colour of the badge for each type of event.
const BADGE = {
  ENTRY: 'bg-cyprus/10 text-cyprus border-cyprus/30',
  EXIT: 'bg-lime/40 text-olive border-olive/40',
  DENIED: 'bg-alert/10 text-alert border-alert/30',
};

export default function History() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setEvents(await api.getHistory());
      setError('');
    } catch {
      setError('Cannot reach the server. Is the backend running on port 4000?');
    }
  }, []);

  // Load now, then refresh every 3 seconds.
  useEffect(() => {
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [load]);

  const count = (type) => events.filter((e) => e.event === type).length;
  const shown = filter === 'ALL' ? events : events.filter((e) => e.event === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cyprus sm:text-3xl">History</h1>
        <p className="text-muted">Every car that entered, exited or was turned away, newest first.</p>
      </div>

      {error && <p className="rounded-xl border border-alert/30 bg-alert/10 p-3 text-alert">{error}</p>}

      {/* Summary numbers */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Entries', count('ENTRY'), 'text-cyprus'],
          ['Exits', count('EXIT'), 'text-olive'],
          ['Denied', count('DENIED'), 'text-alert'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <Card
        title="Event Log"
        subtitle={`${shown.length} event${shown.length === 1 ? '' : 's'}`}
        action={
          <div className="flex gap-1 rounded-lg bg-sand p-1 text-sm">
            {['ALL', 'ENTRY', 'EXIT', 'DENIED'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-md px-2.5 py-1 ${filter === type ? 'bg-cyprus text-sand' : 'text-muted hover:text-charcoal'}`}
              >
                {type}
              </button>
            ))}
          </div>
        }
      >
        {shown.length === 0 ? (
          <p className="py-8 text-center text-muted">No events yet. Use “Car Enters” on the Dashboard.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-3">#</th>
                  <th className="pr-3">Time</th>
                  <th className="pr-3">Event</th>
                  <th className="pr-3">Slot</th>
                  <th className="pr-3">Free after</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id} className="border-b border-line/70">
                    <td className="py-2 pr-3 text-muted">{e.id}</td>
                    <td className="pr-3 whitespace-nowrap">{new Date(e.time).toLocaleString()}</td>
                    <td className="pr-3">
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${BADGE[e.event]}`}>{e.event}</span>
                    </td>
                    <td className="pr-3 font-mono">{e.slot ? `P${String(e.slot).padStart(2, '0')}` : '—'}</td>
                    <td className="pr-3 font-mono">{e.free_after}</td>
                    <td className="text-muted">{e.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
