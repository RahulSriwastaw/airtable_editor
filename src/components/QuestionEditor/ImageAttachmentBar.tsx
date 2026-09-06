import React, { useState } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  X,
  Copy,
  Check,
  ExternalLink,
  Library,
  Maximize2,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCw,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { ImageLightboxModal } from './ImageLightboxModal';
import { ImageStudioModal } from './ImageStudioModal';
import { StudioImageItem } from './studio/studioTypes';

interface ImageAttachmentBarProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  onOpenMediaLibrary: () => void;
  editorName: string;
  setImages?: StudioImageItem[];
}

export const ImageAttachmentBar: React.FC<ImageAttachmentBarProps> = ({
  imageUrl,
  onImageUrlChange,
  onOpenMediaLibrary,
  editorName,
  setImages
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualInput, setManualInput] = useState(false);
  
  // Image Adjustment Controls State
  const [showPreview, setShowPreview] = useState(true);
  const [showAdjustControls, setShowAdjustControls] = useState(false);
  const [sizePreset, setSizePreset] = useState<'s' | 'm' | 'l' | 'xl' | 'custom'>('m');
  const [customHeight, setCustomHeight] = useState<number>(200);
  const [customWidthPercent, setCustomWidthPercent] = useState<number>(100);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [rotation, setRotation] = useState<number>(0);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [showImageStudio, setShowImageStudio] = useState<boolean>(false);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) return;
        const media = await api.uploadImage(base64, file.name, editorName);
        if (media.url) {
          onImageUrlChange(media.url);
          setShowPreview(true);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Image upload failed', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    }
  };

  const copyUrl = () => {
    if (!imageUrl) return;
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Determine height based on preset or custom slider
  const [isRehosting, setIsRehosting] = useState(false);
  const handleRehostToImgbb = async () => {
    if (!imageUrl) return;
    setIsRehosting(true);
    try {
      const res = await api.rehostImageUrl(imageUrl, undefined, editorName);
      if (res.imgbbUrl) {
        onImageUrlChange(res.imgbbUrl);
      }
    } catch (err: any) {
      console.error('Failed to rehost diagram image', err);
      alert(`ImgBB Rehost failed: ${err.message}`);
    } finally {
      setIsRehosting(false);
    }
  };

  const getImageHeight = () => {
    switch (sizePreset) {
      case 's': return '120px';
      case 'm': return '200px';
      case 'l': return '320px';
      case 'xl': return '440px';
      case 'custom': return `${customHeight}px`;
      default: return '200px';
    }
  };

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'left': return 'justify-start';
      case 'right': return 'justify-end';
      case 'center':
      default:
        return 'justify-center';
    }
  };

  return (
    <div id="image-attachment-bar-container" className="space-y-1.5">
      <input
        id="hidden-diagram-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* Main Bar */}
      <div id="image-attachment-bar" className="bg-slate-100/80 border border-slate-200 rounded-md px-2.5 py-1 text-xs shadow-2xs">
        {imageUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            {/* Left: Info & Thumbnail */}
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <button
                type="button"
                onClick={() => setShowLightbox(true)}
                className="w-7 h-7 rounded bg-white border border-slate-300 flex-shrink-0 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-400 transition-all cursor-zoom-in group"
                title="Click to Zoom / Inspect Image in Lightbox"
              >
                <img
                  src={imageUrl}
                  alt="Question visual asset"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </button>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5 truncate">
                  <Check className="w-3 h-3 flex-shrink-0" /> Diagram:
                </span>
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px] sm:max-w-xs">{imageUrl}</span>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Toggle Live Preview */}
              <button
                type="button"
                id="btn-toggle-diagram-preview"
                onClick={() => setShowPreview(!showPreview)}
                className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors flex items-center gap-1 ${
                  showPreview
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Toggle Diagram View"
              >
                {showPreview ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Show'}</span>
              </button>

              {/* Rehost to ImgBB if external OR ImgBB CDN Hosted Badge */}
              {imageUrl && (
                imageUrl.includes('ibb.co') ? (
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-300 flex items-center gap-1 shadow-2xs">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>ImgBB CDN</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    id="btn-rehost-diagram-imgbb"
                    onClick={handleRehostToImgbb}
                    disabled={isRehosting}
                    className="px-2 py-0.5 text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold rounded border border-amber-600 transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50"
                    title="Rehost Google Storage / external image to ImgBB CDN"
                  >
                    <UploadCloud className={`w-3 h-3 ${isRehosting ? 'animate-bounce' : ''}`} />
                    <span>{isRehosting ? 'Uploading...' : 'Rehost to ImgBB'}</span>
                  </button>
                )
              )}

              {/* Pro Studio Editor Button */}
              <button
                type="button"
                id="btn-open-diagram-studio"
                onClick={() => setShowImageStudio(true)}
                className="px-2 py-0.5 text-[10px] rounded border bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Open Pro Image Studio: Resize freely, Remove Background, Erase Watermarks, Draw & Paint"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>🎨 Studio Edit</span>
              </button>

              {/* Adjust / Resize Panel Toggle */}
              <button
                type="button"
                id="btn-toggle-diagram-adjuster"
                onClick={() => {
                  setShowAdjustControls(!showAdjustControls);
                  if (!showPreview) setShowPreview(true);
                }}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors flex items-center gap-1 ${
                  showAdjustControls
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Resize & Adjust Image Display (Small, Medium, Large, Alignment)"
              >
                <Sliders className="w-3 h-3 text-indigo-600" />
                <span>Adjust Size</span>
              </button>

              {/* Lightbox / Zoom */}
              <button
                type="button"
                id="btn-open-diagram-lightbox"
                onClick={() => setShowLightbox(true)}
                className="p-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors"
                title="Open HD Zoom & Rotate Lightbox"
              >
                <Maximize2 className="w-3 h-3" />
              </button>

              {/* Copy URL */}
              <button
                type="button"
                id="btn-copy-img-url"
                onClick={copyUrl}
                className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors"
                title="Copy direct image URL"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>

              {/* Delete / Remove */}
              <button
                type="button"
                id="btn-remove-image-url"
                onClick={() => onImageUrlChange('')}
                className="p-1 text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent rounded transition-colors"
                title="Remove image from question"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : manualInput ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Image URL:</span>
            <input
              type="url"
              id="input-manual-img-url"
              placeholder="Paste image URL (https://i.ibb.co/...)"
              className="flex-1 text-xs px-2 py-0.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onImageUrlChange((e.target as HTMLInputElement).value);
                  setManualInput(false);
                  setShowPreview(true);
                }
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  onImageUrlChange(e.target.value);
                  setShowPreview(true);
                }
                setManualInput(false);
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setManualInput(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-1.5 text-slate-500">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium">Diagram:</span>
              <span className="text-[10px] text-slate-400 italic">None attached (drop file or paste Ctrl+V)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => document.getElementById('hidden-diagram-upload')?.click()}
                disabled={isUploading}
                className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 rounded transition-colors flex items-center gap-1"
              >
                <UploadCloud className="w-3 h-3" />
                <span>{isUploading ? 'Uploading...' : '+ Upload Diagram'}</span>
              </button>
              <button
                type="button"
                onClick={() => setManualInput(true)}
                className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors"
              >
                URL
              </button>
              <button
                type="button"
                id="btn-open-media-lib-attach"
                onClick={onOpenMediaLibrary}
                className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 rounded transition-colors flex items-center gap-1"
              >
                <Library className="w-3 h-3" />
                <span>Media</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Image Adjuster & Resize Control Panel */}
      {imageUrl && showPreview && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50 shadow-xs">
          {/* Quick Adjustment Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 text-xs">
            {/* Size Presets */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Size:</span>
              <button
                type="button"
                id="btn-img-size-s"
                onClick={() => setSizePreset('s')}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  sizePreset === 's'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                title="Small (120px height)"
              >
                Small (120px)
              </button>
              <button
                type="button"
                id="btn-img-size-m"
                onClick={() => setSizePreset('m')}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  sizePreset === 'm'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                title="Medium (200px height - Recommended)"
              >
                Medium (200px)
              </button>
              <button
                type="button"
                id="btn-img-size-l"
                onClick={() => setSizePreset('l')}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  sizePreset === 'l'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                title="Large (320px height)"
              >
                Large (320px)
              </button>
              <button
                type="button"
                id="btn-img-size-xl"
                onClick={() => setSizePreset('xl')}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  sizePreset === 'xl'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                title="XL (440px height)"
              >
                XL (440px)
              </button>
              <button
                type="button"
                id="btn-img-size-custom"
                onClick={() => setSizePreset('custom')}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  sizePreset === 'custom'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                title="Custom Slider"
              >
                Custom
              </button>
            </div>

            {/* Alignment & Rotation */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-0.5">Align:</span>
              <div className="flex items-center bg-white border border-slate-200 rounded p-0.5">
                <button
                  type="button"
                  id="btn-img-align-left"
                  onClick={() => setAlignment('left')}
                  className={`p-1 rounded transition-colors ${
                    alignment === 'left' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  id="btn-img-align-center"
                  onClick={() => setAlignment('center')}
                  className={`p-1 rounded transition-colors ${
                    alignment === 'center' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  id="btn-img-align-right"
                  onClick={() => setAlignment('right')}
                  className={`p-1 rounded transition-colors ${
                    alignment === 'right' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-3 h-3" />
                </button>
              </div>

              {/* Rotate */}
              <button
                type="button"
                id="btn-img-rotate"
                onClick={handleRotate}
                className="p-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors flex items-center gap-0.5 text-[10px]"
                title="Rotate 90° clockwise"
              >
                <RotateCw className="w-3 h-3 text-slate-500" />
                <span className="font-mono text-[9px]">{rotation}°</span>
              </button>
            </div>
          </div>

          {/* Custom Sliders Drawer (Visible when Custom preset selected or toggled) */}
          {sizePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-4 px-3 py-1.5 bg-slate-100/50 border-b border-slate-200 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <label className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                  Height: <span className="font-mono text-indigo-600">{customHeight}px</span>
                </label>
                <input
                  type="range"
                  id="slider-img-height"
                  min="60"
                  max="600"
                  step="10"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <label className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                  Max Width: <span className="font-mono text-indigo-600">{customWidthPercent}%</span>
                </label>
                <input
                  type="range"
                  id="slider-img-width"
                  min="20"
                  max="100"
                  step="5"
                  value={customWidthPercent}
                  onChange={(e) => setCustomWidthPercent(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Live Rendered Canvas with Interactive Scaling */}
          <div className={`p-3 flex ${getAlignmentClass()} bg-slate-50/30 overflow-hidden`}>
            <div
              className="relative group border border-slate-200 rounded-md p-1 bg-white shadow-2xs hover:shadow-md transition-shadow cursor-zoom-in"
              onClick={() => setShowLightbox(true)}
              style={{
                maxWidth: sizePreset === 'custom' ? `${customWidthPercent}%` : '100%'
              }}
              title="Click to Zoom / Fullscreen"
            >
              <img
                src={imageUrl}
                alt="Question Diagram Attached"
                className="rounded object-contain transition-all duration-150"
                style={{
                  height: getImageHeight(),
                  maxHeight: getImageHeight(),
                  maxWidth: '100%',
                  transform: `rotate(${rotation}deg)`
                }}
                referrerPolicy="no-referrer"
              />

              {/* Hover Overlay Tag */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                <Maximize2 className="w-2.5 h-2.5 text-amber-400" /> Click to Zoom
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        imageUrl={imageUrl}
        title="Question Diagram / Image Preview"
      />

      {/* Pro Image Studio & Editor Modal */}
      <ImageStudioModal
        isOpen={showImageStudio}
        onClose={() => setShowImageStudio(false)}
        imageUrl={imageUrl}
        images={setImages}
        initialIndex={
          setImages && imageUrl
            ? Math.max(0, setImages.findIndex((img) => img.url === imageUrl))
            : 0
        }
        title="Question Diagram Studio & Editor"
        editorName={editorName}
        onSave={(newUrl) => {
          onImageUrlChange(newUrl);
          setShowImageStudio(false);
        }}
      />
    </div>
  );
};
