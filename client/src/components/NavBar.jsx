// NavBar.jsx - top navigation bar with links to the three pages.
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/logic', label: 'Logic Panel' },
  { to: '/hardware', label: 'Hardware' },
  { to: '/history', label: 'History' },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Logo + project name */}
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500 text-lg font-black text-slate-950">
            P
          </div>
          <div className="leading-tight">
            <p className="font-semibold">Smart Parking Garage</p>
            <p className="text-xs text-slate-400">Slot Tracker</p>
          </div>
        </div>

        {/* Page links - NavLink highlights the page that is open */}
        <div className="flex gap-1 rounded-xl bg-slate-900 p-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
                (isActive ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
