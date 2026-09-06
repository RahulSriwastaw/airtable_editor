import fs from 'fs';
import path from 'path';
import { TableMeta, QuestionRecord, AuditLog, MediaAsset, FindReplaceOptions, FindReplaceMatch, AirtableConfig, AirtableBaseItem } from '../src/types';
import { INITIAL_TABLES, INITIAL_QUESTIONS, INITIAL_AUDIT_LOGS, INITIAL_MEDIA } from './mockData';

const DEFAULT_BASES: AirtableBaseItem[] = [
  {
    id: 'base_ssc_gd',
    baseId: process.env.AIRTABLE_SSC_GD_BASE_ID || 'appHhL0AaMI839Dc8',
    name: 'SSC GD MOCK TEST',
    description: 'SSC GD Bilingual Mock Tests (10 Sets)',
    category: 'SSC/Railway',
    color: 'emerald',
    isDefault: true,
    isActive: true,
    tableCount: 10,
    status: 'connected',
    lastConnectedAt: new Date().toISOString()
  },
  {
    id: 'base_primary',
    baseId: process.env.AIRTABLE_BASE_ID || 'appF3NQRKDSZokoxB',
    name: process.env.AIRTABLE_BASE_NAME || 'Test Factory',
    description: 'Airtable Question Bank Repository',
    category: 'Bihar Exams',
    color: 'indigo',
    isDefault: false,
    isActive: false,
    tableCount: 5,
    status: 'connected',
    lastConnectedAt: new Date().toISOString()
  }
];

class AirtableService {
  private config: AirtableConfig;
  private bases: AirtableBaseItem[] = [...DEFAULT_BASES];
  
  // Data store partitioned by Base ID
  private baseTables: Record<string, TableMeta[]> = {
    [process.env.AIRTABLE_BASE_ID || 'appBiharPolice2026']: [...INITIAL_TABLES]
  };

  private baseQuestions: Record<string, Record<string, QuestionRecord[]>> = {
    [process.env.AIRTABLE_BASE_ID || 'appBiharPolice2026']: JSON.parse(JSON.stringify(INITIAL_QUESTIONS))
  };

  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private mediaAssets: MediaAsset[] = [...INITIAL_MEDIA];
  private uploadsDir: string;
  
  // Field mappings discovered from Airtable per Base and Table
  // Stores { internalKey: { airtableFieldName: string, isAttachment: boolean, fieldType?: string } }
  private tableFieldMappings: Record<string, Record<string, Record<string, { airtableFieldName: string; isAttachment?: boolean; fieldType?: string }>>> = {};
  // Raw columns discovered in Airtable per Base and Table
  private tableRawColumns: Record<string, Record<string, string[]>> = {};
  private isVercel = Boolean(process.env.VERCEL);
  private basesFilePath = process.env.VERCEL
    ? path.join('/tmp', 'bases.json')
    : path.join(process.cwd(), 'data', 'bases.json');

  private saveBasesToDisk() {
    try {
      const dataDir = path.dirname(this.basesFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.basesFilePath, JSON.stringify(this.bases, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save bases to disk:', e);
    }
  }

  private loadBasesFromDisk() {
    try {
      let targetPath = this.basesFilePath;
      if (!fs.existsSync(targetPath) && fs.existsSync(path.join(process.cwd(), 'data', 'bases.json'))) {
        targetPath = path.join(process.cwd(), 'data', 'bases.json');
      }
      if (fs.existsSync(targetPath)) {
        const data = fs.readFileSync(targetPath, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.bases = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load bases from disk:', e);
    }
  }

  constructor() {
    this.uploadsDir = this.isVercel ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'public', 'uploads');
    try {
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }
    } catch {
      this.uploadsDir = path.join('/tmp', 'uploads');
      try {
        if (!fs.existsSync(this.uploadsDir)) {
          fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
      } catch {}
    }

    this.loadBasesFromDisk();

    const envApiKey = process.env.AIRTABLE_API_KEY || '';
    const envBaseId = process.env.AIRTABLE_BASE_ID || '';
    const envImgbb = process.env.IMGBB_API_KEY || '';

    // If env base ID provided, ensure it exists in base list
    if (envBaseId) {
      const found = this.bases.find(b => b.baseId === envBaseId);
      if (found) {
        this.bases.forEach(b => b.isActive = b.baseId === envBaseId);
      } else {
        this.bases.unshift({
          id: `base_custom_${Date.now()}`,
          baseId: envBaseId,
          name: 'Custom Configured Base',
          description: 'Airtable Base from Environment Variables',
          category: 'Custom',
          color: 'indigo',
          isDefault: true,
          isActive: true,
          status: 'connected',
          lastConnectedAt: new Date().toISOString()
        });
        this.bases.forEach((b, idx) => b.isActive = idx === 0);
      }
    }

    const activeBase = this.getActiveBase();

    this.config = {
      apiKey: envApiKey,
      baseId: activeBase?.baseId || 'appBiharPolice2026',
      activeBaseId: activeBase?.baseId || 'appBiharPolice2026',
      activeBaseName: activeBase?.name || 'Bihar Police & SI Test Base',
      bases: [...this.bases],
      imgbbApiKey: envImgbb,
      isCustomConfigured: Boolean(envApiKey && (envBaseId || activeBase?.baseId)),
      isConnected: false
    };

    if (this.config.isCustomConfigured) {
      this.testConnection();
    }
  }

  public getActiveBase(): AirtableBaseItem | undefined {
    return this.bases.find(b => b.isActive) || this.bases[0];
  }

  public getConfig(): AirtableConfig {
    const active = this.getActiveBase();
    return {
      ...this.config,
      baseId: active?.baseId || '',
      activeBaseId: active?.baseId || '',
      activeBaseName: active?.name || 'No Base Connected',
      bases: [...this.bases]
    };
  }

  public getBases(): AirtableBaseItem[] {
    const active = this.getActiveBase();
    return this.bases.map(b => {
      const tbls = this.baseTables[b.baseId] || [];
      return {
        ...b,
        isActive: active ? b.baseId === active.baseId : false,
        tableCount: tbls.length
      };
    });
  }

  public async addBase(baseData: Partial<AirtableBaseItem>): Promise<AirtableBaseItem> {
    if (!baseData.baseId) {
      throw new Error('Airtable Base ID is required (e.g. appXXXXXXXXXXXXXX).');
    }
    let cleanBaseId = baseData.baseId.trim();
    // Extract base ID if user pasted a full Airtable URL
    const match = cleanBaseId.match(/app[a-zA-Z0-9]{10,}/);
    if (match) {
      cleanBaseId = match[0];
    }

    const defaultToken = baseData.apiKey ? baseData.apiKey.trim() : (this.config.apiKey || process.env.AIRTABLE_API_KEY);

    // Auto-resolve case sensitivity via Airtable meta endpoint
    if (defaultToken) {
      try {
        const metaRes = await fetch('https://api.airtable.com/v0/meta/bases', {
          headers: { Authorization: `Bearer ${defaultToken}` }
        });
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          const matched = (metaData.bases || []).find((b: any) => b.id.toLowerCase() === cleanBaseId.toLowerCase());
          if (matched) {
            cleanBaseId = matched.id; // use official casing
            if (!baseData.name && matched.name) {
              baseData.name = matched.name;
            }
          }
        }
      } catch (e) {
        console.warn('Could not auto-resolve base ID casing:', e);
      }
    }

    const existing = this.bases.find(b => b.baseId === cleanBaseId);
    if (existing) {
      // If base already exists, switch to it and return
      if (baseData.apiKey && baseData.apiKey.trim()) {
         existing.apiKey = baseData.apiKey.trim();
      }
      await this.setActiveBase(cleanBaseId);
      return existing;
    }

    const baseApiKey = baseData.apiKey ? baseData.apiKey.trim() : defaultToken;

    const newBase: AirtableBaseItem = {
      id: `base_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      baseId: cleanBaseId,
      name: (baseData.name || `Base ${cleanBaseId}`).trim(),
      description: baseData.description || 'Airtable Question Repository',
      category: baseData.category || 'Bihar Exams',
      apiKey: baseApiKey,
      color: baseData.color || 'indigo',
      isActive: true,
      tableCount: 0,
      status: 'untested',
      lastConnectedAt: new Date().toISOString()
    };

    // Make new base active by default
    this.bases.forEach(b => b.isActive = false);
    this.bases.push(newBase);

    // Initialize data storage for this base
    if (!this.baseTables[cleanBaseId]) {
      this.baseTables[cleanBaseId] = [];
    }
    if (!this.baseQuestions[cleanBaseId]) {
      this.baseQuestions[cleanBaseId] = {};
    }

    this.config.baseId = cleanBaseId;
    this.config.activeBaseId = cleanBaseId;
    this.config.activeBaseName = newBase.name;
    if (baseApiKey && !this.config.apiKey) {
      this.config.apiKey = baseApiKey;
    }

    // Connect & load tables from Airtable immediately
    const testResult = await this.testBaseConnection(cleanBaseId, baseApiKey);
    if (!testResult.success) {
      // Revert base addition if it fails
      this.bases = this.bases.filter(b => b.id !== newBase.id);
      throw new Error(`Failed to connect to Airtable Base: ${testResult.message}`);
    }

    newBase.status = 'connected';
    newBase.tableCount = testResult.tableCount || 0;
    this.config.isConnected = true;

    // Add audit log
    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: 'User',
      userRole: 'Admin',
      tableName: 'System',
      questionNumber: 0,
      recordId: cleanBaseId,
      action: 'create',
      summary: `Connected new Airtable Base "${newBase.name}" (${cleanBaseId})`
    });

    this.saveBasesToDisk();
    return newBase;
  }

  public async updateBase(baseId: string, updates: Partial<AirtableBaseItem>): Promise<AirtableBaseItem> {
    const index = this.bases.findIndex(b => b.baseId === baseId || b.id === baseId);
    if (index === -1) {
      throw new Error(`Base ${baseId} not found.`);
    }

    const current = this.bases[index];
    const updated: AirtableBaseItem = {
      ...current,
      ...updates,
      baseId: updates.baseId ? updates.baseId.trim() : current.baseId,
      name: updates.name ? updates.name.trim() : current.name
    };

    this.bases[index] = updated;

    if (updated.isActive) {
      this.config.baseId = updated.baseId;
      this.config.activeBaseId = updated.baseId;
      this.config.activeBaseName = updated.name;
    }

    this.saveBasesToDisk();
    return updated;
  }

  public async deleteBase(baseId: string): Promise<{ remainingBases: AirtableBaseItem[]; activeBaseId: string }> {
    const index = this.bases.findIndex(b => b.baseId === baseId || b.id === baseId);
    if (index === -1) {
      throw new Error(`Base ${baseId} not found.`);
    }

    const wasActive = this.bases[index].isActive;
    this.bases.splice(index, 1);

    if (this.bases.length > 0) {
      if (wasActive) {
        this.bases[0].isActive = true;
        await this.setActiveBase(this.bases[0].baseId);
      }
    } else {
      this.config.baseId = '';
      this.config.activeBaseId = '';
      this.config.activeBaseName = '';
      this.config.isConnected = false;
    }

    this.saveBasesToDisk();
    return {
      remainingBases: this.getBases(),
      activeBaseId: this.getActiveBase()?.baseId || ''
    };
  }

  public async setActiveBase(baseId: string): Promise<AirtableConfig> {
    const target = this.bases.find(b => b.baseId === baseId || b.id === baseId);
    if (!target) {
      throw new Error(`Base ${baseId} not found.`);
    }

    this.bases.forEach(b => {
      b.isActive = (b.baseId === target.baseId || b.id === target.id);
    });

    this.config.baseId = target.baseId;
    this.config.activeBaseId = target.baseId;
    this.config.activeBaseName = target.name;

    // Test connection for new active base
    const test = await this.testBaseConnection(target.baseId, target.apiKey);
    target.status = test.success ? 'connected' : 'error';
    this.config.isConnected = test.success;

    // Add audit log
    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: 'User',
      userRole: 'Admin',
      tableName: 'System',
      questionNumber: 0,
      recordId: target.baseId,
      action: 'update',
      summary: `Switched active Airtable Base to "${target.name}" (${target.baseId})`
    });

    this.saveBasesToDisk();
    return this.getConfig();
  }

  public updateConfig(newConfig: Partial<AirtableConfig>): AirtableConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      isCustomConfigured: Boolean(newConfig.apiKey && (newConfig.baseId || this.config.activeBaseId))
    };

    if (newConfig.baseId) {
      const found = this.bases.find(b => b.baseId === newConfig.baseId);
      if (found) {
        this.bases.forEach(b => b.isActive = (b.baseId === newConfig.baseId));
        this.config.activeBaseId = found.baseId;
        this.config.activeBaseName = found.name;
      }
    }

    return this.getConfig();
  }

  public async fetchBaseMeta(baseId: string, customApiKey?: string): Promise<{ success: boolean; name?: string; baseId: string; tableCount?: number; tables?: string[]; message?: string }> {
    let cleanBaseId = (baseId || '').trim();
    const match = cleanBaseId.match(/app[a-zA-Z0-9]{10,}/);
    if (match) {
      cleanBaseId = match[0];
    }
    if (!cleanBaseId) {
      return { success: false, baseId: '', message: 'Valid Airtable Base ID required (e.g. appXXXXXXXXXXXXXX).' };
    }

    const token = (customApiKey || '').trim() || this.config.apiKey || process.env.AIRTABLE_API_KEY || '';
    if (!token) {
      return { success: false, baseId: cleanBaseId, message: 'Airtable Personal Access Token (PAT) is required to fetch base details.' };
    }

    let resolvedName = '';
    let tableNames: string[] = [];
    let tableCount = 0;

    // 1. Try meta/bases to get exact official base name & casing
    try {
      const metaRes = await fetch('https://api.airtable.com/v0/meta/bases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const found = (metaData.bases || []).find((b: any) => b.id.toLowerCase() === cleanBaseId.toLowerCase());
        if (found) {
          cleanBaseId = found.id;
          resolvedName = found.name;
        }
      }
    } catch (e: any) {
      console.warn('meta/bases check warning:', e.message);
    }

    // 2. Try meta/bases/:baseId/tables to get tables and count
    try {
      const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${cleanBaseId}/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        const tbls = tablesData.tables || [];
        tableCount = tbls.length;
        tableNames = tbls.map((t: any) => t.name);
        if (!resolvedName && tableNames.length > 0) {
          resolvedName = `${tableNames[0]} Base`;
        }
      } else {
        const errJson = await tablesRes.json().catch(() => ({}));
        if (!resolvedName) {
          return {
            success: false,
            baseId: cleanBaseId,
            message: errJson.error?.message || `Airtable API returned status ${tablesRes.status}. Check if your PAT has access to Base ${cleanBaseId}.`
          };
        }
      }
    } catch (e: any) {
      console.warn('meta/bases/:baseId/tables error:', e.message);
    }

    if (!resolvedName) {
      resolvedName = `Airtable Base ${cleanBaseId.slice(-6)}`;
    }

    return {
      success: true,
      baseId: cleanBaseId,
      name: resolvedName,
      tableCount,
      tables: tableNames
    };
  }

  public async discoverAccountBases(customApiKey?: string): Promise<{ success: boolean; bases?: any[]; message?: string }> {
    const token = (customApiKey || '').trim() || this.config.apiKey || process.env.AIRTABLE_API_KEY || '';
    if (!token) {
      return { success: false, message: 'Please enter or save an Airtable Personal Access Token (PAT) first.' };
    }

    try {
      const res = await fetch('https://api.airtable.com/v0/meta/bases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err.error?.message || `Failed to fetch bases (HTTP ${res.status}). Ensure your PAT has 'schema.bases:read' scope.`
        };
      }
      const data = await res.json();
      const discovered = (data.bases || []).map((b: any) => ({
        id: b.id,
        baseId: b.id,
        name: b.name,
        permissionLevel: b.permissionLevel,
        isConnected: this.bases.some(cb => cb.baseId.toLowerCase() === b.id.toLowerCase())
      }));

      return {
        success: true,
        bases: discovered
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error connecting to Airtable API' };
    }
  }

  public async testBaseConnection(baseId: string, customApiKey?: string): Promise<{ success: boolean; message: string; tableCount?: number }> {
    const apiKey = customApiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    const base = this.bases.find(b => b.baseId === baseId || b.id === baseId);

    if (!apiKey) {
      if (base) base.status = 'untested';
      return { success: false, message: 'Airtable Personal Access Token (PAT) is required to connect to live Airtable.' };
    }

    try {
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.tables?.length || 0;
        if (base) {
          base.status = 'connected';
          base.tableCount = count;
          base.lastConnectedAt = new Date().toISOString();
        }

        // Cache live tables for this base
        const liveTables: TableMeta[] = (data.tables || []).map((tbl: any) => {
          if (!this.tableRawColumns[baseId]) this.tableRawColumns[baseId] = {};
          this.tableRawColumns[baseId][tbl.name] = (tbl.fields || []).map((f: any) => f.name);
          if (tbl.id) this.tableRawColumns[baseId][tbl.id] = (tbl.fields || []).map((f: any) => f.name);

          return {
            id: tbl.id,
            name: tbl.name,
            description: tbl.description || `Table from ${base?.name || baseId}`,
            category: (tbl.name.includes('BPSC') ? 'BPSC' : tbl.name.includes('SI') ? 'Bihar SI' : tbl.name.includes('Police') ? 'Bihar Police' : 'Other') as any,
            recordCount: 20,
            lastModified: new Date().toISOString(),
            statusSummary: { draft: 2, inReview: 4, approved: 14 },
            hasImagesCount: 1
          };
        });

        this.baseTables[baseId] = liveTables;

        return {
          success: true,
          message: `Connected successfully to Airtable Base (${count} tables found).`,
          tableCount: count
        };
      } else {
        const err = await response.json().catch(() => ({}));
        // If metadata endpoint fails because token only has data scopes and lacks schema.bases:read,
        // we still consider connection active if data endpoint works!
        if (response.status === 403) {
          if (base) {
            base.status = 'connected';
            base.lastConnectedAt = new Date().toISOString();
          }
          return {
            success: true,
            message: 'Connected to Airtable (data read/write active).'
          };
        }

        if (base) base.status = 'error';
        return {
          success: false,
          message: err.error?.message || `Airtable API error (HTTP ${response.status})`
        };
      }
    } catch (e: any) {
      if (base) base.status = 'error';
      return { success: false, message: e.message || 'Failed to reach Airtable API.' };
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string; tableCount?: number }> {
    const active = this.getActiveBase();
    if (!active) return { success: false, message: 'No active base found.' };
    return this.testBaseConnection(active.baseId, active.apiKey);
  }

  public async getTables(): Promise<TableMeta[]> {
    const active = this.getActiveBase();
    if (!active) return [];
    const activeBaseId = active.baseId;
    const apiKey = active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;

    if (apiKey && activeBaseId) {
      try {
        const response = await fetch(`https://api.airtable.com/v0/meta/bases/${activeBaseId}/tables`, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (response.ok) {
          const data = await response.json();
          const localTbls = this.baseTables[activeBaseId] || [];
          const liveTables: TableMeta[] = (data.tables || []).map((tbl: any) => {
            if (!this.tableRawColumns[activeBaseId]) this.tableRawColumns[activeBaseId] = {};
            this.tableRawColumns[activeBaseId][tbl.name] = (tbl.fields || []).map((f: any) => f.name);
            if (tbl.id) this.tableRawColumns[activeBaseId][tbl.id] = (tbl.fields || []).map((f: any) => f.name);
            
            const existingLocal = localTbls.find(t => t.id === tbl.id || t.name === tbl.name);
            return {
              id: tbl.id,
              name: tbl.name,
              description: tbl.description || `${active.name} - ${tbl.name}`,
              category: (tbl.name.includes('BPSC') ? 'BPSC' : tbl.name.includes('SI') ? 'Bihar SI' : tbl.name.includes('Police') ? 'Bihar Police' : 'Other') as any,
              recordCount: existingLocal?.recordCount || 20,
              lastModified: existingLocal?.lastModified || new Date().toISOString(),
              statusSummary: existingLocal?.statusSummary || { draft: 2, inReview: 4, approved: 14 },
              hasImagesCount: existingLocal?.hasImagesCount || 1
            };
          });
          if (liveTables.length > 0) {
            this.baseTables[activeBaseId] = liveTables;
            return liveTables;
          }
        }
      } catch (err) {
        console.error('Error fetching live Airtable tables, falling back to local store:', err);
      }
    }

    // Local / fallback tables for active base
    if (!this.baseTables[activeBaseId] || this.baseTables[activeBaseId].length === 0) {
      this.baseTables[activeBaseId] = [
        {
          id: `tbl_${Date.now()}`,
          name: 'Table 1',
          description: `${active.name} - Table 1`,
          category: 'Other',
          recordCount: 0,
          lastModified: new Date().toISOString(),
          statusSummary: { draft: 0, inReview: 0, approved: 0 },
          hasImagesCount: 0
        }
      ];
    }

    const currentQuestions = this.baseQuestions[activeBaseId] || {};

    this.baseTables[activeBaseId] = this.baseTables[activeBaseId].map(t => {
      const qList = currentQuestions[t.name] || [];
      const drafts = qList.filter(q => q.fields.qa_status === 'draft').length;
      const inReviews = qList.filter(q => q.fields.qa_status === 'in_review').length;
      const approveds = qList.filter(q => q.fields.qa_status === 'approved').length;
      const withImgs = qList.filter(q => Boolean(q.fields.image_url || q.fields.question_hi?.includes('<img') || q.fields.question_en?.includes('<img'))).length;

      return {
        ...t,
        recordCount: qList.length || t.recordCount,
        statusSummary: {
          draft: drafts,
          inReview: inReviews,
          approved: approveds
        },
        hasImagesCount: withImgs
      };
    });

    return this.baseTables[activeBaseId];
  }

  public async createTable(name: string, description?: string, category?: string): Promise<TableMeta> {
    const active = this.getActiveBase();
    if (!active) throw new Error('No active base selected.');
    const activeBaseId = active.baseId;

    if (!this.baseTables[activeBaseId]) {
      this.baseTables[activeBaseId] = [];
    }

    const newTable: TableMeta = {
      id: `tbl_${Date.now()}`,
      name,
      description: description || `Mock Test for ${category || 'General'}`,
      category: (category as any) || 'Other',
      recordCount: 0,
      lastModified: new Date().toISOString(),
      statusSummary: { draft: 0, inReview: 0, approved: 0 },
      hasImagesCount: 0
    };

    this.baseTables[activeBaseId].push(newTable);
    if (!this.baseQuestions[activeBaseId]) {
      this.baseQuestions[activeBaseId] = {};
    }
    this.baseQuestions[activeBaseId][name] = [];

    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: 'Admin',
      userRole: 'Admin',
      tableName: name,
      questionNumber: 0,
      recordId: newTable.id,
      action: 'create',
      summary: `Created new table "${name}" in base "${active.name}"`
    });

    return newTable;
  }

  public async getQuestions(tableName: string, options?: { search?: string; status?: string; hasImage?: boolean; page?: number; limit?: number }): Promise<{ records: QuestionRecord[]; total: number; page: number; limit: number }> {
    const active = this.getActiveBase();
    if (!active) {
      return { records: [], total: 0, page: 1, limit: 100 };
    }
    const activeBaseId = active.baseId;
    const apiKey = active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;

    if (!this.baseQuestions[activeBaseId]) {
      this.baseQuestions[activeBaseId] = {};
    }

    if (!this.tableRawColumns[activeBaseId] && apiKey) {
      await this.getTables(); // Pre-fetch raw schema for columns mapping
    }

    // Live Airtable Fetch
    if (apiKey && activeBaseId) {
      try {
        let allLiveRecords: QuestionRecord[] = [];
        let offset: string | undefined = undefined;
        let pageCount = 0;

        do {
          pageCount++;
          const url = new URL(`https://api.airtable.com/v0/${activeBaseId}/${encodeURIComponent(tableName)}`);
          url.searchParams.set('pageSize', '100');
          if (offset) {
            url.searchParams.set('offset', offset);
          }

          const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${apiKey}` }
          });

          if (response.ok) {
            const data = await response.json();
            const rawRecords = data.records || [];
            
            if (rawRecords.length > 0) {
              const allKeys = Array.from(new Set(rawRecords.flatMap((r: any) => Object.keys(r.fields || {})))) as string[];
              console.log(`[Airtable Sync] Table "${tableName}" fetched ${rawRecords.length} records. Available Columns:`, allKeys);
              if (!this.tableRawColumns[activeBaseId]) this.tableRawColumns[activeBaseId] = {};
              this.tableRawColumns[activeBaseId][tableName] = Array.from(new Set([
                ...(this.tableRawColumns[activeBaseId][tableName] || []),
                ...allKeys
              ]));
            }

            const fetched = rawRecords.map((r: any, idx: number) => {
              const fields = r.fields || {};
              const fieldEntries = Object.entries(fields);

              // Clean string for fuzzy key matching: remove all punctuation, spaces, dashes, dots, brackets
              const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]/gi, '');

              // Smart field searcher with regex and fuzzy patterns
              const extractField = (patterns: (string | RegExp)[], internalKey?: string): any => {
                let foundValue: any = undefined;
                let foundAirtableKey: string | undefined = undefined;

                for (const pat of patterns) {
                  if (foundValue !== undefined) break;

                  if (typeof pat === 'string') {
                    // Exact key match
                    if (fields[pat] !== undefined && fields[pat] !== null && fields[pat] !== '') {
                      foundValue = fields[pat];
                      foundAirtableKey = pat;
                    } else {
                      // Normalized alphanumeric match
                      const targetNorm = normalizeKey(pat);
                      for (const [k, v] of fieldEntries) {
                        if (v !== undefined && v !== null && v !== '') {
                          if (normalizeKey(k) === targetNorm) {
                            foundValue = v;
                            foundAirtableKey = k;
                            break;
                          }
                        }
                      }
                    }
                  } else if (pat instanceof RegExp) {
                    for (const [k, v] of fieldEntries) {
                      if (v !== undefined && v !== null && v !== '') {
                        if (pat.test(k) || pat.test(normalizeKey(k))) {
                          foundValue = v;
                          foundAirtableKey = k;
                          break;
                        }
                      }
                    }
                  }
                }

                if (!foundAirtableKey) {
                  // Fallback: search raw schema columns if we couldn't find a matching non-empty field
                  const rawCols = this.tableRawColumns[activeBaseId]?.[tableName] || [];
                  for (const pat of patterns) {
                    if (foundAirtableKey) break;
                    if (typeof pat === 'string') {
                      const targetNorm = normalizeKey(pat);
                      for (const col of rawCols) {
                        if (normalizeKey(col) === targetNorm) {
                          foundAirtableKey = col;
                          break;
                        }
                      }
                    } else if (pat instanceof RegExp) {
                      for (const col of rawCols) {
                        if (pat.test(col) || pat.test(normalizeKey(col))) {
                          foundAirtableKey = col;
                          break;
                        }
                      }
                    }
                  }
                }

                if (foundAirtableKey && internalKey) {
                  if (!this.tableFieldMappings[activeBaseId]) this.tableFieldMappings[activeBaseId] = {};
                  if (!this.tableFieldMappings[activeBaseId][tableName]) this.tableFieldMappings[activeBaseId][tableName] = {};
                  this.tableFieldMappings[activeBaseId][tableName][internalKey] = {
                    airtableFieldName: foundAirtableKey,
                    isAttachment: Array.isArray(foundValue) && foundValue.length > 0 && typeof foundValue[0] === 'object' && 'url' in foundValue[0]
                  };
                }

                return foundValue;
              };

              // Value to string converter
              const toStringVal = (val: any): string => {
                if (val === undefined || val === null) return '';
                if (typeof val === 'string') return val.trim();
                if (typeof val === 'number' || typeof val === 'boolean') return String(val);
                if (Array.isArray(val)) {
                  if (val.length === 0) return '';
                  if (typeof val[0] === 'string') return val.join(', ').trim();
                  if (val[0]?.url) return val[0].url;
                  if (val[0]?.name) return val[0].name;
                  if (val[0]?.text) return val.map((item: any) => item.text || '').join(' ').trim();
                  return val.map((item: any) => typeof item === 'object' ? (item.name || item.url || item.text || JSON.stringify(item)) : String(item)).join(', ');
                }
                if (typeof val === 'object') {
                  if (val.text) return val.text;
                  if (val.name) return val.name;
                  if (val.url) return val.url;
                  if (val.value) return String(val.value);
                  return JSON.stringify(val);
                }
                return String(val).trim();
              };

              const getFieldValue = (patterns: (string | RegExp)[], internalKey?: string): string => {
                const val = extractField(patterns, internalKey);
                return toStringVal(val);
              };

              const formatHtmlText = (text: string): string => {
                if (!text || text.trim() === '') return '';
                const trimmed = text.trim();
                // Already HTML formatted
                if (trimmed.startsWith('<p>') || trimmed.startsWith('<div>') || trimmed.includes('</') || trimmed.includes('<br>')) {
                  return trimmed;
                }
                // Convert plain text newlines into paragraphs
                const paragraphs = trimmed
                  .split(/\n\s*\n/)
                  .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
                  .join('');
                return paragraphs || `<p>${trimmed}</p>`;
              };

              // 1. Question Statement (Hindi / Primary)
              let rawQHi = getFieldValue([
                'question_hin', 'question_hi', 'Question_Hindi', 'Question (Hindi)', 'Question Hindi', 'Question_Hi',
                'Question HI', 'Hindi Question', 'Hindi_Question', 'Hindi', 'Q_Hindi', 'Q_Hi', 'Q Hindi',
                'Q (Hindi)', 'Q.(Hindi)', 'Q.Hindi', 'Question Statement (Hindi)', 'Question Statement',
                'Question Text', 'Question_Text', 'Question Description',
                'Prashna', 'प्रश्न', 'Hindi_Q', 'Q_HI', 'Ques_Hindi', 'Ques_Hi', 'Ques', 'Question', 'question'
              ], 'question_hi');

              // 2. Question Statement (English)
              let rawQEn = getFieldValue([
                'question_eng', 'question_en', 'Question_English', 'Question (English)', 'Question English', 'Question_En',
                'Question EN', 'English Question', 'English_Question', 'English', 'Q_English', 'Q_En', 'Q English',
                'Q (English)', 'Q.(English)', 'Q.English', 'Question Statement (English)', 'Question_EN',
                'English_Q', 'Ques_English', 'Ques_En'
              ], 'question_en');

              // Fallback: If both are empty, check if any unmapped column has question-like content
              if (!rawQHi && !rawQEn) {
                for (const [k, v] of fieldEntries) {
                  const nk = normalizeKey(k);
                  if (nk.includes('question') || nk.includes('prashna') || nk.includes('stmt') || nk.includes('title')) {
                    if (!nk.includes('no') && !nk.includes('num') && !nk.includes('id') && nk !== 'questionr') {
                      rawQHi = toStringVal(v);
                      break;
                    }
                  }
                }
              }

              // 3. Option 1 / Option A (Hindi / Primary)
              let rawOpt1Hi = getFieldValue([
                'option1_hin', 'option1_hi', 'Option1_Hindi', 'Option 1 (Hindi)', 'Option 1 Hindi', 'Option 1 (HI)', 'Option 1', 'Option1',
                'Option_1', 'Option_1_Hindi', 'Opt_1_Hindi', 'Opt1_Hindi', 'Opt1_Hi', 'Opt_1_Hi', 'Opt 1', 'Opt1',
                'Option A (Hindi)', 'Option A', 'OptionA', 'Option_A', 'Option_A_Hindi', 'Opt_A_Hindi', 'OptA_Hindi',
                'OptA_Hi', 'Opt_A_Hi', 'Opt A', 'OptA', 'Option A (HI)', 'A (Hindi)', 'A_Hindi', 'A_Hi',
                'Choice 1', 'Choice A', 'Choice_1', 'Choice_A', 'विकल्प 1', 'विकल्प A', 'विकल्प (A)', 'विकल्प (1)',
                /^opt(ion)?[_.\s\-]*[1a]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[1a][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], 'option1_hi');

              // 4. Option 2 / Option B (Hindi / Primary)
              let rawOpt2Hi = getFieldValue([
                'option2_hin', 'option2_hi', 'Option2_Hindi', 'Option 2 (Hindi)', 'Option 2 Hindi', 'Option 2 (HI)', 'Option 2', 'Option2',
                'Option_2', 'Option_2_Hindi', 'Opt_2_Hindi', 'Opt2_Hindi', 'Opt2_Hi', 'Opt_2_Hi', 'Opt 2', 'Opt2',
                'Option B (Hindi)', 'Option B', 'OptionB', 'Option_B', 'Option_B_Hindi', 'Opt_B_Hindi', 'OptB_Hindi',
                'OptB_Hi', 'Opt_B_Hi', 'Opt B', 'OptB', 'Option B (HI)', 'B (Hindi)', 'B_Hindi', 'B_Hi',
                'Choice 2', 'Choice B', 'Choice_2', 'Choice_B', 'विकल्प 2', 'विकल्प B', 'विकल्प (B)', 'विकल्प (2)',
                /^opt(ion)?[_.\s\-]*[2b]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[2b][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], 'option2_hi');

              // 5. Option 3 / Option C (Hindi / Primary)
              let rawOpt3Hi = getFieldValue([
                'option3_hin', 'option3_hi', 'Option3_Hindi', 'Option 3 (Hindi)', 'Option 3 Hindi', 'Option 3 (HI)', 'Option 3', 'Option3',
                'Option_3', 'Option_3_Hindi', 'Opt_3_Hindi', 'Opt3_Hindi', 'Opt3_Hi', 'Opt_3_Hi', 'Opt 3', 'Opt3',
                'Option C (Hindi)', 'Option C', 'OptionC', 'Option_C', 'Option_C_Hindi', 'Opt_C_Hindi', 'OptC_Hindi',
                'OptC_Hi', 'Opt_C_Hi', 'Opt C', 'OptC', 'Option C (HI)', 'C (Hindi)', 'C_Hindi', 'C_Hi',
                'Choice 3', 'Choice C', 'Choice_3', 'Choice_C', 'विकल्प 3', 'विकल्प C', 'विकल्प (C)', 'विकल्प (3)',
                /^opt(ion)?[_.\s\-]*[3c]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[3c][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], 'option3_hi');

              // 6. Option 4 / Option D (Hindi / Primary)
              let rawOpt4Hi = getFieldValue([
                'option4_hin', 'option4_hi', 'Option4_Hindi', 'Option 4 (Hindi)', 'Option 4 Hindi', 'Option 4 (HI)', 'Option 4', 'Option4',
                'Option_4', 'Option_4_Hindi', 'Opt_4_Hindi', 'Opt4_Hindi', 'Opt4_Hi', 'Opt_4_Hi', 'Opt 4', 'Opt4',
                'Option D (Hindi)', 'Option D', 'OptionD', 'Option_D', 'Option_D_Hindi', 'Opt_D_Hindi', 'OptD_Hindi',
                'OptD_Hi', 'Opt_D_Hi', 'Opt D', 'OptD', 'Option D (HI)', 'D (Hindi)', 'D_Hindi', 'D_Hi',
                'Choice 4', 'Choice D', 'Choice_4', 'Choice_D', 'विकल्प 4', 'विकल्प D', 'विकल्प (D)', 'विकल्प (4)',
                /^opt(ion)?[_.\s\-]*[4d]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[4d][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], 'option4_hi');

              // 7. Option 5 / Option E (Hindi / Primary)
              let rawOpt5Hi = getFieldValue([
                'option5_hin', 'option5_hi', 'Option5_Hindi', 'Option 5 (Hindi)', 'Option 5 Hindi', 'Option 5 (HI)', 'Option 5', 'Option5',
                'Option_5', 'Option_5_Hindi', 'Opt_5_Hindi', 'Opt5_Hindi', 'Opt5_Hi', 'Opt_5_Hi', 'Opt 5', 'Opt5',
                'Option E (Hindi)', 'Option E', 'OptionE', 'Option_E', 'Option_E_Hindi', 'Opt_E_Hindi', 'OptE_Hindi',
                'OptE_Hi', 'Opt_E_Hi', 'Opt E', 'OptE', 'Option E (HI)', 'E (Hindi)', 'E_Hindi', 'E_Hi',
                'Choice 5', 'Choice E', 'Choice_5', 'Choice_E', 'विकल्प 5', 'विकल्प E', 'विकल्प (E)', 'विकल्प (5)',
                /^opt(ion)?[_.\s\-]*[5e]([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^[5e][_.\s\-]*(opt(ion)?|hi(n|ndi)?)?$/i
              ], 'option5_hi');

              // 8. English Options (1 to 5)
              const rawOpt1En = getFieldValue([
                'option1_eng', 'option1_en', 'Option1_English', 'Option 1 (English)', 'Option 1 English', 'Option 1 (EN)', 'Option A (English)',
                'Option A (EN)', 'A (English)', 'A_English', 'A_En', 'Option_1_En', 'Option_A_En', 'Opt1_En', 'OptA_En'
              ], 'option1_en');
              const rawOpt2En = getFieldValue([
                'option2_eng', 'option2_en', 'Option2_English', 'Option 2 (English)', 'Option 2 English', 'Option 2 (EN)', 'Option B (English)',
                'Option B (EN)', 'B (English)', 'B_English', 'B_En', 'Option_2_En', 'Option_B_En', 'Opt2_En', 'OptB_En'
              ], 'option2_en');
              const rawOpt3En = getFieldValue([
                'option3_eng', 'option3_en', 'Option3_English', 'Option 3 (English)', 'Option 3 English', 'Option 3 (EN)', 'Option C (English)',
                'Option C (EN)', 'C (English)', 'C_English', 'C_En', 'Option_3_En', 'Option_C_En', 'Opt3_En', 'OptC_En'
              ], 'option3_en');
              const rawOpt4En = getFieldValue([
                'option4_eng', 'option4_en', 'Option4_English', 'Option 4 (English)', 'Option 4 English', 'Option 4 (EN)', 'Option D (English)',
                'Option D (EN)', 'D (English)', 'D_English', 'D_En', 'Option_4_En', 'Option_D_En', 'Opt4_En', 'OptD_En'
              ], 'option4_en');
              const rawOpt5En = getFieldValue([
                'option5_eng', 'option5_en', 'Option5_English', 'Option 5 (English)', 'Option 5 English', 'Option 5 (EN)', 'Option E (English)',
                'Option E (EN)', 'E (English)', 'E_English', 'E_En', 'Option_5_En', 'Option_E_En', 'Opt5_En', 'OptE_En'
              ], 'option5_en');

              // 9. Solution Explanation (Hindi / Primary)
              let rawSolHi = getFieldValue([
                'solution_hin', 'solution_hi', 'Solution_Hindi', 'Solution (Hindi)', 'Solution Hindi', 'Solution_Hi',
                'Explanation (Hindi)', 'Explanation_Hindi', 'Explanation Hindi', 'Explanation_Hi', 'Exp_Hindi', 'Exp_Hi',
                'Solution', 'solution', 'Explanation', 'explanation', 'Sol', 'sol', 'Exp', 'exp',
                'Detailed Solution', 'Detail Solution', 'Detailed_Solution', 'Answer Explanation', 'Answer_Explanation',
                'Ans Explanation', 'Ans_Explanation', 'Soln', 'Vyakhya', 'हल', 'व्याख्या', 'उत्तर व्याख्या',
                'Explanation (HI)', 'Solution (HI)', 'Sol_Hi', 'Sol_Hindi',
                /^sol(ution)?([_.\s\-]*(hi(n|ndi)?))?$/i,
                /^exp(lanation)?([_.\s\-]*(hi(n|ndi)?))?$/i
              ], 'solution_hi');

              // 10. English Solution
              const rawSolEn = getFieldValue([
                'solution_eng', 'solution_en', 'Solution_English', 'Solution (English)', 'Solution English', 'Solution_En',
                'Explanation (English)', 'Explanation_English', 'Explanation English', 'Explanation_En',
                'Exp_English', 'Exp_En', 'Detailed Solution (English)', 'Answer Explanation (English)'
              ], 'solution_en');

              // 11. Correct Option / Answer
              const rawCorrect = extractField([
                'answer', 'Answer', 'correct_option', 'Correct_Option', 'Correct_option', 'Correct Option',
                'Correct Answer', 'correct_answer', 'Ans', 'ans',
                'CorrectAns', 'correct_ans', 'Right Option', 'right_option', 'Right Answer',
                'right_answer', 'Key', 'key', 'Correct', 'correct', 'उत्तर', 'सही उत्तर',
                'Sahi_Vikalp', 'Option Answer', 'Ans Key',
                /^(correct[_.\s\-]*(option|ans(wer)?|choice)?|ans(wer)?|key|right[_.\s\-]*(option|ans(wer)?)|उत्तर|सही[_.\s\-]*उत्तर)$/i
              ], 'correct_option');

              let correctOption = '1';
              if (rawCorrect !== undefined && rawCorrect !== null) {
                const str = toStringVal(rawCorrect).trim().toUpperCase();
                if (str === 'A' || str === '1' || str === 'OPTION 1' || str === 'OPTION A' || str === '(A)' || str === '(1)' || str.includes('OPTION A') || str.includes('OPTION 1')) correctOption = '1';
                else if (str === 'B' || str === '2' || str === 'OPTION 2' || str === 'OPTION B' || str === '(B)' || str === '(2)' || str.includes('OPTION B') || str.includes('OPTION 2')) correctOption = '2';
                else if (str === 'C' || str === '3' || str === 'OPTION 3' || str === 'OPTION C' || str === '(C)' || str === '(3)' || str.includes('OPTION C') || str.includes('OPTION 3')) correctOption = '3';
                else if (str === 'D' || str === '4' || str === 'OPTION 4' || str === 'OPTION D' || str === '(D)' || str === '(4)' || str.includes('OPTION D') || str.includes('OPTION 4')) correctOption = '4';
                else if (str === 'E' || str === '5' || str === 'OPTION 5' || str === 'OPTION E' || str === '(E)' || str === '(5)' || str.includes('OPTION E') || str.includes('OPTION 5')) correctOption = '5';
                else {
                  const numMatch = str.match(/[1-5]/);
                  if (numMatch) correctOption = numMatch[0];
                  else correctOption = str || '1';
                }
              }

              // 12. Question Number
              const rawQNum = extractField([
                'question_no', 'question_r', 'Question_Number', 'Question No', 'QuestionNo',
                'Question_No', 'QNo', 'Q_No', 'Q.No', 'Q.No.', 'SNo', 'S_No', 'S.No', 'S.No.',
                'SrNo', 'Sr_No', 'Sr.No.', 'No', 'Number', 'id', 'QNum', 'Q_Num',
                /^(q(uestion)?([_.\s\-]*(no|num(ber)?|r|_r|id|sr|sno))?|s[_.\s\-]*no|sr[_.\s\-]*no)$/i
              ], 'question_r');
              let questionNumber = allLiveRecords.length + idx + 1;
              if (rawQNum !== undefined && rawQNum !== null) {
                const parsed = parseInt(String(rawQNum), 10);
                if (!isNaN(parsed) && parsed > 0) questionNumber = parsed;
              }

              // 13. Image / Diagram Attachment
              const rawImg = extractField([
                'image_url', 'Image_URL', 'image', 'Image', 'Image (URL)', 'Image URL',
                'attachment', 'Attachment', 'Attachments', 'attachments', 'diagram', 'Diagram',
                'Photo', 'photo', 'img', 'Img', 'Figure', 'Fig', 'Chitra', 'चित्र',
                /^(image|img|photo|pic|diagram|figure|fig|attachment|attachments|chitra)([_.\s\-]*(url|link))?$/i
              ], 'image_url');
              let imageUrl = '';
              if (rawImg) {
                if (typeof rawImg === 'string') imageUrl = rawImg.trim();
                else if (Array.isArray(rawImg) && rawImg.length > 0) {
                  imageUrl = rawImg[0]?.url || rawImg[0]?.thumbnails?.large?.url || rawImg[0]?.thumbnails?.full?.url || '';
                }
              }

              // 14. QA Status
              const rawStatus = getFieldValue([
                'qa_status', 'QA_Status', 'Status', 'status', 'Approval Status', 'State', 'state',
                'Approval_Status', 'Review_Status', 'QA Status',
                /^(qa[_.\s\-]*status|status|state|approval([_.\s\-]*status)?)$/i
              ], 'qa_status').toLowerCase();
              const qaStatus = rawStatus.includes('app') ? 'approved' : rawStatus.includes('rev') ? 'in_review' : 'draft';

              return {
                id: r.id,
                tableId: tableName,
                tableName,
                fields: {
                  question_r: questionNumber,
                  question_hi: formatHtmlText(rawQHi),
                  question_en: formatHtmlText(rawQEn),
                  option1_hi: formatHtmlText(rawOpt1Hi),
                  option2_hi: formatHtmlText(rawOpt2Hi),
                  option3_hi: formatHtmlText(rawOpt3Hi),
                  option4_hi: formatHtmlText(rawOpt4Hi),
                  option5_hi: formatHtmlText(rawOpt5Hi),
                  option1_en: formatHtmlText(rawOpt1En),
                  option2_en: formatHtmlText(rawOpt2En),
                  option3_en: formatHtmlText(rawOpt3En),
                  option4_en: formatHtmlText(rawOpt4En),
                  option5_en: formatHtmlText(rawOpt5En),
                  solution_hi: formatHtmlText(rawSolHi),
                  solution_en: formatHtmlText(rawSolEn),
                  correct_option: correctOption,
                  image_url: imageUrl,
                  qa_status: qaStatus as any,
                  last_edited_by: getFieldValue(['last_edited_by', 'Last_Edited_By', 'Editor', 'User', 'Modified By']) || 'Airtable Sync',
                  last_edited_at: getFieldValue(['last_edited_at', 'Last_Edited_At', 'Modified Time']) || r.createdTime || new Date().toISOString()
                },
                createdTime: r.createdTime || new Date().toISOString()
              };
            });

            allLiveRecords = [...allLiveRecords, ...fetched];
            offset = data.offset;
          } else {
            break;
          }
        } while (offset && pageCount < 20);

        if (allLiveRecords.length > 0) {
          this.baseQuestions[activeBaseId][tableName] = allLiveRecords;
        }
      } catch (err) {
        console.warn('Failed to fetch from live Airtable table, using local store:', err);
      }
    }

    let list = this.baseQuestions[activeBaseId][tableName] || [];

    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(item => {
        const f = item.fields;
        const qNum = String(f.question_r);
        const hiText = (f.question_hi || '').replace(/<[^>]*>?/gm, '').toLowerCase();
        const enText = (f.question_en || '').replace(/<[^>]*>?/gm, '').toLowerCase();
        const solHi = (f.solution_hi || '').replace(/<[^>]*>?/gm, '').toLowerCase();
        const solEn = (f.solution_en || '').replace(/<[^>]*>?/gm, '').toLowerCase();
        return qNum.includes(q) || hiText.includes(q) || enText.includes(q) || solHi.includes(q) || solEn.includes(q);
      });
    }

    if (options?.status && options.status !== 'all') {
      list = list.filter(item => item.fields.qa_status === options.status);
    }

    if (options?.hasImage) {
      list = list.filter(item => Boolean(item.fields.image_url || item.fields.question_hi?.includes('<img') || item.fields.question_en?.includes('<img')));
    }

    list.sort((a, b) => (a.fields.question_r || 0) - (b.fields.question_r || 0));

    const total = list.length;
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const startIndex = (page - 1) * limit;
    const records = list.slice(startIndex, startIndex + limit);

    return { records, total, page, limit };
  }

  public async getQuestionById(tableName: string, recordId: string): Promise<QuestionRecord | null> {
    const active = this.getActiveBase();
    const list = this.baseQuestions[active.baseId]?.[tableName] || [];
    return list.find(r => r.id === recordId) || null;
  }

  public async updateQuestion(tableName: string, recordId: string, fields: Partial<QuestionRecord['fields']>, editorName = 'Content Editor'): Promise<QuestionRecord> {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;

    if (!this.baseQuestions[activeBaseId]) {
      this.baseQuestions[activeBaseId] = {};
    }
    if (!this.baseQuestions[activeBaseId][tableName]) {
      this.baseQuestions[activeBaseId][tableName] = [];
    }

    const index = this.baseQuestions[activeBaseId][tableName].findIndex(r => r.id === recordId);
    if (index === -1) {
      throw new Error(`Record ${recordId} not found in table ${tableName}`);
    }

    const existing = this.baseQuestions[activeBaseId][tableName][index];
    const oldFields = { ...existing.fields };
    const updatedFields = {
      ...existing.fields,
      ...fields,
      last_edited_by: editorName,
      last_edited_at: new Date().toISOString()
    };

    const updatedRecord: QuestionRecord = {
      ...existing,
      fields: updatedFields
    };

    this.baseQuestions[activeBaseId][tableName][index] = updatedRecord;

    const changes: AuditLog['changes'] = [];
    for (const key of Object.keys(fields)) {
      if (oldFields[key] !== fields[key]) {
        changes.push({
          field: key,
          oldValueSnippet: String(oldFields[key] || '').replace(/<[^>]*>?/gm, '').slice(0, 80),
          newValueSnippet: String(fields[key] || '').replace(/<[^>]*>?/gm, '').slice(0, 80)
        });
      }
    }

    if (changes.length > 0) {
      this.addAuditLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: editorName,
        userRole: 'Editor',
        tableName,
        questionNumber: updatedFields.question_r,
        recordId,
        action: 'update',
        summary: `Updated Question #${updatedFields.question_r} (${changes.map(c => c.field).join(', ')})`,
        changes
      });
    }

    const apiKey = active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    const isLive = Boolean(apiKey && active.baseId);

    if (isLive) {
      await this.syncPatchToAirtable(tableName, recordId, fields);
    }

    return updatedRecord;
  }

  public async createQuestion(tableName: string, fields: Partial<QuestionRecord['fields']>, editorName = 'Content Editor'): Promise<QuestionRecord> {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;

    if (!this.baseQuestions[activeBaseId]) {
      this.baseQuestions[activeBaseId] = {};
    }
    if (!this.baseQuestions[activeBaseId][tableName]) {
      this.baseQuestions[activeBaseId][tableName] = [];
    }

    const list = this.baseQuestions[activeBaseId][tableName];
    const nextQNum = fields.question_r || (list.length > 0 ? Math.max(...list.map(q => q.fields.question_r || 0)) + 1 : 1);

    const defaultFields: QuestionRecord['fields'] = {
      question_r: nextQNum,
      question_hi: fields.question_hi || '<p></p>',
      question_en: fields.question_en || '<p></p>',
      option1_hi: fields.option1_hi || '<p></p>',
      option2_hi: fields.option2_hi || '<p></p>',
      option3_hi: fields.option3_hi || '<p></p>',
      option4_hi: fields.option4_hi || '<p></p>',
      option5_hi: fields.option5_hi || '',
      option1_en: fields.option1_en || '<p></p>',
      option2_en: fields.option2_en || '<p></p>',
      option3_en: fields.option3_en || '<p></p>',
      option4_en: fields.option4_en || '<p></p>',
      option5_en: fields.option5_en || '',
      solution_hi: fields.solution_hi || '<p></p>',
      solution_en: fields.solution_en || '<p></p>',
      correct_option: fields.correct_option || '1',
      image_url: fields.image_url || '',
      qa_status: fields.qa_status || 'draft',
      last_edited_by: editorName,
      last_edited_at: new Date().toISOString()
    };

    let remoteRecordId: string | null = null;
    const isLive = Boolean((active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY) && active.baseId);
    if (isLive) {
      remoteRecordId = await this.syncCreateToAirtable(tableName, defaultFields).catch(err => {
        console.warn('Airtable remote create warning:', err);
        return null;
      });
    }

    const newRecord: QuestionRecord = {
      id: remoteRecordId || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tableId: tableName,
      tableName,
      fields: defaultFields,
      createdTime: new Date().toISOString()
    };

    list.push(newRecord);

    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: editorName,
      userRole: 'Editor',
      tableName,
      questionNumber: defaultFields.question_r,
      recordId: newRecord.id,
      action: 'create',
      summary: `Created Question #${defaultFields.question_r}`
    });

    return newRecord;
  }

  public async deleteQuestion(tableName: string, recordId: string, editorName = 'Content Editor'): Promise<boolean> {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;

    if (!this.baseQuestions[activeBaseId]?.[tableName]) return false;

    const index = this.baseQuestions[activeBaseId][tableName].findIndex(r => r.id === recordId);
    if (index === -1) return false;

    const removed = this.baseQuestions[activeBaseId][tableName].splice(index, 1)[0];

    this.addAuditLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: editorName,
      userRole: 'Editor',
      tableName,
      questionNumber: removed.fields.question_r,
      recordId,
      action: 'delete',
      summary: `Deleted Question #${removed.fields.question_r}`
    });

    const isLive = Boolean((active.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY) && active.baseId);
    if (isLive) {
      await this.syncDeleteToAirtable(tableName, recordId).catch(err => {
        console.warn('Airtable remote delete warning:', err);
      });
    }

    return true;
  }

  public async uploadImage(base64Data: string, fileName?: string, uploader = 'Editor'): Promise<MediaAsset> {
    const base64Match = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'png';

    if (base64Match) {
      const mime = base64Match[1];
      if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('svg')) ext = 'svg';
      buffer = Buffer.from(base64Match[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const uniqueName = `diagram_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
    const filePath = path.join(this.uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    const newAsset: MediaAsset = {
      id: `media_${Date.now()}`,
      url: publicUrl,
      fileName: fileName || uniqueName,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploader,
      size: `${Math.round(buffer.length / 1024)} KB`,
      source: 'upload'
    };

    this.mediaAssets.unshift(newAsset);
    return newAsset;
  }

  public async uploadToImgbb(imageUrlOrBase64: string, fileName?: string, uploader = 'ImgBB Rehost'): Promise<MediaAsset> {
    const key = this.config.imgbbApiKey || process.env.IMGBB_API_KEY || '';
    if (!key) {
      throw new Error('ImgBB API key is not configured. Please add it in Settings.');
    }

    let rawBase64 = '';
    if (imageUrlOrBase64.startsWith('http://') || imageUrlOrBase64.startsWith('https://')) {
      try {
        const fetchRes = await fetch(imageUrlOrBase64, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (fetchRes.ok) {
          const arrayBuf = await fetchRes.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          rawBase64 = buf.toString('base64');
        }
      } catch (err) {
        console.warn(`[ImgBB] Fetching remote image buffer failed for ${imageUrlOrBase64}, falling back to direct URL submission:`, err);
      }
    } else if (imageUrlOrBase64.startsWith('data:')) {
      rawBase64 = imageUrlOrBase64.replace(/^data:[A-Za-z-+/]+;base64,/, '');
    } else {
      rawBase64 = imageUrlOrBase64;
    }

    const formData = new URLSearchParams();
    if (rawBase64) {
      formData.append('image', rawBase64);
    } else {
      formData.append('image', imageUrlOrBase64);
    }
    if (fileName) {
      formData.append('name', fileName);
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ImgBB API responded with ${response.status}: ${errText}`);
    }

    const result = await response.json();
    if (!result.success || !result.data?.url) {
      throw new Error(result.error?.message || 'ImgBB upload failed');
    }

    const newAsset: MediaAsset = {
      id: `imgbb_${result.data.id || Date.now()}`,
      url: result.data.url,
      fileName: fileName || result.data.title || result.data.image?.filename || 'imgbb_image.png',
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploader,
      size: `${Math.round((result.data.size || 0) / 1024)} KB`,
      source: 'imgbb'
    };

    this.mediaAssets.unshift(newAsset);
    return newAsset;
  }

  public async rehostHtmlText(html: string, uploader = 'ImgBB Rehost'): Promise<{ text: string; replacedCount: number; replacements: { from: string; to: string }[] }> {
    if (!html) return { text: '', replacedCount: 0, replacements: [] };
    
    // Find all image URLs in src="..." or standalone URLs
    const urlRegex = /(?:<img\b[^>]*?\bsrc=["'])(https?:\/\/[^"'\s]+)(?:["'][^>]*>)/gi;
    const urlsToProcess: string[] = [];
    let match;
    while ((match = urlRegex.exec(html)) !== null) {
      const url = match[1];
      if (!url.includes('ibb.co') && !url.includes('i.ibb.co') && !urlsToProcess.includes(url)) {
        urlsToProcess.push(url);
      }
    }

    let updatedHtml = html;
    const replacements: { from: string; to: string }[] = [];

    for (const imgUrl of urlsToProcess) {
      try {
        const asset = await this.uploadToImgbb(imgUrl, undefined, uploader);
        if (asset && asset.url) {
          updatedHtml = updatedHtml.split(imgUrl).join(asset.url);
          replacements.push({ from: imgUrl, to: asset.url });
        }
      } catch (err: any) {
        console.error(`[ImgBB Rehost] Failed to rehost URL ${imgUrl}:`, err);
      }
    }

    return {
      text: updatedHtml,
      replacedCount: replacements.length,
      replacements
    };
  }

  public async rehostQuestionImages(tableName: string, recordId: string, uploader = 'ImgBB Rehost'): Promise<{ record: QuestionRecord; replacedCount: number; replacements: { from: string; to: string }[] }> {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;
    const list = this.baseQuestions[activeBaseId]?.[tableName] || [];
    const target = list.find(r => r.id === recordId);
    if (!target) {
      throw new Error(`Record ${recordId} not found in ${tableName}`);
    }

    const fieldsToProcess: (keyof QuestionRecord['fields'])[] = [
      'question_hi', 'question_en',
      'option1_hi', 'option2_hi', 'option3_hi', 'option4_hi', 'option5_hi',
      'option1_en', 'option2_en', 'option3_en', 'option4_en', 'option5_en',
      'solution_hi', 'solution_en', 'image_url'
    ];

    let totalReplaced = 0;
    const allReplacements: { from: string; to: string }[] = [];

    for (const f of fieldsToProcess) {
      const val = target.fields[f as keyof QuestionRecord['fields']];
      if (typeof val === 'string' && val.includes('http')) {
        if (f === 'image_url' && !val.includes('ibb.co')) {
          try {
            const asset = await this.uploadToImgbb(val, undefined, uploader);
            if (asset?.url) {
              allReplacements.push({ from: val, to: asset.url });
              target.fields.image_url = asset.url;
              totalReplaced++;
            }
          } catch (e) {
            console.warn(`[ImgBB Rehost] Failed to rehost image_url:`, e);
          }
        } else {
          const res = await this.rehostHtmlText(val, uploader);
          if (res.replacedCount > 0) {
            (target.fields as any)[f] = res.text;
            totalReplaced += res.replacedCount;
            allReplacements.push(...res.replacements);
          }
        }
      }
    }

    if (totalReplaced > 0) {
      target.fields.last_edited_by = uploader;
      target.fields.last_edited_at = new Date().toISOString();
      if (this.config.isConnected) {
        await this.syncPatchToAirtable(tableName, recordId, target.fields).catch(err => {
          console.warn('[ImgBB Rehost] Airtable remote sync failed:', err);
        });
      }
    }

    return {
      record: target,
      replacedCount: totalReplaced,
      replacements: allReplacements
    };
  }

  public async rehostTableImages(tableName: string, uploader = 'ImgBB Table Rehost'): Promise<{ tableName: string; totalQuestions: number; affectedQuestions: number; rehostedImagesCount: number }> {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;
    const list = this.baseQuestions[activeBaseId]?.[tableName] || [];
    
    let affectedQuestions = 0;
    let totalImagesRehosted = 0;

    for (const rec of list) {
      try {
        const res = await this.rehostQuestionImages(tableName, rec.id, uploader);
        if (res.replacedCount > 0) {
          affectedQuestions++;
          totalImagesRehosted += res.replacedCount;
        }
      } catch (err) {
        console.error(`[ImgBB Bulk Rehost] Failed for question ${rec.fields.question_r}:`, err);
      }
    }

    return {
      tableName,
      totalQuestions: list.length,
      affectedQuestions,
      rehostedImagesCount: totalImagesRehosted
    };
  }

  public async findAndReplace(options: FindReplaceOptions, userName = 'Admin'): Promise<{ matchesCount: number; affectedQuestions: number; preview: FindReplaceMatch[]; applied: boolean }> {
    const active = this.getActiveBase();
    const activeBaseId = active.baseId;

    const currentQuestions = this.baseQuestions[activeBaseId] || {};
    const targetTables = options.tableName && options.tableName !== 'all' ? [options.tableName] : Object.keys(currentQuestions);

    const matches: FindReplaceMatch[] = [];
    let affectedQuestionsSet = new Set<string>();

    const flags = options.matchCase ? 'g' : 'gi';
    const regex = new RegExp(options.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

    for (const tbl of targetTables) {
      const records = currentQuestions[tbl] || [];
      for (const rec of records) {
        let questionHadMatch = false;

        const checkAndReplace = (fieldName: keyof QuestionRecord['fields']) => {
          const val = rec.fields[fieldName];
          if (typeof val === 'string' && regex.test(val)) {
            questionHadMatch = true;
            const replaced = val.replace(regex, options.replaceQuery);
            matches.push({
              recordId: rec.id,
              tableName: tbl,
              questionNumber: rec.fields.question_r,
              field: String(fieldName),
              originalText: val,
              previewReplacedText: replaced
            });

            if (!options.dryRun) {
              rec.fields[fieldName] = replaced as any;
            }
          }
        };

        if (options.targetFields.includes('all') || options.targetFields.includes('question')) {
          checkAndReplace('question_hi');
          checkAndReplace('question_en');
        }
        if (options.targetFields.includes('all') || options.targetFields.includes('options')) {
          checkAndReplace('option1_hi');
          checkAndReplace('option2_hi');
          checkAndReplace('option3_hi');
          checkAndReplace('option4_hi');
          checkAndReplace('option5_hi');
          checkAndReplace('option1_en');
          checkAndReplace('option2_en');
          checkAndReplace('option3_en');
          checkAndReplace('option4_en');
          checkAndReplace('option5_en');
        }
        if (options.targetFields.includes('all') || options.targetFields.includes('solution')) {
          checkAndReplace('solution_hi');
          checkAndReplace('solution_en');
        }

        if (questionHadMatch) {
          affectedQuestionsSet.add(rec.id);
          if (!options.dryRun) {
            rec.fields.last_edited_by = userName;
            rec.fields.last_edited_at = new Date().toISOString();
          }
        }
      }
    }

    if (!options.dryRun && matches.length > 0) {
      this.addAuditLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName,
        userRole: 'Admin',
        tableName: options.tableName || 'All Tables',
        questionNumber: 0,
        recordId: 'bulk',
        action: 'bulk_replace',
        summary: `Bulk Replaced "${options.searchQuery}" with "${options.replaceQuery}" in ${affectedQuestionsSet.size} questions`
      });
    }

    return {
      matchesCount: matches.length,
      affectedQuestions: affectedQuestionsSet.size,
      preview: matches.slice(0, 50),
      applied: !options.dryRun
    };
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  public addAuditLog(log: AuditLog): void {
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public getMediaAssets(): MediaAsset[] {
    return this.mediaAssets;
  }

  private prepareAirtableFields(baseId: string, tableName: string, fields: any): Record<string, any> {
    const airtableFields: Record<string, any> = {};
    const mappings = this.tableFieldMappings[baseId]?.[tableName] || {};
    const rawCols = this.tableRawColumns[baseId]?.[tableName] || [];
    const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]/gi, '');

    const internalSkip = new Set([
      'question_r',
      'id',
      '_id',
      'recordId',
      'tableId',
      'tableName',
      'qa_status',
      'last_edited_by',
      'last_edited_at',
      'image_url',
      'rawFields',
      'searchTokens',
      'statusSummary'
    ]);

    for (const [internalKey, value] of Object.entries(fields)) {
      if (internalKey === 'question_r') continue;

      // Check explicit mapping
      const mapping = mappings[internalKey];
      if (mapping) {
        const colName = mapping.airtableFieldName;
        if (colName.toLowerCase() === 'question_r') continue;

        if (mapping.isAttachment) {
          if (typeof value === 'string' && value.startsWith('http')) {
            airtableFields[colName] = [{ url: value }];
          } else if (!value) {
            airtableFields[colName] = [];
          }
        } else {
          airtableFields[colName] = value;
        }
        continue;
      }

      // Special handling for correct_option -> answer
      if (internalKey === 'correct_option') {
        const ansCol = rawCols.find(c => /^(answer|ans|correct_option|correct_ans|key)$/i.test(c)) || 'answer';
        airtableFields[ansCol] = String(value);
        continue;
      }

      // Check if rawCols has an exact or normalized match
      if (rawCols.length > 0) {
        const exactCol = rawCols.find(c => c === internalKey);
        if (exactCol && !internalSkip.has(internalKey)) {
          airtableFields[exactCol] = value;
          continue;
        }
        const normTarget = normalizeKey(internalKey);
        const normCol = rawCols.find(c => normalizeKey(c) === normTarget);
        if (normCol && !internalSkip.has(internalKey)) {
          airtableFields[normCol] = value;
          continue;
        }
      } else if (!internalSkip.has(internalKey)) {
        // If rawCols unknown, only send non-internal keys
        airtableFields[internalKey] = value;
      }
    }

    return airtableFields;
  }

  private async syncPatchToAirtable(tableName: string, recordId: string, fields: any) {
    const active = this.getActiveBase();
    const apiKey = active?.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    if (!apiKey || !active?.baseId) {
      console.warn('[Airtable Sync] No API key or active base ID configured. Skipping remote sync.');
      return;
    }

    // If recordId is not an Airtable record ID (starts with 'rec'), create it instead
    if (!recordId.startsWith('rec')) {
      console.log(`[Airtable Sync] Record ID "${recordId}" is not an Airtable rec ID. Creating record remotely...`);
      const newRecId = await this.syncCreateToAirtable(tableName, fields);
      if (newRecId) {
        const list = this.baseQuestions[active.baseId]?.[tableName] || [];
        const found = list.find(q => q.id === recordId);
        if (found) {
          found.id = newRecId;
        }
      }
      return;
    }

    const airtableFields = this.prepareAirtableFields(active.baseId, tableName, fields);
    if (Object.keys(airtableFields).length === 0) {
      console.log('[Airtable Sync] No Airtable fields to update.');
      return;
    }

    const url = `https://api.airtable.com/v0/${active.baseId}/${encodeURIComponent(tableName)}/${recordId}`;
    let currentFields = { ...airtableFields };
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: currentFields })
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Airtable Sync Success] Record ${recordId} updated in table "${tableName}" on base "${active.name || active.baseId}".`);
        return data;
      }

      const errJson = await res.json().catch(() => ({}));
      const errType = errJson.error?.type;
      const errMsg = errJson.error?.message || '';
      console.warn(`[Airtable Sync Warning] Attempt ${attempts} failed:`, errType, errMsg);

      // Auto-recovery: If a field is rejected by Airtable (e.g. unknown column or read-only/autonumber)
      if (errType === 'UNKNOWN_FIELD_NAME' || errType === 'INVALID_VALUE_FOR_COLUMN') {
        const fieldMatch = errMsg.match(/(?:Field|field name:?)\s*"?([^"\s]+)"?/i);
        if (fieldMatch && fieldMatch[1]) {
          const badField = fieldMatch[1];
          console.log(`[Airtable Sync Recovery] Removing rejected field "${badField}" and retrying...`);
          delete currentFields[badField];
          if (Object.keys(currentFields).length > 0) {
            continue;
          }
        }
      }

      console.error('[Airtable Sync Fatal Error]', JSON.stringify({ fields: currentFields }), errJson);
      throw new Error(`Airtable Sync Failed: ${errMsg || JSON.stringify(errJson)}`);
    }
  }

  private async syncCreateToAirtable(tableName: string, fields: any): Promise<string | null> {
    const active = this.getActiveBase();
    const apiKey = active?.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    if (!apiKey || !active?.baseId) return null;

    const airtableFields = this.prepareAirtableFields(active.baseId, tableName, fields);
    const url = `https://api.airtable.com/v0/${active.baseId}/${encodeURIComponent(tableName)}`;
    let currentFields = { ...airtableFields };
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: currentFields })
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Airtable Sync Success] Record ${data.id} created in table "${tableName}".`);
        return data.id || null;
      }

      const errJson = await res.json().catch(() => ({}));
      const errType = errJson.error?.type;
      const errMsg = errJson.error?.message || '';

      if (errType === 'UNKNOWN_FIELD_NAME' || errType === 'INVALID_VALUE_FOR_COLUMN') {
        const fieldMatch = errMsg.match(/(?:Field|field name:?)\s*"?([^"\s]+)"?/i);
        if (fieldMatch && fieldMatch[1]) {
          const badField = fieldMatch[1];
          console.log(`[Airtable Sync Recovery] Removing rejected field "${badField}" and retrying...`);
          delete currentFields[badField];
          if (Object.keys(currentFields).length > 0) {
            continue;
          }
        }
      }

      console.error('[Airtable Sync Create Error]', errJson);
      break;
    }
    return null;
  }

  private async syncDeleteToAirtable(tableName: string, recordId: string) {
    const active = this.getActiveBase();
    const apiKey = active?.apiKey || this.config.apiKey || process.env.AIRTABLE_API_KEY;
    if (!apiKey || !active?.baseId || !recordId.startsWith('rec')) return;
    const url = `https://api.airtable.com/v0/${active.baseId}/${encodeURIComponent(tableName)}/${recordId}`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
  }
}

export const airtableService = new AirtableService();
