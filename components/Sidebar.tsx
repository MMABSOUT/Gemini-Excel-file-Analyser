import React from 'react';
import { Columns3, LayoutDashboard, Network, Share2, Sparkles, Table2 } from 'lucide-react';
import { TabId } from '../types';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  hasData: boolean;
}

export const MENU_ITEMS: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'columns', icon: Columns3, label: 'Column Statistics' },
  { id: 'correlations', icon: Network, label: 'Correlations' },
  { id: 'data', icon: Table2, label: 'Source Data' },
  { id: 'ai', icon: Sparkles, label: 'AI Insights' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, hasData }) => (
  <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-slate-900 text-white lg:flex">
    <div className="p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-lg bg-blue-600 p-2">
          <Share2 size={22} aria-hidden="true" />
        </div>
        <span className="text-xl font-bold tracking-tight">InsightFlow</span>
      </div>

      <nav aria-label="Analysis sections" className="space-y-1">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={!hasData}
            onClick={() => setActiveTab(item.id)}
            aria-current={hasData && activeTab === item.id ? 'page' : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              hasData && activeTab === item.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 enabled:hover:bg-slate-800 enabled:hover:text-white'
            }`}
          >
            <item.icon size={20} aria-hidden="true" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>

    <div className="mt-auto border-t border-slate-800 p-6 text-sm text-slate-400">
      {hasData ? 'Analysis ready' : 'Upload a file to begin'}
    </div>
  </aside>
);

export default Sidebar;
