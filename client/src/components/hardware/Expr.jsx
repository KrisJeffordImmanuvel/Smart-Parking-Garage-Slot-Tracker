// Expr.jsx - shows a Boolean expression, drawing X' as X with a bar on top.
// Example: "B'D' + CD"  ->  B̄D̄ + CD
const PRIMED = /(EMPTY|FULL|EN|UP|Q\d|[A-Z]|[01])'/g;

export default function Expr({ children, className = '' }) {
  const text = String(children);
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(PRIMED)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span key={match.index} className="overline decoration-2">
        {match[1]}
      </span>
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <span className={`font-mono ${className}`}>{parts}</span>;
}
