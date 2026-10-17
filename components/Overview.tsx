import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Copy, Columns3, Rows3, TriangleAlert } from 'lucide-react';
import { ColumnType, DatasetStats } from '../types';
import { TYPE_COLORS, TYPE_LABELS, formatNumber, formatPercent } from '../services/format';
import StatCard from './StatCard';

interface OverviewProps {
  stats: DatasetStats;
  onSelectColumn: (name: string) => void;
}

const Overview: React.FC<OverviewProps> = ({ stats, onSelectColumn }) => {
  const typeData = useMemo(
    () =>
      (Object.entries(stats.typeCounts) as [ColumnType, number][])
        .filter(([, count]) => count > 0)
        .map(([type, count]) => ({ type, label: TYPE_LABELS[type], count })),
    [stats.typeCounts],
  );

  const missingData = useMemo(
    () =>
      stats.columns
        .filter((c) => c.missing > 0)
        .sort((a, b) => b.missingPercent - a.missingPercent)
        .slice(0, 12)
        .map((c) => ({ name: c.name, percent: Number(c.missingPercent.toFixed(1)) })),
    [stats.columns],
  );

  const numericColumns = stats.columns.filter((c) => c.numeric);
  const completenessTone = stats.completeness >= 95 ? 'good' : stats.completeness >= 80 ? 'warn' : 'bad';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Rows" value={stats.rowCount.toLocaleString()} icon={Rows3} />
        <StatCard
          title="Columns"
          value={stats.colCount}
          icon={Columns3}
          hint={`${stats.typeCounts.numeric} numeric, ${stats.typeCounts.categorical} categorical`}
        />
        <StatCard
          title="Completeness"
          value={formatPercent(stats.completeness)}
          icon={stats.completeness >= 95 ? CheckCircle2 : TriangleAlert}
          tone={completenessTone}
          hint={`${stats.missingCells.toLocaleString()} of ${stats.totalCells.toLocaleString()} cells missing`}
        />
        <StatCard
          title="Duplicate rows"
          value={stats.duplicateRows.toLocaleString()}
          icon={Copy}
          tone={stats.duplicateRows > 0 ? 'warn' : 'good'}
          hint={formatPercent((stats.duplicateRows / stats.rowCount) * 100) + ' of rows'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Column types</h2>
          <p className="text-sm text-slate-500">Automatically detected from cell values</p>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {typeData.map((d) => (
                      <Cell key={d.type} fill={TYPE_COLORS[d.type]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-2">
              {typeData.map((d) => (
                <li key={d.type} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: TYPE_COLORS[d.type] }} />
                    {d.label}
                  </span>
                  <span className="font-medium tabular-nums text-slate-900">{d.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Missing values by column</h2>
          <p className="text-sm text-slate-500">Percentage of empty cells</p>
          {missingData.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-slate-500">
              <CheckCircle2 className="mb-2 text-emerald-600" aria-hidden="true" />
              No missing values found. Every cell has data.
            </div>
          ) : (
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="percent" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="p-6 pb-4">
          <h2 className="font-semibold text-slate-900">Column summary</h2>
          <p className="text-sm text-slate-500">Select a column to see its full profile</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Column</th>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Missing</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Unique</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Mean / Top value</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Min</th>
                <th scope="col" className="px-6 py-3 text-right font-medium">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.columns.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50">
                  <th scope="row" className="px-6 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => onSelectColumn(c.name)}
                      className="max-w-[220px] truncate text-left text-blue-700 hover:underline"
                    >
                      {c.name}
                    </button>
                  </th>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: TYPE_COLORS[c.type] }}
                    >
                      {TYPE_LABELS[c.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatPercent(c.missingPercent)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{c.unique.toLocaleString()}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-right tabular-nums text-slate-700">
                    {c.numeric ? formatNumber(c.numeric.mean) : c.topValues[0]?.value ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {c.numeric ? formatNumber(c.numeric.min) : c.date ? c.date.min.toISOString().slice(0, 10) : '—'}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-700">
                    {c.numeric ? formatNumber(c.numeric.max) : c.date ? c.date.max.toISOString().slice(0, 10) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {numericColumns.length > 0 && (
        <p className="text-sm text-slate-500">
          {numericColumns.length} numeric column{numericColumns.length === 1 ? '' : 's'} analyzed for distributions and
          correlations.
        </p>
      )}
    </div>
  );
};

export default Overview;
