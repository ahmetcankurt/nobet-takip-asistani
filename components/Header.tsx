import React from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Calendar as CalendarIcon, Moon, Sun } from 'lucide-react';
import { AnalysisStatus } from '../types';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAnalyze: () => void;
  analysisStatus: AnalysisStatus;
  hasShifts: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  onAnalyze, 
  analysisStatus,
  hasShifts,
  theme,
  toggleTheme
}) => {
  // Use Turkish locale for month name
  const monthName = currentDate.toLocaleString('tr-TR', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo / Title */}
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <CalendarIcon className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Nöbet Takip</h1>
        </div>

        {/* Navigation */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 transition-colors duration-300">
          <button 
            onClick={onPrevMonth}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-md transition-all text-slate-600 dark:text-slate-300"
            aria-label="Önceki Ay"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-6 py-1 font-semibold text-slate-700 dark:text-slate-200 min-w-[160px] text-center select-none capitalize">
            {monthName} {year}
          </span>
          <button 
            onClick={onNextMonth}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-md transition-all text-slate-600 dark:text-slate-300"
            aria-label="Sonraki Ay"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
           <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={theme === 'dark' ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={onAnalyze}
            disabled={analysisStatus === AnalysisStatus.LOADING}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg active:scale-95 
              dark:bg-indigo-600 dark:hover:bg-indigo-500
              disabled:opacity-70 disabled:cursor-wait disabled:active:scale-100
            `}
          >
            {analysisStatus === AnalysisStatus.LOADING ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Analiz</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;