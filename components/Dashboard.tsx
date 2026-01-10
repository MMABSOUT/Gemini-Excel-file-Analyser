
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';
import { AnalysisResult, DataRow } from '../types';
import { 
  ArrowUpRight, 
  TrendingUp, 
  AlertCircle, 
  Download,
  Info
} from 'lucide-react';

interface DashboardProps {
  data: DataRow[];
  analysis: AnalysisResult;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ data, analysis }) => {
  const renderChart = (suggestion: any) => {
    const commonProps = {
      data: data.slice(0, 100), // Sample for visual clarity
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    switch (suggestion.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={suggestion.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={suggestion.yAxis} fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={suggestion.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={suggestion.yAxis} stroke="#8b5cf6" strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={suggestion.xAxis} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey={suggestion.yAxis} stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data.slice(0, 5)}
              dataKey={suggestion.yAxis}
              nameKey={suggestion.xAxis}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid />
            <XAxis type="number" dataKey={suggestion.xAxis} name={suggestion.xAxis} />
            <YAxis type="number" dataKey={suggestion.yAxis} name={suggestion.yAxis} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Data points" data={data.slice(0, 50)} fill="#f59e0b" />
          </ScatterChart>
        );
      default:
        return null;
    }
  };

  const handleDownload = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify({ data, analysis }, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "analysis_results.json";
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Automation Dashboard</h2>
          <p className="text-slate-500 mt-1">AI-driven analysis for your repository data</p>
        </div>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download size={18} />
          <span>Download Results</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Rows" value={analysis.statistics.rowCount} icon={FileSpreadsheet} />
        <StatCard title="Features Found" value={analysis.statistics.colCount} icon={TrendingUp} />
        <StatCard title="Data Quality" value="98.2%" icon={ArrowUpRight} trend="+2.4%" />
        <StatCard title="Key Insights" value={analysis.keyTakeaways.length} icon={AlertCircle} />
      </div>

      {/* AI Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4 text-blue-600">
          <Info size={20} />
          <h3 className="font-semibold text-lg">AI Summary</h3>
        </div>
        <p className="text-slate-700 leading-relaxed text-lg italic">
          "{analysis.summary}"
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.keyTakeaways.map((takeaway, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <p className="text-slate-600 text-sm">{takeaway}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {analysis.charts.map((chart, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="mb-6">
              <h4 className="font-bold text-slate-800">{chart.title}</h4>
              <p className="text-slate-500 text-sm mt-1">{chart.description}</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(chart) as any}
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Relationships Section */}
      <div className="bg-slate-900 rounded-xl p-8 text-white">
        <div className="mb-8">
          <h3 className="text-2xl font-bold">Data Relationships</h3>
          <p className="text-slate-400 mt-2">Correlation and logical connections identified by InsightFlow</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analysis.relationships.map((rel, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">{rel.type}</span>
                <span className="text-emerald-400 text-sm font-medium">{(rel.strength * 100).toFixed(0)}% Match</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-slate-700 px-2 py-1 rounded text-sm">{rel.source}</span>
                <ArrowUpRight size={14} className="text-slate-500" />
                <span className="bg-slate-700 px-2 py-1 rounded text-sm">{rel.target}</span>
              </div>
              <p className="text-slate-300 text-sm line-clamp-3">
                {rel.insight}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-slate-500 text-sm mt-1">{title}</div>
  </div>
);

import { FileSpreadsheet } from 'lucide-react';
export default Dashboard;
