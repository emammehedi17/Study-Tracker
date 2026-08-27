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

export interface UncompletedTask {
  id: string;
  title: string;
  originalDate: string; // Which day's task it was (e.g. "2026-08-20" or "Day 1")
  deadlineDate: string; // Target deadline date (YYYY-MM-DD)
  subject?: string;
  priority?: "low" | "medium" | "high";
  notes?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

