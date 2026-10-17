import React, { useRef, useState } from 'react';
import { BarChart3, FileSpreadsheet, Gauge, Sigma, Sparkles, UploadCloud } from 'lucide-react';
import { ACCEPTED_EXTENSIONS } from '../services/excel';

interface UploadZoneProps {
  onFile: (file: File) => void;
  onSample: () => void;
  error: string | null;
}

const FEATURES = [
  { icon: Sigma, title: 'Descriptive statistics', text: 'Mean, median, quartiles, std deviation and outliers per column.' },
  { icon: Gauge, title: 'Data quality', text: 'Missing values, duplicates and completeness score.' },
  { icon: BarChart3, title: 'Distributions & correlations', text: 'Histograms, top values and a correlation matrix.' },
  { icon: Sparkles, title: 'Optional AI insights', text: 'Ask Gemini to summarize trends in plain language.' },
];

const UploadZone: React.FC<UploadZoneProps> = ({ onFile, onSample, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="mx-auto max-w-3xl py-8 md:py-16">
      <div className="mb-10 text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Upload a spreadsheet, get <span className="text-blue-600">instant statistics</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-slate-500">
          Drop an Excel or CSV file to profile every column, measure data quality and uncover relationships. Files are
          processed entirely in your browser.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an Excel or CSV file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed bg-white px-6 py-14 text-center shadow-sm transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <UploadCloud size={30} aria-hidden="true" />
        </div>
        <p className="text-lg font-semibold text-slate-900">
          {isDragging ? 'Drop your file here' : 'Click to choose a file or drag it here'}
        </p>
        <p className="mt-2 text-sm text-slate-500">Supports .xlsx, .xls, .xlsm and .csv up to 50 MB</p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onSample}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
        >
          <FileSpreadsheet size={16} aria-hidden="true" />
          No file handy? Try a sample sales dataset
        </button>
      </div>

      <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Icon size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UploadZone;
