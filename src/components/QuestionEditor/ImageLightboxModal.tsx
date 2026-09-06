import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize2, Download, Copy, Check } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Image / Diagram Preview'
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotateCw = () => setRotation(prev => (prev + 90) % 360);
  const handleRotateCcw = () => setRotation(prev => (prev - 90 + 360) % 360);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="modal-image-lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 text-white">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-xs tracking-wide text-slate-200">{title}</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline truncate max-w-sm">
              ({Math.round(zoom * 100)}% scale, {rotation}°)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-lightbox-zoom-out"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition-colors disabled:opacity-40"
              title="Zoom Out (Ctrl -)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-lightbox-reset"
              onClick={handleReset}
              className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition-colors"
              title="Reset Zoom & Rotation"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              id="btn-lightbox-zoom-in"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition-colors disabled:opacity-40"
              title="Zoom In (Ctrl +)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-700 mx-1" />

            <button
              type="button"
              id="btn-lightbox-rotate-ccw"
              onClick={handleRotateCcw}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition-colors"
              title="Rotate Left 90°"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-lightbox-rotate-cw"
              onClick={handleRotateCw}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition-colors"
              title="Rotate Right 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-700 mx-1" />

            <button
              type="button"
              id="btn-lightbox-copy-url"
              onClick={handleCopyUrl}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition-colors flex items-center gap-1 text-xs"
              title="Copy Image URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="diagram.png"
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              type="button"
              id="btn-lightbox-close"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-red-900/40 hover:bg-red-800 rounded transition-colors ml-2"
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] min-h-[350px] max-h-[75vh]">
          <div
            className="transition-transform duration-150 ease-out flex items-center justify-center"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`
            }}
          >
            <img
              src={imageUrl}
              alt="High resolution preview"
              className="max-h-[68vh] max-w-[85vw] object-contain rounded-lg shadow-2xl bg-white border border-slate-600"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-1.5 bg-slate-800/80 border-t border-slate-700 text-center text-[11px] text-slate-400 flex items-center justify-between">
          <span>Use controls to inspect labels, formulas, and fine geometric details.</span>
          <span className="font-mono text-[10px] text-slate-500">Press Esc or click outside to exit</span>
        </div>
      </div>
    </div>
  );
};
