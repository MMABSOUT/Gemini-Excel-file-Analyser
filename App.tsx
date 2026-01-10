
import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { analyzeData } from './services/geminiService';
import { DataRow, AnalysisResult, AppState } from './types';
import { 
  CloudUpload, 
  FileCheck, 
  Loader2, 
  Database,
  Search,
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<DataRow[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setAppState(AppState.LOADING_FILE);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const ab = e.target?.result;
          const workbook = XLSX.read(ab, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as DataRow[];

          if (jsonData.length === 0) {
            throw new Error("The selected file appears to be empty.");
          }

          setData(jsonData);
          setAppState(AppState.ANALYZING);
          
          const result = await analyzeData(jsonData);
          setAnalysis(result);
          setAppState(AppState.READY);
        } catch (err: any) {
          setError(err.message || "Failed to process the Excel file.");
          setAppState(AppState.ERROR);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setAppState(AppState.ERROR);
    }
  };

  const renderContent = () => {
    if (appState === AppState.IDLE) {
      return (
        <div className="max-w-4xl mx-auto mt-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
              Connect Your <span className="text-blue-600">Excel Data</span>
            </h1>
            <p className="mt-4 text-xl text-slate-500">
              InsightFlow automates the connection, analysis, and visualization of your repository files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all group relative overflow-hidden">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CloudUpload size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Local Upload</h3>
                <p className="text-slate-500 mt-2">Drag and drop your Excel or CSV file here to start analysis instantly.</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Database size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Google Drive Repository</h3>
                <p className="text-slate-500 mt-2">Connect to your team's drive to automate recurring report analysis.</p>
                <div className="mt-6 flex gap-2">
                  <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded">PRO FEATURE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 text-white flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <Search className="text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Auto-Discovery</h4>
                <p className="text-slate-400">InsightFlow scans for relationships and feature importance automatically.</p>
              </div>
            </div>
            <div className="hidden md:flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">1</div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">2</div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">3</div>
            </div>
          </div>
        </div>
      );
    }

    if (appState === AppState.LOADING_FILE || appState === AppState.ANALYZING) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-slate-800">
            {appState === AppState.LOADING_FILE ? 'Reading file content...' : 'Gemini AI is analyzing relationships...'}
          </h2>
          <p className="text-slate-500 mt-2">This may take a few moments for large datasets.</p>
          <div className="mt-8 w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 animate-pulse w-3/4 rounded-full" />
          </div>
        </div>
      );
    }

    if (appState === AppState.ERROR) {
      return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-red-100 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900">Analysis Failed</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <button 
            onClick={() => setAppState(AppState.IDLE)}
            className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Try Another File
          </button>
        </div>
      );
    }

    if (appState === AppState.READY && analysis) {
      if (activeTab === 'data') {
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold">Source Data Preview</h2>
               <div className="text-sm text-slate-500">Showing first 50 records of {fileName}</div>
             </div>
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                       {Object.keys(data[0] || {}).map((header) => (
                         <th key={header} className="px-6 py-4 font-semibold text-slate-700 truncate">{header}</th>
                       ))}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {data.slice(0, 50).map((row, i) => (
                       <tr key={i} className="hover:bg-slate-50 transition-colors">
                         {Object.values(row).map((val: any, j) => (
                           <td key={j} className="px-6 py-4 text-slate-600 truncate max-w-[200px]">
                             {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>
        );
      }
      
      return <Dashboard data={data} analysis={analysis} />;
    }

    return null;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8">
        {appState === AppState.READY && (
           <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <FileCheck className="text-emerald-500" size={18} />
                <span className="text-sm font-medium text-slate-700">{fileName}</span>
                <button 
                  onClick={() => setAppState(AppState.IDLE)}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Change
                </button>
              </div>
           </div>
        )}
        
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
