import React, { useState } from 'react';
import { X, Search, Replace, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { FindReplaceMatch, TableMeta } from '../../types';
import { api } from '../../services/api';

interface FindAndReplaceModalProps {
  currentTableName: string;
  tables: TableMeta[];
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const FindAndReplaceModal: React.FC<FindAndReplaceModalProps> = ({
  currentTableName,
  tables,
  userName,
  onClose,
  onSuccess
}) => {
  const [selectedTable, setSelectedTable] = useState<string>(currentTableName || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [targetScope, setTargetScope] = useState<'all' | 'question' | 'options' | 'solution'>('all');
  const [matchCase, setMatchCase] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [previewMatches, setPreviewMatches] = useState<FindReplaceMatch[]>([]);
  const [affectedCount, setAffectedCount] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePreview = async () => {
    if (!searchQuery.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter text to search for.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.findAndReplace({
        tableName: selectedTable,
        searchQuery,
        replaceQuery,
        targetFields: [targetScope],
        matchCase,
        dryRun: true
      }, userName);

      setPreviewMatches(res.preview);
      setAffectedCount(res.affectedQuestions);
      setHasSearched(true);
      if (res.matchesCount === 0) {
        setStatusMessage({ type: 'error', text: `No occurrences of "${searchQuery}" found in the selected scope.` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Search preview failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!searchQuery.trim()) return;
    if (!confirm(`Are you sure you want to replace all occurrences of "${searchQuery}" with "${replaceQuery}" in ${affectedCount || 0} questions?`)) {
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.findAndReplace({
        tableName: selectedTable,
        searchQuery,
        replaceQuery,
        targetFields: [targetScope],
        matchCase,
        dryRun: false
      }, userName);

      setStatusMessage({
        type: 'success',
        text: `Successfully replaced ${res.matchesCount} instances across ${res.affectedQuestions} questions!`
      });
      setPreviewMatches([]);
      setAffectedCount(null);
      setHasSearched(false);
      onSuccess();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Replace operation failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div id="find-replace-modal" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Replace className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-semibold">Bulk Find & Replace</h2>
              <p className="text-[11px] text-slate-400">Quickly correct typos, terminology, or formulas across multiple questions</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-find-replace"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Form Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Target Table */}
              <div>
                <label htmlFor="select-find-replace-table" className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Table:
                </label>
                <select
                  id="select-find-replace-table"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Tables ({tables.length} tests)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.recordCount} questions)
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Fields */}
              <div>
                <label htmlFor="select-target-fields" className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Fields:
                </label>
                <select
                  id="select-target-fields"
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Fields (Questions, Options & Solutions)</option>
                  <option value="question">Question Text Only (Hindi + English)</option>
                  <option value="options">Options Only (Options 1–5)</option>
                  <option value="solution">Solutions & Explanations Only</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label htmlFor="input-find-search" className="block text-xs font-semibold text-slate-700 mb-1">
                Find Text / Typo:
              </label>
              <input
                id="input-find-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. राष्ट्रीय मखाना बोर्ड or misspelled term"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Replace Input */}
            <div>
              <label htmlFor="input-find-replace" className="block text-xs font-semibold text-slate-700 mb-1">
                Replace With:
              </label>
              <input
                id="input-find-replace"
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="e.g. राष्ट्रीय मखाना अनुसंधान केंद्र"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Match Case Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="checkbox-match-case"
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="checkbox-match-case" className="text-xs text-slate-600">
                Match exact case sensitive
              </label>
            </div>
          </div>

          {/* Matches Preview List */}
          {hasSearched && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>
                  Found {previewMatches.length} matches in {affectedCount} questions:
                </span>
                <span className="text-[11px] text-slate-500">Previewing first 50 matches</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {previewMatches.map((m, idx) => (
                  <div key={idx} className="p-3 text-xs space-y-1 hover:bg-slate-50/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="font-semibold text-indigo-700">
                        {m.tableName} • Q #{m.questionNumber} ({m.field})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                      <div className="p-2 bg-red-50/50 rounded border border-red-100 text-red-900 line-clamp-2">
                        <span className="text-[10px] text-red-500 block font-semibold uppercase">Before:</span>
                        <div dangerouslySetInnerHTML={{ __html: m.originalText }} />
                      </div>
                      <div className="p-2 bg-emerald-50/50 rounded border border-emerald-100 text-emerald-900 line-clamp-2">
                        <span className="text-[10px] text-emerald-600 block font-semibold uppercase">After Replacement:</span>
                        <div dangerouslySetInnerHTML={{ __html: m.previewReplacedText }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-t border-slate-200">
          <button
            type="button"
            id="btn-cancel-find-replace"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-preview-find-replace"
              disabled={isLoading || !searchQuery.trim()}
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Scanning...' : '1. Preview Matches'}</span>
            </button>

            <button
              type="button"
              id="btn-apply-find-replace"
              disabled={isLoading || !hasSearched || previewMatches.length === 0}
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Replace className="w-3.5 h-3.5" />
              <span>2. Replace All in Airtable</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
