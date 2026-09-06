import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, CheckCircle2, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { QuestionRecord, TableMeta } from '../../types';

interface CsvExportModalProps {
  tableName: string;
  records: QuestionRecord[];
  onClose: () => void;
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  tableName,
  records,
  onClose
}) => {
  const [includeHtml, setIncludeHtml] = useState<boolean>(true);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [selectedFields, setSelectedFields] = useState<{ [key: string]: boolean }>({
    question_r: true,
    question_hi: true,
    question_en: true,
    option1_hi: true,
    option2_hi: true,
    option3_hi: true,
    option4_hi: true,
    option5_hi: true,
    option1_en: true,
    option2_en: true,
    option3_en: true,
    option4_en: true,
    option5_en: true,
    solution_hi: true,
    solution_en: true,
    correct_option: true,
    image_url: true,
    qa_status: true
  });

  const toggleField = (field: string) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleExport = () => {
    const exportedData = records.map(rec => {
      const row: any = {};
      const f = rec.fields;

      Object.keys(selectedFields).forEach(fieldKey => {
        if (selectedFields[fieldKey]) {
          let val = (f as any)[fieldKey] || '';
          if (!includeHtml && typeof val === 'string') {
            val = val.replace(/<[^>]*>?/gm, '').trim();
          }
          row[fieldKey] = val;
        }
      });
      return row;
    });

    if (format === 'csv') {
      const csv = Papa.unparse(exportedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableName.replace(/[^a-zA-Z0-9_-]/g, '_')}_questions.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const jsonStr = JSON.stringify(exportedData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableName.replace(/[^a-zA-Z0-9_-]/g, '_')}_questions.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div id="csv-export-modal" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold">Export Questions ({records.length})</h2>
              <p className="text-[11px] text-slate-400">Export {tableName} to CSV or JSON format</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-csv-export"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 bg-slate-50/50">
          {/* Format Selector */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Export Format:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-format-csv"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold border transition-all ${
                  format === 'csv'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>CSV Spreadsheet (.csv)</span>
              </button>
              <button
                type="button"
                id="btn-format-json"
                onClick={() => setFormat('json')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold border transition-all ${
                  format === 'json'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-400 ring-1 ring-indigo-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>JSON Document (.json)</span>
              </button>
            </div>
          </div>

          {/* HTML preservation toggle */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Preserve HTML Formatting</span>
              <span className="text-[11px] text-slate-500">Keep &lt;p&gt;, &lt;strong&gt;, &lt;img&gt; tags as stored in Airtable</span>
            </div>
            <input
              type="checkbox"
              id="checkbox-preserve-html"
              checked={includeHtml}
              onChange={(e) => setIncludeHtml(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Fields Selection */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-semibold text-slate-800 block">Fields to Include:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {Object.keys(selectedFields).map((fieldKey) => (
                <label key={fieldKey} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields[fieldKey]}
                    onChange={() => toggleField(fieldKey)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-mono text-[11px] truncate">{fieldKey}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-t border-slate-200">
          <button
            type="button"
            id="btn-cancel-export"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-download-export"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download {format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
