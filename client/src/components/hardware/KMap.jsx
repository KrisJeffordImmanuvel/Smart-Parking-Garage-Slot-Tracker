// KMap.jsx
// -----------------------------------------------------------------------------
// A 4-variable Karnaugh map. Rows and columns use Gray code (00, 01, 11, 10),
// so neighbouring cells differ by only one bit.
//   values  : array indexed by minterm number -> 1, 0 or 'X' (don't care)
//   offset  : added to every minterm (16 for the "Q4 = 1" half of a 5-var map)
//   group   : minterms covered by the selected product term (highlighted)
//   current : minterm of the present input (outlined)
// -----------------------------------------------------------------------------
import Expr from './Expr.jsx';

const GRAY = [0, 1, 3, 2]; // 00, 01, 11, 10
const code = (n) => n.toString(2).padStart(2, '0');

export default function KMap({ title, rowVars, colVars, values, offset = 0, group = [], current = null }) {
  return (
    <div className="inline-block">
      {title && <p className="mb-1 text-center font-mono text-xs text-slate-400">{title}</p>}
      <table className="border-collapse font-mono text-sm">
        <thead>
          <tr>
            <th className="px-1 text-[10px] font-normal text-slate-500">
              {rowVars}\{colVars}
            </th>
            {GRAY.map((c) => (
              <th key={c} className="w-10 px-1 pb-1 text-xs font-normal text-slate-400">
                {code(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRAY.map((r) => (
            <tr key={r}>
              <th className="pr-2 text-xs font-normal text-slate-400">{code(r)}</th>
              {GRAY.map((c) => {
                const minterm = offset + r * 4 + c;
                const value = values[minterm];
                const inGroup = group.includes(minterm);
                const isCurrent = current === minterm;
                return (
                  <td
                    key={c}
                    title={`minterm ${minterm}`}
                    className={
                      'relative h-10 w-10 border border-slate-700 text-center transition ' +
                      (inGroup ? 'bg-amber-400/25 ' : '') +
                      (value === 1 ? 'font-bold text-emerald-300' : value === 'X' ? 'text-slate-500' : 'text-slate-600')
                    }
                  >
                    {value}
                    <span className="absolute right-0.5 bottom-0 text-[8px] text-slate-600">{minterm}</span>
                    {isCurrent && <span className="absolute inset-0.5 rounded border-2 border-sky-400" />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Clickable list of the product terms of an expression; the selected one is
// highlighted on the K-map.
export function TermPicker({ terms, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((term, i) => (
        <button
          key={term.label}
          onClick={() => onSelect(i)}
          className={
            'rounded-lg border px-3 py-1 text-sm transition ' +
            (selected === i
              ? 'border-amber-400 bg-amber-400/20 text-amber-200'
              : 'border-slate-700 text-slate-300 hover:border-slate-500')
          }
        >
          <Expr>{term.label}</Expr>
        </button>
      ))}
    </div>
  );
}
