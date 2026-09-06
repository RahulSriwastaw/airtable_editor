import React, { useState, useRef, useEffect } from 'react';
import { Database, ChevronDown, Check, Plus, Settings, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { AirtableBaseItem } from '../types';

interface BaseSwitcherDropdownProps {
  bases: AirtableBaseItem[];
  activeBaseId: string;
  onSelectBase: (baseId: string) => void;
  onOpenBaseManager: () => void;
  onAddNewBase: () => void;
  isCompact?: boolean;
}

export const BaseSwitcherDropdown: React.FC<BaseSwitcherDropdownProps> = ({
  bases,
  activeBaseId,
  onSelectBase,
  onOpenBaseManager,
  onAddNewBase,
  isCompact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeBase = bases.find(b => b.baseId === activeBaseId || b.id === activeBaseId) || bases[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBases = bases.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.baseId.toLowerCase().includes(search.toLowerCase()) ||
    (b.category && b.category.toLowerCase().includes(search.toLowerCase()))
  );

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 text-purple-700 bg-purple-50';
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-emerald-700 bg-emerald-50';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 text-amber-700 bg-amber-50';
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 text-rose-700 bg-rose-50';
      case 'blue':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40 text-blue-700 bg-blue-50';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-indigo-700 bg-indigo-50';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="btn-base-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border transition-all text-left ${
          isCompact
            ? 'px-2.5 py-1 text-xs bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            : 'px-2.5 py-1.5 text-xs bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
        }`}
        title={`Current Base: ${activeBase?.name || 'Airtable Base'} (${activeBase?.baseId || ''})`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative flex-none">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
              activeBase?.color === 'purple' ? 'bg-purple-600 text-white' :
              activeBase?.color === 'emerald' ? 'bg-emerald-600 text-white' :
              activeBase?.color === 'amber' ? 'bg-amber-600 text-white' :
              activeBase?.color === 'rose' ? 'bg-rose-600 text-white' :
              'bg-indigo-600 text-white'
            }`}>
              <Database className="w-3 h-3" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white" />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold truncate text-[11px] max-w-[130px] sm:max-w-[170px]">
                {activeBase?.name || 'Select Base'}
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-slate-100 text-slate-500 border border-slate-200 hidden md:inline-block">
                {bases.length} Bases
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">
              {activeBase?.baseId || ''}
            </span>
          </div>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          id="base-switcher-menu"
          className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="p-2.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold">Connected Airtable Bases</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
              {bases.length} Connected
            </span>
          </div>

          {/* Search bar */}
          {bases.length > 3 && (
            <div className="p-2 border-b border-slate-100 bg-slate-50">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search connected bases..."
                className="w-full text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Bases List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
            {filteredBases.map((base) => {
              const isSelected = base.baseId === activeBase?.baseId;
              return (
                <button
                  key={base.id || base.baseId}
                  type="button"
                  id={`btn-select-base-${base.baseId}`}
                  onClick={() => {
                    onSelectBase(base.baseId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-md flex-none flex items-center justify-center text-xs font-bold ${
                      base.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                      base.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                      base.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                      base.color === 'rose' ? 'bg-rose-100 text-rose-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      <Database className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs truncate block max-w-[160px]">{base.name}</span>
                        {base.category && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded font-medium">
                            {base.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{base.baseId}</span>
                        {typeof base.tableCount === 'number' && (
                          <span>• {base.tableCount} tables</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="flex items-center gap-1 text-indigo-600 flex-none pl-1">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 hover:text-indigo-600 font-medium">
                      Switch
                    </span>
                  )}
                </button>
              );
            })}

            {filteredBases.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching bases found.
              </div>
            )}
          </div>

          {/* Dropdown Actions Footer */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-1.5">
            <button
              type="button"
              id="btn-quick-add-base"
              onClick={() => {
                setIsOpen(false);
                onAddNewBase();
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Base</span>
            </button>

            <button
              type="button"
              id="btn-manage-all-bases"
              onClick={() => {
                setIsOpen(false);
                onOpenBaseManager();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Manage all connected Airtable bases"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Manage</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
