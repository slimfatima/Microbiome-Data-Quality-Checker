import React from 'react';
import { ShieldCheck, Play, RotateCcw } from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'upload' 
  | 'metadata' 
  | 'taxonomy' 
  | 'signatures' 
  | 'experiments' 
  | 'reports' 
  | 'r_package' 
  | 'docs';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onRunValidation: () => void;
  isValidating: boolean;
  onReset: () => void;
  hasIssues: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onRunValidation,
  isValidating,
  onReset,
  hasIssues
}) => {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'upload', label: 'Upload & Import' },
    { id: 'metadata', label: 'Metadata' },
    { id: 'taxonomy', label: 'Taxonomy' },
    { id: 'signatures', label: 'Signatures' },
    { id: 'experiments', label: 'Experiments' },
    { id: 'reports', label: 'QC Reports' },
    { id: 'r_package', label: 'R Package' },
    { id: 'docs', label: 'Documentation' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div 
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded bg-teal-800 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-900 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Microbiome QC
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`py-2 whitespace-nowrap shrink-0 transition-colors border-b-2 text-xs font-semibold ${
                    isActive
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onReset}
              title="Reset to default benchmark"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors text-xs flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={onRunValidation}
              disabled={isValidating}
              className={`px-3.5 py-2 text-xs font-semibold rounded text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isValidating
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-teal-800 hover:bg-teal-900 shadow-xs'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isValidating ? 'Validating...' : 'Run QC Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav strip */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-100 gap-4 custom-scrollbar text-xs font-medium">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap shrink-0 px-2 py-1 rounded ${
                activeTab === item.id
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
