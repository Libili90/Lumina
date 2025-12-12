import React, { useRef, useState, useEffect } from 'react';
import { SelectionBox, SelectionMode } from '../types';

interface ImageEditorProps {
  imageSrc: string;
  selectionMode: SelectionMode;
  isSelectMode: boolean; // toggle for tool active/inactive
  onSelectionChange: (box: SelectionBox | null) => void;
  onMaskChange: (maskBase64: string | null) => void;
  className?: string;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ 
  imageSrc, 
  selectionMode,
  isSelectMode, 
  onSelectionChange,
  onMaskChange,
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<SelectionBox | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Brush Settings
  const [brushSize, setBrushSize] = useState(30);

  // Undo/Redo State
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);

  // Initialize canvas size and history
  const initCanvas = () => {
    if (imgRef.current && canvasRef.current) {
      // Use client dimensions to match visual overlay
      const rect = imgRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
      
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // Save initial blank state
        const blankData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHistory([blankData]);
        setHistoryStep(0);
      }
      setHasDrawn(false);
      onMaskChange(null);
    }
  };

  const handleImageLoad = () => {
    initCanvas();
  };

  // Resize observer to keep canvas synced
  useEffect(() => {
    const handleResize = () => {
        // Reset on resize to avoid coordinate/resolution mismatch issues
        initCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageSrc]);

  const getRelativePos = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // --- HISTORY HANDLERS ---

  const saveHistory = () => {
      const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
      if (ctx && canvasRef.current) {
          const data = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
          // If we are in the middle of history (undid some steps), discard the future
          const newHistory = history.slice(0, historyStep + 1);
          newHistory.push(data);
          setHistory(newHistory);
          setHistoryStep(newHistory.length - 1);
      }
  };

  const handleUndo = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (historyStep > 0) {
          const newStep = historyStep - 1;
          setHistoryStep(newStep);
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
              ctx.putImageData(history[newStep], 0, 0);
              
              const isBlank = newStep === 0;
              setHasDrawn(!isBlank);
              onMaskChange(isBlank ? null : canvasRef.current?.toDataURL() || null);
          }
      }
  };

  const handleRedo = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (historyStep < history.length - 1) {
          const newStep = historyStep + 1;
          setHistoryStep(newStep);
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
              ctx.putImageData(history[newStep], 0, 0);
              setHasDrawn(true);
              onMaskChange(canvasRef.current?.toDataURL() || null);
          }
      }
  };

  // --- MOUSE HANDLERS ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelectMode) return;
    const { x, y } = getRelativePos(e);
    setIsDrawing(true);
    setStartPos({ x, y });

    if (selectionMode === 'BOX') {
      setCurrentBox({ x, y, width: 0, height: 0 });
    } else if (selectionMode === 'BRUSH') {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize; 
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)'; // Indigo-500 with opacity
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelectMode || !isDrawing) return;
    const { x, y } = getRelativePos(e);

    if (selectionMode === 'BOX') {
        const newWidth = x - startPos.x;
        const newHeight = y - startPos.y;
        setCurrentBox({
          x: newWidth > 0 ? startPos.x : x,
          y: newHeight > 0 ? startPos.y : y,
          width: Math.abs(newWidth),
          height: Math.abs(newHeight)
        });
    } else if (selectionMode === 'BRUSH') {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
            setHasDrawn(true);
        }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      
      if (selectionMode === 'BOX') {
        onSelectionChange(currentBox);
      } else if (selectionMode === 'BRUSH') {
        if (canvasRef.current) {
            saveHistory(); // Save state after stroke
            onMaskChange(canvasRef.current.toDataURL());
        }
      }
    }
  };

  // Clear selection logic when modes change
  useEffect(() => {
    if (!isSelectMode) {
      setCurrentBox(null);
      onSelectionChange(null);
    }
  }, [isSelectMode, onSelectionChange]);

  // Effect to handle switching modes
  useEffect(() => {
      if (selectionMode === 'BOX') {
          // Reset brush canvas when switching to box
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx && canvasRef.current) {
               ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
               // Reset history
               const blank = ctx.getImageData(0,0, canvasRef.current.width, canvasRef.current.height);
               setHistory([blank]);
               setHistoryStep(0);
               setHasDrawn(false);
          }
          onMaskChange(null);
      } else {
          // Switching to Brush
          setCurrentBox(null);
          onSelectionChange(null);
      }
  }, [selectionMode]);

  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center bg-slate-50 overflow-hidden ${className}`}
      onMouseUp={handleMouseUp}
    >
      <div 
        ref={containerRef}
        className={`relative inline-block shadow-2xl ${isSelectMode ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Main Image */}
        <img 
          ref={imgRef}
          src={imageSrc} 
          alt="Workspace" 
          className="max-h-[70vh] max-w-full object-contain rounded-lg select-none pointer-events-none" 
          draggable={false}
          onLoad={handleImageLoad}
        />

        {/* Brush Canvas Overlay */}
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 pointer-events-none ${selectionMode === 'BRUSH' && isSelectMode ? 'z-20' : 'z-10'}`}
        />
        
        {/* Box Selection Overlay */}
        {currentBox && selectionMode === 'BOX' && (
          <div 
            className="absolute border-2 border-indigo-500 bg-indigo-500/20 z-20 pointer-events-none"
            style={{
              left: currentBox.x,
              top: currentBox.y,
              width: currentBox.width,
              height: currentBox.height
            }}
          >
            <div className="absolute -top-3 left-0 bg-indigo-500 text-white text-[10px] px-1 rounded-t">
              Selection
            </div>
          </div>
        )}

        {/* Instructions Overlay */}
        {isSelectMode && !currentBox && !isDrawing && !hasDrawn && historyStep <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none z-30">
                <div className="bg-black/70 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur">
                    {selectionMode === 'BOX' ? 'Click and drag box' : 'Paint to select area'}
                </div>
            </div>
        )}

        {/* Floating Toolbar (Brush Size + Undo/Redo) */}
        {isSelectMode && selectionMode === 'BRUSH' && (
             <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white/90 backdrop-blur border border-slate-200 p-2 rounded-xl shadow-xl z-40 pointer-events-auto">
                {/* Brush Size Slider */}
                <div className="flex items-center space-x-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                    <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        value={brushSize} 
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                        title={`Brush size: ${brushSize}px`}
                    />
                    <div className="w-4 h-4 rounded-full bg-slate-400"></div>
                </div>

                <div className="w-px h-6 bg-slate-200"></div>

                {/* Undo/Redo Buttons */}
                <div className="flex items-center space-x-1">
                    <button 
                        className={`p-2 rounded-lg transition-colors ${historyStep > 0 ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'}`}
                        onClick={handleUndo}
                        disabled={historyStep <= 0}
                        title="Undo"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    <button 
                        className={`p-2 rounded-lg transition-colors ${historyStep < history.length - 1 ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'}`}
                        onClick={handleRedo}
                        disabled={historyStep >= history.length - 1}
                        title="Redo"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                    </button>
                </div>
             </div>
        )}

      </div>
    </div>
  );
};
