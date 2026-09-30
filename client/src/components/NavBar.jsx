// NavBar.jsx - top navigation bar with links to the four pages.
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/logic', label: 'Logic Panel', short: 'Logic' }, // short label on small phones
  { to: '/hardware', label: 'Hardware' },
  { to: '/history', label: 'History' },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-cyprus bg-cyprus text-sand shadow-sm">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Logo + project name */}
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-lime text-lg font-black text-charcoal">
            P
          </div>
          <div className="leading-tight">
            <p className="font-semibold">Smart Parking Garage</p>
            <p className="text-xs text-sand/70">Slot Tracker</p>
          </div>
        </div>

        {/* Page links - NavLink highlights the page that is open.
            On phones the bar takes the full width and the links share it. */}
        <div className="flex w-full gap-1 rounded-xl bg-charcoal/25 p-1 sm:w-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                'flex-1 rounded-lg px-2 py-1.5 text-center text-[13px] font-medium whitespace-nowrap transition sm:flex-none sm:px-3 sm:text-sm ' +
                (isActive ? 'bg-lime text-charcoal' : 'text-sand/85 hover:bg-sand/10 hover:text-sand')
              }
            >
              {link.short ? (
                <>
                  <span className="min-[370px]:hidden">{link.short}</span>
                  <span className="hidden min-[370px]:inline">{link.label}</span>
                </>
              ) : (
                link.label
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
