import React from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { WysiwygEditor } from './WysiwygEditor';

interface OptionCardEditorProps {
  optNum: number;
  charLabel: string;
  isCorrect: boolean;
  onSelectCorrect: () => void;
  hiValue: string;
  enValue: string;
  onHiChange: (val: string) => void;
  onEnChange: (val: string) => void;
  onRemove?: () => void;
  langTab: 'hi' | 'en' | 'split';
  editorName: string;
}

export const OptionCardEditor: React.FC<OptionCardEditorProps> = ({
  optNum,
  charLabel,
  isCorrect,
  onSelectCorrect,
  hiValue,
  enValue,
  onHiChange,
  onEnChange,
  onRemove,
  langTab,
  editorName
}) => {
  return (
    <div
      id={`option-card-${optNum}`}
      className={`rounded-xl border transition-all duration-200 overflow-hidden flex flex-col ${
        isCorrect
          ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 bg-white shadow-xs'
      }`}
    >
      {/* Option Card Header */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b transition-colors ${
          isCorrect ? 'bg-emerald-50/60 border-emerald-100' : 'bg-slate-50/80 border-slate-100'
        }`}
      >
        {/* Correct Selector & Letter Badge */}
        <button
          type="button"
          id={`btn-opt-select-${optNum}`}
          onClick={onSelectCorrect}
          className={`group flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isCorrect
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
          }`}
          title={`Click to set Option ${charLabel} as Correct Answer`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              isCorrect
                ? 'bg-white text-emerald-700'
                : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
            }`}
          >
            {charLabel}
          </span>
          <span className="text-xs">
            Option {charLabel}
          </span>
          {isCorrect && (
            <span className="ml-1 inline-flex items-center gap-1 text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded text-emerald-100 uppercase tracking-wider font-bold">
              <CheckCircle2 className="w-3 h-3" />
              Correct
            </span>
          )}
        </button>

        {/* Option 5 Remove Action */}
        {optNum === 5 && onRemove && (
          <button
            type="button"
            id="btn-remove-opt-5"
            onClick={onRemove}
            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
            title="Remove 5th Option"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Remove</span>
          </button>
        )}
      </div>

      {/* Option Body with Rich WYSIWYG Editors */}
      <div className="p-2.5 bg-white flex-1 flex flex-col justify-center">
        {langTab === 'split' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <WysiwygEditor
              id={`editor-opt-${optNum}-hi`}
              value={hiValue || ''}
              onChange={onHiChange}
              placeholder={`Option ${charLabel} (Hindi)...`}
              badge="HI"
              label={`Option ${charLabel}`}
              language="hi"
              minHeight="48px"
              editorName={editorName}
            />
            <WysiwygEditor
              id={`editor-opt-${optNum}-en`}
              value={enValue || ''}
              onChange={onEnChange}
              placeholder={`Option ${charLabel} (English)...`}
              badge="EN"
              label={`Option ${charLabel}`}
              language="en"
              minHeight="48px"
              editorName={editorName}
            />
          </div>
        ) : langTab === 'en' ? (
          <WysiwygEditor
            id={`editor-opt-${optNum}-en-single`}
            value={enValue || ''}
            onChange={onEnChange}
            placeholder={`Option ${charLabel} (English statement, formula, symbols)...`}
            badge="EN"
            label={`Option ${charLabel} (English)`}
            language="en"
            minHeight="52px"
            editorName={editorName}
          />
        ) : (
          <WysiwygEditor
            id={`editor-opt-${optNum}-hi-single`}
            value={hiValue || ''}
            onChange={onHiChange}
            placeholder={`Option ${charLabel} (Hindi सूत्र, समीकरण, टेक्स्ट)...`}
            badge="HI"
            label={`Option ${charLabel} (Hindi)`}
            language="hi"
            minHeight="52px"
            editorName={editorName}
          />
        )}
      </div>
    </div>
  );
};
