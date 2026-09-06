import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Database, Key, CheckCircle2, AlertCircle, RefreshCw, 
  Plus, Trash2, Edit3, Check, ShieldCheck, Sparkles, Server, ArrowRight, ExternalLink,
  Zap, Search, Eye, EyeOff, Layers, Globe, Filter
} from 'lucide-react';
import { AirtableConfig, AirtableBaseItem } from '../types';
import { api } from '../services/api';

interface SettingsModalProps {
  onClose: () => void;
  onConfigSaved: () => void;
  initialTab?: 'bases' | 'keys';
  onBaseSwitched?: (baseId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  onConfigSaved, 
  initialTab = 'bases',
  onBaseSwitched
}) => {
  const [activeTab, setActiveTab] = useState<'bases' | 'keys'>(initialTab);
  const [currentConfig, setCurrentConfig] = useState<AirtableConfig | null>(null);
  const [bases, setBases] = useState<AirtableBaseItem[]>([]);
  
  // Global API Keys form
  const [apiKey, setApiKey] = useState('');
  const [imgbbKey, setImgbbKey] = useState('');

  // Add / Edit Base form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [newBaseName, setNewBaseName] = useState('');
  const [newBaseId, setNewBaseId] = useState('');
  const [newBaseDesc, setNewBaseDesc] = useState('');
  const [newBaseCategory, setNewBaseCategory] = useState<'Bihar Exams' | 'BPSC' | 'SSC/Railway' | 'Teaching' | 'General' | 'Other'>('Bihar Exams');
  const [newBaseColor, setNewBaseColor] = useState<'indigo' | 'purple' | 'emerald' | 'amber' | 'rose' | 'blue'>('indigo');
  const [newBaseApiKey, setNewBaseApiKey] = useState('');

  // Auto-Fetch Name & Metadata States
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [metaResult, setMetaResult] = useState<{
    success: boolean;
    baseId?: string;
    name?: string;
    tableCount?: number;
    tables?: string[];
    message?: string;
  } | null>(null);

  // Account Base Discovery States
  const [showDiscoveryView, setShowDiscoveryView] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoveredBases, setDiscoveredBases] = useState<Array<{
    id: string;
    baseId: string;
    name: string;
    permissionLevel?: string;
    isConnected: boolean;
  }>>([]);
  const [discoverySearch, setDiscoverySearch] = useState('');
  const [connectingDiscoveredId, setConnectingDiscoveredId] = useState<string | null>(null);

  // Password visibility toggles
  const [showBasePat, setShowBasePat] = useState(false);
  const [showGlobalPat, setShowGlobalPat] = useState(false);

  // Testing & Status states
  const [testingBaseId, setTestingBaseId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; tableCount?: number }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [globalTestLoading, setGlobalTestLoading] = useState(false);
  const [globalTestResult, setGlobalTestResult] = useState<{ success: boolean; message: string; tableCount?: number } | null>(null);

  const fetchFullConfig = async () => {
    try {
      const [conf, baseList] = await Promise.all([
        api.getConfig(),
        api.getBases()
      ]);
      setCurrentConfig(conf);
      setBases(baseList);
      setImgbbKey(conf.imgbbApiKey || '');
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  useEffect(() => {
    fetchFullConfig();
  }, []);

  // ⚡ Auto-Fetch Base Name & Tables from Airtable API
  const handleAutoFetchBaseMeta = async (idOverride?: string) => {
    const rawId = (idOverride !== undefined ? idOverride : newBaseId).trim();
    if (!rawId) {
      setMetaResult({
        success: false,
        message: 'Kripya pehle Airtable Base ID enter karein (e.g. appXXXXXXXXXXXXXX).'
      });
      return;
    }

    // Extract clean Base ID if full URL was pasted
    const match = rawId.match(/app[a-zA-Z0-9]{10,}/);
    const cleanId = match ? match[0] : rawId;
    if (cleanId !== newBaseId) {
      setNewBaseId(cleanId);
    }

    setIsFetchingMeta(true);
    setMetaResult(null);

    try {
      const res = await api.fetchBaseMeta(cleanId, newBaseApiKey.trim() || undefined);
      setMetaResult(res);
      if (res.success && res.name) {
        setNewBaseName(res.name);
      }
    } catch (err: any) {
      setMetaResult({
        success: false,
        message: err.message || 'Base details fetch nahi ho paya. Kripya apna PAT aur Base ID check karein.'
      });
    } finally {
      setIsFetchingMeta(false);
    }
  };

  // 🔍 Discover All Bases in Airtable Account
  const handleDiscoverAccountBases = async () => {
    setIsDiscovering(true);
    setDiscoverError(null);
    setShowDiscoveryView(true);
    try {
      const res = await api.discoverBases(apiKey.trim() || undefined);
      if (res.success && res.bases) {
        setDiscoveredBases(res.bases);
      } else {
        setDiscoverError(res.message || 'Airtable account se bases fetch nahi ho paye. Scopes verify karein.');
      }
    } catch (err: any) {
      setDiscoverError(err.message || 'Failed to connect to Airtable Account.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // 1-Click Connect Discovered Base
  const handleConnectDiscoveredBase = async (discovered: { baseId: string; name: string }) => {
    setConnectingDiscoveredId(discovered.baseId);
    try {
      await api.addBase({
        baseId: discovered.baseId,
        name: discovered.name,
        description: `Auto-connected from Airtable Account`,
        category: 'General',
        color: 'indigo',
        isActive: bases.length === 0
      });
      await fetchFullConfig();
      onConfigSaved();
      setDiscoveredBases(prev => prev.map(b => b.baseId === discovered.baseId ? { ...b, isConnected: true } : b));
    } catch (err: any) {
      alert(`Base connect karne me samasya: ${err.message}`);
    } finally {
      setConnectingDiscoveredId(null);
    }
  };

  // Connect All Discovered Bases in 1 Click
  const handleConnectAllDiscoveredBases = async () => {
    const unconn = discoveredBases.filter(b => !bases.some(cb => cb.baseId.toLowerCase() === b.baseId.toLowerCase()));
    if (unconn.length === 0) return;
    setIsDiscovering(true);
    for (const b of unconn) {
      try {
        await api.addBase({
          baseId: b.baseId,
          name: b.name,
          description: `Auto-connected from Airtable Account`,
          category: 'General',
          color: 'indigo',
          isActive: false
        });
      } catch (e) {
        console.warn('Failed to auto-connect base:', b.name, e);
      }
    }
    await fetchFullConfig();
    onConfigSaved();
    setDiscoveredBases(prev => prev.map(b => ({ ...b, isConnected: true })));
    setIsDiscovering(false);
  };

  const handleTestSingleBase = async (baseItem: AirtableBaseItem) => {
    setTestingBaseId(baseItem.baseId);
    try {
      const res = await api.testBaseConnection(baseItem.baseId, baseItem.apiKey || (apiKey || undefined));
      setTestResults(prev => ({ ...prev, [baseItem.baseId]: res }));
      if (res.success) {
        // Refresh base list to update table counts
        const updated = await api.getBases();
        setBases(updated);
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [baseItem.baseId]: { success: false, message: err.message || 'Connection test failed' }
      }));
    } finally {
      setTestingBaseId(null);
    }
  };

  const handleSwitchActiveBase = async (baseId: string) => {
    try {
      const baseObj = bases.find(b => b.baseId === baseId || b.id === baseId);
      await api.switchActiveBase(baseId, baseObj?.name, baseObj?.apiKey);
      await fetchFullConfig();
      if (onBaseSwitched) {
        onBaseSwitched(baseId);
      }
    } catch (err: any) {
      alert(`Error switching base: ${err.message}`);
    }
  };

  const handleSaveNewBase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBaseId.trim() || !newBaseName.trim()) {
      alert('Base Name and Airtable Base ID are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingBaseId) {
        await api.updateBase(editingBaseId, {
          name: newBaseName.trim(),
          baseId: newBaseId.trim(),
          description: newBaseDesc.trim(),
          category: newBaseCategory,
          color: newBaseColor,
          apiKey: newBaseApiKey.trim() || undefined
        });
      } else {
        await api.addBase({
          name: newBaseName.trim(),
          baseId: newBaseId.trim(),
          description: newBaseDesc.trim(),
          category: newBaseCategory,
          color: newBaseColor,
          apiKey: newBaseApiKey.trim() || undefined,
          isActive: bases.length === 0
        });
      }

      // Reset form
      setShowAddForm(false);
      setEditingBaseId(null);
      setNewBaseName('');
      setNewBaseId('');
      setNewBaseDesc('');
      setNewBaseApiKey('');
      setMetaResult(null);
      await fetchFullConfig();
      onConfigSaved();
    } catch (err: any) {
      alert(`Failed to save base: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBaseClick = (base: AirtableBaseItem) => {
    setEditingBaseId(base.baseId);
    setNewBaseName(base.name);
    setNewBaseId(base.baseId);
    setNewBaseDesc(base.description || '');
    setNewBaseCategory((base.category as any) || 'Bihar Exams');
    setNewBaseColor((base.color as any) || 'indigo');
    setNewBaseApiKey(base.apiKey || '');
    setShowAddForm(true);
  };

  const handleDeleteBase = async (baseId: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect Base "${name}" (${baseId})?`)) {
      return;
    }

    try {
      await api.deleteBase(baseId);
      await fetchFullConfig();
      onConfigSaved();
    } catch (err: any) {
      alert(`Failed to delete base: ${err.message}`);
    }
  };

  const handleSaveGlobalKeys = async () => {
    setIsSaving(true);
    try {
      await api.updateConfig({
        apiKey: apiKey || (currentConfig?.isCustomConfigured ? undefined : '') || '',
        baseId: currentConfig?.activeBaseId || '',
        imgbbApiKey: imgbbKey || ''
      });
      await fetchFullConfig();
      onConfigSaved();

      // Auto-scan bases if PAT is provided
      if (apiKey && apiKey.trim().startsWith('pat')) {
        setActiveTab('bases');
        handleDiscoverAccountBases();
      } else {
        alert('Global configuration saved successfully!');
      }
    } catch (err: any) {
      alert(`Failed to save global keys: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestGlobal = async () => {
    setGlobalTestLoading(true);
    setGlobalTestResult(null);
    try {
      const res = await api.testConnection();
      setGlobalTestResult(res);
    } catch (err: any) {
      setGlobalTestResult({ success: false, message: err.message || 'Test failed' });
    } finally {
      setGlobalTestLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div id="multi-base-settings-modal" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Multiple Airtable Bases & API Settings</h2>
              <p className="text-[11px] text-slate-400">Connect, switch and manage multiple Airtable Bases & API Keys</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-100 border-b border-slate-200 flex-none">
          <button
            type="button"
            id="tab-btn-connected-bases"
            onClick={() => setActiveTab('bases')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'bases'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Connected Bases ({bases.length})</span>
          </button>

          <button
            type="button"
            id="tab-btn-api-keys"
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'keys'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Global PAT & Image Tokens</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/60 flex-grow">
          {activeTab === 'bases' ? (
            <div className="space-y-5">
              {/* Top Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-indigo-950">
                    Active Base: <span className="font-bold">{currentConfig?.activeBaseName || 'None'}</span>
                  </span>
                  <span className="text-[10px] font-mono bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                    {currentConfig?.activeBaseId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-discover-account-bases"
                    onClick={handleDiscoverAccountBases}
                    disabled={isDiscovering}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                    title="Scan and list all bases from your Airtable account"
                  >
                    <Search className={`w-3.5 h-3.5 text-indigo-600 ${isDiscovering ? 'animate-spin' : ''}`} />
                    <span>{isDiscovering ? 'Scanning...' : '🔍 Auto-Discover Bases'}</span>
                  </button>

                  {!showAddForm && (
                    <button
                      type="button"
                      id="btn-trigger-add-base-form"
                      onClick={() => {
                        setEditingBaseId(null);
                        setNewBaseName('');
                        setNewBaseId('');
                        setNewBaseDesc('');
                        setNewBaseApiKey('');
                        setMetaResult(null);
                        setShowAddForm(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Connect Base by ID</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Discovery View Panel */}
              {showDiscoveryView && (
                <div id="discovery-panel" className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-200 shadow-md space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-800">
                        Discovered Airtable Bases in Your Account
                      </h3>
                      {discoveredBases.length > 0 && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                          {discoveredBases.length} Bases Found
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {discoveredBases.some(b => !bases.some(cb => cb.baseId.toLowerCase() === b.baseId.toLowerCase())) && (
                        <button
                          type="button"
                          onClick={handleConnectAllDiscoveredBases}
                          disabled={isDiscovering}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>⚡ Connect All Discovered</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowDiscoveryView(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium px-1.5 py-0.5 rounded"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {discoverError && (
                    <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>{discoverError}</span>
                    </div>
                  )}

                  {/* Search inside discovered bases */}
                  {discoveredBases.length > 0 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filter discovered bases by name or ID..."
                        value={discoverySearch}
                        onChange={(e) => setDiscoverySearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Discovered Bases List */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {discoveredBases
                      .filter(b => !discoverySearch.trim() || b.name.toLowerCase().includes(discoverySearch.toLowerCase()) || b.baseId.toLowerCase().includes(discoverySearch.toLowerCase()))
                      .map((b) => {
                        const isConnected = bases.some(cb => cb.baseId.toLowerCase() === b.baseId.toLowerCase()) || b.isConnected;
                        const isConnecting = connectingDiscoveredId === b.baseId;

                        return (
                          <div key={b.baseId} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate">{b.name}</span>
                                {b.permissionLevel && (
                                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                    {b.permissionLevel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-indigo-600 truncate mt-0.5">
                                {b.baseId}
                              </div>
                            </div>

                            <div className="flex-none">
                              {isConnected ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Connected</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isConnecting}
                                  onClick={() => handleConnectDiscoveredBase(b)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                                >
                                  {isConnecting ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Zap className="w-3 h-3 text-amber-300" />
                                  )}
                                  <span>{isConnecting ? 'Connecting...' : '1-Click Connect'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {discoveredBases.length === 0 && !isDiscovering && !discoverError && (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No bases found in your Airtable account. Verify that your PAT has <code>schema.bases:read</code> scope enabled.
                      </div>
                    )}
                    {isDiscovering && (
                      <div className="p-6 text-center text-xs text-indigo-700 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Scanning bases in your Airtable account...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add / Edit Base Drawer */}
              {showAddForm && (
                <form 
                  onSubmit={handleSaveNewBase}
                  id="form-add-new-base"
                  className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-200 shadow-md space-y-4 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-800">
                        {editingBaseId ? 'Edit Airtable Base' : 'Connect New Airtable Base'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Base ID input with ⚡ Auto-Fetch */}
                    <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor="input-new-base-id" className="block text-[11px] font-bold text-slate-700">
                            Airtable Base ID (appXXXXXXXXXXXXXX) *
                          </label>
                          <button
                            type="button"
                            id="btn-auto-fetch-base-meta"
                            onClick={() => handleAutoFetchBaseMeta()}
                            disabled={isFetchingMeta || !newBaseId.trim()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                          >
                            <Zap className={`w-3 h-3 text-amber-500 ${isFetchingMeta ? 'animate-bounce' : ''}`} />
                            <span>{isFetchingMeta ? 'Fetching...' : '⚡ Auto-Fetch Name'}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            id="input-new-base-id"
                            type="text"
                            required
                            value={newBaseId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewBaseId(val);
                            }}
                            onBlur={() => {
                              if (newBaseId.trim().startsWith('app') && !newBaseName) {
                                handleAutoFetchBaseMeta(newBaseId);
                              }
                            }}
                            placeholder="appXXXXXXXXXXXXXX"
                            className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-900 bg-white pr-20"
                          />
                          <button
                            type="button"
                            onClick={() => handleAutoFetchBaseMeta()}
                            disabled={isFetchingMeta || !newBaseId.trim()}
                            className="absolute right-1 top-1 bottom-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded flex items-center gap-1 disabled:opacity-40 transition-colors"
                            title="Fetch official base name from Airtable API"
                          >
                            {isFetchingMeta ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Fetch</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Base ID enter karein ya 'Fetch' dabayein—official base name aur tables apne aap mil jayenge.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="input-new-base-name" className="block text-[11px] font-bold text-slate-700 mb-1">
                          Base Display Name (Auto-Fetched or Custom)
                        </label>
                        <input
                          id="input-new-base-name"
                          type="text"
                          value={newBaseName}
                          onChange={(e) => setNewBaseName(e.target.value)}
                          placeholder="e.g. 72nd BPSC Mock Exam Bank"
                          className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Airtable se fetched name yahan aayega, chahein to badal bhi sakte hain.
                        </p>
                      </div>
                    </div>

                    {/* Metadata Preview Banner */}
                    {metaResult && (
                      <div className={`p-3 rounded-xl text-xs sm:col-span-2 border transition-all ${
                        metaResult.success 
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' 
                          : 'bg-amber-50/90 border-amber-300 text-amber-950'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          {metaResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1 w-full min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <p className="font-bold text-xs">
                                {metaResult.success ? `✓ Base Name: "${metaResult.name}"` : 'Base Name Fetch Notice'}
                              </p>
                              {metaResult.success && typeof metaResult.tableCount === 'number' && (
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full font-bold">
                                  {metaResult.tableCount} tables in Airtable
                                </span>
                              )}
                            </div>
                            {metaResult.message && (
                              <p className="text-[11px] opacity-90">{metaResult.message}</p>
                            )}
                            {metaResult.tables && metaResult.tables.length > 0 && (
                              <div className="pt-1.5 flex flex-wrap gap-1 items-center">
                                <span className="text-[10px] font-semibold text-emerald-900">Tables preview:</span>
                                {metaResult.tables.slice(0, 5).map((t, idx) => (
                                  <span key={idx} className="text-[10px] font-mono bg-white/90 border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                                    {t}
                                  </span>
                                ))}
                                {metaResult.tables.length > 5 && (
                                  <span className="text-[10px] text-emerald-700 font-medium">+{metaResult.tables.length - 5} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="select-new-base-cat" className="block text-[11px] font-bold text-slate-700 mb-1">
                        Exam Category
                      </label>
                      <select
                        id="select-new-base-cat"
                        value={newBaseCategory}
                        onChange={(e) => setNewBaseCategory(e.target.value as any)}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="Bihar Exams">Bihar Police / SI</option>
                        <option value="BPSC">BPSC Combined Competitive</option>
                        <option value="SSC/Railway">SSC / Railway NTPC</option>
                        <option value="Teaching">Bihar Teacher (TRE)</option>
                        <option value="General">General Knowledge</option>
                        <option value="Other">Other / Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Badge Theme Color
                      </label>
                      <div className="flex items-center gap-2">
                        {(['indigo', 'purple', 'emerald', 'amber', 'rose', 'blue'] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewBaseColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              c === 'indigo' ? 'bg-indigo-600' :
                              c === 'purple' ? 'bg-purple-600' :
                              c === 'emerald' ? 'bg-emerald-600' :
                              c === 'amber' ? 'bg-amber-600' :
                              c === 'rose' ? 'bg-rose-600' : 'bg-blue-600'
                            } ${newBaseColor === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="input-new-base-pat" className="block text-[11px] font-bold text-slate-700 mb-1">
                        Custom PAT Token for this Base (Optional - overrides global token)
                      </label>
                      <div className="relative">
                        <input
                          id="input-new-base-pat"
                          type={showBasePat ? 'text' : 'password'}
                          value={newBaseApiKey}
                          onChange={(e) => setNewBaseApiKey(e.target.value)}
                          placeholder="patXXXXXXXXXXXXXX (Chhod sakte hain agar Global PAT use karna hai)"
                          className="w-full text-xs px-3 py-1.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          id="btn-toggle-show-pat"
                          onClick={() => setShowBasePat(!showBasePat)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          title={showBasePat ? 'Hide PAT' : 'Show PAT'}
                        >
                          {showBasePat ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Agar ye Base kisi dusre Airtable account me hai, to uska alag PAT yahan daal sakte hain. Varna default PAT use hoga.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="input-new-base-desc" className="block text-[11px] font-bold text-slate-700 mb-1">
                        Base Description
                      </label>
                      <input
                        id="input-new-base-desc"
                        type="text"
                        value={newBaseDesc}
                        onChange={(e) => setNewBaseDesc(e.target.value)}
                        placeholder="e.g. Contains all 150 Question Full-Length BPSC Tests with 5 Options"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-save-base"
                      disabled={isSaving}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                    >
                      {isSaving ? 'Saving...' : editingBaseId ? 'Save Changes' : 'Connect & Save Base'}
                    </button>
                  </div>
                </form>
              )}

              {/* Connected Bases List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Connected Bases ({bases.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Only your connected bases are displayed
                  </span>
                </div>

                {bases.length === 0 && (
                  <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h5 className="text-xs font-bold text-slate-700">No Airtable Base Connected</h5>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Connect your specific Airtable Base ID to manage questions and tables.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect Your Airtable Base</span>
                    </button>
                  </div>
                )}

                {bases.map((base) => {
                  const isActive = base.baseId === currentConfig?.activeBaseId;
                  const testRes = testResults[base.baseId];
                  const isTesting = testingBaseId === base.baseId;

                  return (
                    <div
                      key={base.id || base.baseId}
                      id={`base-card-${base.baseId}`}
                      className={`p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-white border-indigo-400 ring-2 ring-indigo-100 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex-none flex items-center justify-center font-bold text-white ${
                            base.color === 'purple' ? 'bg-purple-600' :
                            base.color === 'emerald' ? 'bg-emerald-600' :
                            base.color === 'amber' ? 'bg-amber-600' :
                            base.color === 'rose' ? 'bg-rose-600' : 'bg-indigo-600'
                          }`}>
                            <Database className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {base.name}
                              </h5>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 stroke-[3]" /> Active Base
                                </span>
                              )}
                              {base.category && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
                                  {base.category}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono flex-wrap">
                              <span className="text-indigo-600 font-semibold">{base.baseId}</span>
                              {typeof base.tableCount === 'number' && (
                                <span>• {base.tableCount} tables cached</span>
                              )}
                              {base.apiKey && (
                                <span className="text-emerald-700 bg-emerald-50 px-1 rounded">Custom PAT</span>
                              )}
                            </div>

                            {base.description && (
                              <p className="text-[11px] text-slate-500 mt-1">
                                {base.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-none self-end sm:self-center">
                          <button
                            type="button"
                            id={`btn-test-base-${base.baseId}`}
                            disabled={isTesting}
                            onClick={() => handleTestSingleBase(base)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                            title="Test connectivity to this Base"
                          >
                            <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                            <span>{isTesting ? 'Testing...' : 'Test Sync'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditBaseClick(base)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Base Info"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBase(base.baseId, base.name)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Disconnect Base"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {!isActive && (
                            <button
                              type="button"
                              id={`btn-switch-to-${base.baseId}`}
                              onClick={() => handleSwitchActiveBase(base.baseId)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                            >
                              <span>Switch to this Base</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Test feedback banner */}
                      {testRes && (
                        <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          testRes.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {testRes.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-none" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-none" />}
                          <span className="text-[11px] font-medium">{testRes.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Security Banner */}
              <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-xl flex items-start gap-3 text-xs text-indigo-950">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Server-Side Proxy Security</p>
                  <p className="text-[11px] text-indigo-800 mt-1">
                    Your Airtable Personal Access Token (PAT) and storage secrets are strictly preserved on the Node.js Express server backend and never exposed directly in client JavaScript.
                  </p>
                </div>
              </div>

              {globalTestResult && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  globalTestResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {globalTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                  <div>
                    <p className="font-semibold">{globalTestResult.success ? 'Airtable Connection Verified' : 'Sync Warning'}</p>
                    <p className="text-[11px] mt-0.5">{globalTestResult.message}</p>
                  </div>
                </div>
              )}

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                {/* Default Airtable PAT */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="input-global-airtable-pat" className="block text-xs font-bold text-slate-800">
                      Default Airtable Personal Access Token (PAT):
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        setActiveTab('bases');
                        handleDiscoverAccountBases();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
                    >
                      <Search className="w-3 h-3 text-indigo-600" />
                      <span>Scan Bases with this Token</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="input-global-airtable-pat"
                      type={showGlobalPat ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={currentConfig?.apiKey ? `Current: ${currentConfig.apiKey}` : 'patXXXXXXXXXXXXXX.XXXXXXXXXXXX'}
                      className="w-full text-xs px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGlobalPat(!showGlobalPat)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showGlobalPat ? 'Hide Token' : 'Show Token'}
                    >
                      {showGlobalPat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used for all bases that do not specify a custom token. Required scopes: <code className="text-indigo-600 font-mono">data.records:read</code>, <code className="text-indigo-600 font-mono">data.records:write</code>, <code className="text-indigo-600 font-mono">schema.bases:read</code>.
                  </p>
                </div>

                {/* ImgBB Key */}
                <div>
                  <label htmlFor="input-global-imgbb-key" className="block text-xs font-bold text-slate-800 mb-1">
                    ImgBB Image Hosting API Key (Optional):
                  </label>
                  <input
                    id="input-global-imgbb-key"
                    type="password"
                    value={imgbbKey}
                    onChange={(e) => setImgbbKey(e.target.value)}
                    placeholder="ImgBB API Key for automated diagram uploads"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    If provided, pasted images and diagrams are hosted on ImgBB. Otherwise, local high-speed file storage is used automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  id="btn-test-global-connection"
                  disabled={globalTestLoading}
                  onClick={handleTestGlobal}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${globalTestLoading ? 'animate-spin' : ''}`} />
                  <span>{globalTestLoading ? 'Testing...' : 'Test Active Connection'}</span>
                </button>

                <button
                  type="button"
                  id="btn-save-global-keys"
                  disabled={isSaving}
                  onClick={handleSaveGlobalKeys}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save API Configuration'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-slate-200 flex-none">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Test Factory MCQ Multi-Base Engine</span>
          </div>

          <button
            type="button"
            id="btn-finish-settings"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
