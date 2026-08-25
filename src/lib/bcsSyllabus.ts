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

// Compute total completed percentage for a plan
export function calculatePlanPercentage(topics: TableTopicItem[]): number {
  if (!topics || topics.length === 0) return 0;
  
  let totalAchieved = 0;
  const weightedTopics = computeCellWeights(topics);

  weightedTopics.forEach((t) => {
    if (t.textbook) totalAchieved += (t.textbookWeight || 0);
    if (t.livemcq) totalAchieved += (t.livemcqWeight || 0);
    if (t.qbank) totalAchieved += (t.qbankWeight || 0);
    if (t.others) totalAchieved += (t.othersWeight || 0);
  });

  return Math.min(100, Math.round(totalAchieved));
}

// Check if a topic has explicit custom weights set by the user
export function hasCustomWeights(topic: TableTopicItem): boolean {
  return (
    topic.textbookWeight !== undefined &&
    topic.livemcqWeight !== undefined &&
    topic.qbankWeight !== undefined
  );
}

// Automatically distribute 100% of the day's total among all cells,
// or retain user-defined explicit weights if they provided them via format
export function computeCellWeights(topics: TableTopicItem[]): TableTopicItem[] {
  if (!topics || topics.length === 0) return [];

  // If all topics already have explicit custom weights, preserve them
  const allCustom = topics.every((t) => hasCustomWeights(t));
  if (allCustom) {
    return topics.map((t) => ({
      ...t,
      textbookWeight: Number(Number(t.textbookWeight || 0).toFixed(2)),
      livemcqWeight: Number(Number(t.livemcqWeight || 0).toFixed(2)),
      qbankWeight: Number(Number(t.qbankWeight || 0).toFixed(2)),
      othersWeight: Number(Number(t.othersWeight || 0).toFixed(2)),
    }));
  }

  const n = topics.length;
  const topicWeight = 100 / n;

  // Default distribution within each topic:
  // Textbook: 30%, LiveMCQ PDF: 35%, Q-Bank: 25%, Others: 10%
  return topics.map((t) => {
    if (hasCustomWeights(t)) {
      return {
        ...t,
        textbookWeight: Number(Number(t.textbookWeight || 0).toFixed(2)),
        livemcqWeight: Number(Number(t.livemcqWeight || 0).toFixed(2)),
        qbankWeight: Number(Number(t.qbankWeight || 0).toFixed(2)),
        othersWeight: Number(Number(t.othersWeight || 0).toFixed(2)),
      };
    }

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

/**
 * Format Parser:
 * Format: "topic > textbook percent > LIVE MCQ pdf percent > Q- Bank percent > Others percent will always be zero"
 * Example:
 * 1. সমাস ও সন্ধি > 5 > 8 > 4 > 0
 * 2. কারক ও বিভক্তি > 4.5 > 7 > 3.5 > 0
 *
 * Can also handle numbers in Bengali, optional number prefixes (e.g. "1.", "1)", "[1]"),
 * flexible separators ('>', '|', ',', ';', etc.), and clean extraction.
 */
export interface ParsedTopicResult {
  topics: TableTopicItem[];
  errors: string[];
  totalWeight: number;
}

export function parseTopicsFromCode(rawText: string, existingTopics: TableTopicItem[] = []): ParsedTopicResult {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const parsedTopics: TableTopicItem[] = [];
  const errors: string[] = [];

  // Helper to convert Bengali digits to English
  const normalizeDigits = (str: string): string => {
    const bnToEn: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    return str.replace(/[০-৯]/g, (d) => bnToEn[d] || d);
  };

  lines.forEach((line, idx) => {
    // Clean leading line numbering like "1.", "১.", "1)", "1 - ", "#1", etc.
    let cleanLine = line.replace(/^(\d+|[০-৯]+)[\.\)\-\:\s]+\s*/, "");
    
    // Split by '>'
    let parts = cleanLine.split(">").map((p) => p.trim());

    // Fallback: if user used '|' or ';' instead of '>'
    if (parts.length < 2 && cleanLine.includes("|")) {
      parts = cleanLine.split("|").map((p) => p.trim());
    }

    if (parts.length === 0 || !parts[0]) {
      return;
    }

    const topicName = parts[0];
    let tbPct = 0;
    let livePct = 0;
    let qbPct = 0;
    let othersPct = 0;
    let hasExplicitPct = false;

    // If weights were provided (at least textbook / live / qbank)
    if (parts.length >= 2) {
      hasExplicitPct = true;
      const parseNum = (val: string | undefined): number => {
        if (!val) return 0;
        const normalized = normalizeDigits(val.replace(/[%]/g, "").trim());
        const n = parseFloat(normalized);
        return isNaN(n) ? 0 : n;
      };

      tbPct = parseNum(parts[1]);
      livePct = parts.length >= 3 ? parseNum(parts[2]) : 0;
      qbPct = parts.length >= 4 ? parseNum(parts[3]) : 0;
      // Others is always 0 as requested or parsed
      othersPct = parts.length >= 5 ? parseNum(parts[4]) : 0;
    }

    // Check if matching an existing topic to preserve its checked state
    const existing = existingTopics.find(
      (t) => t.topic.trim().toLowerCase() === topicName.toLowerCase()
    );

    const newTopic: TableTopicItem = {
      id: existing ? existing.id : `topic_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      topic: topicName,
      details: existing?.details,
      textbook: existing ? existing.textbook : false,
      livemcq: existing ? existing.livemcq : false,
      qbank: existing ? existing.qbank : false,
      others: existing ? existing.others : false,
    };

    if (hasExplicitPct) {
      newTopic.textbookWeight = tbPct;
      newTopic.livemcqWeight = livePct;
      newTopic.qbankWeight = qbPct;
      newTopic.othersWeight = othersPct;
    }

    parsedTopics.push(newTopic);
  });

  const finalTopics = computeCellWeights(parsedTopics);
  const totalWeight = finalTopics.reduce((sum, t) => {
    return sum + (t.textbookWeight || 0) + (t.livemcqWeight || 0) + (t.qbankWeight || 0) + (t.othersWeight || 0);
  }, 0);

  return {
    topics: finalTopics,
    errors,
    totalWeight: Number(totalWeight.toFixed(2)),
  };
}

/**
 * Convert existing plan topics to formatted code string
 */
export function exportTopicsToCodeFormat(topics: TableTopicItem[]): string {
  const weighted = computeCellWeights(topics);
  return weighted
    .map((t, idx) => {
      const tb = t.textbookWeight !== undefined ? t.textbookWeight : 0;
      const live = t.livemcqWeight !== undefined ? t.livemcqWeight : 0;
      const qb = t.qbankWeight !== undefined ? t.qbankWeight : 0;
      const oth = t.othersWeight !== undefined ? t.othersWeight : 0;
      return `${idx + 1}. ${t.topic} > ${tb} > ${live} > ${qb} > ${oth}`;
    })
    .join("\n");
}

// Default 10 BCS Preliminary Subjects (২০০ নম্বর প্রিলিমিনারি সিলেবাস)
export const DEFAULT_BCS_10_SUBJECTS: TableTopicItem[] = computeCellWeights([
  {
    id: "bcs-sub-1",
    topic: "১. বাংলা ভাষা ও সাহিত্য (৩৫ নম্বর)",
    details: "ব্যাকরণ (১৫) ও সাহিত্য (প্রাচীন, মধ্য ও আধুনিক যুগ - ২০)",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "bcs-sub-2",
    topic: "২. ইংরেজি ভাষা ও সাহিত্য (৩৫ নম্বর)",
    details: "English Language & Grammar (20) and English Literature (15)",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "bcs-sub-3",
    topic: "৩. বাংলাদেশ বিষয়াবলী (৩০ নম্বর)",
    details: "ইতিহাস, মুক্তিযুদ্ধ, সংবিধান, অর্থনীতি, ভৌগোলিক বিষয় ও সাম্প্রতিক",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "bcs-sub-4",
    topic: "৪. আন্তর্জাতিক বিষয়াবলী (২০ নম্বর)",
    details: "বৈশ্বিক ইতিহাস, ভূ-রাজনীতি, আন্তর্জাতিক সংস্থা, নিরাপত্তা ও পরিবেশ",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "bcs-sub-5",
    topic: "৫. ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা (১০ নম্বর)",
    details: "বাংলাদেশ ও বৈশ্বিক ভূগোল, আবহাওয়া, জলবায়ু ও দুর্যোগ ব্যবস্থাপনা",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "bcs-sub-6",
    topic: "৬. সাধারণ বিজ্ঞান (১৫ নম্বর)",
    details: "ভৌত বিজ্ঞান, জীববিজ্ঞান এবং আধুনিক বিজ্ঞান",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "bcs-sub-7",
    topic: "৭. কম্পিউটার ও তথ্যপ্রযুক্তি (১৫ নম্বর)",
    details: "কম্পিউটার সংগঠন, ইন্টারনেট, নেটওয়ার্কিং, ডাটাবেস ও স্মার্ট ডিভাইস",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "bcs-sub-8",
    topic: "৮. গাণিতিক যুক্তি (১৫ নম্বর)",
    details: "পাটিগণিত, বীজগণিত, জ্যামিতি, বিন্যাস-সমাবেশ ও সম্ভাব্যতা",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "bcs-sub-9",
    topic: "৯. মানসিক দক্ষতা (১৫ নম্বর)",
    details: "ভাষাগত ও সংখ্যাগত যুক্তি, সমস্যা সমাধান ও স্থানিক সম্পর্ক",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
  {
    id: "bcs-sub-10",
    topic: "১০. নৈতিকতা, মূল্যবোধ ও সুশাসন (১০ নম্বর)",
    details: "সুশাসন ও নৈতিকতার স্বরূপ, মূল্যবোধ শিক্ষা ও জাতীয় জীবনে গুরুত্ব",
    textbook: false,
    livemcq: false,
    qbank: false,
    others: false,
  },
]);

export const DEFAULT_DAY_1_TOPICS = DEFAULT_BCS_10_SUBJECTS;

export function getInitialDay1Plan(date: string): DailyTablePlan {
  return {
    date,
    topics: DEFAULT_BCS_10_SUBJECTS,
    completionPercentage: 0,
    notes: "",
  };
}
