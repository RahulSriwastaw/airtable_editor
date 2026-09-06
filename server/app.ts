import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { airtableService } from './airtableService';

export function createExpressApp() {
  const app = express();

  // JSON Body parser with 50MB limit for image paste/uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static uploads
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    app.use('/uploads', express.static(uploadsDir));
  }

  // ===================== API ROUTER =====================
  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Airtable Configuration & Status
  apiRouter.get('/config', (req, res) => {
    const config = airtableService.getConfig();
    // Mask API key for security
    const maskedKey = config.apiKey ? `${config.apiKey.substring(0, 5)}...${config.apiKey.slice(-4)}` : '';
    res.json({
      ...config,
      apiKey: maskedKey,
      hasRawKey: Boolean(config.apiKey)
    });
  });

  apiRouter.post('/config', async (req, res) => {
    try {
      const { apiKey, baseId, imgbbApiKey } = req.body;
      const updated = airtableService.updateConfig({
        apiKey: apiKey || '',
        baseId: baseId || '',
        imgbbApiKey: imgbbApiKey || ''
      });
      const testResult = await airtableService.testConnection();
      res.json({ config: updated, testResult });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/config/test', async (req, res) => {
    try {
      const result = await airtableService.testConnection();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Multi-Base Endpoints
  apiRouter.get('/bases', (req, res) => {
    try {
      const bases = airtableService.getBases();
      res.json({ bases });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/bases', async (req, res) => {
    try {
      const newBase = await airtableService.addBase(req.body);
      const bases = airtableService.getBases();
      res.status(201).json({ base: newBase, bases });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  apiRouter.patch('/bases/:baseId', async (req, res) => {
    try {
      const { baseId } = req.params;
      const updated = await airtableService.updateBase(baseId, req.body);
      const bases = airtableService.getBases();
      res.json({ base: updated, bases });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  apiRouter.delete('/bases/:baseId', async (req, res) => {
    try {
      const { baseId } = req.params;
      const result = await airtableService.deleteBase(baseId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  apiRouter.post('/bases/:baseId/activate', async (req, res) => {
    try {
      const { baseId } = req.params;
      const config = await airtableService.setActiveBase(baseId);
      res.json({ success: true, config, activeBaseId: config.activeBaseId, activeBaseName: config.activeBaseName });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  apiRouter.post('/bases/:baseId/test', async (req, res) => {
    try {
      const { baseId } = req.params;
      const { apiKey } = req.body;
      const result = await airtableService.testBaseConnection(baseId, apiKey);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Auto-Fetch Base Name & Metadata from Airtable API
  apiRouter.post('/bases/fetch-meta', async (req, res) => {
    try {
      const { baseId, apiKey } = req.body;
      const result = await airtableService.fetchBaseMeta(baseId, apiKey);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Discover All Bases in User's Airtable Account via PAT
  apiRouter.post('/bases/discover', async (req, res) => {
    try {
      const { apiKey } = req.body;
      const result = await airtableService.discoverAccountBases(apiKey);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Tables List & Create
  apiRouter.get('/tables', async (req, res) => {
    try {
      const tables = await airtableService.getTables();
      res.json({ tables });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/tables', async (req, res) => {
    try {
      const { name, description, category } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Table name is required.' });
      }
      const table = await airtableService.createTable(name, description, category);
      res.status(201).json({ table });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Records / Questions CRUD
  apiRouter.get('/tables/:tableName/raw-debug', async (req, res) => {
    try {
      const { tableName } = req.params;
      const active = airtableService.getActiveBase();
      if (!active) return res.status(400).json({ error: 'No active base' });
      const apiKey = active.apiKey || airtableService.getConfig().apiKey || process.env.AIRTABLE_API_KEY;
      const url = `https://api.airtable.com/v0/${active.baseId}/${encodeURIComponent(tableName)}?maxRecords=3`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await response.json();
      res.json({
        tableName,
        baseId: active.baseId,
        status: response.status,
        records: data.records || [],
        error: data.error
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get('/tables/:tableName/records', async (req, res) => {
    try {
      const { tableName } = req.params;
      const { search, status, hasImage, page, limit } = req.query;
      const result = await airtableService.getQuestions(tableName, {
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        hasImage: hasImage === 'true',
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 100
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get('/tables/:tableName/records/:recordId', async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      const record = await airtableService.getQuestionById(tableName, recordId);
      if (!record) {
        return res.status(404).json({ error: 'Question record not found' });
      }
      res.json({ record });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post('/tables/:tableName/records', async (req, res) => {
    try {
      const { tableName } = req.params;
      const { fields, editorName } = req.body;
      const record = await airtableService.createQuestion(tableName, fields || {}, editorName || 'Content Editor');
      res.status(201).json({ record });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.patch('/tables/:tableName/records/:recordId', async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      const { fields, editorName } = req.body;
      if (!fields) {
        return res.status(400).json({ error: 'Fields payload is required' });
      }
      const updated = await airtableService.updateQuestion(tableName, recordId, fields, editorName || 'Content Editor');
      res.json({ record: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete('/tables/:tableName/records/:recordId', async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      const { editorName } = req.body;
      const deleted = await airtableService.deleteQuestion(tableName, recordId, editorName || 'Content Editor');
      if (!deleted) {
        return res.status(404).json({ error: 'Question record not found' });
      }
      res.json({ success: true, recordId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Image Upload Proxy (Base64 clipboard paste / file upload)
  apiRouter.post('/upload-image', async (req, res) => {
    try {
      const { imageBase64, fileName, uploader } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 data is required' });
      }

      // Try ImgBB upload
      try {
        const media = await airtableService.uploadToImgbb(imageBase64, fileName, uploader || 'Editor');
        return res.json({ media });
      } catch (imgbbErr) {
        console.warn('ImgBB upload failed, falling back to local storage:', imgbbErr);
      }

      // Local storage fallback / default
      const media = await airtableService.uploadImage(imageBase64, fileName, uploader || 'Editor');
      res.json({ media });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Rehost a single external image URL to ImgBB
  apiRouter.post('/images/rehost-url', async (req, res) => {
    try {
      const { url, name, uploader } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Image URL is required' });
      }
      const asset = await airtableService.uploadToImgbb(url, name, uploader || 'ImgBB Rehost');
      res.json({ success: true, originalUrl: url, imgbbUrl: asset.url, asset });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Rehost all external images found in an HTML text string
  apiRouter.post('/images/rehost-text', async (req, res) => {
    try {
      const { htmlText, uploader } = req.body;
      if (!htmlText) {
        return res.json({ text: '', replacedCount: 0, replacements: [] });
      }
      const result = await airtableService.rehostHtmlText(htmlText, uploader || 'ImgBB Rehost');
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Rehost all external images for a specific question record and sync to Airtable
  apiRouter.post('/images/rehost-question', async (req, res) => {
    try {
      const { tableName, recordId, uploader } = req.body;
      if (!tableName || !recordId) {
        return res.status(400).json({ error: 'tableName and recordId are required' });
      }
      const result = await airtableService.rehostQuestionImages(tableName, recordId, uploader || 'ImgBB Rehost');
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Rehost all external images in an entire table/mock test set
  apiRouter.post('/images/rehost-table', async (req, res) => {
    try {
      const { tableName, uploader } = req.body;
      if (!tableName) {
        return res.status(400).json({ error: 'tableName is required' });
      }
      const result = await airtableService.rehostTableImages(tableName, uploader || 'ImgBB Bulk Rehost');
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Media Library
  apiRouter.get('/media', (req, res) => {
    const assets = airtableService.getMediaAssets();
    res.json({ assets });
  });

  // Bulk Find & Replace
  apiRouter.post('/bulk/find-replace', async (req, res) => {
    try {
      const { tableName, searchQuery, replaceQuery, targetFields, matchCase, dryRun, userName } = req.body;
      if (!searchQuery) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      const result = await airtableService.findAndReplace({
        tableName: tableName || 'all',
        searchQuery,
        replaceQuery: replaceQuery || '',
        targetFields: targetFields || ['all'],
        matchCase: Boolean(matchCase),
        dryRun: dryRun !== false
      }, userName || 'Admin');

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Audit Logs
  apiRouter.get('/audit-logs', (req, res) => {
    const logs = airtableService.getAuditLogs(100);
    res.json({ logs });
  });

  // Mount router to both '/api' prefix and root router so requests with or without '/api' prefix work seamlessly
  app.use('/api', apiRouter);
  app.use(apiRouter);

  return app;
}

export const app = createExpressApp();
export default app;
