import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Crop,
  Sliders,
  Sparkles,
  Eraser,
  Brush,
  Highlighter,
  Type,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Copy,
  Check,
  UploadCloud,
  Lock,
  Unlock,
  Pipette,
  Layers,
  Wand2,
  Eye,
  EyeOff,
  Move,
  FileCheck,
  RefreshCw,
  Stamp,
  Grab,
  ChevronLeft,
  ChevronRight,
  Palette,
  Scan,
  ArrowRightLeft,
  ChevronsRight,
  Images,
  Grid
} from 'lucide-react';
import { api } from '../../services/api';
import {
  ImageStudioTab,
  StudioImageItem,
  CropBox,
  TextAnnotation,
  CustomInvertConfig,
  MultiColorInvertPreset
} from './studio/studioTypes';
import {
  MULTI_COLOR_INVERT_PRESETS,
  applyMultiColorInvertToImageData,
  hexToRgb,
  rgbToHex
} from './studio/colorInvertUtils';

export interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  images?: StudioImageItem[];
  initialIndex?: number;
  onSave?: (newImageUrl: string, itemIndex?: number, item?: StudioImageItem) => void | Promise<void>;
  title?: string;
  editorName?: string;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  imageUrl = '',
  images = [],
  initialIndex = 0,
  onSave,
  title = 'Pro Image Studio & Editor',
  editorName = 'Editor'
}) => {
  // -------------------------------------------------------------
  // Image List & Set Navigation
  // -------------------------------------------------------------
  const normalizedImages: StudioImageItem[] = useMemo(() => {
    if (images && images.length > 0) return images;
    if (imageUrl) return [{ url: imageUrl, title: title || 'Image' }];
    return [];
  }, [images, imageUrl, title]);

  const [activeImageIndex, setActiveImageIndex] = useState<number>(initialIndex);
  const [showImageListDropdown, setShowImageListDropdown] = useState<boolean>(false);

  // Sync initialIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      const validIndex = Math.max(0, Math.min(initialIndex, normalizedImages.length - 1));
      setActiveImageIndex(validIndex);
    }
  }, [isOpen, initialIndex, normalizedImages.length]);

  const currentItem: StudioImageItem | undefined = normalizedImages[activeImageIndex] || normalizedImages[0];
  const activeUrl = currentItem?.url || imageUrl;

  // Main canvas & original image references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<ImageStudioTab>('resize');

  // Image Dimensions & Aspect Lock
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [aspectRatioValue, setAspectRatioValue] = useState<number>(1);
  const [scalePercent, setScalePercent] = useState<number>(100);

  // Canvas Viewport (Zoom & Pan) - Supports up to 500% / 800%
  const [zoom, setZoom] = useState<number>(1);
  const [manualZoomInput, setManualZoomInput] = useState<string>('100');
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHandTool, setIsHandTool] = useState<boolean>(false);

  // History Stack for Undo / Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Loading, Saving & Toast
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // -------------------------------------------------------------
  // Tool States
  // -------------------------------------------------------------
  // TAB: Tone & Adjust
  const [brightness, setBrightness] = useState<number>(0); // -100 to 100
  const [contrast, setContrast] = useState<number>(0); // -100 to 100
  const [exposure, setExposure] = useState<number>(0); // -50 to 50
  const [saturation, setSaturation] = useState<number>(100); // 0 to 200%
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(0); // 0 (off) to 255 (Binarize)

  // TAB: Multi-Color Inverter
  const [invertConfig, setInvertConfig] = useState<CustomInvertConfig>({
    preset: 'none',
    bgColor: '#0b1d3a',
    fgColor: '#38bdf8',
    contrast: 20,
    threshold: 0,
    invertMode: 'light_to_dark',
    intensity: 100
  });

  // TAB: Crop & Transform
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [cropAspectRatio, setCropAspectRatio] = useState<'free' | '1:1' | '4:3' | '16:9' | '3:2'>('free');

  // TAB: Background Remover
  const [bgTolerance, setBgTolerance] = useState<number>(30);
  const [bgFeather, setBgFeather] = useState<number>(1);
  const [bgPickColor, setBgPickColor] = useState<string>('#ffffff');
  const [isPickingBgColor, setIsPickingBgColor] = useState<boolean>(false);
  const [removeMode, setRemoveMode] = useState<'white' | 'picked'>('white');

  // TAB: Watermark & Object Eraser
  const [watermarkTool, setWatermarkTool] = useState<'inpaint' | 'clone'>('inpaint');
  const [watermarkBrushSize, setWatermarkBrushSize] = useState<number>(18);
  const [cloneSourcePoint, setCloneSourcePoint] = useState<{ x: number; y: number } | null>(null);
  const [isSettingCloneSource, setIsSettingCloneSource] = useState<boolean>(false);

  // TAB: Draw & Shapes
  const [drawTool, setDrawTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [brushColor, setBrushColor] = useState<string>('#ef4444');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [brushOpacity, setBrushOpacity] = useState<number>(100);

  const [activeShape, setActiveShape] = useState<'arrow' | 'line' | 'rect' | 'circle'>('arrow');
  const [shapeFilled, setShapeFilled] = useState<boolean>(false);
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState<number>(3);
  const [shapeColor, setShapeColor] = useState<string>('#3b82f6');

  // TAB: Text Annotation
  const [newTextString, setNewTextString] = useState<string>('Fig 1.');
  const [textColor, setTextColor] = useState<string>('#1e293b');
  const [textBgColor, setTextBgColor] = useState<string>('#ffffff');
  const [textHasBg, setTextHasBg] = useState<boolean>(true);
  const [textFontSize, setTextFontSize] = useState<number>(16);
  const [textIsBold, setTextIsBold] = useState<boolean>(true);

  // Mouse / Drawing tracking
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startDrawPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const tempCanvasDataRef = useRef<ImageData | null>(null);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Sync zoom state to manual input
  useEffect(() => {
    setManualZoomInput(String(Math.round(zoom * 100)));
  }, [zoom]);

  // -------------------------------------------------------------
  // History Stack Push & Undo / Redo
  // -------------------------------------------------------------
  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      if (sliced.length >= 25) sliced.shift();
      return [...sliced, currentData];
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 24));
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const targetData = history[newIndex];
      const canvas = canvasRef.current;
      if (!canvas || !targetData) return;

      canvas.width = targetData.width;
      canvas.height = targetData.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.putImageData(targetData, 0, 0);

      setTargetWidth(targetData.width);
      setTargetHeight(targetData.height);
      setOriginalWidth(targetData.width);
      setOriginalHeight(targetData.height);
      setHistoryIndex(newIndex);
      showToast('Undo action');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const targetData = history[newIndex];
      const canvas = canvasRef.current;
      if (!canvas || !targetData) return;

      canvas.width = targetData.width;
      canvas.height = targetData.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.putImageData(targetData, 0, 0);

      setTargetWidth(targetData.width);
      setTargetHeight(targetData.height);
      setOriginalWidth(targetData.width);
      setOriginalHeight(targetData.height);
      setHistoryIndex(newIndex);
      showToast('Redo action');
    }
  };

  // -------------------------------------------------------------
  // FIT TO CANVAS & ZOOM CONTROLS
  // -------------------------------------------------------------
  const fitToCanvas = useCallback(() => {
    if (!containerRef.current || !originalWidth || !originalHeight) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const padding = 64;
    const containerW = containerRef.current.clientWidth - padding;
    const containerH = containerRef.current.clientHeight - padding;
    const scaleX = containerW / originalWidth;
    const scaleY = containerH / originalHeight;
    const fitScale = Math.max(0.1, Math.min(scaleX, scaleY, 5.0));

    setZoom(fitScale);
    setPan({ x: 0, y: 0 });
    showToast(`Fitted to canvas (${Math.round(fitScale * 100)}%)`);
  }, [originalWidth, originalHeight]);

  const handleManualZoomChange = (valStr: string) => {
    setManualZoomInput(valStr);
    const num = parseInt(valStr, 10);
    if (!isNaN(num) && num >= 10 && num <= 800) {
      setZoom(num / 100);
    }
  };

  const handleManualZoomBlur = () => {
    const num = parseInt(manualZoomInput, 10);
    if (isNaN(num) || num < 10) {
      setZoom(0.1);
      setManualZoomInput('10');
    } else if (num > 800) {
      setZoom(8.0);
      setManualZoomInput('800');
    } else {
      setZoom(num / 100);
    }
  };

  // Wheel zoom on canvas container
  const handleContainerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.max(0.1, Math.min(8.0, Number((prev + zoomDelta).toFixed(2)))));
  };

  // -------------------------------------------------------------
  // Load Active Image onto Canvas
  // -------------------------------------------------------------
  const loadImage = useCallback((urlToLoad: string) => {
    if (!urlToLoad) return;
    setIsLoading(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      originalImageRef.current = img;
      const w = img.naturalWidth || img.width || 600;
      const h = img.naturalHeight || img.height || 400;

      setOriginalWidth(w);
      setOriginalHeight(h);
      setTargetWidth(w);
      setTargetHeight(h);
      setAspectRatioValue(w / h);
      setScalePercent(100);

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const initialData = ctx.getImageData(0, 0, w, h);
          setHistory([initialData]);
          setHistoryIndex(0);
        }
      }

      setCropBox({ x: 0, y: 0, width: w, height: h });
      setIsLoading(false);

      // Auto fit canvas on load
      setTimeout(() => {
        if (containerRef.current) {
          const padding = 64;
          const containerW = containerRef.current.clientWidth - padding;
          const containerH = containerRef.current.clientHeight - padding;
          const scaleX = containerW / w;
          const scaleY = containerH / h;
          const fitScale = Math.max(0.1, Math.min(scaleX, scaleY, 1.0));
          setZoom(fitScale);
          setPan({ x: 0, y: 0 });
        }
      }, 50);
    };

    img.onerror = () => {
      setIsLoading(false);
      showToast('Failed to load image URL into studio.');
    };

    img.src = urlToLoad;
  }, []);

  // Reload when activeUrl or isOpen changes
  useEffect(() => {
    if (isOpen && activeUrl) {
      loadImage(activeUrl);
    }
  }, [isOpen, activeImageIndex, activeUrl, loadImage]);

  // Handle Set Navigation
  const handleNavigateImage = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= normalizedImages.length) return;
    setActiveImageIndex(newIndex);
    setShowImageListDropdown(false);
    
    // Reset temporary tool adjustments
    setBrightness(0);
    setContrast(0);
    setExposure(0);
    setSaturation(100);
    setGrayscale(false);
    setThreshold(0);
    setCropBox(null);
    setInvertConfig({
      preset: 'none',
      bgColor: '#0b1d3a',
      fgColor: '#38bdf8',
      contrast: 20,
      threshold: 0,
      invertMode: 'light_to_dark',
      intensity: 100
    });

    const targetItem = normalizedImages[newIndex];
    if (targetItem?.url) {
      loadImage(targetItem.url);
    }
    showToast(`Switched to Image ${newIndex + 1} of ${normalizedImages.length}: ${targetItem?.title || `Q#${targetItem?.questionNumber || newIndex + 1}`}`);
  }, [normalizedImages, loadImage]);

  // -------------------------------------------------------------
  // RESIZE & DIMENSIONS
  // -------------------------------------------------------------
  const handleWidthChange = (w: number) => {
    const clampedW = Math.max(10, w);
    setTargetWidth(clampedW);
    if (lockAspectRatio && aspectRatioValue > 0) {
      setTargetHeight(Math.round(clampedW / aspectRatioValue));
    }
  };

  const handleHeightChange = (h: number) => {
    const clampedH = Math.max(10, h);
    setTargetHeight(clampedH);
    if (lockAspectRatio && aspectRatioValue > 0) {
      setTargetWidth(Math.round(clampedH * aspectRatioValue));
    }
  };

  const handleScalePercentChange = (pct: number) => {
    setScalePercent(pct);
    const newW = Math.round((originalWidth * pct) / 100);
    const newH = Math.round((originalHeight * pct) / 100);
    setTargetWidth(newW);
    setTargetHeight(newH);
  };

  const applyResize = () => {
    const canvas = canvasRef.current;
    if (!canvas || targetWidth <= 0 || targetHeight <= 0) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;
    offCtx.drawImage(canvas, 0, 0);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreen, 0, 0, targetWidth, targetHeight);

    setOriginalWidth(targetWidth);
    setOriginalHeight(targetHeight);
    setAspectRatioValue(targetWidth / targetHeight);
    setCropBox({ x: 0, y: 0, width: targetWidth, height: targetHeight });

    pushHistory();
    showToast(`Resized to ${targetWidth} × ${targetHeight} px`);
  };

  // -------------------------------------------------------------
  // CROP & ROTATE
  // -------------------------------------------------------------
  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cropBox) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { x, y, width, height } = cropBox;
    if (width <= 5 || height <= 5) return;

    const croppedData = ctx.getImageData(x, y, width, height);
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(croppedData, 0, 0);

    setTargetWidth(width);
    setTargetHeight(height);
    setOriginalWidth(width);
    setOriginalHeight(height);
    setAspectRatioValue(width / height);
    setCropBox({ x: 0, y: 0, width, height });

    pushHistory();
    showToast(`Cropped to ${width} × ${height} px`);
  };

  const handleRotateCanvas = (degrees: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;
    offCtx.drawImage(canvas, 0, 0);

    const rad = (degrees * Math.PI) / 180;
    const is90 = Math.abs(degrees) === 90 || Math.abs(degrees) === 270;
    const newW = is90 ? canvas.height : canvas.width;
    const newH = is90 ? canvas.width : canvas.height;

    canvas.width = newW;
    canvas.height = newH;
    ctx.save();
    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(rad);
    ctx.drawImage(offscreen, -offscreen.width / 2, -offscreen.height / 2);
    ctx.restore();

    setTargetWidth(newW);
    setTargetHeight(newH);
    setOriginalWidth(newW);
    setOriginalHeight(newH);
    setCropBox({ x: 0, y: 0, width: newW, height: newH });

    pushHistory();
    showToast(`Rotated ${degrees}°`);
  };

  const handleFlipCanvas = (dir: 'horizontal' | 'vertical') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;
    offCtx.drawImage(canvas, 0, 0);

    ctx.save();
    if (dir === 'horizontal') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();

    pushHistory();
    showToast(`Flipped ${dir}`);
  };

  // -------------------------------------------------------------
  // COLOR ADJUSTMENTS & MULTI-COLOR INVERSION
  // -------------------------------------------------------------
  const applyToneAndInvertFilters = useCallback((customCfg?: CustomInvertConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const baseImgData = history[historyIndex] || ctx.getImageData(0, 0, canvas.width, canvas.height);
    const imgData = ctx.createImageData(baseImgData);
    const data = imgData.data;
    const src = baseImgData.data;

    // 1. Apply Brightness, Contrast, Exposure, Grayscale
    const bVal = brightness * 2.55;
    const cVal = (contrast + 100) / 100;
    const expVal = Math.pow(2, exposure / 50);
    const satVal = saturation / 100;

    for (let i = 0; i < src.length; i += 4) {
      let r = src[i];
      let g = src[i + 1];
      let b = src[i + 2];
      const a = src[i + 3];

      if (a === 0) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
        continue;
      }

      r = r * expVal + bVal;
      g = g * expVal + bVal;
      b = b * expVal + bVal;

      r = ((r / 255 - 0.5) * cVal + 0.5) * 255;
      g = ((g / 255 - 0.5) * cVal + 0.5) * 255;
      b = ((b / 255 - 0.5) * cVal + 0.5) * 255;

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      if (grayscale) {
        r = gray;
        g = gray;
        b = gray;
      } else if (satVal !== 1) {
        r = gray + (r - gray) * satVal;
        g = gray + (g - gray) * satVal;
        b = gray + (b - gray) * satVal;
      }

      if (threshold > 0) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const val = lum >= threshold ? 255 : 0;
        r = val;
        g = val;
        b = val;
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = a;
    }

    // 2. Apply Multi-Color Inversion & Remapping if enabled
    const cfg = customCfg || invertConfig;
    if (cfg.preset !== 'none') {
      const intermediate = new Uint8ClampedArray(data);
      applyMultiColorInvertToImageData(intermediate, data, cfg);
    }

    ctx.putImageData(imgData, 0, 0);
  }, [history, historyIndex, brightness, contrast, exposure, saturation, grayscale, threshold, invertConfig]);

  const commitToneAdjustments = () => {
    applyToneAndInvertFilters();
    pushHistory();
    showToast('Applied color tone adjustments');
  };

  const handleSelectInvertPreset = (preset: MultiColorInvertPreset) => {
    const found = MULTI_COLOR_INVERT_PRESETS.find((p) => p.id === preset);
    if (!found) return;

    const newCfg: CustomInvertConfig = {
      ...invertConfig,
      preset,
      bgColor: found.bgHex,
      fgColor: found.fgHex
    };
    setInvertConfig(newCfg);
    applyToneAndInvertFilters(newCfg);
    pushHistory();
    showToast(`Applied ${found.name}`);
  };

  // -------------------------------------------------------------
  // BACKGROUND REMOVER
  // -------------------------------------------------------------
  const removeBackground = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const targetColor = removeMode === 'white' ? { r: 255, g: 255, b: 255 } : hexToRgb(bgPickColor);
    const tolDistance = (bgTolerance / 100) * 441;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue;

      const dr = r - targetColor.r;
      const dg = g - targetColor.g;
      const db = b - targetColor.b;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist <= tolDistance) {
        if (bgFeather > 1 && dist > tolDistance - bgFeather * 4) {
          const alphaFactor = (dist - (tolDistance - bgFeather * 4)) / (bgFeather * 4);
          data[i + 3] = Math.round(a * (1 - alphaFactor));
        } else {
          data[i + 3] = 0;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    pushHistory();
    showToast('Background removed & transparency created');
  };

  const restoreSolidWhiteBg = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;
    offCtx.drawImage(canvas, 0, 0);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreen, 0, 0);

    pushHistory();
    showToast('Restored solid white background');
  };

  // -------------------------------------------------------------
  // WATERMARK INPAINTING & CLONING
  // -------------------------------------------------------------
  const inpaintArea = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
    const startX = Math.max(0, Math.floor(cx - radius));
    const startY = Math.max(0, Math.floor(cy - radius));
    const endX = Math.min(ctx.canvas.width - 1, Math.ceil(cx + radius));
    const endY = Math.min(ctx.canvas.height - 1, Math.ceil(cy + radius));
    const w = endX - startX + 1;
    const h = endY - startY + 1;

    const imgData = ctx.getImageData(startX, startY, w, h);
    const data = imgData.data;

    let borderR = 0, borderG = 0, borderB = 0, borderCount = 0;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const realX = startX + px;
        const realY = startY + py;
        const dist = Math.sqrt((realX - cx) ** 2 + (realY - cy) ** 2);
        const idx = (py * w + px) * 4;

        if (dist >= radius * 0.85 && dist <= radius * 1.2) {
          borderR += data[idx];
          borderG += data[idx + 1];
          borderB += data[idx + 2];
          borderCount++;
        }
      }
    }

    if (borderCount === 0) return;
    const avgR = borderR / borderCount;
    const avgG = borderG / borderCount;
    const avgB = borderB / borderCount;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const realX = startX + px;
        const realY = startY + py;
        const dist = Math.sqrt((realX - cx) ** 2 + (realY - cy) ** 2);
        const idx = (py * w + px) * 4;

        if (dist <= radius) {
          const factor = Math.cos((dist / radius) * (Math.PI / 2));
          data[idx] = Math.round(data[idx] * (1 - factor) + avgR * factor);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - factor) + avgG * factor);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - factor) + avgB * factor);
        }
      }
    }

    ctx.putImageData(imgData, startX, startY);
  };

  // -------------------------------------------------------------
  // CANVAS MOUSE EVENTS (DRAW, SHAPES, WATERMARK)
  // -------------------------------------------------------------
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isHandTool) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (isPickingBgColor) {
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
      setBgPickColor(hex);
      setIsPickingBgColor(false);
      showToast(`Selected color: ${hex}`);
      return;
    }

    if (activeTab === 'watermark' && isSettingCloneSource) {
      setCloneSourcePoint({ x, y });
      setIsSettingCloneSource(false);
      showToast(`Clone stamp source set at (${Math.round(x)}, ${Math.round(y)})`);
      return;
    }

    isDrawingRef.current = true;
    lastPosRef.current = { x, y };
    startDrawPosRef.current = { x, y };
    tempCanvasDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (activeTab === 'watermark') {
      if (watermarkTool === 'inpaint') {
        inpaintArea(ctx, x, y, watermarkBrushSize);
      } else if (watermarkTool === 'clone' && cloneSourcePoint) {
        ctx.save();
        ctx.drawImage(
          canvas,
          cloneSourcePoint.x - watermarkBrushSize,
          cloneSourcePoint.y - watermarkBrushSize,
          watermarkBrushSize * 2,
          watermarkBrushSize * 2,
          x - watermarkBrushSize,
          y - watermarkBrushSize,
          watermarkBrushSize * 2,
          watermarkBrushSize * 2
        );
        ctx.restore();
      }
    } else if (activeTab === 'draw') {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      if (drawTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else if (drawTool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = brushColor;
      } else {
        ctx.globalAlpha = brushOpacity / 100;
        ctx.strokeStyle = brushColor;
      }
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.1, y + 0.1);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (activeTab === 'watermark') {
      if (watermarkTool === 'inpaint') {
        inpaintArea(ctx, x, y, watermarkBrushSize);
      } else if (watermarkTool === 'clone' && cloneSourcePoint) {
        const dx = x - startDrawPosRef.current.x;
        const dy = y - startDrawPosRef.current.y;
        ctx.save();
        ctx.drawImage(
          canvas,
          cloneSourcePoint.x + dx - watermarkBrushSize,
          cloneSourcePoint.y + dy - watermarkBrushSize,
          watermarkBrushSize * 2,
          watermarkBrushSize * 2,
          x - watermarkBrushSize,
          y - watermarkBrushSize,
          watermarkBrushSize * 2,
          watermarkBrushSize * 2
        );
        ctx.restore();
      }
      lastPosRef.current = { x, y };
    } else if (activeTab === 'draw') {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      if (drawTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else if (drawTool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = brushColor;
      } else {
        ctx.globalAlpha = brushOpacity / 100;
        ctx.strokeStyle = brushColor;
      }
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
      lastPosRef.current = { x, y };
    } else if (activeTab === 'shapes' && tempCanvasDataRef.current) {
      ctx.putImageData(tempCanvasDataRef.current, 0, 0);
      ctx.save();
      ctx.strokeStyle = shapeColor;
      ctx.fillStyle = shapeColor;
      ctx.lineWidth = shapeStrokeWidth;

      const sx = startDrawPosRef.current.x;
      const sy = startDrawPosRef.current.y;

      if (activeShape === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeShape === 'arrow') {
        const headLen = 14;
        const angle = Math.atan2(y - sy, x - sx);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - headLen * Math.cos(angle - Math.PI / 6), y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x - headLen * Math.cos(angle + Math.PI / 6), y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (activeShape === 'rect') {
        ctx.beginPath();
        ctx.rect(sx, sy, x - sx, y - sy);
        if (shapeFilled) ctx.fill();
        else ctx.stroke();
      } else if (activeShape === 'circle') {
        const rx = Math.abs(x - sx) / 2;
        const ry = Math.abs(y - sy) / 2;
        const cx = Math.min(sx, x) + rx;
        const cy = Math.min(sy, y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        if (shapeFilled) ctx.fill();
        else ctx.stroke();
      }
      ctx.restore();
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    tempCanvasDataRef.current = null;
    pushHistory();
  };

  // -------------------------------------------------------------
  // TEXT ANNOTATION
  // -------------------------------------------------------------
  const addTextAnnotation = () => {
    const canvas = canvasRef.current;
    if (!canvas || !newTextString.trim()) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const posX = canvas.width / 2 - 40;
    const posY = canvas.height / 2;

    ctx.save();
    ctx.font = `${textIsBold ? 'bold ' : ''}${textFontSize}px sans-serif`;
    ctx.textBaseline = 'top';

    const metrics = ctx.measureText(newTextString);
    const textW = metrics.width;
    const textH = textFontSize * 1.3;

    if (textHasBg) {
      ctx.fillStyle = textBgColor;
      ctx.beginPath();
      ctx.roundRect(posX - 4, posY - 2, textW + 8, textH + 4, 4);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = textColor;
    ctx.fillText(newTextString, posX, posY);
    ctx.restore();

    pushHistory();
    showToast(`Added text label "${newTextString}"`);
  };

  // -------------------------------------------------------------
  // SAVE & APPLY TO QUESTION (CURRENT & SAVE + NEXT)
  // -------------------------------------------------------------
  const handleSaveAndApply = async (andNext = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const media = await api.uploadImage(dataUrl, `edited_diagram_${Date.now()}.png`, editorName);
      const finalUrl = media.url || dataUrl;

      if (currentItem?.onSave) {
        await currentItem.onSave(finalUrl);
      } else if (onSave) {
        await onSave(finalUrl, activeImageIndex, currentItem);
      }

      showToast('✓ Saved & uploaded to ImgBB CDN successfully!');

      if (andNext && activeImageIndex < normalizedImages.length - 1) {
        handleNavigateImage(activeImageIndex + 1);
      } else {
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (err: any) {
      console.error('Failed to save edited image', err);
      const fallbackUrl = canvas.toDataURL('image/png', 0.95);
      if (currentItem?.onSave) {
        await currentItem.onSave(fallbackUrl);
      } else if (onSave) {
        await onSave(fallbackUrl, activeImageIndex, currentItem);
      }
      showToast('Saved locally (Base64 fallback)');
      if (andNext && activeImageIndex < normalizedImages.length - 1) {
        handleNavigateImage(activeImageIndex + 1);
      } else {
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard navigation for image switcher & shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // Save & Next shortcut: Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndApply(true);
        return;
      }

      if (!isInput) {
        // '[' or Alt+Left or Ctrl+Left for Previous Image
        if (e.key === '[' || ((e.ctrlKey || e.altKey) && e.key === 'ArrowLeft')) {
          e.preventDefault();
          if (activeImageIndex > 0) {
            handleNavigateImage(activeImageIndex - 1);
          }
        }
        // ']' or Alt+Right or Ctrl+Right for Next Image
        else if (e.key === ']' || ((e.ctrlKey || e.altKey) && e.key === 'ArrowRight')) {
          e.preventDefault();
          if (activeImageIndex < normalizedImages.length - 1) {
            handleNavigateImage(activeImageIndex + 1);
          }
        }
        // Undo: Ctrl+Z
        else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        }
        // Redo: Ctrl+Y or Ctrl+Shift+Z
        else if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeImageIndex, normalizedImages.length, handleUndo, handleRedo, handleSaveAndApply, handleNavigateImage]);

  const handleDownload = (format: 'png' | 'jpeg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = `image/${format}`;
    const dataUrl = canvas.toDataURL(mime, 0.95);
    const link = document.createElement('a');
    link.download = `edited_diagram_${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
    showToast(`Downloaded .${format.toUpperCase()}`);
  };

  const handleCopyClipboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        showToast('Image copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Clipboard copy error', e);
        showToast('Clipboard write failed');
      }
    });
  };

  const handleResetToOriginal = () => {
    if (activeUrl) {
      loadImage(activeUrl);
      showToast('Reset back to original image');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-image-studio"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full max-w-7xl h-[94vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-200">
        
        {/* ===================== TOP HEADER: SET NAVIGATOR & GLOBAL ACTIONS ===================== */}
        <header className="h-14 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 flex-none gap-2">
          
          {/* Left: Studio Badge & Set Image Navigator */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg flex-none">
              <Sparkles className="w-4 h-4" />
            </div>

            {/* Set Image Navigator (Next / Prev / Dropdown Switcher) */}
            {normalizedImages.length > 1 ? (
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-0.5 shadow-xs">
                <button
                  type="button"
                  id="btn-studio-prev-image"
                  onClick={() => handleNavigateImage(activeImageIndex - 1)}
                  disabled={activeImageIndex <= 0}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous Image in Set"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dropdown Selector */}
                <div className="relative">
                  <button
                    type="button"
                    id="btn-studio-image-selector"
                    onClick={() => setShowImageListDropdown(!showImageListDropdown)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 rounded-md hover:bg-slate-800/80"
                  >
                    <span className="text-indigo-400 font-mono">
                      Image {activeImageIndex + 1} / {normalizedImages.length}
                    </span>
                    <span className="truncate max-w-[120px] sm:max-w-[200px] text-slate-400 text-[11px]">
                      {currentItem?.title || `Q#${currentItem?.questionNumber || activeImageIndex + 1}`}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showImageListDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 max-h-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-y-auto z-50 p-1 divide-y divide-slate-800">
                      {normalizedImages.map((imgItem, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleNavigateImage(idx)}
                          className={`w-full p-2 flex items-center gap-2 text-left rounded-lg text-xs transition-colors ${
                            idx === activeImageIndex
                              ? 'bg-indigo-600/30 text-indigo-300 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="w-5 h-5 rounded bg-slate-800 font-mono text-[10px] flex items-center justify-center flex-none">
                            {idx + 1}
                          </span>
                          <div className="truncate flex-1">
                            <p className="truncate font-medium">{imgItem.title || `Image ${idx + 1}`}</p>
                            {imgItem.subtitle && <p className="text-[10px] text-slate-500 truncate">{imgItem.subtitle}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-studio-next-image"
                  onClick={() => handleNavigateImage(activeImageIndex + 1)}
                  disabled={activeImageIndex >= normalizedImages.length - 1}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next Image in Set"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-xs font-bold text-slate-100 flex items-center gap-2 truncate">
                  <span className="truncate">{title}</span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal flex-none">
                    ({originalWidth} × {originalHeight} px)
                  </span>
                </h2>
              </div>
            )}
          </div>

          {/* Center / Right: Undo/Redo, Copy, Save & Next, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              id="btn-studio-undo"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-studio-redo"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-studio-reset"
              onClick={handleResetToOriginal}
              className="px-2 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
              title="Reset all edits to original image"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

            <button
              type="button"
              id="btn-studio-copy"
              onClick={handleCopyClipboard}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Copy to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              id="btn-studio-download"
              onClick={() => handleDownload('png')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Download PNG"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Save & Next (if multi-image set) */}
            {normalizedImages.length > 1 && activeImageIndex < normalizedImages.length - 1 && (
              <button
                type="button"
                id="btn-studio-save-next"
                onClick={() => handleSaveAndApply(true)}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-emerald-950/40 disabled:opacity-50"
                title="Save this image to ImgBB and immediately edit the next image"
              >
                <span>Save & Next</span>
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Save & Apply */}
            <button
              type="button"
              id="btn-studio-save-apply"
              onClick={() => handleSaveAndApply(false)}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-900/40 disabled:opacity-50"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isSaving ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save & Apply'}</span>
            </button>

            <button
              type="button"
              id="btn-studio-close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ===================== TOOL SELECTION TABS ===================== */}
        <nav className="flex items-center gap-1 px-3 sm:px-4 py-1.5 bg-slate-950 border-b border-slate-800 overflow-x-auto flex-none text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('resize')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'resize' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Resize</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crop')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'crop' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Crop & Rotate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invert')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'invert' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multi-Color Invert</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bg_remove')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'bg_remove' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Background Remover</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('watermark')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'watermark' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400" />
            <span>Watermark Eraser</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'adjust' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tone & Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'draw' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Brush className="w-3.5 h-3.5" />
            <span>Brush & Paint</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shapes')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'shapes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Shapes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'text' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Labels</span>
          </button>
        </nav>

        {/* ===================== WORKSPACE: TOOL CONTROLS & CANVAS ===================== */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT TOOLBAR PANEL */}
          <aside className="w-72 bg-slate-950/90 border-r border-slate-800 p-4 flex flex-col overflow-y-auto space-y-4 flex-none text-xs">
            
            {/* TAB: RESIZE */}
            {activeTab === 'resize' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm">Resize Dimensions</h3>
                  <p className="text-[11px] text-slate-400">Freely adjust width, height, and scale</p>
                </div>

                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-300 font-medium">Lock Aspect Ratio</span>
                  <button
                    type="button"
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className={`p-1.5 rounded-lg ${
                      lockAspectRatio ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={targetWidth}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={targetHeight}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Scale Percentage</span>
                    <span className="font-mono text-indigo-400">{scalePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={scalePercent}
                    onChange={(e) => handleScalePercentChange(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                    {[25, 50, 75, 100, 150].map((p) => (
                      <button key={p} type="button" onClick={() => handleScalePercentChange(p)}>
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">Exam Diagram Presets</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => { handleWidthChange(400); handleHeightChange(300); }}
                      className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-[11px]"
                    >
                      <span className="font-semibold block text-slate-200">Small (400×300)</span>
                      <span className="text-[9px] text-slate-500">Option diagram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleWidthChange(600); handleHeightChange(450); }}
                      className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-[11px]"
                    >
                      <span className="font-semibold block text-slate-200">Standard (600×450)</span>
                      <span className="text-[9px] text-slate-500">Question figure</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleWidthChange(800); handleHeightChange(600); }}
                      className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-[11px]"
                    >
                      <span className="font-semibold block text-slate-200">Large (800×600)</span>
                      <span className="text-[9px] text-slate-500">Detailed map/graph</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleWidthChange(1000); handleHeightChange(750); }}
                      className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-[11px]"
                    >
                      <span className="font-semibold block text-slate-200">Full Width (1000px)</span>
                      <span className="text-[9px] text-slate-500">Full page diagram</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyResize}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Apply Resize
                </button>
              </div>
            )}

            {/* TAB: CROP & ROTATE */}
            {activeTab === 'crop' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm">Crop & Orientation</h3>
                  <p className="text-[11px] text-slate-400">Trim unwanted borders or rotate diagrams</p>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">Crop Ratio</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['free', '1:1', '4:3', '16:9', '3:2'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => {
                          setCropAspectRatio(ratio);
                          if (ratio === '1:1') {
                            const minSide = Math.min(originalWidth, originalHeight);
                            setCropBox({ x: 0, y: 0, width: minSide, height: minSide });
                          } else if (ratio === '4:3') {
                            const h = Math.round((originalWidth * 3) / 4);
                            setCropBox({ x: 0, y: 0, width: originalWidth, height: Math.min(h, originalHeight) });
                          } else if (ratio === '16:9') {
                            const h = Math.round((originalWidth * 9) / 16);
                            setCropBox({ x: 0, y: 0, width: originalWidth, height: Math.min(h, originalHeight) });
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border ${
                          cropAspectRatio === ratio
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {ratio.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {cropBox && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Width</span>
                      <input
                        type="number"
                        value={Math.round(cropBox.width)}
                        onChange={(e) => setCropBox({ ...cropBox, width: parseInt(e.target.value) || 10 })}
                        className="w-full bg-slate-950 px-2 py-1 rounded text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block">Height</span>
                      <input
                        type="number"
                        value={Math.round(cropBox.height)}
                        onChange={(e) => setCropBox({ ...cropBox, height: parseInt(e.target.value) || 10 })}
                        className="w-full bg-slate-950 px-2 py-1 rounded text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={applyCrop}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Apply Crop Area
                </button>

                <div className="pt-2 border-t border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1.5">Rotate & Flip</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRotateCanvas(-90)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg flex flex-col items-center gap-1 border border-slate-800"
                      title="Rotate Left 90°"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="text-[9px]">-90°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotateCanvas(90)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg flex flex-col items-center gap-1 border border-slate-800"
                      title="Rotate Right 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span className="text-[9px]">+90°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlipCanvas('horizontal')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg flex flex-col items-center gap-1 border border-slate-800"
                      title="Flip Horizontal"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                      <span className="text-[9px]">Flip H</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlipCanvas('vertical')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg flex flex-col items-center gap-1 border border-slate-800"
                      title="Flip Vertical"
                    >
                      <FlipVertical className="w-4 h-4" />
                      <span className="text-[9px]">Flip V</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MULTI-COLOR INVERT (रंग-बिरंगा इनवर्टर) */}
            {activeTab === 'invert' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span>Multi-Color Invert</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Invert diagrams into high-contrast dark, navy, blackboard, or custom colors</p>
                </div>

                {/* Preset Choices */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 block">Color Invert Presets</label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {MULTI_COLOR_INVERT_PRESETS.map((p) => {
                      const isActive = invertConfig.preset === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectInvertPreset(p.id)}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-xs'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <span className="font-bold block text-xs">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.nameHi}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-none">
                            <span
                              className="w-4 h-4 rounded-full border border-slate-600"
                              style={{ backgroundColor: p.previewBg }}
                              title="Background"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-slate-600"
                              style={{ backgroundColor: p.previewFg }}
                              title="Line Color"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Colors Picker */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-2.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Custom Tone Mapping</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Swap background and foreground
                        const newCfg: CustomInvertConfig = {
                          ...invertConfig,
                          preset: 'custom_dual',
                          bgColor: invertConfig.fgColor,
                          fgColor: invertConfig.bgColor
                        };
                        setInvertConfig(newCfg);
                        applyToneAndInvertFilters(newCfg);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 flex items-center gap-1 text-[10px]"
                      title="Swap Background & Line Colors"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Swap</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block mb-1">Target Background</span>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={invertConfig.bgColor}
                          onChange={(e) => {
                            const newCfg: CustomInvertConfig = {
                              ...invertConfig,
                              preset: 'custom_dual',
                              bgColor: e.target.value
                            };
                            setInvertConfig(newCfg);
                            applyToneAndInvertFilters(newCfg);
                          }}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-[10px] text-slate-300">{invertConfig.bgColor}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Target Lines / Text</span>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={invertConfig.fgColor}
                          onChange={(e) => {
                            const newCfg: CustomInvertConfig = {
                              ...invertConfig,
                              preset: 'custom_dual',
                              fgColor: e.target.value
                            };
                            setInvertConfig(newCfg);
                            applyToneAndInvertFilters(newCfg);
                          }}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-[10px] text-slate-300">{invertConfig.fgColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contrast / Intensity */}
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Line Contrast & Sharpness</span>
                      <span className="font-mono text-cyan-400">{invertConfig.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={invertConfig.contrast}
                      onChange={(e) => {
                        const newCfg: CustomInvertConfig = {
                          ...invertConfig,
                          contrast: parseInt(e.target.value)
                        };
                        setInvertConfig(newCfg);
                        applyToneAndInvertFilters(newCfg);
                      }}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    commitToneAdjustments();
                  }}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Apply Color Invert
                </button>
              </div>
            )}

            {/* TAB: BACKGROUND REMOVER */}
            {activeTab === 'bg_remove' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <span>Background Remover</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Make scanned paper transparent for clean transparent overlay</p>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveMode('white');
                      setIsPickingBgColor(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between ${
                      removeMode === 'white'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-xs">Auto White Paper & Light BG</span>
                      <span className="text-[10px] text-slate-400">Standard for exam diagrams</span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-white border border-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRemoveMode('picked');
                      setIsPickingBgColor(true);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between ${
                      removeMode === 'picked'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-xs flex items-center gap-1">
                        <Pipette className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Pick Exact Color</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Click on canvas to sample color</span>
                    </div>
                    <span className="w-4 h-4 rounded-full border border-slate-400" style={{ backgroundColor: bgPickColor }} />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Color Tolerance</span>
                    <span className="font-mono text-indigo-400">{bgTolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    value={bgTolerance}
                    onChange={(e) => setBgTolerance(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Edge Smoothing / Feather</span>
                    <span className="font-mono text-indigo-400">{bgFeather}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={bgFeather}
                    onChange={(e) => setBgFeather(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={removeBackground}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Remove Background</span>
                </button>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={restoreSolidWhiteBg}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold rounded-xl"
                  >
                    Restore Solid White Background
                  </button>
                </div>
              </div>
            )}

            {/* TAB: WATERMARK ERASER */}
            {activeTab === 'watermark' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    <Eraser className="w-4 h-4 text-rose-400" />
                    <span>Watermark & Object Eraser</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Brush over stamps, logos, or text stamps to seamlessly erase</p>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWatermarkTool('inpaint')}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 ${
                      watermarkTool === 'inpaint'
                        ? 'bg-rose-950/60 border-rose-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-bold text-xs">Smart Inpaint</span>
                    <span className="text-[9px] text-slate-400">Seamless texture blend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWatermarkTool('clone');
                      setIsSettingCloneSource(true);
                    }}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 ${
                      watermarkTool === 'clone'
                        ? 'bg-rose-950/60 border-rose-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Stamp className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-xs">Clone Stamp</span>
                    <span className="text-[9px] text-slate-400">Sample & paint clean area</span>
                  </button>
                </div>

                {watermarkTool === 'clone' && (
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Sample Source:</span>
                      <span className="font-mono text-indigo-400">
                        {cloneSourcePoint ? `(${Math.round(cloneSourcePoint.x)}, ${Math.round(cloneSourcePoint.y)})` : 'Not Set'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSettingCloneSource(true)}
                      className={`w-full py-1 rounded text-xs font-semibold ${
                        isSettingCloneSource ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isSettingCloneSource ? '👉 Click Canvas to Pick Source' : 'Pick Clean Source Point'}
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Eraser Brush Size</span>
                    <span className="font-mono text-rose-400">{watermarkBrushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={watermarkBrushSize}
                    onChange={(e) => setWatermarkBrushSize(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>
              </div>
            )}

            {/* TAB: ADJUST / TONE & SCANNER */}
            {activeTab === 'adjust' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm">Tone & Document Scanner</h3>
                  <p className="text-[11px] text-slate-400">Enhance scanned papers & make diagrams crisp</p>
                </div>

                <div className="bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-800/60">
                  <div className="flex justify-between text-[11px] text-slate-200 font-semibold mb-1">
                    <span className="flex items-center gap-1 text-indigo-300">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Document Scan Threshold</span>
                    </span>
                    <span className="font-mono text-indigo-400">{threshold === 0 ? 'Off' : threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="240"
                    step="5"
                    value={threshold}
                    onChange={(e) => {
                      setThreshold(parseInt(e.target.value));
                      setTimeout(applyToneAndInvertFilters, 10);
                    }}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Brightness</span>
                    <span className="font-mono text-indigo-400">{brightness > 0 ? `+${brightness}` : brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    onChange={(e) => {
                      setBrightness(parseInt(e.target.value));
                      setTimeout(applyToneAndInvertFilters, 10);
                    }}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Contrast</span>
                    <span className="font-mono text-indigo-400">{contrast > 0 ? `+${contrast}` : contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    onChange={(e) => {
                      setContrast(parseInt(e.target.value));
                      setTimeout(applyToneAndInvertFilters, 10);
                    }}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setGrayscale(!grayscale);
                      setTimeout(applyToneAndInvertFilters, 10);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                      grayscale ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Grayscale (B&W)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectInvertPreset(invertConfig.preset === 'classic_negative' ? 'none' : 'classic_negative');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                      invertConfig.preset === 'classic_negative'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Invert (Negative)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={commitToneAdjustments}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Apply Tone Filters
                </button>
              </div>
            )}

            {/* TAB: DRAW & BRUSH */}
            {activeTab === 'draw' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    <Brush className="w-4 h-4 text-indigo-400" />
                    <span>Freehand Brush & Highlighter</span>
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setDrawTool('pen')}
                    className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                      drawTool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    <Brush className="w-3.5 h-3.5" />
                    <span>Pen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawTool('highlighter')}
                    className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                      drawTool === 'highlighter' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span>Marker</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawTool('eraser')}
                    className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                      drawTool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Eraser</span>
                  </button>
                </div>

                {drawTool !== 'eraser' && (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Color</label>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#000000', '#ffffff'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setBrushColor(col)}
                          className={`w-6 h-6 rounded-full border-2 ${
                            brushColor === col ? 'border-indigo-400 scale-110' : 'border-slate-700'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                      <input
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="w-6 h-6 rounded-full border-0 cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Brush Thickness</span>
                    <span className="font-mono text-indigo-400">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB: SHAPES */}
            {activeTab === 'shapes' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm">Diagram Geometric Shapes</h3>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'arrow', label: 'Arrow (तीर)', icon: ArrowUpRight },
                    { id: 'line', label: 'Straight Line', icon: Minus },
                    { id: 'rect', label: 'Rectangle', icon: Square },
                    { id: 'circle', label: 'Circle / Node', icon: Circle }
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveShape(s.id as any)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 ${
                          activeShape === s.id
                            ? 'bg-indigo-950/60 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-indigo-400 flex-none" />
                        <span className="font-semibold text-xs">{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Shape Color</label>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#000000', '#ffffff'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setShapeColor(col)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          shapeColor === col ? 'border-indigo-400 scale-110' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                    <input
                      type="color"
                      value={shapeColor}
                      onChange={(e) => setShapeColor(e.target.value)}
                      className="w-6 h-6 rounded-full border-0 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Line Width</span>
                    <span className="font-mono text-indigo-400">{shapeStrokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={shapeStrokeWidth}
                    onChange={(e) => setShapeStrokeWidth(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB: TEXT */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 text-sm">Text & Diagram Labels</h3>
                  <p className="text-[11px] text-slate-400">Add formula, points (A, B, θ) or figure annotations</p>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Label Text</label>
                  <input
                    type="text"
                    value={newTextString}
                    onChange={(e) => setNewTextString(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    placeholder="e.g. Fig 1, A, B, 10 cm, θ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Font Size</label>
                    <input
                      type="number"
                      value={textFontSize}
                      onChange={(e) => setTextFontSize(parseInt(e.target.value) || 12)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setTextIsBold(!textIsBold)}
                      className={`w-full py-1 rounded-lg text-xs font-bold border ${
                        textIsBold ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Bold (B)
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addTextAnnotation}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Place Label on Canvas
                </button>
              </div>
            )}
          </aside>

          {/* RIGHT / MAIN CANVAS WORKSPACE */}
          <main
            ref={containerRef}
            onWheel={handleContainerWheel}
            className="flex-1 bg-slate-950 overflow-hidden relative flex items-center justify-center cursor-crosshair select-none"
            onMouseDown={(e) => {
              if (isHandTool || e.button === 1 || e.spaceKey) {
                setIsPanning(true);
                setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
              }
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
              }
            }}
            onMouseUp={() => setIsPanning(false)}
          >
            {/* Status Toast Banner */}
            {statusMessage && (
              <div className="absolute top-3 z-30 bg-indigo-600/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                {statusMessage}
              </div>
            )}

            {/* Checkerboard Pattern Background for Transparency */}
            <div
              className="relative shadow-2xl rounded-sm transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                backgroundImage:
                  'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                backgroundColor: '#0f172a'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="block max-w-none"
              />

              {/* Crop Box Overlay */}
              {activeTab === 'crop' && cropBox && (
                <div
                  className="absolute border-2 border-indigo-400 bg-indigo-500/15 pointer-events-none"
                  style={{
                    left: `${cropBox.x}px`,
                    top: `${cropBox.y}px`,
                    width: `${cropBox.width}px`,
                    height: `${cropBox.height}px`
                  }}
                >
                  <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
                  <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
                  <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
                  <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
                </div>
              )}
            </div>

            {/* Bottom Floating Canvas Navigation Controls (Zoom up to 500% + Manual Digit Input + Fit Canvas) */}
            <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xl backdrop-blur-md z-20">
              
              {/* Zoom Out Button */}
              <button
                type="button"
                id="btn-studio-zoom-out"
                onClick={() => setZoom((z) => Math.max(0.1, z - 0.25))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Zoom Range Slider (10% to 500%) */}
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={Math.round(zoom * 100)}
                onChange={(e) => setZoom(parseInt(e.target.value, 10) / 100)}
                className="w-20 sm:w-28 accent-indigo-500"
                title="Zoom Slider (10% to 500%)"
              />

              {/* Zoom In Button */}
              <button
                type="button"
                id="btn-studio-zoom-in"
                onClick={() => setZoom((z) => Math.min(8.0, z + 0.25))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Manual Digit Input for Zoom */}
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-0.5 font-mono text-xs">
                <input
                  type="number"
                  min="10"
                  max="800"
                  value={manualZoomInput}
                  onChange={(e) => handleManualZoomChange(e.target.value)}
                  onBlur={handleManualZoomBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualZoomBlur();
                  }}
                  className="w-10 bg-transparent text-indigo-400 font-bold text-center focus:outline-none"
                  title="Type exact zoom percentage (10 to 800) and press Enter"
                />
                <span className="text-slate-400 text-[11px]">%</span>
              </div>

              <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

              {/* Fit to Canvas Button */}
              <button
                type="button"
                id="btn-studio-fit-canvas"
                onClick={fitToCanvas}
                className="px-2 py-1 text-[11px] font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg flex items-center gap-1 transition-colors"
                title="Fit Image to Viewport Canvas"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Fit Canvas</span>
              </button>

              {/* 100% 1:1 Button */}
              <button
                type="button"
                id="btn-studio-reset-100"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="px-1.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white rounded hover:bg-slate-800"
                title="Actual 1:1 Pixel Size (100%)"
              >
                100%
              </button>

              {/* Hand / Pan Tool */}
              <button
                type="button"
                id="btn-studio-hand-tool"
                onClick={() => setIsHandTool(!isHandTool)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isHandTool ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Hand Tool / Pan Canvas (Drag to navigate)"
              >
                <Grab className="w-4 h-4" />
              </button>
            </div>

            {/* ===================== FLOATING CANVAS NEXT / PREV BUTTONS ===================== */}
            {normalizedImages.length > 1 && (
              <>
                {/* Floating Left: Previous Image */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    id="btn-studio-float-prev"
                    onClick={() => handleNavigateImage(activeImageIndex - 1)}
                    disabled={activeImageIndex <= 0}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-indigo-600 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md disabled:opacity-20 disabled:pointer-events-none transition-all hover:scale-110 active:scale-95 group"
                    title={`Previous Image (Key: [ or Ctrl+Left) — ${activeImageIndex > 0 ? (normalizedImages[activeImageIndex - 1]?.title || `Q#${normalizedImages[activeImageIndex - 1]?.questionNumber}`) : ''}`}
                  >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  {activeImageIndex > 0 && (
                    <span className="text-[10px] bg-slate-950/90 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-slate-700/80 shadow backdrop-blur-sm">
                      Q#{normalizedImages[activeImageIndex - 1]?.questionNumber || activeImageIndex}
                    </span>
                  )}
                </div>

                {/* Floating Right: Next Image */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    id="btn-studio-float-next"
                    onClick={() => handleNavigateImage(activeImageIndex + 1)}
                    disabled={activeImageIndex >= normalizedImages.length - 1}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-indigo-600 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md disabled:opacity-20 disabled:pointer-events-none transition-all hover:scale-110 active:scale-95 group"
                    title={`Next Image (Key: ] or Ctrl+Right) — ${activeImageIndex < normalizedImages.length - 1 ? (normalizedImages[activeImageIndex + 1]?.title || `Q#${normalizedImages[activeImageIndex + 1]?.questionNumber}`) : ''}`}
                  >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  {activeImageIndex < normalizedImages.length - 1 && (
                    <span className="text-[10px] bg-slate-950/90 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-slate-700/80 shadow backdrop-blur-sm">
                      Q#{normalizedImages[activeImageIndex + 1]?.questionNumber || activeImageIndex + 2}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* ===================== BOTTOM FILMSTRIP / THUMBNAIL DOCK ===================== */}
            {normalizedImages.length > 1 && (
              <div className="absolute bottom-4 left-4 z-20 flex flex-col items-start gap-1 max-w-[calc(100%-380px)] pointer-events-auto">
                <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-full">
                  <div className="px-2.5 py-1 flex items-center gap-1.5 text-xs text-indigo-400 font-bold border-r border-slate-800 flex-none select-none">
                    <Images className="w-4 h-4 text-cyan-400" />
                    <span className="hidden sm:inline">Set Diagrams:</span>
                    <span className="font-mono text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                      {activeImageIndex + 1} / {normalizedImages.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 scrollbar-thin max-w-full">
                    {normalizedImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        id={`btn-filmstrip-img-${idx}`}
                        onClick={() => handleNavigateImage(idx)}
                        className={`relative flex-none rounded-lg overflow-hidden border transition-all p-0.5 ${
                          idx === activeImageIndex
                            ? 'border-indigo-400 bg-indigo-600/40 scale-105 ring-2 ring-indigo-500/60 shadow-lg'
                            : 'border-slate-800 hover:border-slate-600 bg-slate-950/90 opacity-70 hover:opacity-100 hover:scale-102'
                        }`}
                        title={`Click to jump to ${img.title || `Q#${img.questionNumber || idx + 1}`}`}
                      >
                        <div className="w-11 h-8 bg-slate-950 flex items-center justify-center overflow-hidden rounded">
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-contain pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="absolute bottom-0 right-0 bg-black/85 text-[8px] font-mono text-cyan-300 font-bold px-1 rounded-tl">
                          {img.questionNumber ? `Q${img.questionNumber}` : `#${idx + 1}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
