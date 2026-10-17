import React, { useMemo, useState } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Network } from 'lucide-react';
import { CorrelationPair, CorrelationResult, DataRow } from '../types';
import { describeCorrelation, toNumber } from '../services/statistics';

interface CorrelationsViewProps {
  correlations: CorrelationResult;
  rows: DataRow[];
}

function cellColor(r: number | null): string {
  if (r === null) return '#f1f5f9';
  const alpha = Math.min(1, Math.abs(r));
  return r >= 0 ? `rgba(37, 99, 235, ${alpha})` : `rgba(220, 38, 38, ${alpha})`;
}

const CorrelationsView: React.FC<CorrelationsViewProps> = ({ correlations, rows }) => {
  const { columns, matrix, topPairs } = correlations;
  const [selectedPair, setSelectedPair] = useState<CorrelationPair | undefined>(topPairs[0]);

  const scatterData = useMemo(() => {
    if (!selectedPair) return [];
    return rows
      .slice(0, 2000)
      .map((row) => ({ x: toNumber(row[selectedPair.a] ?? null), y: toNumber(row[selectedPair.b] ?? null) }))
      .filter((p) => p.x !== null && p.y !== null);
  }, [rows, selectedPair]);

  if (columns.length < 2) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
        <Network className="mb-4 text-slate-400" size={36} aria-hidden="true" />
        <h2 className="font-semibold text-slate-900">Not enough numeric columns</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Correlations require at least two numeric columns with varying values.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Correlation matrix</h2>
        <p className="text-sm text-slate-500">
          Pearson coefficient between numeric columns. Blue is positive, red is negative.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th scope="col" className="sr-only">Column</th>
                {columns.map((c) => (
                  <th key={c} scope="col" className="h-28 w-14 align-bottom font-medium text-slate-600">
                    <span className="inline-block max-w-[7rem] -rotate-45 truncate whitespace-nowrap" title={c}>
                      {c}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {columns.map((rowName, i) => (
                <tr key={rowName}>
                  <th scope="row" className="max-w-[9rem] truncate pr-2 text-right font-medium text-slate-600" title={rowName}>
                    {rowName}
                  </th>
                  {matrix[i].map((r, j) => (
                    <td
                      key={columns[j]}
                      title={`${rowName} vs ${columns[j]}: ${r === null ? 'n/a' : r.toFixed(3)}`}
                      className="h-12 w-14 rounded text-center tabular-nums"
                      style={{ backgroundColor: cellColor(r), color: r !== null && Math.abs(r) > 0.5 ? '#fff' : '#0f172a' }}
                    >
                      {r === null ? '—' : r.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Strongest relationships</h2>
          <ul className="space-y-2">
            {topPairs.map((pair) => {
              const isSelected = selectedPair?.a === pair.a && selectedPair?.b === pair.b;
              return (
                <li key={`${pair.a}|${pair.b}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedPair(pair)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">
                        {pair.a} &harr; {pair.b}
                      </span>
                      <span className="text-xs text-slate-500">
                        {describeCorrelation(pair.r)} · {pair.n.toLocaleString()} paired rows
                      </span>
                    </span>
                    <span className={`shrink-0 font-semibold tabular-nums ${pair.r >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {pair.r.toFixed(3)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {selectedPair && (
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">
              {selectedPair.a} vs {selectedPair.b}
            </h2>
            <p className="text-sm text-slate-500">Scatter plot of paired values</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: -10, right: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name={selectedPair.a} tick={{ fontSize: 12 }} />
                  <YAxis type="number" dataKey="y" name={selectedPair.b} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill="#2563eb" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CorrelationsView;
