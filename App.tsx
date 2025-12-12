import React, { useState, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageEditor } from './components/ImageEditor';
import { ComparisonView } from './components/ComparisonView';
import { Button } from './components/Button';
import { generateRoomDesign, getDesignSuggestions } from './services/geminiService';
import { AppState, DesignStyle, SelectionBox, DesignHistoryItem, SelectionMode } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [objectImage, setObjectImage] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [selectedStyle, setSelectedStyle] = useState<string>(DesignStyle.Modern);
  
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('BOX');
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setBaseImage(result);
      setAppState('EDITING');
      setGeneratedImage(null); // Reset prev generation
      // Reset selection tools
      setSelectionBox(null);
      setMaskImage(null);
      setIsSelectMode(false);
      setPrompt('');
      
      // Get AI Suggestions
      handleRegenerateSuggestions(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRegenerateSuggestions = (imageOverride?: string) => {
    const img = imageOverride || baseImage;
    if (!img) return;

    setSuggestions([]);
    setIsSuggesting(true);
    getDesignSuggestions(img)
      .then(setSuggestions)
      .catch(err => console.error("Error fetching suggestions", err))
      .finally(() => setIsSuggesting(false));
  };

  const handleRefUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setRefImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleObjectUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setObjectImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Generation Logic
  const handleGenerate = async () => {
    if (!baseImage) return;

    setAppState('GENERATING');
    
    // Construct instructions based on selection type
    let selectionPrompt = '';
    
    // If Box selection is active and we have a box
    if (selectionMode === 'BOX' && selectionBox && baseImage) {
        selectionPrompt = "Apply changes primarily to the highlighted region of interest.";
    }

    // Note: If selectionMode is BRUSH, we pass 'maskImage' directly to the service

    try {
      const resultBase64 = await generateRoomDesign({
        baseImage,
        referenceImage: refImage,
        objectImage,
        // Only pass mask if in brush mode
        maskImage: (selectionMode === 'BRUSH') ? maskImage : null,
        prompt,
        style: selectedStyle,
        selectionPrompt
      });

      setGeneratedImage(resultBase64);
      setAppState('REVIEW');
      setIsSelectMode(false); // Exit select mode

      // Add to history
      const newItem: DesignHistoryItem = {
          id: Date.now().toString(),
          originalImage: baseImage,
          generatedImage: resultBase64,
          prompt,
          style: selectedStyle,
          timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev].slice(0, 5)); // Keep last 5

    } catch (error: any) {
      console.error(error);
      alert(error.message || "An unexpected error occurred during generation.");
      setAppState('EDITING');
    }
  };

  const handleDownload = () => {
      if (generatedImage) {
          const link = document.createElement('a');
          link.href = generatedImage;
          link.download = `lumina-design-${Date.now()}.png`;
          link.click();
      }
  };

  const handleLoadHistory = (item: DesignHistoryItem) => {
      setBaseImage(item.originalImage);
      setGeneratedImage(item.generatedImage);
      setPrompt(item.prompt);
      setSelectedStyle(item.style);
      setAppState('REVIEW');
  };

  // --- Views ---

  const renderEmptyState = () => (
    <div 
      className="flex flex-col items-center justify-center h-full w-full bg-slate-50/50"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 text-center max-w-lg mx-4">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Redesign Your Space</h1>
        <p className="text-slate-500 mb-8">Upload a photo of your room to get started. Drag and drop or click below.</p>
        
        <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full sm:w-auto px-8 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
        >
          Upload Photo
        </Button>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload} 
        />
        <p className="mt-4 text-xs text-slate-400">Supported formats: JPG, PNG, WebP</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-800">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 z-10 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-lg"></div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Lumina</span>
          </div>
          
          <div className="flex items-center space-x-3">
             {appState === 'REVIEW' && (
                 <>
                    <Button variant="secondary" onClick={() => { setAppState('EDITING'); setGeneratedImage(null); }}>
                        Edit Original
                    </Button>
                    <Button variant="primary" onClick={handleDownload} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}>
                        Download
                    </Button>
                 </>
             )}
             {appState !== 'IDLE' && (
                 <button onClick={() => { setAppState('IDLE'); setBaseImage(null); }} className="text-slate-400 hover:text-slate-600 p-2">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             )}
          </div>
        </header>

        {/* Canvas / Workspace */}
        <main className="flex-1 relative bg-slate-100 overflow-hidden flex items-center justify-center p-4">
          {appState === 'IDLE' && renderEmptyState()}

          {(appState === 'EDITING' || appState === 'GENERATING') && baseImage && (
            <div className="w-full h-full max-w-5xl relative shadow-2xl rounded-2xl overflow-hidden bg-white ring-1 ring-black/5">
                <ImageEditor 
                    imageSrc={baseImage}
                    selectionMode={selectionMode}
                    isSelectMode={isSelectMode}
                    onSelectionChange={setSelectionBox}
                    onMaskChange={setMaskImage}
                />
                {appState === 'GENERATING' && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-900 font-medium text-lg animate-pulse">Designing your new space...</p>
                        <p className="text-indigo-900/60 text-sm mt-1">Using Gemini 2.5 Flash</p>
                    </div>
                )}
            </div>
          )}

          {appState === 'REVIEW' && baseImage && generatedImage && (
             <div className="w-full h-full max-w-5xl relative shadow-2xl rounded-2xl overflow-hidden bg-white ring-1 ring-black/5">
                <ComparisonView 
                    beforeImage={baseImage}
                    afterImage={generatedImage}
                />
             </div>
          )}
        </main>
      </div>

      {/* Sidebar - Conditional Render based on state */}
      {appState !== 'IDLE' && (
        <Sidebar 
          prompt={prompt}
          setPrompt={setPrompt}
          suggestions={suggestions}
          isSuggesting={isSuggesting}
          onRegenerateSuggestions={() => handleRegenerateSuggestions()}
          selectedStyle={selectedStyle}
          setSelectedStyle={setSelectedStyle}
          isSelectMode={isSelectMode}
          toggleSelectMode={() => setIsSelectMode(!isSelectMode)}
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          onGenerate={handleGenerate}
          onUploadRef={handleRefUpload}
          refImage={refImage}
          onRemoveRef={() => setRefImage(null)}
          onUploadObject={handleObjectUpload}
          objectImage={objectImage}
          onRemoveObject={() => setObjectImage(null)}
          isGenerating={appState === 'GENERATING'}
          history={history}
          onLoadHistory={handleLoadHistory}
          hasSelection={!!selectionBox || !!maskImage}
        />
      )}
    </div>
  );
}
