import { StudySource, BCSSubject, StudyTask, DailyPlan } from "../types";

export const BCS_SUBJECTS: { name: BCSSubject; marks: number; iconName: string; color: string }[] = [
  { name: 'বাংলা সাহিত্য ও ব্যাকরণ', marks: 35, iconName: 'BookOpen', color: 'emerald' },
  { name: 'English Language & Literature', marks: 35, iconName: 'Languages', color: 'blue' },
  { name: 'বাংলাদেশ বিষয়াবলী', marks: 30, iconName: 'MapPin', color: 'red' },
  { name: 'আন্তর্জাতিক বিষয়াবলী', marks: 20, iconName: 'Globe', color: 'indigo' },
  { name: 'গাণিতিক যুক্তি', marks: 15, iconName: 'Calculator', color: 'amber' },
  { name: 'মানসিক দক্ষতা', marks: 15, iconName: 'Brain', color: 'purple' },
  { name: 'সাধারণ বিজ্ঞান', marks: 15, iconName: 'Atom', color: 'teal' },
  { name: 'কম্পিউটার ও তথ্যপ্রযুক্তি', marks: 15, iconName: 'Cpu', color: 'cyan' },
  { name: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা', marks: 10, iconName: 'Compass', color: 'orange' },
  { name: 'নৈতিকতা ও সুশাসন', marks: 10, iconName: 'ShieldCheck', color: 'rose' },
];

export const SOURCE_CONFIG: Record<StudySource, { nameBangla: string; nameEng: string; color: string; bgClass: string; textClass: string; borderClass: string; icon: string }> = {
  textbook: {
    nameBangla: 'পাঠ্যবই ও ডাইজেস্ট',
    nameEng: 'Textbooks',
    color: 'emerald',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800/60',
    icon: 'Library',
  },
  livemcq: {
    nameBangla: 'লাইভ এমসিকিউ শিট ও এক্সাম',
    nameEng: 'LiveMCQ PDFs',
    color: 'blue',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800/60',
    icon: 'Smartphone',
  },
  question_bank: {
    nameBangla: 'বিসিএস প্রশ্নব্যাংক ও সমাধান',
    nameEng: 'Question Bank',
    color: 'amber',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-800 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800/60',
    icon: 'FileQuestion',
  },
  revision: {
    nameBangla: 'রিভিশন ও ভুল প্রশ্নের খাতা',
    nameEng: 'Revision Notes',
    color: 'purple',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800/60',
    icon: 'Repeat',
  },
};

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

// Sample BCS Daily Study Plans for 1-Click loading
export const SAMPLE_BCS_PLANS: { title: string; subtitle: string; plan: DailyPlan }[] = [
  {
    title: '৫১তম বিসিএস স্ট্যান্ডার্ড ডেইলি রুটিন (ভারসাম্যপূর্ণ)',
    subtitle: 'টেক্সটবুক থিওরি + লাইভ এমসিকিউ ডেইলি টেস্ট + বিগত সালের প্রশ্ন বিশ্লেষণ',
    plan: {
      date: new Date().toISOString().split('T')[0],
      daySummary: 'বাংলা ব্যাকরণ সন্ধি, বাংলাদেশ সংবিধানের মূলনীতি, ইংরেজি Idioms এবং ২০তম বিসিএস প্রশ্ন সমাধান।',
      strategyAdvice: 'প্রথমে মূল বই থেকে সন্ধির নিয়ম ও উদাহরণ পড়ে নিন, তারপর প্রশ্নব্যাংক সলভ করুন এবং দিনশেষে LiveMCQ PDF রিভিশন দিন।',
      totalEstimatedMinutes: 300,
      completionPercentage: 0,
      tasks: [
        {
          id: 'sample-1',
          title: 'বাংলা ব্যাকরণ: সন্ধি ও বিসর্গ সন্ধির সকল নিয়ম ও ব্যতিক্রম',
          subject: 'বাংলা সাহিত্য ও ব্যাকরণ',
          source: 'textbook',
          sourceDetails: 'নবম-দশম শ্রেণির বাংলা ব্যাকরণ ও জর্জ MP3 বাংলা (পৃঃ ৩৪-৪৪)',
          percentageWeight: 30,
          estimatedMinutes: 80,
          completed: false,
          importance: 'high',
          strategicTip: 'বিসর্গ সন্ধির ব্যতিক্রম শব্দগুলো খাতায় মার্ক করে মুখস্থ করুন।'
        },
        {
          id: 'sample-2',
          title: 'LiveMCQ ডেইলি টেস্ট শিট: সংবিধানের প্রস্তাবনা ও মূলনীতি (অনুচ্ছেদ ১-২৪)',
          subject: 'বাংলাদেশ বিষয়াবলী',
          source: 'livemcq',
          sourceDetails: 'LiveMCQ স্পেশাল বুলেটিন PDF #১৮ ও ডেইলি টেস্ট',
          percentageWeight: 25,
          estimatedMinutes: 60,
          completed: false,
          importance: 'high',
          strategicTip: 'মৌলিক অধিকারের অনুচ্ছেদগুলো ছন্দ দিয়ে মনে রাখার চেষ্টা করুন।'
        },
        {
          id: 'sample-3',
          title: 'English: Prepositions & Idioms (A to C) - বিগত প্রশ্নের ব্যাখ্যা',
          subject: 'English Language & Literature',
          source: 'question_bank',
          sourceDetails: 'বিসিএস প্রশ্নব্যাংক ১০ম-৪৫তম ও জব সলিউশন',
          percentageWeight: 25,
          estimatedMinutes: 60,
          completed: false,
          importance: 'medium',
          strategicTip: 'Appropriate Preposition বাক্য তৈরি করে রিডিং পড়ুন।'
        },
        {
          id: 'sample-4',
          title: 'গাণিতিক যুক্তি: শতকরা ও লাভ-ক্ষতির শর্টকাট টেকনিক ও ৩০টি ম্যাথ সলভ',
          subject: 'গাণিতিক যুক্তি',
          source: 'textbook',
          sourceDetails: 'খায়রুলস বেসিক ম্যাথ (অধ্যায় ৫)',
          percentageWeight: 20,
          estimatedMinutes: 50,
          completed: false,
          importance: 'medium',
          strategicTip: 'টাইপ ভিত্তিক সূত্রের চার্ট বানিয়ে হাতে কলমে হিসাব প্র্যাকটিস করুন।'
        }
      ]
    }
  },
  {
    title: 'বিসিএস মেগা রিভিশন ও লাইভ এক্সাম ডে',
    subtitle: 'আন্তর্জাতিক বিষয়াবলী + বিজ্ঞান ও আইসিটি + লাইভ এমসিকিউ স্পেশাল মডেল টেস্ট',
    plan: {
      date: new Date().toISOString().split('T')[0],
      daySummary: 'আন্তর্জাতিক সংস্থা (জাতিসংঘ, বিশ্বব্যাংক) + কম্পিউটার মেমোরি ও নেটওয়ার্কিং + LiveMCQ ১০০ মার্কস টেস্ট।',
      strategyAdvice: 'আগের দিনের ভুল প্রশ্নগুলো সকালে রিভিশন দিয়ে দুপুরে মূল বিষয়ের তথ্য পড়ুন এবং রাতে ফুল মডেল টেস্ট দিন।',
      totalEstimatedMinutes: 280,
      completionPercentage: 0,
      tasks: [
        {
          id: 'sample-rev-1',
          title: 'আন্তর্জাতিক সংস্থা: জাতিসংঘ, অঙ্গসংগঠন, সদর দপ্তর ও সাম্প্রতিক সম্মেলন',
          subject: 'আন্তর্জাতিক বিষয়াবলী',
          source: 'textbook',
          sourceDetails: 'জোবায়েরস জিকে / এমপি৩ আন্তর্জাতিক',
          percentageWeight: 30,
          estimatedMinutes: 75,
          completed: false,
          importance: 'high',
          strategicTip: 'সদর দপ্তরগুলো শহরভিত্তিক গ্রুপ করে মনে রাখুন।'
        },
        {
          id: 'sample-rev-2',
          title: 'LiveMCQ 51st BCS Special Subject Model Test (100 Marks)',
          subject: 'বাংলাদেশ বিষয়াবলী',
          source: 'livemcq',
          sourceDetails: 'LiveMCQ App লাইভ এক্সাম ও পোস্ট-এক্সাম অ্যানালাইসিস PDF',
          percentageWeight: 35,
          estimatedMinutes: 90,
          completed: false,
          importance: 'high',
          strategicTip: 'এক্সাম শেষে নেগেটিভ মার্কিং হওয়া প্রতিটি ভুল প্রশ্ন নোট করুন।'
        },
        {
          id: 'sample-rev-3',
          title: 'কম্পিউটার ও আইসিটি: ডাটা কমিউনিকেশন, নেটওয়ার্ক টপোলজি ও ক্লাউড কম্পিউটিং',
          subject: 'কম্পিউটার ও তথ্যপ্রযুক্তি',
          source: 'textbook',
          sourceDetails: 'সেল রিলিজিয়ন আইসিটি / ইজি কম্পিউটার',
          percentageWeight: 20,
          estimatedMinutes: 50,
          completed: false,
          importance: 'medium',
          strategicTip: 'OSI 7 Layers এবং IP Address ক্লাসিফিকেশন স্পষ্ট রাখুন।'
        },
        {
          id: 'sample-rev-4',
          title: 'ভুল হওয়া প্রশ্ন খাতা (Mistake Notebook) ও দুর্বল টপিক রিভিশন',
          subject: 'সাধারণ বিজ্ঞান',
          source: 'revision',
          sourceDetails: 'ব্যক্তিগত রিভিশন ডায়েরি',
          percentageWeight: 15,
          estimatedMinutes: 40,
          completed: false,
          importance: 'high',
          strategicTip: 'যেসব প্রশ্নে দ্বিধায় পড়ে নেগেটিভ খেয়েছেন সেগুলো পুনরায় ঝালাই করুন।'
        }
      ]
    }
  }
];
