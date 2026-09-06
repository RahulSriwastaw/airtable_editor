import React, { useState, useEffect } from 'react';
import { X, History, User, Clock, CheckCircle2, FileEdit, PlusCircle, Trash2, Replace } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../services/api';

interface AuditLogModalProps {
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'create':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1"><PlusCircle className="w-3 h-3" /> Created</span>;
      case 'update':
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold flex items-center gap-1"><FileEdit className="w-3 h-3" /> Edited</span>;
      case 'delete':
        return <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-[11px] font-semibold flex items-center gap-1"><Trash2 className="w-3 h-3" /> Deleted</span>;
      case 'bulk_replace':
        return <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold flex items-center gap-1"><Replace className="w-3 h-3" /> Bulk Replace</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">{action}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div id="audit-log-modal" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-semibold">Activity & Audit History</h2>
              <p className="text-[11px] text-slate-400">Chronological trail of edits made across Test Factory MCQ tables</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-audit-log"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Audit items */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Loading audit records...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No recent changes logged.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="text-xs font-semibold text-slate-800">
                      {log.tableName} {log.questionNumber ? `• Q #${log.questionNumber}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <User className="w-3 h-3 text-slate-400" />
                      {log.userName} ({log.userRole})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 font-medium">{log.summary}</p>

                {log.changes && log.changes.length > 0 && (
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    {log.changes.map((c, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-slate-600">
                        <span className="font-semibold text-indigo-700">{c.field}:</span>{' '}
                        <span className="line-through text-red-500 opacity-80">{c.oldValueSnippet}</span>{' '}
                        <span className="text-slate-400">→</span>{' '}
                        <span className="text-emerald-700 font-semibold">{c.newValueSnippet}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-white border-t border-slate-200">
          <button
            type="button"
            id="btn-close-audit-footer"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
