import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Layers, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import { QuestionFields } from '../../types';
import { api } from '../../services/api';

interface CsvImportModalProps {
  tableName: string;
  userName: string;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  tableName,
  userName,
  onClose,
  onImportSuccess
}) => {
  const [fileData, setFileData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setErrorMessage('');

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setFileData(results.data);
          } else {
            setErrorMessage('No valid rows found in CSV.');
          }
        },
        error: (err) => {
          setErrorMessage(`CSV Parse error: ${err.message}`);
        }
      });
    }
  };

  const handleCommitImport = async () => {
    if (fileData.length === 0) return;
    setIsImporting(true);
    setErrorMessage('');
    setProgress({ current: 0, total: fileData.length });

    try {
      for (let i = 0; i < fileData.length; i++) {
        const row = fileData[i];
        const fields: Partial<QuestionFields> = {
          question_r: parseInt(row.question_r || row.q_no || row.number || String(i + 1), 10),
          question_hi: row.question_hi || row.question || '<p></p>',
          question_en: row.question_en || '<p></p>',
          option1_hi: row.option1_hi || row.opt1_hi || '<p></p>',
          option2_hi: row.option2_hi || row.opt2_hi || '<p></p>',
          option3_hi: row.option3_hi || row.opt3_hi || '<p></p>',
          option4_hi: row.option4_hi || row.opt4_hi || '<p></p>',
          option5_hi: row.option5_hi || row.opt5_hi || '',
          option1_en: row.option1_en || row.opt1_en || '<p></p>',
          option2_en: row.option2_en || row.opt2_en || '<p></p>',
          option3_en: row.option3_en || row.opt3_en || '<p></p>',
          option4_en: row.option4_en || row.opt4_en || '<p></p>',
          option5_en: row.option5_en || row.opt5_en || '',
          solution_hi: row.solution_hi || row.explanation_hi || '<p></p>',
          solution_en: row.solution_en || row.explanation_en || '<p></p>',
          correct_option: String(row.correct_option || row.answer || '1').replace(/[^1-5]/g, '1') || '1',
          image_url: row.image_url || row.image || '',
          qa_status: (row.qa_status === 'approved' ? 'approved' : row.qa_status === 'in_review' ? 'in_review' : 'draft') as any
        };

        await api.createQuestion(tableName, fields, userName);
        setProgress({ current: i + 1, total: fileData.length });
      }

      setSuccessMessage(`Successfully imported ${fileData.length} questions into ${tableName}!`);
      setTimeout(() => {
        onImportSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Import failed midway.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div id="csv-import-modal" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-semibold">Bulk Import to {tableName}</h2>
              <p className="text-[11px] text-slate-400">Import MCQ questions via CSV spreadsheet</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-csv-import"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Upload Drop Zone */}
          {fileData.length === 0 ? (
            <label
              htmlFor="csv-file-input"
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors text-center shadow-2xs"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Click or drag CSV file here to upload</p>
                <p className="text-xs text-slate-500 mt-1">
                  Expected columns: <code className="text-indigo-600 font-mono text-[11px]">question_r, question_hi, option1_hi...option5_hi, solution_hi, question_en...</code>
                </p>
              </div>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{fileName}</p>
                    <p className="text-[11px] text-slate-500">{fileData.length} valid rows found</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-reselect-csv"
                  onClick={() => setFileData([])}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Choose another file
                </button>
              </div>

              {/* Preview Rows Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Preview of First 3 Records:</span>
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                  {fileData.slice(0, 3).map((row, idx) => (
                    <div key={idx} className="p-3 space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px] text-indigo-700 font-semibold">
                        <span>Row {idx + 1} (Q #{row.question_r || idx + 1})</span>
                        <span className="text-slate-500">Correct: Option {row.correct_option || '1'}</span>
                      </div>
                      <p className="text-slate-800 line-clamp-1 font-medium">
                        HI: {(row.question_hi || row.question || '').replace(/<[^>]*>?/gm, '')}
                      </p>
                      <p className="text-slate-600 line-clamp-1">
                        EN: {(row.question_en || '').replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar if importing */}
              {isImporting && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>Importing to Airtable...</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-200"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-t border-slate-200">
          <button
            type="button"
            id="btn-cancel-import"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-commit-import"
            disabled={isImporting || fileData.length === 0}
            onClick={handleCommitImport}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isImporting ? 'Importing...' : `Import ${fileData.length} Questions`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
