// Card.jsx - a simple box with an optional title, used on every page.
export default function Card({ title, subtitle, action, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-line bg-paper p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-charcoal">{title}</h2>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
