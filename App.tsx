import React, { useMemo, useState } from 'react';
import type { WorkBook } from 'xlsx';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UploadZone from './components/UploadZone';
import ResultsHeader from './components/ResultsHeader';
import Overview from './components/Overview';
import ColumnsView from './components/ColumnsView';
import CorrelationsView from './components/CorrelationsView';
import DataPreview from './components/DataPreview';
import AiInsights from './components/AiInsights';
import { parseSheet, readWorkbook, validateFile } from './services/excel';
import { computeStatistics } from './services/statistics';
import { generateSampleData } from './services/sampleData';
import { AiInsightsResult, DataRow, LoadedFile, TabId } from './types';

interface Dataset {
  rows: DataRow[];
  headers: string[];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [sheetName, setSheetName] = useState('');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [insights, setInsights] = useState<AiInsightsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => (dataset ? computeStatistics(dataset.rows, dataset.headers) : null), [dataset]);

  const loadDataset = (next: Dataset) => {
    setDataset(next);
    setSelectedColumn(next.headers[0] ?? '');
    setInsights(null);
    setActiveTab('overview');
  };

  const handleFile = async (selected: File) => {
    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const wb = await readWorkbook(selected);
      const firstSheet = wb.SheetNames.find((name) => {
        try {
          parseSheet(wb, name);
          return true;
        } catch {
          return false;
        }
      });
      if (!firstSheet) throw new Error('No sheet in this file contains data rows.');
      setWorkbook(wb);
      setSheetName(firstSheet);
      setFile({ name: selected.name, size: selected.size, sheetNames: wb.SheetNames });
      loadDataset(parseSheet(wb, firstSheet));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read the file.');
    } finally {
      setLoading(false);
    }
  };

  const handleSample = () => {
    const rows = generateSampleData();
    setWorkbook(null);
    setSheetName('Sales');
    setFile({ name: 'sample-sales.xlsx', size: 0, sheetNames: ['Sales'] });
    setError(null);
    loadDataset({ rows, headers: Object.keys(rows[0]) });
  };

  const handleSheetChange = (name: string) => {
    if (!workbook) return;
    try {
      loadDataset(parseSheet(workbook, name));
      setSheetName(name);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read sheet.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setWorkbook(null);
    setDataset(null);
    setInsights(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!stats || !file) return;
    const blob = new Blob([JSON.stringify({ file: file.name, sheet: sheetName, statistics: stats, insights }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.replace(/\.[^.]+$/, '')}-statistics.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderTab = () => {
    if (!dataset || !stats) return null;
    switch (activeTab) {
      case 'columns':
        return <ColumnsView columns={stats.columns} selected={selectedColumn} onSelect={setSelectedColumn} />;
      case 'correlations':
        return <CorrelationsView correlations={stats.correlations} rows={dataset.rows} />;
      case 'data':
        return <DataPreview rows={dataset.rows} headers={dataset.headers} />;
      case 'ai':
        return <AiInsights rows={dataset.rows} stats={stats} insights={insights} onInsights={setInsights} />;
      default:
        return (
          <Overview
            stats={stats}
            onSelectColumn={(name) => {
              setSelectedColumn(name);
              setActiveTab('columns');
            }}
          />
        );
    }
  };

  const hasData = Boolean(file && stats);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} hasData={hasData} />

      <main className="p-4 md:p-8 lg:ml-64">
        {loading ? (
          <div className="flex min-h-[70vh] flex-col items-center justify-center text-center" role="status">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-slate-900">Reading and analyzing your file...</h2>
            <p className="mt-1 text-sm text-slate-500">Large spreadsheets may take a few seconds.</p>
          </div>
        ) : hasData && file ? (
          <>
            <ResultsHeader
              file={file}
              sheetName={sheetName}
              onSheetChange={handleSheetChange}
              onReset={handleReset}
              onDownload={handleDownload}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            {error && (
              <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {renderTab()}
          </>
        ) : (
          <UploadZone onFile={handleFile} onSample={handleSample} error={error} />
        )}
      </main>
    </div>
  );
};

export default App;
