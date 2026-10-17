import React, { useState } from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { AiInsightsResult, DataRow, DatasetStats } from '../types';
import { generateInsights, isAiConfigured } from '../services/geminiService';

interface AiInsightsProps {
  rows: DataRow[];
  stats: DatasetStats;
  insights: AiInsightsResult | null;
  onInsights: (result: AiInsightsResult) => void;
}

const AiInsights: React.FC<AiInsightsProps> = ({ rows, stats, insights, onInsights }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      onInsights(await generateInsights(rows, stats));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights.');
    } finally {
      setLoading(false);
    }
  };

  if (!insights) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Sparkles size={26} aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Generate AI insights with Gemini</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Sends the computed statistics and a 30-row sample to Gemini for a plain-language summary, relationships and
          recommended next steps.
        </p>
        {isAiConfigured ? (
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            {loading ? 'Analyzing...' : 'Generate insights'}
          </button>
        ) : (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Add a <code className="font-mono">GEMINI_API_KEY</code> environment variable to enable AI insights.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-3 flex items-center gap-2 text-blue-700">
          <Sparkles size={18} aria-hidden="true" />
          <h2 className="font-semibold">Summary</h2>
        </div>
        <p className="leading-relaxed text-slate-700">{insights.summary}</p>
        <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {insights.keyTakeaways.map((t) => (
            <li key={t} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {insights.relationships.length > 0 && (
        <section className="rounded-xl bg-slate-900 p-6 text-white">
          <h2 className="mb-4 font-semibold">Relationships</h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {insights.relationships.map((rel) => (
              <li key={`${rel.source}-${rel.target}`} className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">{rel.type}</span>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded bg-slate-700 px-2 py-0.5">{rel.source}</span>
                  <ArrowRight size={14} className="text-slate-400" aria-hidden="true" />
                  <span className="rounded bg-slate-700 px-2 py-0.5">{rel.target}</span>
                </p>
                <p className="mt-3 text-sm text-slate-300">{rel.insight}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {insights.recommendations.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-slate-900">Recommended next steps</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {insights.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>
      )}

      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        Regenerate
      </button>
    </div>
  );
};

export default AiInsights;
