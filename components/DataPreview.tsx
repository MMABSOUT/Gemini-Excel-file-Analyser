import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { DataRow } from '../types';
import { formatCell } from '../services/format';

interface DataPreviewProps {
  rows: DataRow[];
  headers: string[];
}

const PAGE_SIZE = 50;

const DataPreview: React.FC<DataPreviewProps> = ({ rows, headers }) => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => headers.some((h) => formatCell(row[h] ?? null).toLowerCase().includes(q)));
  }, [rows, headers, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
          <label htmlFor="row-search" className="sr-only">
            Search rows
          </label>
          <input
            id="row-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search all columns..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <p className="text-sm text-slate-500">
          {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} rows
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400">#</th>
                {headers.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((row, i) => (
                <tr key={currentPage * PAGE_SIZE + i} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-xs tabular-nums text-slate-400">{currentPage * PAGE_SIZE + i + 1}</td>
                  {headers.map((h) => {
                    const text = formatCell(row[h] ?? null);
                    return (
                      <td key={h} className="max-w-[240px] truncate px-4 py-2 text-slate-700" title={text}>
                        {text === '' ? <span className="text-slate-300">empty</span> : text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 0}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="px-2 tabular-nums text-slate-500">
          Page {currentPage + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= pageCount - 1}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataPreview;
