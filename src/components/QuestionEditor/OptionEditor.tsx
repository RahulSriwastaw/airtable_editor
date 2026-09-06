import React from 'react';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { WysiwygEditor } from './WysiwygEditor';

interface OptionEditorProps {
  optionNumber: number;
  hindiText: string;
  englishText: string;
  isCorrect: boolean;
  onSelectCorrect: () => void;
  onHindiChange: (text: string) => void;
  onEnglishChange: (text: string) => void;
  onRemove?: () => void;
  viewMode: 'side-by-side' | 'hindi-only' | 'english-only';
  editorName: string;
}

export const OptionEditor: React.FC<OptionEditorProps> = ({
  optionNumber,
  hindiText,
  englishText,
  isCorrect,
  onSelectCorrect,
  onHindiChange,
  onEnglishChange,
  onRemove,
  viewMode,
  editorName
}) => {
  const optionLabels = ['A', 'B', 'C', 'D', 'E'];
  const charLabel = optionLabels[optionNumber - 1] || String(optionNumber);

  return (
    <div
      id={`option-card-${optionNumber}`}
      className={`rounded-xl border transition-all duration-200 p-3.5 ${
        isCorrect
          ? 'bg-emerald-50/40 border-emerald-400 ring-1 ring-emerald-400/40 shadow-xs'
          : 'bg-white border-gray-200/90 hover:border-gray-300 shadow-2xs'
      }`}
    >
      {/* Option Header Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id={`btn-correct-option-${optionNumber}`}
            onClick={onSelectCorrect}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isCorrect
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={`Set Option ${optionNumber} (${charLabel}) as Correct Answer`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span>Option {optionNumber} ({charLabel})</span>
            {isCorrect && <span className="ml-1 text-[10px] bg-emerald-700/60 px-1.5 py-0.5 rounded text-emerald-100 uppercase tracking-wider">Correct</span>}
          </button>
        </div>

        {onRemove && optionNumber === 5 && (
          <button
            type="button"
            id="btn-remove-option-5"
            onClick={onRemove}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            title="Remove 5th Option"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove Opt 5</span>
          </button>
        )}
      </div>

      {/* Inputs (Side by Side or Single) */}
      <div className={`grid gap-3 ${viewMode === 'side-by-side' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {(viewMode === 'side-by-side' || viewMode === 'hindi-only') && (
          <WysiwygEditor
            id={`editor-opt${optionNumber}-hi`}
            value={hindiText}
            onChange={onHindiChange}
            placeholder={`विकल्प ${optionNumber} (Hindi) यहाँ लिखें...`}
            badge="HI"
            label={`Option ${optionNumber} (Hindi)`}
            language="hi"
            minHeight="65px"
            editorName={editorName}
          />
        )}

        {(viewMode === 'side-by-side' || viewMode === 'english-only') && (
          <WysiwygEditor
            id={`editor-opt${optionNumber}-en`}
            value={englishText}
            onChange={onEnglishChange}
            placeholder={`Option ${optionNumber} (English) text here...`}
            badge="EN"
            label={`Option ${optionNumber} (English)`}
            language="en"
            minHeight="65px"
            editorName={editorName}
          />
        )}
      </div>
    </div>
  );
};
