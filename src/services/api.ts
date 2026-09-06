import { TableMeta, QuestionRecord, AuditLog, MediaAsset, AirtableConfig, AirtableBaseItem, FindReplaceOptions, FindReplaceMatch } from '../types';

export const api = {
  // Config & Connection
  async getConfig(): Promise<AirtableConfig & { hasRawKey: boolean }> {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Failed to load configuration');
    return res.json();
  },

  async updateConfig(config: { apiKey: string; baseId: string; imgbbApiKey?: string }): Promise<{ config: AirtableConfig; testResult: { success: boolean; message: string; tableCount?: number } }> {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update config');
    return res.json();
  },

  async testConnection(): Promise<{ success: boolean; message: string; tableCount?: number }> {
    const res = await fetch('/api/config/test', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to test connection');
    return res.json();
  },

  // Multi-Base Endpoints
  async getBases(): Promise<AirtableBaseItem[]> {
    const res = await fetch('/api/bases');
    if (!res.ok) throw new Error('Failed to fetch bases');
    const data = await res.json();
    return data.bases || [];
  },

  async addBase(baseData: Partial<AirtableBaseItem>): Promise<{ base: AirtableBaseItem; bases: AirtableBaseItem[] }> {
    const res = await fetch('/api/bases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to connect base');
    }
    return res.json();
  },

  async updateBase(baseId: string, updates: Partial<AirtableBaseItem>): Promise<{ base: AirtableBaseItem; bases: AirtableBaseItem[] }> {
    const res = await fetch(`/api/bases/${encodeURIComponent(baseId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update base');
    }
    return res.json();
  },

  async deleteBase(baseId: string): Promise<{ remainingBases: AirtableBaseItem[]; activeBaseId: string }> {
    const res = await fetch(`/api/bases/${encodeURIComponent(baseId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete base');
    }
    return res.json();
  },

  async switchActiveBase(baseId: string, name?: string, apiKey?: string): Promise<{ success: boolean; config: AirtableConfig; activeBaseId: string; activeBaseName: string }> {
    const res = await fetch(`/api/bases/${encodeURIComponent(baseId)}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, apiKey })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to switch active base');
    }
    return res.json();
  },

  async testBaseConnection(baseId: string, apiKey?: string): Promise<{ success: boolean; message: string; tableCount?: number }> {
    const res = await fetch(`/api/bases/${encodeURIComponent(baseId)}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    if (!res.ok) throw new Error('Failed to test base connection');
    return res.json();
  },

  async fetchBaseMeta(baseId: string, apiKey?: string): Promise<{ success: boolean; baseId: string; name?: string; tableCount?: number; tables?: string[]; message?: string }> {
    const res = await fetch('/api/bases/fetch-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseId, apiKey })
    });
    return res.json();
  },

  async discoverBases(apiKey?: string): Promise<{ success: boolean; bases?: Array<{ id: string; baseId: string; name: string; permissionLevel?: string; isConnected: boolean }>; message?: string }> {
    const res = await fetch('/api/bases/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    return res.json();
  },

  // Tables
  async getTables(): Promise<TableMeta[]> {
    const res = await fetch('/api/tables');
    if (!res.ok) throw new Error('Failed to fetch tables');
    const data = await res.json();
    return data.tables || [];
  },

  async createTable(name: string, description?: string, category?: string): Promise<TableMeta> {
    const res = await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, category })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create table');
    }
    const data = await res.json();
    return data.table;
  },

  // Questions / Records
  async getQuestions(tableName: string, options?: { search?: string; status?: string; hasImage?: boolean; page?: number; limit?: number }): Promise<{ records: QuestionRecord[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.status) params.append('status', options.status);
    if (options?.hasImage) params.append('hasImage', 'true');
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));

    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/records?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch questions for ${tableName}`);
    return res.json();
  },

  async getQuestionById(tableName: string, recordId: string): Promise<QuestionRecord> {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/records/${encodeURIComponent(recordId)}`);
    if (!res.ok) throw new Error('Failed to fetch question record');
    const data = await res.json();
    return data.record;
  },

  async updateQuestion(tableName: string, recordId: string, fields: Partial<QuestionRecord['fields']>, editorName = 'Content Editor'): Promise<QuestionRecord> {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/records/${encodeURIComponent(recordId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, editorName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update question in Airtable');
    }
    const data = await res.json();
    return data.record;
  },

  async createQuestion(tableName: string, fields: Partial<QuestionRecord['fields']>, editorName = 'Content Editor'): Promise<QuestionRecord> {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, editorName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create question in Airtable');
    }
    const data = await res.json();
    return data.record;
  },

  async deleteQuestion(tableName: string, recordId: string, editorName = 'Content Editor'): Promise<boolean> {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/records/${encodeURIComponent(recordId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editorName })
    });
    if (!res.ok) throw new Error('Failed to delete question');
    return true;
  },

  // Image Upload Proxy
  async uploadImage(imageBase64: string, fileName?: string, uploader = 'Editor'): Promise<MediaAsset> {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, fileName, uploader })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload image');
    }
    const data = await res.json();
    return data.media;
  },

  // ImgBB Rehost Endpoints
  async rehostImageUrl(url: string, name?: string, uploader = 'Editor'): Promise<{ success: boolean; originalUrl: string; imgbbUrl: string; asset: MediaAsset }> {
    const res = await fetch('/api/images/rehost-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name, uploader })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to rehost image to ImgBB');
    }
    return res.json();
  },

  async rehostHtmlText(htmlText: string, uploader = 'Editor'): Promise<{ text: string; replacedCount: number; replacements: { from: string; to: string }[] }> {
    const res = await fetch('/api/images/rehost-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ htmlText, uploader })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to rehost images in text');
    }
    return res.json();
  },

  async rehostQuestionImages(tableName: string, recordId: string, uploader = 'Editor'): Promise<{ success: boolean; record: QuestionRecord; replacedCount: number; replacements: { from: string; to: string }[] }> {
    const res = await fetch('/api/images/rehost-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName, recordId, uploader })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to rehost question images to ImgBB');
    }
    return res.json();
  },

  async rehostTableImages(tableName: string, uploader = 'Editor'): Promise<{ success: boolean; tableName: string; totalQuestions: number; affectedQuestions: number; rehostedImagesCount: number }> {
    const res = await fetch('/api/images/rehost-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName, uploader })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to bulk rehost table images to ImgBB');
    }
    return res.json();
  },

  // Media Assets
  async getMediaAssets(): Promise<MediaAsset[]> {
    const res = await fetch('/api/media');
    if (!res.ok) throw new Error('Failed to fetch media assets');
    const data = await res.json();
    return data.assets || [];
  },

  // Find & Replace
  async findAndReplace(options: FindReplaceOptions, userName = 'Admin'): Promise<{ matchesCount: number; affectedQuestions: number; preview: FindReplaceMatch[]; applied: boolean }> {
    const res = await fetch('/api/bulk/find-replace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...options, userName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run Find & Replace');
    }
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const data = await res.json();
    return data.logs || [];
  }
};
