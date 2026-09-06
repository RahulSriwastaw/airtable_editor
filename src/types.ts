export interface AirtableBaseItem {
  id: string;
  baseId: string;
  name: string;
  description?: string;
  category?: string;
  apiKey?: string;
  color?: string;
  isDefault?: boolean;
  isActive?: boolean;
  tableCount?: number;
  lastConnectedAt?: string;
  status?: 'connected' | 'error' | 'untested';
}

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  activeBaseId: string;
  activeBaseName: string;
  bases: AirtableBaseItem[];
  imgbbApiKey?: string;
  isCustomConfigured: boolean;
  isConnected: boolean;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'editor' | 'reviewer' | 'admin';
  avatar?: string;
}

export interface QuestionFields {
  question_r: number;
  question_hi: string;
  question_en: string;
  option1_hi: string;
  option2_hi: string;
  option3_hi: string;
  option4_hi: string;
  option5_hi?: string;
  option1_en: string;
  option2_en: string;
  option3_en: string;
  option4_en: string;
  option5_en?: string;
  solution_hi: string;
  solution_en: string;
  correct_option: string; // '1' | '2' | '3' | '4' | '5'
  image_url?: string;
  qa_status?: 'draft' | 'in_review' | 'approved';
  last_edited_by?: string;
  last_edited_at?: string;
  [key: string]: any;
}

export interface QuestionRecord {
  id: string;
  tableId: string;
  tableName: string;
  fields: QuestionFields;
  createdTime?: string;
}

export interface TableMeta {
  id: string;
  name: string;
  description?: string;
  category?: 'Bihar Police' | 'Bihar SI' | 'BPSC' | 'SSC/Railway' | 'Other';
  recordCount: number;
  lastModified: string;
  statusSummary: {
    draft: number;
    inReview: number;
    approved: number;
  };
  hasImagesCount: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  tableName: string;
  questionNumber: number;
  recordId: string;
  action: 'create' | 'update' | 'delete' | 'bulk_replace' | 'import';
  summary: string;
  changes?: {
    field: string;
    oldValueSnippet: string;
    newValueSnippet: string;
  }[];
}

export interface MediaAsset {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  size?: string;
  dimensions?: string;
  source?: 'paste' | 'upload' | 'imgbb';
}

export interface FindReplaceOptions {
  tableName?: string; // 'all' or specific tableName
  searchQuery: string;
  replaceQuery: string;
  targetFields: ('question' | 'options' | 'solution' | 'all')[];
  matchCase: boolean;
  dryRun?: boolean;
}

export interface FindReplaceMatch {
  recordId: string;
  tableName: string;
  questionNumber: number;
  field: string;
  originalText: string;
  previewReplacedText: string;
}
