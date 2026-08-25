import { TableTopicItem, DailyTablePlan } from "../types";

// Bengali numbers converter
export function toBengaliNumber(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

// Bengali Date Formatter
export function formatBanglaDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  
  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const daysBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  
  const day = toBengaliNumber(date.getDate());
  const month = monthsBn[date.getMonth()];
  const year = toBengaliNumber(date.getFullYear());
  const dayName = daysBn[date.getDay()];
  
  return `${day} ${month}, ${year} (${dayName})`;
}

// Automatically distribute 100% of the day's total among all cells
export function computeCellWeights(topics: TableTopicItem[]): TableTopicItem[] {
  if (!topics || topics.length === 0) return [];
  const n = topics.length;
  const topicWeight = 100 / n;

  // Distribution within each topic:
  // Textbook: 30%, LiveMCQ PDF: 35%, Q-Bank: 25%, Others: 10%
  return topics.map((t) => {
    const tbW = Number((topicWeight * 0.30).toFixed(2));
    const liveW = Number((topicWeight * 0.35).toFixed(2));
    const qbW = Number((topicWeight * 0.25).toFixed(2));
    const othW = Number((topicWeight * 0.10).toFixed(2));

    return {
      ...t,
      textbookWeight: tbW,
      livemcqWeight: liveW,
      qbankWeight: qbW,
      othersWeight: othW,
    };
  });
}

// Default Day-1 BCS Bangla Grammar & Literature Topics
export const DEFAULT_DAY_1_TOPICS: TableTopicItem[] = computeCellWeights([
  {
    id: "topic-1",
    topic: "শব্দগঠন, শব্দদ্বিত্ব ও সংখ্যাবাচক শব্দ",
    details: "বোর্ড ব্যাকরণ বই • LiveMCQ লেকচার ১ শিট",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "topic-2",
    topic: "বিশেষ্য ও সর্বনাম পদ",
    details: "নবম-দশম বোর্ড ব্যাকরণ • LiveMCQ লেকচার ২ শিট",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "topic-3",
    topic: "বিশেষণ ও অনুসর্গ",
    details: "বোর্ড ব্যাকরণ ও বাউবি • LiveMCQ লেকচার ৩ শিট",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "topic-4",
    topic: "ক্রিয়া ও ক্রিয়া বিশেষণ",
    details: "বোর্ড ব্যাকরণ বই • LiveMCQ লেকচার ৪ শিট",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "topic-5",
    topic: "যোজক ও আবেগ শব্দ",
    details: "বাংলা ব্যাকরণ বোর্ড বই • LiveMCQ লেকচার ৫ শিট",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "topic-6",
    topic: "পুরুষ ও স্ত্রী-বাচক শব্দ এবং পদাশ্রিত নির্দেশক",
    details: "বোর্ড ব্যাকরণ বই • LiveMCQ লেকচার ৬ শিট",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "topic-7",
    topic: "বাংলা বানান ও শুদ্ধীকরণ (পর্ব ১ ও ২)",
    details: "বাংলা একাডেমি প্রমিত বানান • LiveMCQ লেকচার ৭ ও ৮",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "topic-8",
    topic: "বাক্য শুদ্ধি ও প্রয়োগ-অপপ্রয়োগ",
    details: "বিসিএস প্রশ্নব্যাংক ও LiveMCQ লেকচার ৯",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
]);

export function getInitialDay1Plan(date: string): DailyTablePlan {
  return {
    date,
    topics: DEFAULT_DAY_1_TOPICS,
    completionPercentage: 0,
    notes: "",
  };
}
