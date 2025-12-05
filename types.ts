export interface ShiftData {
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface DayCellProps {
  day: number;
  dateString: string;
  isSelected: boolean;
  isToday: boolean;
  onClick: (dateString: string) => void;
  disabled?: boolean;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
