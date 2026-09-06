import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Subscript,
  Superscript,
  FileCode,
  Eye,
  Trash2,
  Wand2,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  Check,
  UploadCloud,
  RefreshCw,
  Table as TableIcon,
  X,
  Undo2,
  Redo2,
  PenTool
} from 'lucide-react';
import { api } from '../../services/api';
import { convertLatexToHtml, hasLatexCode, repairCorruptedSubscriptsInUrls, cleanHtmlArtifactTokens } from '../../utils/mathUtils';
import { ImageLightboxModal } from './ImageLightboxModal';
import { ImageStudioModal } from './ImageStudioModal';
import { StudioImageItem } from './studio/studioTypes';

interface WysiwygEditorProps {
  id?: string;
  value: string;
  onChange: (htmlValue: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  badge?: string;
  language?: 'hi' | 'en';
  onImageUploaded?: (url: string) => void;
  editorName?: string;
  setImages?: StudioImageItem[];
}

const QUICK_MATH_SYMBOLS = [
  { label: 'sin θ', title: 'Sine Theta', html: 'sin θ' },
  { label: 'cos θ', title: 'Cosine Theta', html: 'cos θ' },
  { label: 'tan θ', title: 'Tangent Theta', html: 'tan θ' },
  { label: 'θ', title: 'Theta (Angle)' },
  { label: '√2', title: 'Square Root of 2', html: '√2' },
  { label: '√3', title: 'Square Root of 3', html: '√3' },
  { label: '√', title: 'Square Root' },
  { label: '°', title: 'Degree (°)' },
  { label: '30°', title: '30 Degrees', html: '30°' },
  { label: '45°', title: '45 Degrees', html: '45°' },
  { label: '60°', title: '60 Degrees', html: '60°' },
  { label: '90°', title: '90 Degrees', html: '90°' },
  { label: 'Ω', title: 'Ohm (Resistance)' },
  { label: 'π', title: 'Pi' },
  { label: 'α', title: 'Alpha' },
  { label: 'β', title: 'Beta' },
  { label: 'γ', title: 'Gamma' },
  { label: 'λ', title: 'Lambda' },
  { label: 'μ', title: 'Micro / Mu' },
  { label: 'Δ', title: 'Delta' },
  { label: '∑', title: 'Sigma / Sum' },
  { label: '²', title: 'Square (Superscript 2)' },
  { label: '³', title: 'Cube (Superscript 3)' },
  { label: '½', title: 'Half (1/2)', html: '½' },
  { label: '¾', title: 'Three Quarters (3/4)', html: '¾' },
  { label: '¼', title: 'One Quarter (1/4)', html: '¼' },
  { label: '<sup>a</sup>/<sub>b</sub>', title: 'Fraction a/b', html: '<sup>a</sup>/<sub>b</sub>' },
  { label: '±', title: 'Plus-Minus' },
  { label: '×', title: 'Multiplication' },
  { label: '÷', title: 'Division' },
  { label: '≠', title: 'Not Equal' },
  { label: '≤', title: 'Less or Equal' },
  { label: '≥', title: 'Greater or Equal' },
  { label: '→', title: 'Right Arrow' },
  { label: '⇄', title: 'Equilibrium Arrow' },
  { label: 'Ca<sup>2+</sup>', title: 'Calcium Ion (Ca²⁺)', html: 'Ca<sup>2+</sup>' },
  { label: 'F<sup>-</sup>', title: 'Fluoride Ion (F⁻)', html: 'F<sup>-</sup>' },
  { label: 'CaF<sub>2</sub>', title: 'Calcium Fluoride', html: 'CaF<sub>2</sub>' },
  { label: 'H<sub>2</sub>O', title: 'Water Molecule', html: 'H<sub>2</sub>O' },
  { label: 'CO<sub>2</sub>', title: 'Carbon Dioxide', html: 'CO<sub>2</sub>' }
];

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  id,
  value,
  onChange,
  placeholder = 'Type formatted text or paste images (Ctrl+V)...',
  minHeight = '45px',
  label,
  badge,
  language,
  onImageUploaded,
  editorName = 'Content Editor',
  setImages
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [showLiveHtmlPreview, setShowLiveHtmlPreview] = useState(true);
  const showHtmlSource = editorMode === 'html';
  const isVisualMode = editorMode === 'visual';
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSymbolsPalette, setShowSymbolsPalette] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [hoverGrid, setHoverGrid] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  
  // Selected in-editor Image state for resizing & adjustments
  const [selectedImgEl, setSelectedImgEl] = useState<HTMLImageElement | null>(null);
  const [lightboxImgUrl, setLightboxImgUrl] = useState<string | null>(null);
  const [studioImgUrl, setStudioImgUrl] = useState<string | null>(null);
  const isInternalUpdate = useRef(false);

  // Undo / Redo History Stack
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoRedoAction = useRef<boolean>(false);
  const lastInputTimeRef = useRef<number>(0);

  // Push history snapshot
  const pushHistorySnapshot = (newHtml: string, force = false) => {
    if (isUndoRedoAction.current) return;
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentIndex >= 0 && history[currentIndex] === newHtml) return;

    const now = Date.now();
    // Group rapid typing within 400ms into the same frame
    if (!force && currentIndex >= 0 && now - lastInputTimeRef.current < 400) {
      history[currentIndex] = newHtml;
      lastInputTimeRef.current = now;
      return;
    }

    // Branching: truncate any redo steps after current point
    const updated = history.slice(0, currentIndex + 1);
    updated.push(newHtml);
    if (updated.length > 60) updated.shift();
    historyRef.current = updated;
    historyIndexRef.current = updated.length - 1;
    lastInputTimeRef.current = now;
  };

  // Trigger Undo
  const handleUndo = () => {
    if (!isVisualMode) {
      document.execCommand('undo');
      return;
    }

    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const targetHtml = historyRef.current[historyIndexRef.current];
      isUndoRedoAction.current = true;
      isInternalUpdate.current = true;
      if (editorRef.current) {
        editorRef.current.innerHTML = targetHtml;
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch {
          // Ignore selection error
        }
      }
      onChange(targetHtml);
      setTimeout(() => { isUndoRedoAction.current = false; }, 40);
    } else {
      document.execCommand('undo', false);
    }
  };

  // Trigger Redo
  const handleRedo = () => {
    if (!isVisualMode) {
      document.execCommand('redo');
      return;
    }

    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const targetHtml = historyRef.current[historyIndexRef.current];
      isUndoRedoAction.current = true;
      isInternalUpdate.current = true;
      if (editorRef.current) {
        editorRef.current.innerHTML = targetHtml;
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch {
          // Ignore selection error
        }
      }
      onChange(targetHtml);
      setTimeout(() => { isUndoRedoAction.current = false; }, 40);
    } else {
      document.execCommand('redo', false);
    }
  };

  // Keyboard shortcut handler for Ctrl+Z and Ctrl+Y
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ctrl+Z / Cmd+Z (Undo)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleUndo();
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z (Redo)
    if (
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
    ) {
      e.preventDefault();
      e.stopPropagation();
      handleRedo();
      return;
    }
  };

  // Detect if content has raw LaTeX code
  const containsLatex = hasLatexCode(value || '');

  // Sync value from props to contentEditable innerHTML only if not caused by user typing
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      const sanitized = cleanHtmlArtifactTokens(value || '');
      if (editorRef.current.innerHTML !== sanitized) {
        editorRef.current.innerHTML = sanitized;
      }
      if (sanitized !== (value || '')) {
        onChange(sanitized);
      }
      // Seed history stack if empty
      if (historyRef.current.length === 0) {
        historyRef.current = [sanitized || ''];
        historyIndexRef.current = 0;
      }
    }
    isInternalUpdate.current = false;
  }, [value, editorMode]);

  const handleInput = (force = false) => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const html = editorRef.current.innerHTML;
      pushHistorySnapshot(html, force);
      onChange(html);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (!isVisualMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
    if (editorRef.current) {
      pushHistorySnapshot(editorRef.current.innerHTML, true);
    }
  };

  // Convert LaTeX math code to clean HTML formatting & remove code artifacts
  const fixLatexInEditor = () => {
    const rawContent = showHtmlSource ? value : (editorRef.current?.innerHTML || value || '');
    const cleanHtml = cleanHtmlArtifactTokens(convertLatexToHtml(rawContent));
    onChange(cleanHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = cleanHtml;
      pushHistorySnapshot(cleanHtml, true);
    }
  };

  // Insert special symbol or pre-formatted HTML
  const insertSymbol = (sym: { label: string; html?: string }) => {
    editorRef.current?.focus();
    if (sym.html) {
      document.execCommand('insertHTML', false, sym.html);
    } else {
      document.execCommand('insertText', false, sym.label);
    }
    handleInput(true);
    setShowSymbolsPalette(false);
  };

  // Insert table helper
  const insertTable = (rows: number, cols: number, withHeader = true, preset?: 'match' | 'comparison') => {
    editorRef.current?.focus();
    let tableHtml = '';

    if (preset === 'match') {
      tableHtml = `<table class="mcq-table" style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; border: 1px solid #cbd5e1;"><thead><tr style="background-color: #f1f5f9;"><th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: bold; width: 50%;">सूची-I / List I</th><th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: bold; width: 50%;">सूची-II / List II</th></tr></thead><tbody><tr><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">(A) </td><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">1. </td></tr><tr><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">(B) </td><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">2. </td></tr><tr><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">(C) </td><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">3. </td></tr><tr><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">(D) </td><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">4. </td></tr></tbody></table><p><br></p>`;
    } else if (preset === 'comparison') {
      tableHtml = `<table class="mcq-table" style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; border: 1px solid #cbd5e1;"><thead><tr style="background-color: #f1f5f9;"><th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: bold;">स्तंभ A / Column A</th><th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: bold;">स्तंभ B / Column B</th></tr></thead><tbody><tr><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">&nbsp;</td><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">&nbsp;</td></tr><tr><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">&nbsp;</td><td style="border: 1px solid #cbd5e1; padding: 6px 8px;">&nbsp;</td></tr></tbody></table><p><br></p>`;
    } else {
      const r = Math.max(1, Math.min(10, rows));
      const c = Math.max(1, Math.min(6, cols));
      let thead = '';
      if (withHeader) {
        thead = '<thead style="background-color: #f1f5f9;"><tr>' + 
          Array.from({ length: c }, (_, i) => `<th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: bold;">Col ${i + 1}</th>`).join('') +
          '</tr></thead>';
      }
      const tbodyRows = Array.from({ length: r }, () => {
        const tds = Array.from({ length: c }, () => `<td style="border: 1px solid #cbd5e1; padding: 6px 8px;">&nbsp;</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');

      tableHtml = `<table class="mcq-table" style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; border: 1px solid #cbd5e1;">${thead}<tbody>${tbodyRows}</tbody></table><p><br></p>`;
    }

    document.execCommand('insertHTML', false, tableHtml);
    handleInput(true);
    setShowTableMenu(false);
  };

  const addRowToActiveTable = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    let targetTable: HTMLTableElement | null = null;
    if (sel && sel.anchorNode) {
      const el = sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode.parentElement;
      targetTable = el?.closest('table') || null;
    }
    if (!targetTable && editorRef.current) {
      targetTable = editorRef.current.querySelector('table');
    }

    if (targetTable) {
      const cols = targetTable.rows[0]?.cells.length || 2;
      const newRow = targetTable.insertRow();
      for (let i = 0; i < cols; i++) {
        const cell = newRow.insertCell();
        cell.style.border = '1px solid #cbd5e1';
        cell.style.padding = '6px 8px';
        cell.innerHTML = '&nbsp;';
      }
      handleInput(true);
    } else {
      insertTable(2, 2, true);
    }
  };

  const addColToActiveTable = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    let targetTable: HTMLTableElement | null = null;
    if (sel && sel.anchorNode) {
      const el = sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode.parentElement;
      targetTable = el?.closest('table') || null;
    }
    if (!targetTable && editorRef.current) {
      targetTable = editorRef.current.querySelector('table');
    }

    if (targetTable) {
      for (let i = 0; i < targetTable.rows.length; i++) {
        const row = targetTable.rows[i];
        const isHeader = row.parentElement?.tagName.toLowerCase() === 'thead' || row.cells[0]?.tagName.toLowerCase() === 'th';
        const cell = document.createElement(isHeader ? 'th' : 'td');
        cell.style.border = '1px solid #cbd5e1';
        cell.style.padding = '6px 8px';
        cell.style.textAlign = 'left';
        if (isHeader) {
          cell.style.fontWeight = 'bold';
          cell.innerHTML = `Col ${row.cells.length + 1}`;
        } else {
          cell.innerHTML = '&nbsp;';
        }
        row.appendChild(cell);
      }
      handleInput(true);
    }
  };

  const deleteActiveTable = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    let targetTable: HTMLTableElement | null = null;
    if (sel && sel.anchorNode) {
      const el = sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode.parentElement;
      targetTable = el?.closest('table') || null;
    }
    if (!targetTable && editorRef.current) {
      targetTable = editorRef.current.querySelector('table');
    }
    if (targetTable) {
      targetTable.remove();
      handleInput(true);
      setShowTableMenu(false);
    }
  };

  // Image Upload helper
  const uploadAndInsertImage = async (file: File | Blob) => {
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) return;

        const asset = await api.uploadImage(base64, 'diagram_asset.png', editorName);
        if (asset.url) {
          editorRef.current?.focus();
          const imgHtml = `<p style="text-align: center;"><img src="${asset.url}" alt="Diagram" class="rounded border border-gray-200 my-1.5 shadow-2xs transition-all cursor-pointer" style="max-height: 200px; max-width: 100%; object-fit: contain; display: inline-block;" /></p>`;
          document.execCommand('insertHTML', false, imgHtml);
          handleInput(true);

          if (onImageUploaded) {
            onImageUploaded(asset.url);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      alert(`Image upload error: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Paste handler for Ctrl+V image capture & auto LaTeX conversion
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            uploadAndInsertImage(file);
            return;
          }
        }
      }
    }

    // Check if pasted text contains LaTeX code
    const pastedText = e.clipboardData?.getData('text/plain');
    if (pastedText && hasLatexCode(pastedText)) {
      e.preventDefault();
      const converted = cleanHtmlArtifactTokens(convertLatexToHtml(pastedText));
      document.execCommand('insertHTML', false, converted);
      handleInput(true);
    }
  };

  // Drag and drop image handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        uploadAndInsertImage(file);
      }
    }
  };

  const handleManualImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAndInsertImage(e.target.files[0]);
    }
  };

  const clearFormatting = () => {
    executeCommand('removeFormat');
  };

  // Click listener to detect image selection for resizing & adjustment
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setSelectedImgEl(target as HTMLImageElement);
    } else {
      setSelectedImgEl(null);
    }
  };

  // Resize Selected Image
  const applyImageSize = (maxHeight: string, maxWidth: string = '100%') => {
    if (!selectedImgEl) return;
    selectedImgEl.style.maxHeight = maxHeight;
    selectedImgEl.style.maxWidth = maxWidth;
    selectedImgEl.style.height = maxHeight === 'none' ? 'auto' : maxHeight;
    handleInput();
  };

  // Adjust Selected Image Height Step
  const adjustImageHeightStep = (delta: number) => {
    if (!selectedImgEl) return;
    const currentHeight = selectedImgEl.clientHeight || 200;
    const newHeight = Math.max(50, Math.min(800, currentHeight + delta));
    selectedImgEl.style.maxHeight = `${newHeight}px`;
    selectedImgEl.style.height = `${newHeight}px`;
    handleInput();
  };

  // Align Selected Image
  const applyImageAlign = (align: 'left' | 'center' | 'right') => {
    if (!selectedImgEl) return;
    const parent = selectedImgEl.parentElement;
    if (parent && parent.tagName === 'P') {
      parent.style.textAlign = align;
    } else {
      selectedImgEl.style.display = 'block';
      if (align === 'center') {
        selectedImgEl.style.marginLeft = 'auto';
        selectedImgEl.style.marginRight = 'auto';
      } else if (align === 'left') {
        selectedImgEl.style.marginLeft = '0';
        selectedImgEl.style.marginRight = 'auto';
      } else if (align === 'right') {
        selectedImgEl.style.marginLeft = 'auto';
        selectedImgEl.style.marginRight = '0';
      }
    }
    handleInput();
  };

  // Rehost single selected image to ImgBB
  const [isRehosting, setIsRehosting] = useState(false);
  const handleRehostSelectedImage = async () => {
    if (!selectedImgEl || !selectedImgEl.src) return;
    setIsRehosting(true);
    try {
      const res = await api.rehostImageUrl(selectedImgEl.src, undefined, 'Editor');
      if (res.imgbbUrl) {
        selectedImgEl.src = res.imgbbUrl;
        selectedImgEl.setAttribute('referrerpolicy', 'no-referrer');
        handleInput();
      }
    } catch (err: any) {
      console.error('Failed to rehost selected image', err);
      alert(`Rehost failed: ${err.message}`);
    } finally {
      setIsRehosting(false);
    }
  };

  // Rehost all external images in the current editor content
  const handleRehostAllImages = async () => {
    if (!value) return;
    setIsRehosting(true);
    try {
      const res = await api.rehostHtmlText(value, 'Editor');
      if (res.replacedCount > 0) {
        onChange(res.text);
        if (editorRef.current) {
          editorRef.current.innerHTML = res.text;
        }
      }
    } catch (err: any) {
      console.error('Failed to rehost images in editor', err);
      alert(`Rehost failed: ${err.message}`);
    } finally {
      setIsRehosting(false);
    }
  };

  // Check if content has external images needing ImgBB CDN hosting
  const hasExternalImages = Boolean(
    value &&
    /<img\b[^>]*?\bsrc=["'](https?:\/\/(?!i\.ibb\.co|ibb\.co)[^"'\s]+)["']/i.test(value)
  );

  // Delete Selected Image
  const deleteSelectedImage = () => {
    if (!selectedImgEl) return;
    const parent = selectedImgEl.parentElement;
    if (parent && parent.tagName === 'P' && parent.children.length === 1) {
      parent.remove();
    } else {
      selectedImgEl.remove();
    }
    setSelectedImgEl(null);
    handleInput();
  };

  return (
    <div id={id} className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-2xs hover:border-gray-300 transition-colors relative">
      {/* Label and Language Header with Segmented Mode Switcher */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border-b border-gray-100 text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {badge && (
            <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] uppercase tracking-wider ${
              language === 'hi' 
                ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                : 'bg-blue-100 text-blue-900 border border-blue-200'
            }`}>
              {badge}
            </span>
          )}
          {label && <span className="font-medium text-gray-700">{label}</span>}

          {/* LaTeX Auto-Fix Badge */}
          {containsLatex && (
            <button
              type="button"
              onClick={fixLatexInEditor}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 border border-purple-300 px-1.5 py-0.2 rounded transition-colors shadow-2xs cursor-pointer"
              title="LaTeX Code Detected! Click to convert \(CaF_2\) to clean CaF₂ and Ca²⁺"
            >
              <Wand2 className="w-2.5 h-2.5 text-purple-600 animate-pulse" />
              <span>Fix LaTeX Code</span>
            </button>
          )}

          {/* ImgBB Rehost Badge */}
          {hasExternalImages && (
            <button
              type="button"
              onClick={handleRehostAllImages}
              disabled={isRehosting}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.2 rounded transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="External image detected (e.g. Google Storage). Click to convert & upload to ImgBB CDN"
            >
              <UploadCloud className={`w-2.5 h-2.5 text-amber-700 ${isRehosting ? 'animate-bounce' : ''}`} />
              <span>{isRehosting ? 'Uploading to ImgBB...' : 'Rehost to ImgBB'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isUploadingImage && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              Uploading...
            </span>
          )}

          {/* Segmented Mode Switcher: Visual | HTML | Preview */}
          <div className="flex items-center bg-gray-200/90 p-0.5 rounded border border-gray-300 shadow-2xs">
            <button
              type="button"
              id={`${id || 'editor'}-mode-visual`}
              onClick={() => setEditorMode('visual')}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded transition-all cursor-pointer ${
                editorMode === 'visual'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Visual WYSIWYG Editor (फॉर्मेटेड एडिटर)"
            >
              <PenTool className="w-2.5 h-2.5" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              id={`${id || 'editor'}-mode-html`}
              onClick={() => setEditorMode('html')}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded transition-all cursor-pointer ${
                editorMode === 'html'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="HTML Source Code Editor & Live Preview (रॉ HTML)"
            >
              <FileCode className="w-2.5 h-2.5" />
              <span>HTML</span>
            </button>
            <button
              type="button"
              id={`${id || 'editor'}-mode-preview`}
              onClick={() => setEditorMode('preview')}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded transition-all cursor-pointer ${
                editorMode === 'preview'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Rendered Preview (लाइव पूर्वावलोकन)"
            >
              <Eye className="w-2.5 h-2.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formatting Toolbar */}
      {isVisualMode && (
        <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-0.5 bg-gray-50/70 border-b border-gray-200/70 text-gray-700">
          <button
            type="button"
            id={`${id || 'editor'}-btn-undo`}
            onClick={handleUndo}
            className="p-1 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            id={`${id || 'editor'}-btn-redo`}
            onClick={handleRedo}
            className="p-1 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3 h-3" />
          </button>
          <div className="h-3 w-[1px] bg-gray-300 mx-0.5" />

          <button
            type="button"
            id={`${id || 'editor'}-btn-bold`}
            onClick={() => executeCommand('bold')}
            className="p-1 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            type="button"
            id={`${id || 'editor'}-btn-italic`}
            onClick={() => executeCommand('italic')}
            className="p-1 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3 h-3" />
          </button>
          <button
            type="button"
            id={`${id || 'editor'}-btn-underline`}
            onClick={() => executeCommand('underline')}
            className="p-1 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3 h-3" />
          </button>

          <div className="h-3 w-[1px] bg-gray-300 mx-0.5" />

          <button
            type="button"
            id={`${id || 'editor'}-btn-sub`}
            onClick={() => executeCommand('subscript')}
            className="p-1 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            title="Subscript (e.g. H₂O, CaF₂)"
          >
            <Subscript className="w-3 h-3" />
          </button>
          <button
            type="button"
            id={`${id || 'editor'}-btn-sup`}
            onClick={() => executeCommand('superscript')}
            className="p-1 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            title="Superscript (e.g. 10², Ca²⁺, F⁻)"
          >
            <Superscript className="w-3 h-3" />
          </button>

          <div className="h-3 w-[1px] bg-gray-300 mx-0.5" />

          {/* Fix Math Button */}
          <button
            type="button"
            id={`${id || 'editor'}-btn-fix-latex`}
            onClick={fixLatexInEditor}
            className={`flex items-center gap-0.5 px-1 py-0.5 text-[10px] rounded font-medium transition-colors ${
              containsLatex
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300'
                : 'hover:bg-gray-200 text-gray-700 hover:text-gray-900'
            }`}
            title="Fix Math/LaTeX Code: Auto converts sin θ, √2, 45°, CaF₂ to clean formatting"
          >
            <Wand2 className="w-2.5 h-2.5 text-purple-600" />
            <span>Fix Code</span>
          </button>

          {/* Quick Symbols & Math Palette Trigger */}
          <button
            type="button"
            id={`${id || 'editor'}-btn-symbols`}
            onClick={() => setShowSymbolsPalette(!showSymbolsPalette)}
            className={`flex items-center gap-0.5 px-1 py-0.5 text-[10px] rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors ${
              showSymbolsPalette ? 'bg-amber-100 text-amber-900 font-bold' : ''
            }`}
            title="Insert Math Symbols, Angles & Formulas (sin θ, √2, 45°, Ω, π)"
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            <span className="font-mono text-[9px]">Ω/π</span>
          </button>

          <div className="h-3 w-[1px] bg-gray-300 mx-0.5" />

          <button
            type="button"
            id={`${id || 'editor'}-btn-ul`}
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            title="Bullet List"
          >
            <List className="w-3 h-3" />
          </button>
          <button
            type="button"
            id={`${id || 'editor'}-btn-ol`}
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-3 h-3" />
          </button>

          <div className="h-3 w-[1px] bg-gray-300 mx-0.5" />

          {/* Image Upload button */}
          <label
            htmlFor={`${id || 'editor'}-file-input`}
            className="flex items-center gap-0.5 px-1 py-0.5 text-[10px] rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
            title="Upload/Paste Image or Diagram (Ctrl+V works directly!)"
          >
            <ImageIcon className="w-3 h-3 text-blue-600" />
            <span className="font-medium hidden sm:inline">Img</span>
            <input
              id={`${id || 'editor'}-file-input`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleManualImageSelect}
            />
          </label>

          <div className="h-3 w-[1px] bg-gray-300 mx-0.5" />

          {/* Table Insert button */}
          <button
            type="button"
            id={`${id || 'editor'}-btn-table`}
            onClick={() => {
              setShowTableMenu(!showTableMenu);
              setShowSymbolsPalette(false);
            }}
            className={`flex items-center gap-0.5 px-1 py-0.5 text-[10px] rounded transition-colors ${
              showTableMenu
                ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                : 'hover:bg-gray-200 text-gray-700 hover:text-gray-900'
            }`}
            title="Insert Table: List I/II Match, Comparison, or Custom Grid"
          >
            <TableIcon className="w-3 h-3 text-emerald-600" />
            <span className="font-medium hidden sm:inline">Table</span>
          </button>

          <button
            type="button"
            id={`${id || 'editor'}-btn-clear`}
            onClick={clearFormatting}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-600 transition-colors ml-auto"
            title="Clear Formatting"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Image Adjustment Toolbar (Shown when an image is clicked inside editor) */}
      {selectedImgEl && (
        <div className="bg-slate-900 text-white px-2.5 py-1.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-1.5 text-xs shadow-md animate-in fade-in duration-150">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Image Size:
            </span>
            <button
              type="button"
              onClick={() => applyImageSize('120px')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 rounded text-[10px] transition-colors"
              title="Small (120px)"
            >
              S (120px)
            </button>
            <button
              type="button"
              onClick={() => applyImageSize('200px')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 rounded text-[10px] transition-colors font-medium"
              title="Medium (200px)"
            >
              M (200px)
            </button>
            <button
              type="button"
              onClick={() => applyImageSize('320px')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 rounded text-[10px] transition-colors"
              title="Large (320px)"
            >
              L (320px)
            </button>
            <button
              type="button"
              onClick={() => applyImageSize('none', '100%')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 rounded text-[10px] transition-colors"
              title="Full Width"
            >
              Full
            </button>

            {/* Height Fine Tuning Buttons */}
            <div className="flex items-center gap-0.5 bg-slate-800 rounded px-1 py-0.5 ml-1">
              <button
                type="button"
                onClick={() => adjustImageHeightStep(-25)}
                className="p-0.5 text-slate-300 hover:text-white rounded"
                title="Decrease Height (-25px)"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-300 px-1">
                {selectedImgEl.clientHeight || 200}px
              </span>
              <button
                type="button"
                onClick={() => adjustImageHeightStep(25)}
                className="p-0.5 text-slate-300 hover:text-white rounded"
                title="Increase Height (+25px)"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Alignment, Lightbox & Delete */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyImageAlign('left')}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              title="Align Left"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => applyImageAlign('center')}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              title="Align Center"
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => applyImageAlign('right')}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              title="Align Right"
            >
              <AlignRight className="w-3 h-3" />
            </button>

            <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />

            {/* ImgBB CDN Status Badge or Rehost Button */}
            {selectedImgEl.src && selectedImgEl.src.includes('ibb.co') ? (
              <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 font-bold rounded text-[10px] flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>ImgBB Hosted</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRehostSelectedImage}
                disabled={isRehosting}
                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded text-[10px] flex items-center gap-1 transition-colors disabled:opacity-50"
                title="Upload this image to ImgBB CDN and replace URL"
              >
                <UploadCloud className={`w-3 h-3 ${isRehosting ? 'animate-bounce' : ''}`} />
                <span>{isRehosting ? 'Rehosting...' : 'Rehost to ImgBB'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setStudioImgUrl(selectedImgEl.src)}
              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[10px] flex items-center gap-1 transition-colors"
              title="Open Pro Image Studio: Freely Resize, Remove Background, Erase Watermarks, Draw & Paint"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>🎨 Studio Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setLightboxImgUrl(selectedImgEl.src)}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              title="Inspect Full Image"
            >
              <Maximize2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={deleteSelectedImage}
              className="p-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded ml-1"
              title="Remove Image"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedImgEl(null)}
              className="px-1.5 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] flex items-center gap-0.5 ml-1"
              title="Done Adjusting"
            >
              <Check className="w-2.5 h-2.5" /> Done
            </button>
          </div>
        </div>
      )}

      {/* Quick Symbols Floating Drawer / Palette */}
      {showSymbolsPalette && (
        <div className="bg-slate-800 text-white p-2 border-b border-slate-700 shadow-md">
          <div className="flex items-center justify-between pb-1 border-b border-slate-700 mb-1.5">
            <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Click to Insert Formula / Symbol:
            </span>
            <button
              type="button"
              onClick={() => setShowSymbolsPalette(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_MATH_SYMBOLS.map((sym, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => insertSymbol(sym)}
                className="px-2 py-0.5 bg-slate-700 hover:bg-indigo-600 text-slate-100 rounded text-xs font-mono transition-colors"
                title={sym.title}
                dangerouslySetInnerHTML={{ __html: sym.label }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Table Palette & Grid Creator */}
      {showTableMenu && (
        <div id={`${id || 'editor'}-table-palette`} className="bg-slate-900 text-white p-3 border-b border-slate-700 shadow-xl space-y-3 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Insert MCQ Table / Option Grid (तालिका जोड़ें)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowTableMenu(false)}
              className="text-slate-400 hover:text-white p-0.5 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section 1: Popular Exam Presets */}
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              ⚡ Exam Question & Option Presets (1-Click Insert)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                id={`${id || 'editor'}-btn-preset-match`}
                onClick={() => insertTable(4, 2, true, 'match')}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-emerald-300 flex items-center gap-1">
                  <span>📋 Match Lists</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  सूची-I (A-D) vs सूची-II (1-4)
                </p>
              </button>

              <button
                type="button"
                id={`${id || 'editor'}-btn-preset-compare`}
                onClick={() => insertTable(2, 2, true, 'comparison')}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-emerald-300 flex items-center gap-1">
                  <span>⚖️ 2-Col Compare</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  स्तंभ A vs स्तंभ B
                </p>
              </button>

              <button
                type="button"
                id={`${id || 'editor'}-btn-preset-2x2`}
                onClick={() => insertTable(2, 2, true)}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-emerald-300 flex items-center gap-1">
                  <span>🔢 2 × 2 Matrix</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Compact 4-cell matrix
                </p>
              </button>

              <button
                type="button"
                id={`${id || 'editor'}-btn-preset-3x3`}
                onClick={() => insertTable(3, 3, true)}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-emerald-300 flex items-center gap-1">
                  <span>📊 3 × 3 Data</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  3 Columns × 3 Rows
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Interactive Grid & Quick Row/Col Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            {/* Visual Interactive Grid (1x1 to 4x4) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Quick Grid:</span>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-800/80 rounded border border-slate-700">
                {[1, 2, 3, 4].map(r => (
                  <div key={r} className="flex gap-1">
                    {[1, 2, 3, 4].map(c => {
                      const isHovered = hoverGrid.r >= r && hoverGrid.c >= c;
                      return (
                        <div
                          key={c}
                          onMouseEnter={() => setHoverGrid({ r, c })}
                          onMouseLeave={() => setHoverGrid({ r: 0, c: 0 })}
                          onClick={() => insertTable(r, c, true)}
                          className={`w-3.5 h-3.5 rounded-2xs border cursor-pointer transition-colors ${
                            isHovered
                              ? 'bg-emerald-500 border-emerald-400'
                              : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                          }`}
                          title={`${r} Rows × ${c} Columns`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold min-w-[50px]">
                {hoverGrid.r > 0 ? `${hoverGrid.r}×${hoverGrid.c}` : 'Select'}
              </span>
            </div>

            {/* Row/Col Action Buttons for Active Table */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                id={`${id || 'editor'}-btn-add-row`}
                onClick={addRowToActiveTable}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[10px] font-medium border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Add a new row at the bottom of the table"
              >
                <Plus className="w-2.5 h-2.5 text-emerald-400" />
                <span>+ Row</span>
              </button>
              <button
                type="button"
                id={`${id || 'editor'}-btn-add-col`}
                onClick={addColToActiveTable}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[10px] font-medium border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Add a new column to the right of the table"
              >
                <Plus className="w-2.5 h-2.5 text-emerald-400" />
                <span>+ Column</span>
              </button>
              <button
                type="button"
                id={`${id || 'editor'}-btn-del-table`}
                onClick={deleteActiveTable}
                className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white rounded text-[10px] font-medium border border-rose-800/50 flex items-center gap-1 cursor-pointer transition-colors"
                title="Delete the table from editor"
              >
                <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                <span>Delete Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Body */}
      {editorMode === 'html' ? (
        <div className="bg-slate-900 text-slate-200">
          {/* Top Bar inside HTML mode */}
          <div className="flex items-center justify-between px-2.5 py-1 bg-slate-950 text-slate-400 text-[10px] font-mono border-b border-slate-800">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <FileCode className="w-3 h-3" />
              Raw HTML Source (Airtable Format)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500 hidden sm:inline">&lt;p&gt;, &lt;table&gt;, &lt;sub&gt;, &lt;sup&gt;, &lt;strong&gt;, &lt;img&gt;</span>
              <button
                type="button"
                id={`${id || 'editor'}-toggle-live-preview`}
                onClick={() => setShowLiveHtmlPreview(!showLiveHtmlPreview)}
                className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer ${
                  showLiveHtmlPreview
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Toggle Live Rendered Preview Pane"
              >
                <Eye className="w-2.5 h-2.5" />
                <span>{showLiveHtmlPreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
              </button>
            </div>
          </div>

          <textarea
            id={`${id || 'editor'}-html-textarea`}
            value={value || ''}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val);
              pushHistorySnapshot(val, false);
            }}
            className="w-full bg-slate-900 text-emerald-300 font-mono text-xs p-2.5 focus:outline-none resize-y border-b border-slate-800 selection:bg-indigo-900"
            style={{ minHeight }}
            placeholder="<p>Enter HTML tags or paste formatted table code...</p>"
          />

          {/* Live Rendered Preview Below HTML Editor */}
          {showLiveHtmlPreview && (
            <div className="p-3 bg-white text-slate-900 border-t-2 border-indigo-500">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-indigo-700 font-bold uppercase tracking-wider">
                  <Eye className="w-3 h-3 text-indigo-600" />
                  Live Preview (लाइव पूर्वावलोकन)
                </span>
                <span className="text-[10px] text-slate-400">Updates in real time from HTML</span>
              </div>
              <div
                className="text-xs text-gray-900 leading-normal font-sans rich-preview"
                dangerouslySetInnerHTML={{
                  __html: cleanHtmlArtifactTokens(value || '') || '<span class="text-slate-400 italic">No HTML content yet...</span>'
                }}
              />
            </div>
          )}
        </div>
      ) : editorMode === 'preview' ? (
        /* Full Dedicated Preview Mode */
        <div className="p-3 bg-slate-50/70 text-slate-900" style={{ minHeight }}>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200/80 text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase tracking-wider bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
              <Eye className="w-3 h-3 text-emerald-600" />
              Rendered Preview (छात्र/परीक्षा पूर्वावलोकन)
            </span>
            <span className="text-[10px] text-slate-500">
              Click <strong className="text-indigo-600 cursor-pointer" onClick={() => setEditorMode('visual')}>Visual</strong> or <strong className="text-indigo-600 cursor-pointer" onClick={() => setEditorMode('html')}>HTML</strong> to edit
            </span>
          </div>
          <div
            className="text-xs text-gray-900 leading-normal font-sans rich-preview p-2.5 bg-white rounded border border-slate-200/80 shadow-2xs"
            dangerouslySetInnerHTML={{
              __html: cleanHtmlArtifactTokens(value || '') || '<span class="text-slate-400 italic">Empty content. Switch to Visual or HTML to write.</span>'
            }}
          />
        </div>
      ) : (
        /* Visual WYSIWYG ContentEditable */
        <div
          ref={editorRef}
          id={`${id || 'editor'}-content`}
          contentEditable
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onClick={handleEditorClick}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="p-2 text-xs text-gray-900 focus:outline-none focus:ring-0 leading-normal font-sans empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
      )}

      {/* Lightbox Modal for In-Editor Images */}
      {lightboxImgUrl && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxImgUrl)}
          onClose={() => setLightboxImgUrl(null)}
          imageUrl={lightboxImgUrl}
          title="Question Image / Diagram Details"
        />
      )}

      {/* Pro Image Studio Modal for In-Editor Images */}
      {studioImgUrl && (
        <ImageStudioModal
          isOpen={Boolean(studioImgUrl)}
          onClose={() => setStudioImgUrl(null)}
          imageUrl={studioImgUrl}
          images={setImages}
          initialIndex={
            setImages && studioImgUrl
              ? Math.max(0, setImages.findIndex((img) => img.url === studioImgUrl))
              : 0
          }
          title="Question Rich Text Image Studio"
          editorName={editorName}
          onSave={(newUrl) => {
            if (selectedImgEl) {
              selectedImgEl.src = newUrl;
              selectedImgEl.setAttribute('src', newUrl);
            }
            if (editorRef.current) {
              isInternalUpdate.current = true;
              onChange(editorRef.current.innerHTML);
            }
            setStudioImgUrl(null);
          }}
        />
      )}
    </div>
  );
};
