import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Database,
  Layers,
  CheckSquare,
  Square,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { TableMeta, QuestionRecord } from '../../types';
import { getQuestionImagesSummary, QuestionImageDetail } from '../../utils/mathUtils';

interface ImgbbMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableMeta[];
  activeTable: string;
  records: QuestionRecord[];
  onMigrationComplete: () => void;
  onSelectQuestion?: (recordId: string) => void;
}

interface QuestionScanResult {
  record: QuestionRecord;
  questionNumber: number | string;
  totalImages: number;
  unhostedCount: number;
  locations: string[];
  images: QuestionImageDetail[];
  status: 'pending' | 'migrating' | 'done' | 'failed';
  error?: string;
}

export const ImgbbMigrationModal: React.FC<ImgbbMigrationModalProps> = ({
  isOpen,
  onClose,
  tables,
  activeTable,
  records,
  onMigrationComplete,
  onSelectQuestion
}) => {
  const [selectedTable, setSelectedTable] = useState(activeTable || (tables[0]?.name || ''));
  const [isScanning, setIsScanning] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all_images' | 'unhosted_only' | 'hosted_only'>('unhosted_only');
  
  // Results
  const [scannedQuestions, setScannedQuestions] = useState<QuestionScanResult[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ current: 0, total: 0, currentQ: '' });
  const [migrationSummary, setMigrationSummary] = useState<{ totalQuestions: number; rehostedImages: number; failed: number } | null>(null);

  useEffect(() => {
    if (activeTable) {
      setSelectedTable(activeTable);
    }
  }, [activeTable]);

  useEffect(() => {
    if (isOpen) {
      scanTableForImages();
    }
  }, [isOpen, selectedTable, records]);

  // Deep Scan across all question fields: Question, Options 1-5, Solutions, and Diagrams
  const scanTableForImages = () => {
    setIsScanning(true);
    const results: QuestionScanResult[] = [];

    records.forEach(rec => {
      const summary = getQuestionImagesSummary(rec.fields);
      if (summary.hasAnyImage) {
        results.push({
          record: rec,
          questionNumber: rec.fields.question_r || rec.id,
          totalImages: summary.totalImages,
          unhostedCount: summary.unhostedImages,
          locations: summary.locations,
          images: summary.images,
          status: 'pending'
        });
      }
    });

    setScannedQuestions(results);
    // Pre-select questions that have unhosted images
    const unhostedIds = new Set(results.filter(q => q.unhostedCount > 0).map(q => q.record.id));
    setSelectedQuestionIds(unhostedIds);
    setIsScanning(false);
    setMigrationSummary(null);
  };

  const toggleSelectAll = () => {
    const listToToggle = displayedQuestions;
    const allSelected = listToToggle.every(q => selectedQuestionIds.has(q.record.id));
    const next = new Set(selectedQuestionIds);
    if (allSelected) {
      listToToggle.forEach(q => next.delete(q.record.id));
    } else {
      listToToggle.forEach(q => next.add(q.record.id));
    }
    setSelectedQuestionIds(next);
  };

  const toggleSelectQuestion = (id: string) => {
    const next = new Set(selectedQuestionIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedQuestionIds(next);
  };

  // Filter displayed list
  const displayedQuestions = scannedQuestions.filter(q => {
    if (activeTabFilter === 'unhosted_only') {
      return q.unhostedCount > 0;
    }
    if (activeTabFilter === 'hosted_only') {
      return q.unhostedCount === 0;
    }
    return true;
  });

  const totalUnhostedImages = scannedQuestions.reduce((acc, q) => acc + q.unhostedCount, 0);
  const totalAllImages = scannedQuestions.reduce((acc, q) => acc + q.totalImages, 0);

  // 1-Click Complete Table Rehost / Selected Rehost
  const handleHostAllInOneClick = async () => {
    if (scannedQuestions.length === 0) return;
    setIsMigrating(true);
    setMigrationSummary(null);

    const questionsToProcess = scannedQuestions.filter(q => selectedQuestionIds.has(q.record.id) || q.unhostedCount > 0);
    setProgress({ current: 0, total: questionsToProcess.length, currentQ: 'Initializing...' });

    let totalImagesRehosted = 0;
    let failedCount = 0;

    // Process questions sequentially to guarantee progress feedback and reliable uploads
    const updatedList = [...scannedQuestions];
    for (let i = 0; i < questionsToProcess.length; i++) {
      const item = questionsToProcess[i];
      const targetIdx = updatedList.findIndex(q => q.record.id === item.record.id);
      if (targetIdx !== -1) {
        updatedList[targetIdx].status = 'migrating';
        setScannedQuestions([...updatedList]);
      }

      setProgress({
        current: i + 1,
        total: questionsToProcess.length,
        currentQ: `Question #${item.questionNumber}`
      });

      try {
        const res = await api.rehostQuestionImages(selectedTable, item.record.id, 'ImgBB 1-Click Host');
        if (res.success) {
          totalImagesRehosted += res.replacedCount;
          if (targetIdx !== -1) {
            updatedList[targetIdx].status = 'done';
            updatedList[targetIdx].unhostedCount = 0;
          }
        } else {
          failedCount++;
          if (targetIdx !== -1) {
            updatedList[targetIdx].status = 'failed';
            updatedList[targetIdx].error = 'Rehost unsuccessful';
          }
        }
      } catch (err: any) {
        console.error(`Rehost failed for Q #${item.questionNumber}:`, err);
        failedCount++;
        if (targetIdx !== -1) {
          updatedList[targetIdx].status = 'failed';
          updatedList[targetIdx].error = err.message || 'Error';
        }
      }
      setScannedQuestions([...updatedList]);
    }

    setIsMigrating(false);
    setMigrationSummary({
      totalQuestions: questionsToProcess.length,
      rehostedImages: totalImagesRehosted,
      failed: failedCount
    });
    onMigrationComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shadow-inner">
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">ImgBB 1-Click All Images Hosting</h3>
                <span className="text-[10px] uppercase font-extrabold bg-amber-950/40 text-amber-100 px-1.5 py-0.5 rounded border border-amber-400/40">
                  Auto-Detect & CDN
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Identify questions with images in Questions, Options, Solutions & Diagrams and host all to ImgBB at once.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Control Bar: Table Switcher & Metrics */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Test Table:</span>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              disabled={isMigrating}
              className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-amber-500 shadow-2xs"
            >
              {tables.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scanTableForImages}
              disabled={isScanning || isMigrating}
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Rescan Questions</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-grow">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
              <div className="text-[11px] font-semibold text-blue-700">Questions with Images</div>
              <div className="text-xl font-bold text-blue-900 mt-0.5">
                {scannedQuestions.length} <span className="text-xs font-normal text-blue-600">/ {records.length} total</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
              <div className="text-[11px] font-semibold text-amber-800">External / Unhosted Images</div>
              <div className="text-xl font-bold text-amber-900 mt-0.5">
                {totalUnhostedImages} <span className="text-xs font-normal text-amber-700">need ImgBB</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <div className="text-[11px] font-semibold text-emerald-800">Total Images Detected</div>
              <div className="text-xl font-bold text-emerald-900 mt-0.5">
                {totalAllImages} <span className="text-xs font-normal text-emerald-600">across all fields</span>
              </div>
            </div>
          </div>

          {/* Migration Success Message */}
          {migrationSummary && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-emerald-950">1-Click Bulk Hosting Completed!</div>
                  <div className="text-emerald-800 text-[11px]">
                    Successfully hosted <strong>{migrationSummary.rehostedImages}</strong> images to ImgBB and synchronized all Airtable records.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar when running */}
          {isMigrating && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  Hosting in Progress: {progress.currentQ}
                </span>
                <span className="font-mono font-semibold text-amber-800">
                  {progress.current} of {progress.total} questions ({Math.round((progress.current / progress.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-2.5 transition-all duration-300 rounded-full"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Filter Tabs & Selection Control */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTabFilter('unhosted_only')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeTabFilter === 'unhosted_only'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Needs ImgBB Hosting ({scannedQuestions.filter(q => q.unhostedCount > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter('hosted_only')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                  activeTabFilter === 'hosted_only'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>Hosted on ImgBB ({scannedQuestions.filter(q => q.unhostedCount === 0).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter('all_images')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeTabFilter === 'all_images'
                    ? 'bg-slate-200 text-slate-900 border border-slate-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({scannedQuestions.length})
              </button>
            </div>

            {displayedQuestions.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                {displayedQuestions.every(q => selectedQuestionIds.has(q.record.id)) ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>Select All ({displayedQuestions.length})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Questions Identified List */}
          {displayedQuestions.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-slate-800">
                {activeTabFilter === 'unhosted_only'
                  ? 'All Question Images are Already on ImgBB CDN!'
                  : activeTabFilter === 'hosted_only'
                  ? 'No questions with hosted images yet'
                  : 'No Images Found in this Test Table'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {activeTabFilter === 'unhosted_only'
                  ? 'Every single image in Questions, Options, Solutions, and Diagrams is already securely hosted on ImgBB.'
                  : activeTabFilter === 'hosted_only'
                  ? 'Use the "Needs ImgBB Hosting" tab and click "1-Click Host All Images" to host your question images.'
                  : 'Add questions with images or formulas to see them listed here.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white shadow-2xs">
              {displayedQuestions.map((item) => {
                const isChecked = selectedQuestionIds.has(item.record.id);
                return (
                  <div
                    key={item.record.id}
                    className={`p-3 transition-colors ${
                      isChecked ? 'bg-amber-50/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelectQuestion(item.record.id)}
                          className="mt-0.5 text-slate-400 hover:text-slate-600"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs">
                              Question #{item.questionNumber}
                            </span>

                            {/* Location Badges */}
                            {item.locations.map((loc, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium border border-slate-200"
                              >
                                {loc}
                              </span>
                            ))}

                            {item.unhostedCount > 0 ? (
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold border border-amber-300">
                                {item.unhostedCount} to Rehost
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-200">
                                ✓ Hosted
                              </span>
                            )}
                          </div>

                          {/* Thumbnails of images detected in this question */}
                          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
                            {item.images.map((img, i) => (
                              <div
                                key={i}
                                className="relative w-12 h-12 rounded border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 group"
                                title={`${img.fieldLabel} (${img.isImgbb ? 'ImgBB CDN' : 'External'})`}
                              >
                                <img
                                  src={img.url}
                                  alt="preview"
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                                {!img.isImgbb && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-tl" title="External URL" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Status / Single Action */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                item.status = 'migrating';
                                setScannedQuestions([...scannedQuestions]);
                                const res = await api.rehostQuestionImages(selectedTable, item.record.id, 'ImgBB Single Host');
                                if (res.success) {
                                  item.status = 'done';
                                  item.unhostedCount = 0;
                                  onMigrationComplete();
                                }
                              } catch (e) {
                                item.status = 'failed';
                              }
                              setScannedQuestions([...scannedQuestions]);
                            }}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-semibold rounded shadow-2xs transition-colors"
                          >
                            Host Now
                          </button>
                        )}
                        {item.status === 'migrating' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-semibold flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Uploading
                          </span>
                        )}
                        {item.status === 'done' && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-semibold flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> Done
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-semibold">
                            Failed
                          </span>
                        )}

                        {onSelectQuestion && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectQuestion(item.record.id);
                              onClose();
                            }}
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            <span>Open in Editor</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {scannedQuestions.length > 0 && (
              <button
                type="button"
                id="btn-host-all-imgbb-one-click"
                onClick={handleHostAllInOneClick}
                disabled={isMigrating || selectedQuestionIds.size === 0}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                <UploadCloud className={`w-4 h-4 ${isMigrating ? 'animate-bounce' : ''}`} />
                <span>
                  {isMigrating
                    ? 'Hosting All Images to ImgBB...'
                    : `⚡ 1-Click Host All Images (${selectedQuestionIds.size} Questions)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
