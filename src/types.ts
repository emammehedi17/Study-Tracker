export interface TableTopicItem {
  id: string;
  topic: string;
  details?: string;
  textbook: boolean;
  livemcq: boolean;
  qbank: boolean;
  others: boolean;
  // Individual weights (percentages from 100% of day)
  textbookWeight?: number;
  livemcqWeight?: number;
  qbankWeight?: number;
  othersWeight?: number;
}

export interface DailyTablePlan {
  date: string; // YYYY-MM-DD
  topics: TableTopicItem[];
  completionPercentage: number;
  notes?: string;
  updatedAt?: string;
}

export interface UserStats {
  streakDays: number;
  lastStudiedDate: string;
}

