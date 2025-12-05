import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import DayCell from './components/DayCell';
import AnalysisModal from './components/AnalysisModal';
import { analyzeSchedule } from './services/geminiService';
import { AnalysisStatus } from './types';
import { Save, Undo2, Redo2, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'nobet_kayitlari';
const THEME_KEY = 'nobet_tema';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- THEME MANAGEMENT ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check local storage or system preference on initial load
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Apply theme class to HTML element
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- HISTORY & STATE MANAGEMENT ---
  
  // History stores arrays of shift strings (snapshots of the schedule)
  const [history, setHistory] = useState<string[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Holds the exact data that is currently inside localStorage
  // We use this to compare with current state to see if "Save" is needed
  const [savedSnapshot, setSavedSnapshot] = useState<string[]>([]);
  
  const [showToast, setShowToast] = useState(false);

  // Load initial data once on mount
  useEffect(() => {
    try {
      const savedShifts = localStorage.getItem(STORAGE_KEY);
      let initialShifts: string[] = [];
      if (savedShifts) {
        initialShifts = JSON.parse(savedShifts) as string[];
      }
      setHistory([initialShifts]);
      setHistoryIndex(0);
      setSavedSnapshot(initialShifts);
    } catch (e) {
      console.error("Kayıtlar yüklenirken hata oluştu:", e);
      setHistory([[]]);
      setHistoryIndex(0);
      setSavedSnapshot([]);
    }
  }, []);

  // Derived state for current shifts based on history pointer
  const currentShiftsSet = useMemo(() => {
    if (historyIndex >= 0 && history[historyIndex]) {
      return new Set(history[historyIndex]);
    }
    return new Set<string>();
  }, [history, historyIndex]);

  // INTELLIGENT SAVE CHECK
  // Compares the current history state with the last saved snapshot
  const hasUnsavedChanges = useMemo(() => {
    if (historyIndex < 0 || !history[historyIndex]) return false;
    
    const current = history[historyIndex];
    
    if (current.length !== savedSnapshot.length) return true;

    // Sort both arrays to ensure order doesn't affect comparison
    const sortedCurrent = [...current].sort();
    const sortedSaved = [...savedSnapshot].sort();

    return JSON.stringify(sortedCurrent) !== JSON.stringify(sortedSaved);
  }, [history, historyIndex, savedSnapshot]);

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- ACTIONS ---

  const handleSave = () => {
    if (historyIndex >= 0) {
      const currentData = history[historyIndex];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
      
      // Update the snapshot to match the current data
      setSavedSnapshot(currentData);
      
      // Show success toast
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const toggleShift = (dateString: string) => {
    const newSet = new Set(currentShiftsSet);
    if (newSet.has(dateString)) {
      newSet.delete(dateString);
    } else {
      newSet.add(dateString);
    }

    const newShiftsArray = Array.from(newSet);

    // Slice history to remove any "future" states if we were in the middle of undoing
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShiftsArray);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // --- DATE CALCULATION ---

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  // Adjust so Monday is 0 (Turkey standard)
  const startingSlot = (firstDayOfMonth + 6) % 7; 

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleAnalyze = async () => {
    setAnalysisStatus(AnalysisStatus.LOADING);
    const monthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    
    const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthlyShifts = (Array.from(currentShiftsSet) as string[]).filter(s => s.startsWith(currentMonthPrefix));

    if (monthlyShifts.length === 0) {
        setAnalysisResult("Bu ay için henüz hiç nöbet seçmediniz.");
        setAnalysisStatus(AnalysisStatus.SUCCESS);
        setIsModalOpen(true);
        return;
    }

    const result = await analyzeSchedule(monthName, monthlyShifts);
    setAnalysisResult(result);
    setAnalysisStatus(AnalysisStatus.SUCCESS);
    setIsModalOpen(true);
  };

  // --- RENDER HELPERS ---

  const renderCalendarGrid = () => {
    const cells = [];
    
    // Always create a 6-row grid (42 cells) to keep layout stable
    // 6 rows * 7 cols = 42
    const totalSlots = 42; 

    // Empty slots before first day
    for (let i = 0; i < startingSlot; i++) {
      cells.push(<DayCell key={`empty-start-${i}`} day={0} dateString="" isSelected={false} isToday={false} onClick={() => {}} disabled={true} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = currentShiftsSet.has(dateString);
      
      const today = new Date();
      const isToday = 
        day === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear();

      cells.push(
        <DayCell 
          key={dateString}
          day={day}
          dateString={dateString}
          isSelected={isSelected}
          isToday={isToday}
          onClick={toggleShift}
        />
      );
    }

    // Fill remaining slots
    const filledSlots = startingSlot + daysInMonth;
    for (let i = filledSlots; i < totalSlots; i++) {
       cells.push(<DayCell key={`empty-end-${i}`} day={0} dateString="" isSelected={false} isToday={false} onClick={() => {}} disabled={true} />);
    }

    return cells;
  };

  const currentMonthShiftsCount = useMemo(() => {
    const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return (Array.from(currentShiftsSet) as string[]).filter(s => s.startsWith(currentMonthPrefix)).length;
  }, [currentShiftsSet, year, month]);

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
      
      {/* FIXED TOP HEADER */}
      <div className="flex-none z-20">
        <Header 
          currentDate={currentDate} 
          onPrevMonth={handlePrevMonth} 
          onNextMonth={handleNextMonth} 
          onAnalyze={handleAnalyze}
          analysisStatus={analysisStatus}
          hasShifts={currentMonthShiftsCount > 0}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </div>

      {/* MAIN CONTENT - SCROLLABLE IF NEEDED BUT FITS SCREEN */}
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 min-h-0 relative">
        
        {/* Weekday Headers */}
        <div className="flex-none grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center py-1 text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Responsive Calendar Grid - Fills remaining space */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 sm:gap-2 pb-2">
          {renderCalendarGrid()}
        </div>

      </main>
      
      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Değişiklikler başarıyla kaydedildi</span>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM FOOTER / CONTROLS */}
      <div className="flex-none bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300 w-full sm:w-auto justify-center sm:justify-start">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500"></span>
                    <span>Toplam: <strong className="text-slate-900 dark:text-white">{currentMonthShiftsCount}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                    <span>Boş: <strong className="text-slate-900 dark:text-white">{daysInMonth - currentMonthShiftsCount}</strong></span>
                </div>
            </div>

            {/* Controls (Undo/Redo/Save) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <button 
                  onClick={handleUndo} 
                  disabled={historyIndex <= 0}
                  className="p-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                  title="Geri Al"
                >
                  <Undo2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Geri</span>
                </button>
                
                <button 
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                  title="İleri Al"
                >
                  <Redo2 className="w-4 h-4" />
                  <span className="hidden sm:inline">İleri</span>
                </button>

                <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className={`
                    flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200
                    ${!hasUnsavedChanges 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 dark:bg-indigo-600 dark:hover:bg-indigo-500'
                    }
                  `}
                >
                  {!hasUnsavedChanges ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{!hasUnsavedChanges ? 'Kaydedildi' : 'Kaydet'}</span>
                </button>
            </div>
        </div>
      </div>

      <AnalysisModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        content={analysisResult} 
      />
    </div>
  );
};

export default App;