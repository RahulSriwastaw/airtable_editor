import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layers,
  Database,
  Search,
  Plus,
  Settings,
  Image as ImageIcon,
  Replace,
  UploadCloud,
  Download,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  Edit3,
  Trash2,
  Check,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  Columns,
  Key,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Menu,
  X,
  BookOpen,
  FileText,
  ListOrdered,
  ChevronLeft
} from 'lucide-react';
import { TableMeta, QuestionRecord, QuestionFields, UserSession, AirtableBaseItem } from './types';
import { api } from './services/api';
import { convertLatexToHtml, hasLatexCode, repairCorruptedSubscriptsInUrls, cleanHtmlArtifactTokens, getQuestionImagesSummary } from './utils/mathUtils';
import { WysiwygEditor } from './components/QuestionEditor/WysiwygEditor';
import { OptionEditor } from './components/QuestionEditor/OptionEditor';
import { OptionCardEditor } from './components/QuestionEditor/OptionCardEditor';
import { ImageAttachmentBar } from './components/QuestionEditor/ImageAttachmentBar';
import { QuestionEditorModal } from './components/QuestionEditor/QuestionEditorModal';
import { FindAndReplaceModal } from './components/BulkOperations/FindAndReplaceModal';
import { CsvImportModal } from './components/BulkOperations/CsvImportModal';
import { CsvExportModal } from './components/BulkOperations/CsvExportModal';
import { ImgbbMigrationModal } from './components/BulkOperations/ImgbbMigrationModal';
import { MediaLibraryModal } from './components/MediaLibraryModal';
import { AuditLogModal } from './components/AuditLogModal';
import { SettingsModal } from './components/SettingsModal';
import { BaseSwitcherDropdown } from './components/BaseSwitcherDropdown';
import { StudioImageItem } from './components/QuestionEditor/studio/studioTypes';
import { extractSetImages } from './utils/setImagesHelper';
import { auth } from './firebase';

export default function App({ user, onSignOut }: { user?: any; onSignOut?: () => void }) {
  // Session & User
  const [currentUser, setCurrentUser] = useState<UserSession>({
    id: user?.uid || 'usr_1',
    name: user?.displayName || 'Editor_Amit',
    email: user?.email || 'amit.editor@testfactory.org',
    role: 'editor'
  });

  // Multiple Bases State
  const [bases, setBases] = useState<AirtableBaseItem[]>([]);
  const [activeBaseId, setActiveBaseId] = useState<string>('');
  const [activeBaseName, setActiveBaseName] = useState<string>('');

  // State: Tables & Records
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [records, setRecords] = useState<QuestionRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Form State for Active High-Density Question Editor
  const [activeFormData, setActiveFormData] = useState<QuestionFields | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<string>('Connected');
  const [has5thOption, setHas5thOption] = useState<boolean>(false);
  const [langTab, setLangTab] = useState<'hi' | 'en' | 'split'>('hi');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_review' | 'approved'>('all');
  const [imageFilter, setImageFilter] = useState<'all' | 'any' | 'hosted' | 'unhosted'>('all');

  // View Mode: 'split-editor' | 'table-grid'
  const [viewLayout, setViewLayout] = useState<'split-editor' | 'table-grid'>('split-editor');

  // Sidebar Visibility State (Show / Hide)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'questions'>('editor');

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'bases' | 'keys'>('bases');
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showCsvExportModal, setShowCsvExportModal] = useState(false);
  const [showImgbbMigrationModal, setShowImgbbMigrationModal] = useState(false);
  const [showMediaLibraryModal, setShowMediaLibraryModal] = useState(false);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [showStandaloneModalEditor, setShowStandaloneModalEditor] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCategory, setNewTableCategory] = useState('BPSC');

  // Connection Info
  const [connectionStatus, setConnectionStatus] = useState<{ isConnected: boolean; tokenMask?: string }>({
    isConnected: true,
    tokenMask: 'test_factory_pat...'
  });

  // Load Bases & Tables on mount or base change
  const loadBasesAndTables = useCallback(async (preserveTable = false) => {
    setIsLoadingTables(true);
    try {
      const [fetchedBases, fetchedTables, config] = await Promise.all([
        api.getBases().catch(() => []),
        api.getTables().catch(() => []),
        api.getConfig().catch(() => null)
      ]);

      setBases(fetchedBases);
      setTables(fetchedTables);

      if (config) {
        setActiveBaseId(config.activeBaseId || config.baseId);
        setActiveBaseName(config.activeBaseName || 'Airtable Base');
        setConnectionStatus({
          isConnected: config.isConnected,
          tokenMask: config.apiKey || 'test_factory_pat...'
        });
      }

      if (fetchedTables.length > 0) {
        if (!preserveTable || !fetchedTables.some(t => t.name === selectedTable)) {
          setSelectedTable(fetchedTables[0].name);
        }
      } else {
        setSelectedTable('');
        setRecords([]);
        setSelectedRecordId(null);
        setActiveFormData(null);
      }
    } catch (err) {
      console.error('Error loading bases and tables:', err);
    } finally {
      setIsLoadingTables(false);
    }
  }, [selectedTable]);

  useEffect(() => {
    loadBasesAndTables(true);
  }, []);

  const loadTables = useCallback(async () => {
    loadBasesAndTables(true);
  }, [loadBasesAndTables]);

  // Handle Switch Base
  const handleSwitchBase = async (baseId: string) => {
    if (isDirty) {
      if (!confirm('You have unsaved edits on the current question. Discard and switch base?')) {
        return;
      }
    }

    setIsLoadingTables(true);
    try {
      const switchRes = await api.switchActiveBase(baseId);
      setActiveBaseId(switchRes.activeBaseId);
      setActiveBaseName(switchRes.activeBaseName);

      const [updatedBases, newTables] = await Promise.all([
        api.getBases(),
        api.getTables()
      ]);

      setBases(updatedBases);
      setTables(newTables);

      if (newTables.length > 0) {
        setSelectedTable(newTables[0].name);
      } else {
        setSelectedTable('');
        setRecords([]);
        setSelectedRecordId(null);
        setActiveFormData(null);
      }
      setIsDirty(false);
    } catch (err: any) {
      alert(`Failed to switch Airtable base: ${err.message}`);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const openBaseManager = (tab: 'bases' | 'keys' = 'bases') => {
    setSettingsInitialTab(tab);
    setShowSettingsModal(true);
  };

  const openAddNewBase = () => {
    setSettingsInitialTab('bases');
    setShowSettingsModal(true);
  };

  // Helper to auto-clean raw LaTeX from fields
  const sanitizeQuestionFields = (fields: QuestionFields): QuestionFields => {
    const res = { ...fields };
    const textFields: (keyof QuestionFields)[] = [
      'question_hi', 'question_en',
      'option1_hi', 'option2_hi', 'option3_hi', 'option4_hi', 'option5_hi',
      'option1_en', 'option2_en', 'option3_en', 'option4_en', 'option5_en',
      'solution_hi', 'solution_en'
    ];
    textFields.forEach(f => {
      if (typeof res[f] === 'string' && res[f]) {
        let val = cleanHtmlArtifactTokens(res[f]);
        val = repairCorruptedSubscriptsInUrls(val);
        if (hasLatexCode(val)) {
          val = convertLatexToHtml(val);
        }
        res[f] = val as any;
      }
    });
    return res;
  };

  // Load records when selected table changes
  const loadRecords = useCallback(async (tableName: string) => {
    if (!tableName) return;
    setIsLoadingRecords(true);
    try {
      const data = await api.getQuestions(tableName);
      // Auto-sanitize loaded records
      const cleaned = data.records.map(r => ({
        ...r,
        fields: sanitizeQuestionFields(r.fields)
      }));
      setRecords(cleaned);
      if (cleaned.length > 0) {
        const first = cleaned[0];
        setSelectedRecordId(first.id);
        setActiveFormData({ ...first.fields });
        setHas5thOption(Boolean(first.fields.option5_hi || first.fields.option5_en));
        setIsDirty(false);
      } else {
        setSelectedRecordId(null);
        setActiveFormData(null);
      }
    } catch (err) {
      console.error('Error loading records for table:', tableName, err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadRecords(selectedTable);
    }
  }, [selectedTable, loadRecords]);

  // Global Keyboard Shortcut: Ctrl+B or Cmd+B to toggle Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar on Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        // Allow toggle unless actively in a contenteditable where user intends bold text
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          setIsSidebarOpen(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active selected record
  const currentRecord = useMemo(() => {
    return records.find(r => r.id === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  // Collect all images across the active table/set for batch studio navigation
  const activeTableImages: StudioImageItem[] = useMemo(() => {
    return extractSetImages(records, selectedTable, currentUser.name, (recId, updatedFields) => {
      if (recId === selectedRecordId) {
        setActiveFormData(prev => prev ? { ...prev, ...updatedFields } : null);
      }
      setRecords(prev => prev.map(rec => rec.id === recId ? { ...rec, fields: { ...rec.fields, ...updatedFields } } : rec));
    });
  }, [records, selectedTable, currentUser.name, selectedRecordId]);

  // Handle select question
  const handleSelectQuestion = (rec: QuestionRecord) => {
    if (isDirty) {
      if (!confirm('You have unsaved edits on the current question. Discard and switch?')) {
        return;
      }
    }
    const cleanFields = sanitizeQuestionFields(rec.fields);
    setSelectedRecordId(rec.id);
    setActiveFormData({ ...cleanFields });
    setHas5thOption(Boolean(cleanFields.option5_hi || cleanFields.option5_en));
    setIsDirty(false);
  };

  // Update Field in high-density editor
  const updateFormField = (field: keyof QuestionFields, val: any) => {
    if (!activeFormData) return;
    setActiveFormData(prev => prev ? { ...prev, [field]: val } : null);
    setIsDirty(true);
  };

  // Detect if active question contains raw LaTeX notation (e.g. \(CaF_2\), \(Ca^{2+}\), \(F^-\))
  const hasLatexInActiveForm = useMemo(() => {
    if (!activeFormData) return false;
    return Object.values(activeFormData).some(v => typeof v === 'string' && hasLatexCode(v));
  }, [activeFormData]);

  // Fix and convert all raw LaTeX in the entire active question to clean HTML (CaF₂, Ca²⁺, F⁻)
  const fixAllLatexInActiveForm = () => {
    if (!activeFormData) return;
    const updated: any = { ...activeFormData };
    const fieldsToClean: (keyof QuestionFields)[] = [
      'question_hi', 'question_en',
      'option1_hi', 'option2_hi', 'option3_hi', 'option4_hi', 'option5_hi',
      'option1_en', 'option2_en', 'option3_en', 'option4_en', 'option5_en',
      'solution_hi', 'solution_en'
    ];
    fieldsToClean.forEach(f => {
      if (typeof updated[f] === 'string' && updated[f]) {
        updated[f] = convertLatexToHtml(updated[f]);
      }
    });
    setActiveFormData(updated);
    setIsDirty(true);
  };

  // Save current active question
  const handleSaveActiveQuestion = async (andNext = false): Promise<boolean> => {
    if (!selectedTable || !selectedRecordId || !activeFormData) return false;

    setIsSaving(true);
    try {
      const payload: Partial<QuestionFields> = {
        ...activeFormData,
        option5_hi: has5thOption ? activeFormData.option5_hi : '',
        option5_en: has5thOption ? activeFormData.option5_en : ''
      };

      const updated = await api.updateQuestion(selectedTable, selectedRecordId, payload, currentUser.name);

      // Update local records array
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      setActiveFormData({ ...updated.fields });
      setIsDirty(false);
      setLastSavedMessage(`Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${currentUser.name}`);

      if (andNext) {
        const currIdx = records.findIndex(r => r.id === selectedRecordId);
        if (currIdx < records.length - 1) {
          const nextRec = records[currIdx + 1];
          setSelectedRecordId(nextRec.id);
          setActiveFormData({ ...nextRec.fields });
          setHas5thOption(Boolean(nextRec.fields.option5_hi || nextRec.fields.option5_en));
        }
      }
      return true;
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate next / prev in question list
  const currentIndex = records.findIndex(r => r.id === selectedRecordId);
  const prevRecord = currentIndex > 0 ? records[currentIndex - 1] : null;
  const nextRecord = currentIndex < records.length - 1 ? records[currentIndex + 1] : null;

  // Keyboard Shortcuts (Ctrl+S, Ctrl+Enter, Alt+Left, Alt+Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSaveActiveQuestion(false);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || (e.shiftKey && (e.key === 'S' || e.key === 's')))) {
        e.preventDefault();
        handleSaveActiveQuestion(true);
      } else if (e.altKey && e.key === 'ArrowLeft' && prevRecord) {
        e.preventDefault();
        handleSelectQuestion(prevRecord);
      } else if (e.altKey && e.key === 'ArrowRight' && nextRecord) {
        e.preventDefault();
        handleSelectQuestion(nextRecord);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFormData, isDirty, selectedTable, selectedRecordId, prevRecord, nextRecord, currentUser.name, has5thOption]);

  // Create new question
  const handleAddNewQuestion = async () => {
    if (!selectedTable) return;
    const nextQNum = records.length > 0 ? Math.max(...records.map(r => r.fields.question_r || 0)) + 1 : 1;
    const newFields: Partial<QuestionFields> = {
      question_r: nextQNum,
      question_hi: '<p>नया प्रश्न यहाँ लिखें...</p>',
      question_en: '<p>New question text here...</p>',
      option1_hi: '<p>विकल्प A</p>',
      option2_hi: '<p>विकल्प B</p>',
      option3_hi: '<p>विकल्प C</p>',
      option4_hi: '<p>विकल्प D</p>',
      option1_en: '<p>Option A</p>',
      option2_en: '<p>Option B</p>',
      option3_en: '<p>Option C</p>',
      option4_en: '<p>Option D</p>',
      solution_hi: '<p>व्याख्या यहाँ दर्ज करें...</p>',
      solution_en: '<p>Explanation details here...</p>',
      correct_option: '1',
      qa_status: 'draft'
    };

    try {
      const created = await api.createQuestion(selectedTable, newFields, currentUser.name);
      setRecords(prev => [...prev, created]);
      setSelectedRecordId(created.id);
      setActiveFormData({ ...created.fields });
      setHas5thOption(false);
      setIsDirty(false);
      setLastSavedMessage(`Created Q #${nextQNum}`);
    } catch (err: any) {
      alert(`Failed to create question: ${err.message}`);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (recordId: string) => {
    if (!selectedTable) return;
    if (!confirm('Are you sure you want to delete this question from Airtable?')) return;

    try {
      await api.deleteQuestion(selectedTable, recordId, currentUser.name);
      const remaining = records.filter(r => r.id !== recordId);
      setRecords(remaining);
      if (remaining.length > 0) {
        setSelectedRecordId(remaining[0].id);
        setActiveFormData({ ...remaining[0].fields });
        setHas5thOption(Boolean(remaining[0].fields.option5_hi || remaining[0].fields.option5_en));
      } else {
        setSelectedRecordId(null);
        setActiveFormData(null);
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // Create Table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    try {
      const created = await api.createTable(newTableName.trim(), undefined, newTableCategory);
      setTables(prev => [created, ...prev]);
      setSelectedTable(created.name);
      setShowCreateTableModal(false);
      setNewTableName('');
    } catch (err: any) {
      alert(`Failed to create mock test table: ${err.message}`);
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const f = r.fields;
      if (statusFilter !== 'all' && (f.qa_status || 'draft') !== statusFilter) {
        return false;
      }
      if (imageFilter !== 'all') {
        const imgSummary = getQuestionImagesSummary(f);
        if (imageFilter === 'any' && !imgSummary.hasAnyImage) {
          return false;
        }
        if (imageFilter === 'hosted' && (!imgSummary.hasAnyImage || imgSummary.unhostedImages > 0)) {
          return false;
        }
        if (imageFilter === 'unhosted' && (!imgSummary.hasAnyImage || imgSummary.unhostedImages === 0)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const qHi = (f.question_hi || '').toLowerCase();
        const qEn = (f.question_en || '').toLowerCase();
        const optHi = `${f.option1_hi || ''} ${f.option2_hi || ''} ${f.option3_hi || ''} ${f.option4_hi || ''} ${f.option5_hi || ''}`.toLowerCase();
        const optEn = `${f.option1_en || ''} ${f.option2_en || ''} ${f.option3_en || ''} ${f.option4_en || ''} ${f.option5_en || ''}`.toLowerCase();
        const sol = `${f.solution_hi || ''} ${f.solution_en || ''}`.toLowerCase();
        const qNum = String(f.question_r || '');

        if (!qHi.includes(q) && !qEn.includes(q) && !optHi.includes(q) && !optEn.includes(q) && !sol.includes(q) && !qNum.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, statusFilter, imageFilter, searchQuery]);

  return (
    <div className="flex w-full h-screen bg-slate-100/60 font-sans overflow-hidden text-slate-800 antialiased">
      {/* ===================== MOBILE BACKDROP ===================== */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ===================== SIDEBAR (Deep Slate-900) ===================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static flex flex-col flex-none bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${
          isSidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-r-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between flex-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-xs text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400/20">
              TF
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-xs block">Test Factory</span>
              <span className="text-[10px] text-blue-400 block font-mono">MCQ Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="btn-sidebar-add-table"
              onClick={() => {
                setShowCreateTableModal(true);
                setIsMobileSidebarOpen(false);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Create New Mock Test Table"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-sidebar-collapse"
              onClick={() => {
                setIsSidebarOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Hide Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Airtable Base Switcher Card */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-indigo-400" />
              <span>ACTIVE BASE</span>
            </span>
            <button
              type="button"
              id="btn-sidebar-manage-bases"
              onClick={() => {
                openBaseManager('bases');
                setIsMobileSidebarOpen(false);
              }}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Manage ({bases.length})
            </button>
          </div>
          <BaseSwitcherDropdown
            bases={bases}
            activeBaseId={activeBaseId}
            onSelectBase={(id) => {
              handleSwitchBase(id);
              setIsMobileSidebarOpen(false);
            }}
            onOpenBaseManager={() => {
              openBaseManager('bases');
              setIsMobileSidebarOpen(false);
            }}
            onAddNewBase={() => {
              openAddNewBase();
              setIsMobileSidebarOpen(false);
            }}
            isCompact={true}
          />
        </div>

        {/* Scrollable Navigation Sections */}
        <nav className="flex-grow py-3 px-2 overflow-y-auto space-y-4 dark-scroll">
          {/* Mock Tests List */}
          <div>
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Tests & Question Sets</span>
              <button
                type="button"
                id="btn-refresh-tables-list"
                onClick={loadTables}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                title="Refresh Tables"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingTables ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                id="btn-nav-all-tests"
                onClick={() => {
                  setViewLayout(viewLayout === 'table-grid' ? 'split-editor' : 'table-grid');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                  viewLayout === 'table-grid'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span className="flex items-center gap-2">
                  <TableIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>All Mock Tests Grid</span>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  {tables.length}
                </span>
              </button>

              <div className="pt-1 space-y-0.5">
                {tables.map(table => {
                  const isActive = table.name === selectedTable && viewLayout === 'split-editor';
                  return (
                    <div
                      key={table.id}
                      id={`table-item-${table.id}`}
                      onClick={() => {
                        setSelectedTable(table.name);
                        setViewLayout('split-editor');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer flex justify-between items-center transition-all ${
                        isActive
                          ? 'text-white bg-blue-600/25 border-l-2 border-blue-500 font-semibold shadow-2xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="truncate pr-2" title={table.name}>{table.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive ? 'bg-blue-500 text-white font-bold' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {table.recordCount || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bulk Operations & Tools */}
          <div>
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Bulk Operations & Tools
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                id="btn-nav-imgbb-migration"
                onClick={() => {
                  setShowImgbbMigrationModal(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <UploadCloud className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-amber-200">ImgBB CDN Migrator</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-900/60 text-amber-300 rounded font-bold border border-amber-700/50">
                  CDN
                </span>
              </button>

              <button
                type="button"
                id="btn-nav-find-replace"
                onClick={() => {
                  setShowFindReplaceModal(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Replace className="w-3.5 h-3.5 text-indigo-400" />
                <span>Bulk Find & Replace</span>
              </button>

              <button
                type="button"
                id="btn-nav-media-lib"
                onClick={() => {
                  setShowMediaLibraryModal(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Media & Diagrams</span>
              </button>

              <button
                type="button"
                id="btn-nav-import-csv"
                onClick={() => {
                  setShowCsvImportModal(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Import CSV</span>
              </button>

              <button
                type="button"
                id="btn-nav-export-csv"
                onClick={() => {
                  setShowCsvExportModal(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export CSV/JSON</span>
              </button>

              <button
                type="button"
                id="btn-nav-audit-log"
                onClick={() => {
                  setShowAuditLogModal(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>Audit & History</span>
              </button>

              <button
                type="button"
                id="btn-nav-settings"
                onClick={() => {
                  openBaseManager('bases');
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Airtable Bases</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-900/60 text-indigo-300 rounded font-semibold border border-indigo-700/50">
                  {bases.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-nav-global-keys"
                onClick={() => {
                  openBaseManager('keys');
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>API Keys & PAT</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/50 space-y-2.5 flex-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                {activeBaseName || 'Connected'}
              </span>
            </div>
            <button
              type="button"
              id="btn-footer-config"
              onClick={() => openBaseManager('bases')}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              Manage
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onSignOut) {
                onSignOut();
              } else {
                auth.signOut().catch(() => {});
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 rounded-lg cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out ({currentUser.name})</span>
          </button>
        </div>
      </aside>

      {/* ===================== MAIN WORKSPACE ===================== */}
      <main className="flex-grow flex flex-col h-full overflow-hidden min-w-0">
        {/* Modern Top Header Bar */}
        <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200/90 flex items-center justify-between px-3 sm:px-4 flex-none z-10 sticky top-0 shadow-xs">
          {/* Left section */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              type="button"
              id="btn-mobile-sidebar-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Desktop Sidebar Toggle Button */}
            <button
              type="button"
              id="btn-toggle-sidebar"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className={`hidden lg:flex p-2 rounded-lg transition-all items-center gap-1.5 border cursor-pointer ${
                isSidebarOpen
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 font-semibold shadow-xs'
              }`}
              title={isSidebarOpen ? 'Collapse Sidebar (Ctrl+B)' : 'Expand Sidebar (Ctrl+B)'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 text-slate-500" />
              ) : (
                <>
                  <PanelLeft className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs text-indigo-900 font-medium">Show Menu</span>
                </>
              )}
            </button>

            <div className="hidden lg:block h-4 w-px bg-slate-200" />

            {/* Base Switcher Dropdown */}
            <BaseSwitcherDropdown
              bases={bases}
              activeBaseId={activeBaseId}
              onSelectBase={handleSwitchBase}
              onOpenBaseManager={() => openBaseManager('bases')}
              onAddNewBase={openAddNewBase}
            />

            <span className="text-slate-300 font-mono hidden sm:inline">/</span>

            {/* Table Name Chip */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200/80 truncate max-w-[190px]" title={selectedTable}>
              <TableIcon className="w-3.5 h-3.5 text-slate-500 flex-none" />
              <span className="truncate">{selectedTable || 'Select Table'}</span>
            </div>

            {/* Mobile Tab Switcher (Editor vs Questions List on < md) */}
            <div className="md:hidden flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setMobileTab('editor')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  mobileTab === 'editor' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('questions')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  mobileTab === 'questions' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                <span>Questions</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded-full font-mono">
                  {records.length}
                </span>
              </button>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Toggle (Split Editor vs Table Grid) */}
            <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewLayout('split-editor')}
                className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewLayout === 'split-editor'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Interactive Question Editor"
              >
                <Columns className="w-3.5 h-3.5 text-blue-600" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table-grid')}
                className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewLayout === 'table-grid'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Full Question Sheet Grid"
              >
                <TableIcon className="w-3.5 h-3.5 text-orange-500" />
                <span>Sheet Grid</span>
              </button>
            </div>

            {/* Saved Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs">
              {isDirty ? (
                <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Unsaved
                </span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Saved
                </span>
              )}
            </div>

            {/* QA Status Selector */}
            {activeFormData && (
              <select
                id="header-qa-status-select"
                value={activeFormData.qa_status || 'draft'}
                onChange={(e) => updateFormField('qa_status', e.target.value)}
                className={`text-xs font-semibold rounded-lg border px-2.5 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  activeFormData.qa_status === 'approved'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : activeFormData.qa_status === 'in_review'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <option value="draft">🟡 Draft</option>
                <option value="in_review">🟠 In Review</option>
                <option value="approved">🟢 Approved</option>
              </select>
            )}

            {/* Primary Save Button */}
            <button
              type="button"
              id="btn-header-save-airtable"
              disabled={isSaving || !activeFormData}
              onClick={() => handleSaveActiveQuestion(false)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </header>

        {/* Main Content Area: Split Editor OR Full Table Grid */}
        {viewLayout === 'table-grid' ? (
          /* ===================== FULL TABLE GRID VIEW ===================== */
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden bg-slate-100/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedTable} &bull; Complete Question Sheet</h2>
                <p className="text-xs text-slate-500 mt-0.5">Overview of all {records.length} questions in this test</p>
              </div>
              <button
                type="button"
                onClick={() => setViewLayout('split-editor')}
                className="px-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                Back to Editor
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-14 text-center">#</th>
                    <th className="p-3 w-72">Question (Hindi)</th>
                    <th className="p-3 w-72">Question (English)</th>
                    <th className="p-3 w-24 text-center">Correct</th>
                    <th className="p-3 w-28">Status</th>
                    <th className="p-3 w-20 text-center">Image</th>
                    <th className="p-3 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(rec => {
                    const f = rec.fields;
                    const imgSummary = getQuestionImagesSummary(f);
                    return (
                      <tr
                        key={rec.id}
                        className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                          rec.id === selectedRecordId ? 'bg-blue-50/80 font-medium' : ''
                        }`}
                        onClick={() => {
                          handleSelectQuestion(rec);
                          setViewLayout('split-editor');
                        }}
                      >
                        <td className="p-3 text-center font-mono font-bold text-slate-700">{f.question_r || 1}</td>
                        <td className="p-3 text-slate-800 line-clamp-1">
                          {(f.question_hi || '').replace(/<[^>]*>?/gm, '')}
                        </td>
                        <td className="p-3 text-slate-600 line-clamp-1">
                          {(f.question_en || '').replace(/<[^>]*>?/gm, '')}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600">Opt {f.correct_option || '1'}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            f.qa_status === 'approved' ? 'bg-emerald-100 text-emerald-800' : f.qa_status === 'in_review' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {f.qa_status || 'draft'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {imgSummary.hasAnyImage ? (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 border ${
                                imgSummary.unhostedImages > 0
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>{imgSummary.totalImages}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectQuestion(rec);
                              setViewLayout('split-editor');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-md text-xs font-semibold text-slate-700 transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ===================== MODERN SPLIT SCREEN ===================== */
          <div className="flex flex-grow overflow-hidden min-w-0">
            {/* Left Question List Feed */}
            <div
              className={`${
                mobileTab === 'questions' ? 'flex' : 'hidden'
              } md:flex w-full md:w-76 lg:w-80 border-r border-slate-200/90 flex-col flex-none bg-white`}
            >
              {/* Search & Filter Header */}
              <div className="p-3 border-b border-slate-100 space-y-2.5 bg-slate-50/70">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    id="input-search-questions-sidebar"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in questions..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('all');
                        setImageFilter('all');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        statusFilter === 'all' && imageFilter === 'all'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      All ({records.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        statusFilter === 'approved'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      Approved
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        statusFilter === 'draft'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      Draft
                    </button>

                    <button
                      type="button"
                      onClick={() => setImageFilter(prev => (prev === 'any' ? 'all' : 'any'))}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ${
                        imageFilter === 'any'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                      title="Filter questions with images"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Images</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 flex-none">
                    <button
                      type="button"
                      id="btn-sidebar-refresh-questions"
                      onClick={() => selectedTable && loadRecords(selectedTable)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Reload Questions"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecords ? 'animate-spin text-blue-600' : ''}`} />
                    </button>

                    <button
                      type="button"
                      id="btn-sidebar-add-question"
                      onClick={() => {
                        handleAddNewQuestion();
                        setMobileTab('editor');
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Add Question to this Test"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions Scrollable Feed */}
              <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
                {isLoadingRecords ? (
                  <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                    Loading questions from Airtable...
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No matching questions found.
                  </div>
                ) : (
                  filteredRecords.map(rec => {
                    const isCurrent = rec.id === selectedRecordId;
                    const f = rec.fields;
                    const hiSnippet = (f.question_hi || '').replace(/<[^>]*>?/gm, '');
                    const enSnippet = (f.question_en || '').replace(/<[^>]*>?/gm, '');
                    const previewText = hiSnippet || enSnippet || 'Empty question text...';
                    const isApproved = f.qa_status === 'approved';
                    const imgSummary = getQuestionImagesSummary(f);

                    return (
                      <div
                        key={rec.id}
                        id={`q-item-${rec.id}`}
                        onClick={() => {
                          handleSelectQuestion(rec);
                          setMobileTab('editor');
                        }}
                        className={`p-3.5 cursor-pointer transition-all duration-150 border-l-4 ${
                          isCurrent
                            ? 'bg-blue-50/80 border-l-blue-600 shadow-xs'
                            : 'hover:bg-slate-50 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold font-mono ${isCurrent ? 'text-blue-700' : 'text-slate-800'}`}>
                              #{String(f.question_r || 1).padStart(2, '0')}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : f.qa_status === 'in_review'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {f.qa_status || 'draft'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {imgSummary.hasAnyImage && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 border ${
                                  imgSummary.unhostedImages > 0
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                                title={imgSummary.isFullyHosted ? 'All images hosted on ImgBB CDN' : `${imgSummary.unhostedImages} unhosted images`}
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>{imgSummary.totalImages}</span>
                              </span>
                            )}
                            <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              Ans: {f.correct_option || '1'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                          {previewText}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Center/Right Main Question Editor Canvas */}
            {activeFormData && currentRecord ? (
              <div
                className={`${
                  mobileTab === 'editor' ? 'flex' : 'hidden'
                } md:flex flex-grow flex-col overflow-y-auto bg-slate-100/60 p-3 sm:p-5 lg:p-6`}
              >
                <div className="max-w-5xl w-full mx-auto space-y-4">
                  {/* Top Control Bar with Segmented Language Selector */}
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 sm:p-3 flex items-center justify-between flex-wrap gap-2.5">
                    {/* Segmented Language Controls */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
                      <button
                        type="button"
                        id="tab-lang-hindi"
                        onClick={() => setLangTab('hi')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          langTab === 'hi'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Hindi
                      </button>
                      <button
                        type="button"
                        id="tab-lang-english"
                        onClick={() => setLangTab('en')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          langTab === 'en'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        id="tab-lang-split"
                        onClick={() => setLangTab('split')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          langTab === 'split'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Split Bilingual
                      </button>
                    </div>

                    {/* Action Chips */}
                    <div className="flex items-center gap-2">
                      {/* Fix All LaTeX Code Button */}
                      {hasLatexInActiveForm && (
                        <button
                          type="button"
                          id="btn-fix-all-latex-question"
                          onClick={fixAllLatexInActiveForm}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                          title="Math/LaTeX Code Detected! Click to convert sin θ, √2, 45° across all fields"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>Fix Math Code</span>
                        </button>
                      )}

                      {/* ImgBB Status Chip */}
                      {(() => {
                        const qImgSummary = getQuestionImagesSummary(activeFormData);
                        if (!qImgSummary.hasAnyImage) return null;
                        return qImgSummary.isFullyHosted ? (
                          <span
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg"
                            title={`All ${qImgSummary.totalImages} images hosted on ImgBB CDN`}
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ImgBB Hosted</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowImgbbMigrationModal(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                            title="Click to host images on ImgBB"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-amber-700" />
                            <span>Host {qImgSummary.unhostedImages} Image(s)</span>
                          </button>
                        );
                      })()}

                      {/* Fullscreen & Delete buttons */}
                      <button
                        type="button"
                        id="btn-launch-fullscreen-modal"
                        onClick={() => setShowStandaloneModalEditor(true)}
                        className="p-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Open Fullscreen Modal"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        id="btn-delete-active-question"
                        onClick={() => handleDeleteQuestion(currentRecord.id)}
                        className="p-2 hover:bg-rose-50 border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card 1: Question Statement */}
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Question Statement ({langTab === 'en' ? 'English' : langTab === 'hi' ? 'Hindi' : 'Bilingual'})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Q.{activeFormData.question_r || 1}
                      </span>
                    </div>

                    {langTab === 'split' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <WysiwygEditor
                          id="editor-canvas-q-hi"
                          value={activeFormData.question_hi || ''}
                          onChange={(val) => updateFormField('question_hi', val)}
                          badge="HI"
                          label="Hindi Statement"
                          language="hi"
                          minHeight="54px"
                          editorName={currentUser.name}
                          setImages={activeTableImages}
                        />
                        <WysiwygEditor
                          id="editor-canvas-q-en"
                          value={activeFormData.question_en || ''}
                          onChange={(val) => updateFormField('question_en', val)}
                          badge="EN"
                          label="English Statement"
                          language="en"
                          minHeight="54px"
                          editorName={currentUser.name}
                          setImages={activeTableImages}
                        />
                      </div>
                    ) : langTab === 'en' ? (
                      <WysiwygEditor
                        id="editor-canvas-q-en-single"
                        value={activeFormData.question_en || ''}
                        onChange={(val) => updateFormField('question_en', val)}
                        badge="EN"
                        label="Question Statement"
                        language="en"
                        minHeight="60px"
                        editorName={currentUser.name}
                        setImages={activeTableImages}
                      />
                    ) : (
                      <WysiwygEditor
                        id="editor-canvas-q-hi-single"
                        value={activeFormData.question_hi || ''}
                        onChange={(val) => updateFormField('question_hi', val)}
                        badge="HI"
                        label="Question Statement"
                        language="hi"
                        minHeight="60px"
                        editorName={currentUser.name}
                        setImages={activeTableImages}
                      />
                    )}
                  </div>

                  {/* Card 2: Image & Diagram Attachment Bar */}
                  <ImageAttachmentBar
                    imageUrl={activeFormData.image_url || ''}
                    onImageUrlChange={(url) => updateFormField('image_url', url)}
                    onOpenMediaLibrary={() => setShowMediaLibraryModal(true)}
                    editorName={currentUser.name}
                    setImages={activeTableImages}
                  />

                  {/* Card 3: MCQ Options */}
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Options (Click Letter to Set Correct Answer)
                        </span>
                      </div>
                      {!has5thOption && (
                        <button
                          type="button"
                          onClick={() => {
                            setHas5thOption(true);
                            updateFormField('option5_hi', '<p>उपर्युक्त में से कोई नहीं / एक से अधिक</p>');
                            updateFormField('option5_en', '<p>None of the above / More than one</p>');
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                        >
                          + Add Option E (BPSC)
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {[1, 2, 3, 4, 5].map((optNum) => {
                        if (optNum === 5 && !has5thOption) return null;
                        const isCorrect = String(activeFormData.correct_option) === String(optNum);
                        const optionLabels = ['A', 'B', 'C', 'D', 'E'];
                        const charLabel = optionLabels[optNum - 1];
                        const hiKey = `option${optNum}_hi` as keyof QuestionFields;
                        const enKey = `option${optNum}_en` as keyof QuestionFields;

                        return (
                          <OptionCardEditor
                            key={optNum}
                            optNum={optNum}
                            charLabel={charLabel}
                            isCorrect={isCorrect}
                            onSelectCorrect={() => updateFormField('correct_option', String(optNum))}
                            hiValue={(activeFormData[hiKey] as string) || ''}
                            enValue={(activeFormData[enKey] as string) || ''}
                            onHiChange={(val) => updateFormField(hiKey, val)}
                            onEnChange={(val) => updateFormField(enKey, val)}
                            onRemove={
                              optNum === 5
                                ? () => {
                                    setHas5thOption(false);
                                    if (activeFormData.correct_option === '5') updateFormField('correct_option', '1');
                                  }
                                : undefined
                            }
                            langTab={langTab}
                            editorName={currentUser.name}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 4: Solution Explanation */}
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Solution Explanation ({langTab === 'en' ? 'English' : langTab === 'hi' ? 'Hindi' : 'Bilingual'})
                        </span>
                      </div>
                    </div>

                    {langTab === 'split' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <WysiwygEditor
                          id="editor-canvas-sol-hi"
                          value={activeFormData.solution_hi || ''}
                          onChange={(val) => updateFormField('solution_hi', val)}
                          badge="HI"
                          label="Hindi Explanation"
                          language="hi"
                          minHeight="54px"
                          editorName={currentUser.name}
                          setImages={activeTableImages}
                        />
                        <WysiwygEditor
                          id="editor-canvas-sol-en"
                          value={activeFormData.solution_en || ''}
                          onChange={(val) => updateFormField('solution_en', val)}
                          badge="EN"
                          label="English Explanation"
                          language="en"
                          minHeight="54px"
                          editorName={currentUser.name}
                          setImages={activeTableImages}
                        />
                      </div>
                    ) : langTab === 'en' ? (
                      <WysiwygEditor
                        id="editor-canvas-sol-en-single"
                        value={activeFormData.solution_en || ''}
                        onChange={(val) => updateFormField('solution_en', val)}
                        badge="EN"
                        label="Solution Explanation"
                        language="en"
                        minHeight="60px"
                        editorName={currentUser.name}
                        setImages={activeTableImages}
                      />
                    ) : (
                      <WysiwygEditor
                        id="editor-canvas-sol-hi-single"
                        value={activeFormData.solution_hi || ''}
                        onChange={(val) => updateFormField('solution_hi', val)}
                        badge="HI"
                        label="Solution Explanation"
                        language="hi"
                        minHeight="60px"
                        editorName={currentUser.name}
                        setImages={activeTableImages}
                      />
                    )}
                  </div>

                  {/* Sticky Bottom Navigation & Save Bar */}
                  <div className="sticky bottom-3 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-lg p-3 sm:p-4 flex items-center justify-between flex-wrap gap-3">
                    {/* Left: Previous / Question Counter / Next */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="btn-prev-question"
                        disabled={!prevRecord}
                        onClick={() => prevRecord && handleSelectQuestion(prevRecord)}
                        className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 font-mono">
                        Q.{activeFormData.question_r || 1} of {records.length}
                      </span>

                      <button
                        type="button"
                        id="btn-save-next-question"
                        disabled={isSaving}
                        onClick={() => handleSaveActiveQuestion(true)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Middle: Shortcut Tips */}
                    <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">Ctrl+S: Save</span>
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">Ctrl+Enter: Save & Next</span>
                    </div>

                    {/* Right: Quick Save Action */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSaving || !activeFormData}
                        onClick={() => handleSaveActiveQuestion(false)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save Question'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <Database className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No question selected</p>
                <p className="text-xs text-slate-400 mt-1">Select a question from the list or click Add Question.</p>
                <button
                  type="button"
                  onClick={handleAddNewQuestion}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  + Add First Question
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ===================== MODALS ===================== */}

      {/* Create Table Modal */}
      {showCreateTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
              <h3 className="text-xs font-bold uppercase tracking-wider">Create Mock Test Table</h3>
              <button type="button" onClick={() => setShowCreateTableModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTable} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Table / Test Name:</label>
                <input
                  type="text"
                  required
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. 72nd BPSC CCE Full Test-18"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category:</label>
                <select
                  value={newTableCategory}
                  onChange={(e) => setNewTableCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-slate-50"
                >
                  <option value="BPSC">BPSC</option>
                  <option value="Bihar Police">Bihar Police</option>
                  <option value="Bihar SI">Bihar SI</option>
                  <option value="SSC/Railway">SSC / Railway</option>
                  <option value="Other">Other Exam</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTableModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Focus Standalone Modal Question Editor */}
      {showStandaloneModalEditor && currentRecord && (
        <QuestionEditorModal
          tableName={selectedTable}
          record={currentRecord}
          allRecords={records}
          currentUser={currentUser}
          onClose={() => setShowStandaloneModalEditor(false)}
          onSaveSuccess={(updated) => {
            setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
            if (updated.id === selectedRecordId) {
              setActiveFormData({ ...updated.fields });
            }
          }}
          onNavigateRecord={(targetId) => {
            const targetRec = records.find(r => r.id === targetId);
            if (targetRec) {
              setSelectedRecordId(targetRec.id);
              setActiveFormData({ ...targetRec.fields });
              setHas5thOption(Boolean(targetRec.fields.option5_hi || targetRec.fields.option5_en));
            }
          }}
          onOpenMediaLibrary={() => setShowMediaLibraryModal(true)}
          onDeleteRecord={(delId) => {
            handleDeleteQuestion(delId);
            setShowStandaloneModalEditor(false);
          }}
        />
      )}

      {/* Bulk Find and Replace Modal */}
      {showFindReplaceModal && (
        <FindAndReplaceModal
          currentTableName={selectedTable}
          tables={tables}
          userName={currentUser.name}
          onClose={() => setShowFindReplaceModal(false)}
          onSuccess={() => {
            loadRecords(selectedTable);
            loadTables();
          }}
        />
      )}

      {/* CSV Import Modal */}
      {showCsvImportModal && (
        <CsvImportModal
          tableName={selectedTable}
          userName={currentUser.name}
          onClose={() => setShowCsvImportModal(false)}
          onImportSuccess={() => {
            loadRecords(selectedTable);
            loadTables();
            setShowCsvImportModal(false);
          }}
        />
      )}

      {/* CSV Export Modal */}
      {showCsvExportModal && (
        <CsvExportModal
          tableName={selectedTable}
          records={records}
          onClose={() => setShowCsvExportModal(false)}
        />
      )}

      {/* ImgBB Image Migration Modal */}
      {showImgbbMigrationModal && (
        <ImgbbMigrationModal
          isOpen={showImgbbMigrationModal}
          onClose={() => setShowImgbbMigrationModal(false)}
          tables={tables}
          activeTable={selectedTable}
          records={records}
          onMigrationComplete={() => {
            loadRecords(selectedTable);
          }}
          onSelectQuestion={(targetId) => {
            const targetRec = records.find(r => r.id === targetId);
            if (targetRec) {
              handleSelectQuestion(targetRec);
              setViewLayout('split-editor');
            }
          }}
        />
      )}

      {/* Media Library Modal */}
      {showMediaLibraryModal && (
        <MediaLibraryModal
          onClose={() => setShowMediaLibraryModal(false)}
          editorName={currentUser.name}
          onSelectImage={(url) => {
            updateFormField('image_url', url);
            setShowMediaLibraryModal(false);
          }}
        />
      )}

      {/* Audit Log Modal */}
      {showAuditLogModal && (
        <AuditLogModal onClose={() => setShowAuditLogModal(false)} />
      )}

      {/* Multi-Base & Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          initialTab={settingsInitialTab}
          onClose={() => setShowSettingsModal(false)}
          onConfigSaved={() => {
            loadBasesAndTables(true);
          }}
          onBaseSwitched={(newBaseId) => {
            handleSwitchBase(newBaseId);
          }}
        />
      )}
    </div>
  );
}
