export type StudySource = 'textbook' | 'livemcq' | 'question_bank' | 'revision';

export type BCSSubject =
  | 'বাংলা সাহিত্য ও ব্যাকরণ'
  | 'English Language & Literature'
  | 'বাংলাদেশ বিষয়াবলী'
  | 'আন্তর্জাতিক বিষয়াবলী'
  | 'গাণিতিক যুক্তি'
  | 'মানসিক দক্ষতা'
  | 'সাধারণ বিজ্ঞান'
  | 'কম্পিউটার ও তথ্যপ্রযুক্তি'
  | 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা'
  | 'নৈতিকতা ও সুশাসন';

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  source: StudySource;
  sourceDetails?: string;
  percentageWeight: number; // Analyzed weight relative to other tasks, sum = 100%
  estimatedMinutes: number;
  actualMinutes?: number;
  completed: boolean;
  completedAt?: string;
  importance?: 'high' | 'medium' | 'low';
  strategicTip?: string;
  notes?: string;
}

export interface DailyPlan {
  id?: string;
  date: string; // YYYY-MM-DD
  tasks: StudyTask[];
  daySummary?: string;
  strategyAdvice?: string;
  totalEstimatedMinutes?: number;
  actualStudyMinutes?: number;
  completionPercentage: number;
  updatedAt?: string;
  dayReflection?: string;
}

export interface MockExamScore {
  id: string;
  date: string;
  title: string;
  source: 'LiveMCQ' | 'Question Bank' | 'Model Test' | 'Self Practice';
  subject?: string;
  totalMarks: number;
  obtainedMarks: number;
  negativeMarks: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  rank?: string;
  weakTopics?: string;
  notes?: string;
}

export interface MistakeNote {
  id: string;
  date: string;
  question: string;
  correctAnswer: string;
  explanation?: string;
  subject: string;
  source: string;
  reviewedCount: number;
  mastered: boolean;
  tag?: string;
}

export interface UserStats {
  totalTasksCompleted: number;
  totalStudyMinutes: number;
  streakDays: number;
  lastStudiedDate: string;
  averageWeeklyScore: number;
  sourcesCompletedCount: {
    textbook: number;
    livemcq: number;
    question_bank: number;
    revision: number;
  };
}

export interface AIPlanAnalysisResponse {
  daySummary: string;
  totalEstimatedMinutes: number;
  strategyAdvice: string;
  tasks: {
    title: string;
    source: StudySource;
    subject: string;
    sourceDetails?: string;
    estimatedMinutes: number;
    percentageWeight: number;
    importance?: 'high' | 'medium' | 'low';
    strategicTip?: string;
  }[];
}

export interface AIMentorFeedback {
  mentorVerdict: string;
  strengths: string[];
  recommendations: string[];
  motivationalQuote: string;
}
