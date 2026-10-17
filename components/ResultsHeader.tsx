import React from 'react';
import { Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { LoadedFile, TabId } from '../types';
import { formatBytes } from '../services/format';
import { MENU_ITEMS } from './Sidebar';

interface ResultsHeaderProps {
  file: LoadedFile;
  sheetName: string;
  onSheetChange: (sheet: string) => void;
  onReset: () => void;
  onDownload: () => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  file,
  sheetName,
  onSheetChange,
  onReset,
  onDownload,
  activeTab,
  setActiveTab,
}) => {
  const activeLabel = MENU_ITEMS.find((m) => m.id === activeTab)?.label;

  return (
    <header className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <FileSpreadsheet size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-900">{file.name}</h1>
            <p className="text-sm text-slate-500">
              {file.size > 0 ? `${formatBytes(file.size)} · ` : ''}
              {file.sheetNames.length} sheet{file.sheetNames.length === 1 ? '' : 's'} · {activeLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {file.sheetNames.length > 1 && (
            <>
              <label htmlFor="sheet-select" className="sr-only">
                Worksheet
              </label>
              <select
                id="sheet-select"
                value={sheetName}
                onChange={(e) => onSheetChange(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {file.sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download size={16} aria-hidden="true" />
            Export stats
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RotateCcw size={16} aria-hidden="true" />
            New file
          </button>
        </div>
      </div>

      <nav aria-label="Analysis sections" className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:hidden">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              activeTab === item.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <item.icon size={16} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default ResultsHeader;
