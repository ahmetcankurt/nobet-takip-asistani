import React from 'react';
import { DayCellProps } from '../types';
import { Check } from 'lucide-react';

const DayCell: React.FC<DayCellProps> = ({ 
  day, 
  dateString, 
  isSelected, 
  isToday, 
  onClick,
  disabled 
}) => {
  // Empty cell for padding days
  if (disabled) {
    return <div className="w-full h-full bg-slate-50/30 dark:bg-slate-900/30 border border-transparent rounded-lg"></div>;
  }

  return (
    <button
      onClick={() => onClick(dateString)}
      className={`
        relative group w-full h-full min-h-[40px] rounded-lg border transition-all duration-200 ease-in-out flex flex-col items-center justify-center
        outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 dark:focus:ring-offset-slate-900
        ${isSelected 
          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm dark:bg-indigo-600 dark:border-indigo-600' 
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-750'
        }
        ${isToday && !isSelected ? 'border-indigo-400 dark:border-indigo-400 ring-1 ring-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20' : ''}
      `}
      aria-label={`Select date ${day}`}
      aria-pressed={isSelected}
    >
      {/* Day Number */}
      <span className={`text-xl sm:text-2xl lg:text-3xl font-bold transition-colors ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
        {day}
      </span>
      
      {/* Selected Indicator Icon (Only visible on larger screens to save space on small grids) */}
      {isSelected && (
        <div className="hidden sm:block absolute top-1 right-1 animate-in fade-in zoom-in duration-200">
          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-200" />
        </div>
      )}

      {/* Today Dot Indicator */}
      {isToday && (
        <span className={`absolute bottom-1.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-indigo-500 dark:bg-indigo-400'}`}></span>
      )}
    </button>
  );
};

export default DayCell;