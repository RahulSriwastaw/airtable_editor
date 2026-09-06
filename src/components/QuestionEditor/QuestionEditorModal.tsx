import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  X,
  Save,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Columns,
  Maximize2,
  Minimize2,
  Trash2,
  Layers,
  ChevronDown
} from 'lucide-react';
import { QuestionRecord, QuestionFields, UserSession } from '../../types';
import { WysiwygEditor } from './WysiwygEditor';
import { OptionEditor } from './OptionEditor';
import { OptionCardEditor } from './OptionCardEditor';
import { ImageAttachmentBar } from './ImageAttachmentBar';
import { StudioImageItem } from './studio/studioTypes';
import { api } from '../../services/api';
import { convertLatexToHtml, hasLatexCode, cleanHtmlArtifactTokens } from '../../utils/mathUtils';
import { extractSetImages } from '../../utils/setImagesHelper';

interface QuestionEditorModalProps {
  tableName: string;
  record: QuestionRecord;
  allRecords: QuestionRecord[];
  currentUser: UserSession;
  onClose: () => void;
  onSaveSuccess: (updatedRecord: QuestionRecord) => void;
  onNavigateRecord: (targetRecordId: string) => void;
  onOpenMediaLibrary: () => void;
  onDeleteRecord?: (recordId: string) => void;
}

const sanitizeFields = (raw: QuestionFields): QuestionFields => {
  const res: any = { ...raw };
  const textFields: (keyof QuestionFields)[] = [
    'question_hi', 'question_en',
    'option1_hi', 'option2_hi', 'option3_hi', 'option4_hi', 'option5_hi',
    'option1_en', 'option2_en', 'option3_en', 'option4_en', 'option5_en',
    'solution_hi', 'solution_en'
  ];
  textFields.forEach(f => {
    if (typeof res[f] === 'string' && res[f]) {
      res[f] = cleanHtmlArtifactTokens(res[f]);
    }
  });
  return res;
};

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  tableName,
  record,
  allRecords,
  currentUser,
  onClose,
  onSaveSuccess,
  onNavigateRecord,
  onOpenMediaLibrary,
  onDeleteRecord
}) => {
  const [formData, setFormData] = useState<QuestionFields>(sanitizeFields(record.fields));
  const [has5thOption, setHas5thOption] = useState<boolean>(Boolean(record.fields.option5_hi || record.fields.option5_en));
  const [viewMode, setViewMode] = useState<'side-by-side' | 'hindi-only' | 'english-only'>('side-by-side');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [autoSavedTime, setAutoSavedTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync state when record prop changes (e.g. when navigating to next question)
  useEffect(() => {
    setFormData(sanitizeFields(record.fields));
    setHas5thOption(Boolean(record.fields.option5_hi || record.fields.option5_en));
    setIsDirty(false);
    setSaveStatus('idle');

    // Check local draft cache
    const draftKey = `mcq_draft_${record.id}`;
    const cachedDraft = localStorage.getItem(draftKey);
    if (cachedDraft) {
      try {
        const parsed = JSON.parse(cachedDraft);
        if (parsed.timestamp && new Date(parsed.timestamp) > new Date(record.fields.last_edited_at || 0)) {
          setFormData(parsed.fields);
          setAutoSavedTime('Restored unsaved local draft');
          setIsDirty(true);
        }
      } catch (e) {}
    }
  }, [record]);

  // Local Auto-Save Draft
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      const draftKey = `mcq_draft_${record.id}`;
      localStorage.setItem(draftKey, JSON.stringify({
        recordId: record.id,
        fields: formData,
        timestamp: new Date().toISOString()
      }));
      setAutoSavedTime(`Draft auto-saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
    }, 2500);

    return () => clearTimeout(timer);
  }, [formData, isDirty, record.id]);

  const updateField = (field: keyof QuestionFields, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSaveStatus('idle');
  };

  // Detect if question contains raw LaTeX notation in modal
  const hasLatexInForm = Object.values(formData).some(v => typeof v === 'string' && hasLatexCode(v));

  // Convert all LaTeX syntax to clean HTML across all fields
  const fixAllLatexInModal = () => {
    const updated: any = { ...formData };
    const fieldsToClean: (keyof QuestionFields)[] = [
      'question_hi', 'question_en',
      'option1_hi', 'option2_hi', 'option3_hi', 'option4_hi', 'option5_hi',
      'option1_en', 'option2_en', 'option3_en', 'option4_en', 'option5_en',
      'solution_hi', 'solution_en'
    ];
    fieldsToClean.forEach(f => {
      if (typeof updated[f] === 'string' && updated[f]) {
        updated[f] = cleanHtmlArtifactTokens(convertLatexToHtml(updated[f]));
      }
    });
    setFormData(updated);
    setIsDirty(true);
  };

  // Find currentIndex in allRecords
  const currentIndex = allRecords.findIndex(r => r.id === record.id);
  const prevRecord = currentIndex > 0 ? allRecords[currentIndex - 1] : null;
  const nextRecord = currentIndex < allRecords.length - 1 ? allRecords[currentIndex + 1] : null;

  // Collect all question images from the active set for batch studio navigation
  const setImages: StudioImageItem[] = useMemo(() => {
    return extractSetImages(allRecords, tableName, currentUser.name, (recId, updatedFields) => {
      if (recId === record.id) {
        Object.entries(updatedFields).forEach(([k, v]) => {
          updateField(k as keyof QuestionFields, v);
        });
      }
    });
  }, [allRecords, tableName, currentUser.name, record.id, updateField]);

  // Handle Save
  const handleSave = async (andNext = false): Promise<boolean> => {
    if (!formData.question_hi && !formData.question_en) {
      setErrorMessage('Please enter question text before saving.');
      setSaveStatus('error');
      return false;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      const payload: Partial<QuestionFields> = {
        ...formData,
        option5_hi: has5thOption ? formData.option5_hi : '',
        option5_en: has5thOption ? formData.option5_en : ''
      };

      const updated = await api.updateQuestion(tableName, record.id, payload, currentUser.name);
      setIsDirty(false);
      setSaveStatus('saved');
      localStorage.removeItem(`mcq_draft_${record.id}`);
      onSaveSuccess(updated);

      if (andNext && nextRecord) {
        onNavigateRecord(nextRecord.id);
      }
      return true;
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMessage(err.message || 'Failed to save question to Airtable');
      setSaveStatus('error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcuts (Ctrl+S, Ctrl+Enter, Ctrl+Left, Ctrl+Right)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+S or Cmd+S -> Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
      e.preventDefault();
      handleSave(false);
    }
    // Ctrl+Shift+S or Ctrl+Enter -> Save & Next
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || (e.shiftKey && (e.key === 'S' || e.key === 's')))) {
      e.preventDefault();
      handleSave(true);
    }
    // Ctrl+Left -> Previous question
    else if (e.altKey && e.key === 'ArrowLeft' && prevRecord) {
      e.preventDefault();
      onNavigateRecord(prevRecord.id);
    }
    // Ctrl+Right -> Next question
    else if (e.altKey && e.key === 'ArrowRight' && nextRecord) {
      e.preventDefault();
      onNavigateRecord(nextRecord.id);
    }
  }, [formData, has5thOption, prevRecord, nextRecord, currentUser.name]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleRevert = () => {
    if (confirm('Discard all unsaved changes for this question?')) {
      setFormData({ ...record.fields });
      setHas5thOption(Boolean(record.fields.option5_hi || record.fields.option5_en));
      setIsDirty(false);
      localStorage.removeItem(`mcq_draft_${record.id}`);
      setAutoSavedTime('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        id="question-editor-modal-container"
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-200 overflow-hidden ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl max-h-[95vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 font-mono font-bold text-xs">
              Q #{formData.question_r || 1}
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
                <span>{tableName}</span>
                <span className="text-slate-400 font-normal text-xs">• Question Editor</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {allRecords.length > 0 ? `Question ${currentIndex + 1} of ${allRecords.length}` : 'New Question'}
                {formData.last_edited_by && (
                  <span className="ml-2 text-slate-400">
                    (Last modified by {formData.last_edited_by})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Navigator & Mode Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Jumper Dropdown */}
            <div className="relative">
              <select
                id="select-jump-question"
                value={record.id}
                onChange={(e) => onNavigateRecord(e.target.value)}
                className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {allRecords.map((r, idx) => (
                  <option key={r.id} value={r.id}>
                    Q{r.fields.question_r || idx + 1}: {(r.fields.question_hi || r.fields.question_en || '').replace(/<[^>]*>?/gm, '').slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Prev / Next Arrows */}
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
              <button
                type="button"
                id="btn-nav-prev-question"
                disabled={!prevRecord}
                onClick={() => prevRecord && onNavigateRecord(prevRecord.id)}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous Question (Alt+Left)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="h-3 w-[1px] bg-slate-700" />
              <button
                type="button"
                id="btn-nav-next-question"
                disabled={!nextRecord}
                onClick={() => nextRecord && onNavigateRecord(nextRecord.id)}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next Question (Alt+Right)"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5 text-xs">
              <button
                type="button"
                id="btn-view-side-by-side"
                onClick={() => setViewMode('side-by-side')}
                className={`px-2 py-1 rounded transition-colors ${
                  viewMode === 'side-by-side' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
                title="Side by Side (Hindi & English)"
              >
                Side by Side
              </button>
              <button
                type="button"
                id="btn-view-hindi-only"
                onClick={() => setViewMode('hindi-only')}
                className={`px-2 py-1 rounded transition-colors ${
                  viewMode === 'hindi-only' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
                title="Hindi Only"
              >
                Hindi
              </button>
              <button
                type="button"
                id="btn-view-english-only"
                onClick={() => setViewMode('english-only')}
                className={`px-2 py-1 rounded transition-colors ${
                  viewMode === 'english-only' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
                title="English Only"
              >
                English
              </button>
            </div>

            {/* Fullscreen toggle */}
            <button
              type="button"
              id="btn-toggle-editor-fullscreen"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="btn-close-question-editor"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status & Validation Message Banner */}
        {errorMessage && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </span>
            <button type="button" onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {/* Top Meta Bar: Question Sequence #, QA Status, Correct Option Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
            {/* Question Sequence Number */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="input-question-seq" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Question #:
              </label>
              <input
                id="input-question-seq"
                type="number"
                min="1"
                value={formData.question_r || 1}
                onChange={(e) => updateField('question_r', parseInt(e.target.value, 10) || 1)}
                className="w-16 text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* QA Review Status */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="select-qa-status" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                QA Status:
              </label>
              <select
                id="select-qa-status"
                value={formData.qa_status || 'draft'}
                onChange={(e) => updateField('qa_status', e.target.value)}
                className={`text-xs font-medium px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  formData.qa_status === 'approved'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : formData.qa_status === 'in_review'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                <option value="draft">Draft (In Progress)</option>
                <option value="in_review">Under QA Review</option>
                <option value="approved">Approved & Verified</option>
              </select>
            </div>

            {/* Correct Option Dropdown / Shortcut */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="select-correct-option-header" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Correct Ans:
              </label>
              <select
                id="select-correct-option-header"
                value={formData.correct_option || '1'}
                onChange={(e) => updateField('correct_option', e.target.value)}
                className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="1">Option 1 (A)</option>
                <option value="2">Option 2 (B)</option>
                <option value="3">Option 3 (C)</option>
                <option value="4">Option 4 (D)</option>
                {has5thOption && <option value="5">Option 5 (E)</option>}
              </select>
            </div>

            {/* Fix LaTeX Code in Modal */}
            {hasLatexInForm && (
              <button
                type="button"
                id="btn-fix-all-latex-modal"
                onClick={fixAllLatexInModal}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 rounded-md shadow-xs animate-pulse transition-all"
                title="Math/LaTeX Code Detected! Click to convert sin θ, √2, 45°, CaF₂ across all fields"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>⚡ Fix Math Code (sin θ, √2, 45°)</span>
              </button>
            )}
          </div>

          {/* Section 1: Question Stem (Hindi & English) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-600" />
                <span>Question Statement</span>
              </h3>
            </div>

            <div className={`grid gap-2 ${viewMode === 'side-by-side' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {(viewMode === 'side-by-side' || viewMode === 'hindi-only') && (
                <WysiwygEditor
                  id="editor-question-hi"
                  value={formData.question_hi || ''}
                  onChange={(val) => updateField('question_hi', val)}
                  placeholder="प्रश्न यहाँ लिखें (Hindi)..."
                  label="Question Statement (Hindi)"
                  badge="HI"
                  language="hi"
                  minHeight="45px"
                  onImageUploaded={(url) => {
                    if (!formData.image_url) updateField('image_url', url);
                  }}
                  editorName={currentUser.name}
                  setImages={setImages}
                />
              )}

              {(viewMode === 'side-by-side' || viewMode === 'english-only') && (
                <WysiwygEditor
                  id="editor-question-en"
                  value={formData.question_en || ''}
                  onChange={(val) => updateField('question_en', val)}
                  placeholder="Enter Question statement (English)..."
                  label="Question Statement (English)"
                  badge="EN"
                  language="en"
                  minHeight="45px"
                  onImageUploaded={(url) => {
                    if (!formData.image_url) updateField('image_url', url);
                  }}
                  editorName={currentUser.name}
                  setImages={setImages}
                />
              )}
            </div>
          </div>

          {/* Section 2: Question Diagram / Image Attachment */}
          <ImageAttachmentBar
            imageUrl={formData.image_url || ''}
            onImageUrlChange={(url) => updateField('image_url', url)}
            onOpenMediaLibrary={onOpenMediaLibrary}
            editorName={currentUser.name}
            setImages={setImages}
          />

          {/* Section 3: Options (1 to 5) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Multiple Choice Options (1 – {has5thOption ? '5' : '4'})
              </h3>
              {!has5thOption && (
                <button
                  type="button"
                  id="btn-add-option-5"
                  onClick={() => {
                    setHas5thOption(true);
                    updateField('option5_hi', '<p>उपर्युक्त में से कोई नहीं / एक से अधिक</p>');
                    updateField('option5_en', '<p>None of the above / More than one</p>');
                  }}
                  className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors"
                >
                  + Add Option 5 (BPSC)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5].map((optNum) => {
                if (optNum === 5 && !has5thOption) return null;
                const isCorrect = String(formData.correct_option) === String(optNum);
                const charLabels = ['A', 'B', 'C', 'D', 'E'];
                const charLabel = charLabels[optNum - 1];
                const hiKey = `option${optNum}_hi` as keyof QuestionFields;
                const enKey = `option${optNum}_en` as keyof QuestionFields;

                return (
                  <OptionCardEditor
                    key={optNum}
                    optNum={optNum}
                    charLabel={charLabel}
                    isCorrect={isCorrect}
                    onSelectCorrect={() => updateField('correct_option', String(optNum))}
                    hiValue={(formData[hiKey] as string) || ''}
                    enValue={(formData[enKey] as string) || ''}
                    onHiChange={(val) => updateField(hiKey, val)}
                    onEnChange={(val) => updateField(enKey, val)}
                    onRemove={
                      optNum === 5
                        ? () => {
                            setHas5thOption(false);
                            if (formData.correct_option === '5') updateField('correct_option', '1');
                          }
                        : undefined
                    }
                    langTab={viewMode === 'side-by-side' ? 'split' : viewMode === 'english-only' ? 'en' : 'hi'}
                    editorName={currentUser.name}
                  />
                );
              })}
            </div>
          </div>

          {/* Section 4: Solution & Explanation (Hindi & English) */}
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Solution & Detailed Explanation
            </h3>

            <div className={`grid gap-2 ${viewMode === 'side-by-side' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {(viewMode === 'side-by-side' || viewMode === 'hindi-only') && (
                <WysiwygEditor
                  id="editor-solution-hi"
                  value={formData.solution_hi || ''}
                  onChange={(val) => updateField('solution_hi', val)}
                  placeholder="उत्तर व्याख्या (Hindi)..."
                  label="Detailed Solution (Hindi)"
                  badge="HI"
                  language="hi"
                  minHeight="45px"
                  editorName={currentUser.name}
                  setImages={setImages}
                />
              )}

              {(viewMode === 'side-by-side' || viewMode === 'english-only') && (
                <WysiwygEditor
                  id="editor-solution-en"
                  value={formData.solution_en || ''}
                  onChange={(val) => updateField('solution_en', val)}
                  placeholder="Detailed Solution (English)..."
                  label="Detailed Solution (English)"
                  badge="EN"
                  language="en"
                  minHeight="45px"
                  editorName={currentUser.name}
                  setImages={setImages}
                />
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Bar: Save, Save & Next, Revert, Auto-Save Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white border-t border-slate-200 flex-shrink-0">
          {/* Left Info: Draft status & Shortcuts */}
          <div className="flex items-center gap-3">
            {isDirty ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                <span>Unsaved changes</span>
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved to Airtable</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                {autoSavedTime || 'All changes saved in sync with Airtable'}
              </span>
            )}

            {isDirty && (
              <button
                type="button"
                id="btn-revert-changes"
                onClick={handleRevert}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert</span>
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {onDeleteRecord && (
              <button
                type="button"
                id="btn-delete-current-question"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete Question #${formData.question_r}? This will remove it from Airtable.`)) {
                    onDeleteRecord(record.id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              id="btn-cancel-editor"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {/* Save Only */}
            <button
              type="button"
              id="btn-save-question"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all disabled:opacity-50"
              title="Save Changes (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
              <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 bg-white/70 border border-slate-300 rounded text-[10px] text-slate-500">
                Ctrl+S
              </kbd>
            </button>

            {/* Save & Next (Primary Action for rapid bulk editing) */}
            <button
              type="button"
              id="btn-save-and-next-question"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow rounded-xl transition-all disabled:opacity-50"
              title="Save & Move to Next Question (Ctrl+Enter)"
            >
              <span>{isSaving ? 'Saving...' : nextRecord ? 'Save & Next' : 'Save & Finish'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 bg-indigo-800/80 rounded text-[10px] text-indigo-100">
                Ctrl+↵
              </kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
