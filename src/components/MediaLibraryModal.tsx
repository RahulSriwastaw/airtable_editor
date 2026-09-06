import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Copy, Check, UploadCloud, ExternalLink, Calendar, User, Sparkles } from 'lucide-react';
import { MediaAsset } from '../types';
import { api } from '../services/api';
import { ImageStudioModal } from './QuestionEditor/ImageStudioModal';

interface MediaLibraryModalProps {
  onClose: () => void;
  onSelectImage?: (url: string) => void;
  editorName: string;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  onClose,
  onSelectImage,
  editorName
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [editingAssetIndex, setEditingAssetIndex] = useState<number>(0);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMediaAssets();
      setAssets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) return;
        await api.uploadImage(base64, file.name, editorName);
        await loadMedia();
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div id="media-library-modal" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-semibold">Media Library & Diagrams</h2>
              <p className="text-[11px] text-slate-400">All uploaded MCQ diagrams, math formulas, and question visuals</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-media-lib"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200">
          <span className="text-xs text-slate-600 font-medium">
            {assets.length} image assets available
          </span>

          <label
            htmlFor="media-lib-upload-input"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : 'Upload New Image'}</span>
            <input
              id="media-lib-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUpload(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>

        {/* Assets Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Loading media library...
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No images uploaded yet. Copy-paste an image into any question or upload above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {assets.map((asset, index) => (
                <div
                  key={asset.id}
                  id={`media-card-${asset.id}`}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col group"
                >
                  <div className="h-36 bg-slate-100 flex items-center justify-center overflow-hidden relative border-b border-slate-100">
                    <img
                      src={asset.url}
                      alt={asset.fileName}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Open full size"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 truncate" title={asset.fileName}>
                        {asset.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {asset.uploadedBy}
                        </span>
                        <span>•</span>
                        <span>{asset.size || '120 KB'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      {onSelectImage && (
                        <button
                          type="button"
                          id={`btn-select-media-${asset.id}`}
                          onClick={() => {
                            onSelectImage(asset.url);
                            onClose();
                          }}
                          className="flex-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Use in Question
                        </button>
                      )}
                      <button
                        type="button"
                        id={`btn-edit-media-${asset.id}`}
                        onClick={() => {
                          setEditingImageUrl(asset.url);
                          setEditingAssetIndex(index);
                        }}
                        className="flex items-center justify-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        title="Edit in Image Studio"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        id={`btn-copy-media-${asset.id}`}
                        onClick={() => copyUrl(asset.url, asset.id)}
                        className="flex items-center justify-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        title="Copy hosted image URL"
                      >
                        {copiedId === asset.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === asset.id ? 'Copied' : 'URL'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-white border-t border-slate-200">
          <button
            type="button"
            id="btn-close-media-footer"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Pro Image Studio Modal for Media Library Asset Editing */}
      {editingImageUrl && (
        <ImageStudioModal
          isOpen={Boolean(editingImageUrl)}
          onClose={() => setEditingImageUrl(null)}
          imageUrl={editingImageUrl}
          images={assets.map((a, i) => ({
            id: a.id,
            url: a.url,
            title: a.fileName || `Diagram Asset #${i + 1}`,
            subtitle: a.size || undefined
          }))}
          initialIndex={editingAssetIndex}
          title="Media Library Image Studio & Editor"
          editorName={editorName}
          onSave={async () => {
            await loadMedia();
          }}
        />
      )}
    </div>
  );
};
