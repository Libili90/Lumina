import React, { useRef } from 'react';
import { Button } from './Button';
import { DesignStyle, DesignHistoryItem, SelectionMode } from '../types';

interface SidebarProps {
  prompt: string;
  setPrompt: (s: string) => void;
  suggestions?: string[];
  isSuggesting?: boolean;
  onRegenerateSuggestions: () => void;
  selectedStyle: string;
  setSelectedStyle: (s: string) => void;
  isSelectMode: boolean;
  toggleSelectMode: () => void;
  selectionMode: SelectionMode;
  setSelectionMode: (m: SelectionMode) => void;
  onGenerate: () => void;
  onUploadRef: (file: File) => void;
  refImage: string | null;
  onRemoveRef: () => void;
  
  onUploadObject: (file: File) => void;
  objectImage: string | null;
  onRemoveObject: () => void;

  isGenerating: boolean;
  history: DesignHistoryItem[];
  onLoadHistory: (item: DesignHistoryItem) => void;
  hasSelection: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  prompt,
  setPrompt,
  suggestions = [],
  isSuggesting = false,
  onRegenerateSuggestions,
  selectedStyle,
  setSelectedStyle,
  isSelectMode,
  toggleSelectMode,
  selectionMode,
  setSelectionMode,
  onGenerate,
  onUploadRef,
  refImage,
  onRemoveRef,
  onUploadObject,
  objectImage,
  onRemoveObject,
  isGenerating,
  history,
  onLoadHistory,
  hasSelection
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadRef(e.target.files[0]);
    }
  };

  const handleObjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadObject(e.target.files[0]);
    }
  };

  // Always enable generation if base image is present (which is implied if Sidebar is rendered)
  const canGenerate = true; 

  return (
    <div className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-white/80 backdrop-blur-xl border-l border-white/20 shadow-xl flex flex-col h-full z-20">
      <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          Controls
        </h2>

        {/* Selection Tool */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            1. Focus Area
          </label>
          <div className="flex flex-col gap-2">
            <Button 
                variant={isSelectMode ? 'primary' : 'secondary'} 
                className="w-full justify-between group"
                onClick={toggleSelectMode}
            >
                <span>{isSelectMode ? (hasSelection ? 'Area Selected' : 'Selecting...') : 'Select Area (Optional)'}</span>
                <svg className={`w-5 h-5 ${isSelectMode ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </Button>

            {isSelectMode && (
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setSelectionMode('BOX')}
                        className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-all ${selectionMode === 'BOX' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" /></svg>
                        Box
                    </button>
                    <button
                        onClick={() => setSelectionMode('BRUSH')}
                        className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-all ${selectionMode === 'BRUSH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                         <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Brush
                    </button>
                </div>
            )}
          </div>
        </div>

        {/* Style Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            2. Design Style
          </label>
          <div className="relative">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="block w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
            >
              {Object.values(DesignStyle).map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Reference Image */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            3. Style Reference (Optional)
          </label>
          {!refImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-center"
            >
              <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm text-slate-500">Upload Style Image</span>
            </div>
          ) : (
            <div className="relative group rounded-xl overflow-hidden border border-slate-200">
              <img src={refImage} alt="Reference" className="w-full h-32 object-cover" />
              <button 
                onClick={onRemoveRef}
                className="absolute top-2 right-2 bg-white/90 p-1 rounded-full text-rose-500 hover:text-rose-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Object Image */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            4. Add Object (Optional)
          </label>
          {!objectImage ? (
            <div 
              onClick={() => objectInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-center"
            >
              <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="text-sm text-slate-500">Upload Object Image</span>
            </div>
          ) : (
            <div className="relative group rounded-xl overflow-hidden border border-slate-200">
              <img src={objectImage} alt="Object" className="w-full h-32 object-contain bg-slate-50/50" />
              <button 
                onClick={onRemoveObject}
                className="absolute top-2 right-2 bg-white/90 p-1 rounded-full text-rose-500 hover:text-rose-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={objectInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleObjectFileChange}
          />
        </div>

        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
            <span>5. Instructions</span>
            <div className="flex items-center space-x-2">
                {isSuggesting ? (
                    <span className="text-indigo-600 animate-pulse text-[10px]">Thinking...</span>
                ) : (
                    <button 
                        onClick={onRegenerateSuggestions}
                        className="text-indigo-600 hover:text-indigo-700 text-[10px] flex items-center transition-colors"
                        title="Get new ideas"
                    >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Ideas
                    </button>
                )}
            </div>
          </label>
          
          {/* Suggestions List */}
          {suggestions.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-3">
                 {suggestions.map((idea, idx) => (
                    <button
                        key={idx}
                        onClick={() => setPrompt(idea)}
                        className="text-xs text-left bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                    >
                        {idea}
                    </button>
                 ))}
             </div>
          )}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Make the walls white with wooden accents..."
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-white border-t border-slate-100">
        <Button 
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          isLoading={isGenerating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 shadow-lg"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        >
          {isGenerating ? 'Designing...' : 'Generate Design'}
        </Button>
      </div>
      
       {/* Mini History */}
       {history.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50">
             <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Recent Designs</h3>
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {history.map((item) => (
                    <button 
                      key={item.id} 
                      onClick={() => onLoadHistory(item)}
                      className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 ring-indigo-500 transition-all"
                    >
                        <img src={item.generatedImage} className="w-full h-full object-cover" alt="History" />
                    </button>
                ))}
             </div>
          </div>
       )}
    </div>
  );
};
