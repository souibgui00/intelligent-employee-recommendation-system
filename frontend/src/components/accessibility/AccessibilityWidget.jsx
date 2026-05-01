import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Eye, 
  Type, 
  MousePointer2, 
  RotateCcw, 
  X,
  Check
} from 'lucide-react';
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [readingGuide, setReadingGuide] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [guidePosition, setGuidePosition] = useState(0);

  // Handle Reading Guide Movement
  useEffect(() => {
    if (!readingGuide) return;

    const handleMouseMove = (e) => {
      setGuidePosition(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [readingGuide]);

  // Handle High Contrast
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('a11y-high-contrast');
    } else {
      document.documentElement.classList.remove('a11y-high-contrast');
    }
  }, [highContrast]);

  // Handle Font Size
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  const resetSettings = () => {
    setReadingGuide(false);
    setHighContrast(false);
    setFontSize(100);
  };

  return (
    <>
      {/* Reading Guide Line */}
      {readingGuide && (
        <div 
          className="fixed left-0 right-0 h-1 bg-primary/40 pointer-events-none z-[9999] shadow-[0_0_15px_rgba(242,140,27,0.5)] transition-all duration-75 ease-out"
          style={{ top: `${guidePosition}px`, transform: 'translateY(-50%)' }}
        />
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[999] group"
        aria-label="Accessibility Settings"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />}
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 p-6 z-[999] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Accessibility
            </h3>
            <button onClick={resetSettings} className="text-xs font-bold text-slate-400 hover:text-primary flex items-center gap-1 transition-colors">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="space-y-6">
            {/* Reading Guide Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setReadingGuide(!readingGuide)}>
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", readingGuide ? "bg-primary text-white" : "bg-white text-slate-400 border border-slate-200")}>
                  <MousePointer2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Reading Guide</p>
                  <p className="text-[10px] text-slate-500">Visual focus line</p>
                </div>
              </div>
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", readingGuide ? "bg-emerald-500" : "bg-slate-200")}>
                {readingGuide && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setHighContrast(!highContrast)}>
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", highContrast ? "bg-primary text-white" : "bg-white text-slate-400 border border-slate-200")}>
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">High Contrast</p>
                  <p className="text-[10px] text-slate-500">Easier to read text</p>
                </div>
              </div>
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", highContrast ? "bg-emerald-500" : "bg-slate-200")}>
                {highContrast && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>

            {/* Font Size Scaling */}
            <div className="space-y-3 px-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-900">Font Size</span>
                </div>
                <span className="text-xs font-black text-primary">{fontSize}%</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setFontSize(Math.max(80, fontSize - 10))}
                  className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors"
                >-</button>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(fontSize - 80) / (150 - 80) * 100}%` }} />
                </div>
                <button 
                  onClick={() => setFontSize(Math.min(150, fontSize + 10))}
                  className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors"
                >+</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
