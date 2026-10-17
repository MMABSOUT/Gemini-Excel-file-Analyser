import React from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ColumnStats } from '../types';
import { TYPE_COLORS, TYPE_LABELS, formatDate, formatNumber, formatPercent } from '../services/format';

interface ColumnsViewProps {
  columns: ColumnStats[];
  selected: string;
  onSelect: (name: string) => void;
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-slate-50 px-4 py-3">
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 truncate text-lg font-semibold tabular-nums text-slate-900" title={value}>
      {value}
    </dd>
  </div>
);

const ChartPanel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-6">
    <h3 className="mb-4 font-semibold text-slate-900">{title}</h3>
    <div className="h-64">{children}</div>
  </section>
);

const ColumnsView: React.FC<ColumnsViewProps> = ({ columns, selected, onSelect }) => {
  const column = columns.find((c) => c.name === selected) ?? columns[0];
  const color = TYPE_COLORS[column.type];
  const n = column.numeric;

  const skewLabel = n
    ? Math.abs(n.skewness) < 0.5
      ? 'Symmetric'
      : n.skewness > 0
        ? 'Right-skewed'
        : 'Left-skewed'
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="column-select" className="text-sm font-medium text-slate-700">
            Column
          </label>
          <select
            id="column-select"
            value={column.name}
            onChange={(e) => onSelect(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-80"
          >
            {columns.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({TYPE_LABELS[c.type]})
              </option>
            ))}
          </select>
        </div>
        <span
          className="self-start rounded-full px-3 py-1 text-sm font-medium text-white sm:self-auto"
          style={{ backgroundColor: color }}
        >
          {TYPE_LABELS[column.type]}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Non-empty" value={column.count.toLocaleString()} />
        <Metric label="Missing" value={`${column.missing.toLocaleString()} (${formatPercent(column.missingPercent)})`} />
        <Metric label="Unique" value={column.unique.toLocaleString()} />
        <Metric label="Uniqueness" value={formatPercent(column.uniquePercent)} />
        {n && (
          <>
            <Metric label="Mean" value={formatNumber(n.mean)} />
            <Metric label="Median" value={formatNumber(n.median)} />
            <Metric label="Std deviation" value={formatNumber(n.std)} />
            <Metric label="Sum" value={formatNumber(n.sum)} />
            <Metric label="Min" value={formatNumber(n.min)} />
            <Metric label="Q1 (25%)" value={formatNumber(n.q1)} />
            <Metric label="Q3 (75%)" value={formatNumber(n.q3)} />
            <Metric label="Max" value={formatNumber(n.max)} />
            <Metric label="Outliers (IQR)" value={n.outliers.toLocaleString()} />
            <Metric label="Skewness" value={`${n.skewness.toFixed(2)} · ${skewLabel}`} />
            <Metric label="Zeros" value={n.zeros.toLocaleString()} />
            <Metric label="Negatives" value={n.negatives.toLocaleString()} />
          </>
        )}
        {column.date && (
          <>
            <Metric label="Earliest" value={formatDate(column.date.min)} />
            <Metric label="Latest" value={formatDate(column.date.max)} />
            <Metric label="Span" value={`${column.date.spanDays.toLocaleString()} days`} />
          </>
        )}
        {column.avgLength !== undefined && <Metric label="Avg. length" value={`${column.avgLength.toFixed(1)} chars`} />}
      </dl>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {n && (
          <ChartPanel title="Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={n.histogram} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => [v, 'Rows']}
                  labelFormatter={(_, payload) => {
                    const bin = payload?.[0]?.payload;
                    return bin ? `${formatNumber(bin.start)} – ${formatNumber(bin.end)}` : '';
                  }}
                />
                <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {column.date && (
          <ChartPanel title="Records over time">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={column.date.timeline} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v, 'Rows']} />
                <Area type="monotone" dataKey="count" stroke={color} fill={color} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {column.topValues.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Most frequent values</h3>
            <ul className="space-y-3">
              {column.topValues.map((v) => (
                <li key={v.value}>
                  <div className="mb-1 flex justify-between gap-4 text-sm">
                    <span className="truncate text-slate-700" title={v.value}>
                      {v.value || '(blank)'}
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      {v.count.toLocaleString()} · {formatPercent(v.percent)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(v.percent, 1)}%`, backgroundColor: color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default ColumnsView;
