import { AIPlanAnalysisResponse, BCSSubject, StudySource, StudyTask } from "../types";

export function analyzePlanOffline(text: string, targetDate: string): AIPlanAnalysisResponse {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("---") && !l.startsWith("==="));

  if (lines.length === 0) {
    return {
      daySummary: "আজকের জন্য রুটিন প্রস্তুত করা হয়েছে। প্রতিটি বিষয়ের গুরুত্ব অনুযায়ী ভাগ করা হলো।",
      totalEstimatedMinutes: 180,
      strategyAdvice: "প্রথমে পাঠ্যবই থেকে কনসেপ্ট রিডিং পড়ুন, এরপর প্রশ্নব্যাংক সলভ করে লাইভ এমসিকিউ দিয়ে নিজেকে যাচাই করুন।",
      tasks: [
        {
          title: "বাংলা সাহিত্য ও ব্যাকরণ রিডিং",
          source: "textbook",
          subject: "বাংলা সাহিত্য ও ব্যাকরণ",
          sourceDetails: "পাঠ্যবই ও ডাইজেস্ট",
          percentageWeight: 35,
          estimatedMinutes: 60,
          importance: "high",
          strategicTip: "বিসিএস প্রিলিতে বাংলা ৩৫ নম্বরের অন্যতম গুরুত্বপূর্ণ অংশ।"
        },
        {
          title: "বাংলাদেশ বিষয়াবলী বিগত প্রশ্নব্যাংক",
          source: "question_bank",
          subject: "বাংলাদেশ বিষয়াবলী",
          sourceDetails: "১০ম-৪৫তম বিসিএস প্রশ্নব্যাংক",
          percentageWeight: 35,
          estimatedMinutes: 60,
          importance: "high",
          strategicTip: "সংবিধান ও মুক্তিযুদ্ধ অংশ থেকে প্রতি বছর নিশ্চিত প্রশ্ন থাকে।"
        },
        {
          title: "LiveMCQ ডেইলি টেস্ট ও পিডিএফ রিভিশন",
          source: "livemcq",
          subject: "English Language & Literature",
          sourceDetails: "LiveMCQ PDF",
          percentageWeight: 30,
          estimatedMinutes: 45,
          importance: "medium",
          strategicTip: "ভুল হওয়া প্রশ্নগুলো সাথে সাথে নোট করে রাখুন।"
        }
      ]
    };
  }

  const tasks: AIPlanAnalysisResponse["tasks"] = [];

  lines.forEach((line, index) => {
    const cleanLine = line.replace(/^[০-৯0-9\.\-\*\)\(\s]+/, "").trim();
    if (!cleanLine) return;

    let source: StudySource = "textbook";
    let subject: BCSSubject = "বাংলাদেশ বিষয়াবলী";
    let sourceDetails = "";
    let minutes = 45;

    const lower = cleanLine.toLowerCase();

    // Source detection
    if (lower.includes("livemcq") || lower.includes("live mcq") || lower.includes("pdf") || lower.includes("পিডিএফ") || lower.includes("ডেইলি এক্সাম") || lower.includes("মডেল টেস্ট")) {
      source = "livemcq";
      sourceDetails = "LiveMCQ PDF / Daily Exam";
    } else if (lower.includes("প্রশ্নব্যাংক") || lower.includes("question bank") || lower.includes("বিগত") || lower.includes("job solution") || lower.includes("জব সলিউশন") || lower.includes("সলভ")) {
      source = "question_bank";
      sourceDetails = "বিসিএস প্রশ্নব্যাংক ও জব সলিউশন";
    } else if (lower.includes("রিভিশন") || lower.includes("ভুল") || lower.includes("নোট") || lower.includes("mistake") || lower.includes("review")) {
      source = "revision";
      sourceDetails = "ভুল প্রশ্ন খাতা ও রিভিশন";
    } else {
      source = "textbook";
      sourceDetails = "পাঠ্যবই / ডাইজেস্ট / বোর্ড বই";
    }

    // Subject detection
    if (lower.includes("বাংলা") || lower.includes("bangla") || lower.includes("ব্যাকরণ") || lower.includes("সাহিত্য") || lower.includes("ধ্বনি") || lower.includes("সন্ধি") || lower.includes("সমাস")) {
      subject = "বাংলা সাহিত্য ও ব্যাকরণ";
    } else if (lower.includes("english") || lower.includes("ইংরেজি") || lower.includes("grammar") || lower.includes("vocab") || lower.includes("preposition") || lower.includes("idiom") || lower.includes("literature")) {
      subject = "English Language & Literature";
    } else if (lower.includes("সংবিধান") || lower.includes("মুক্তিযুদ্ধ") || lower.includes("বাংলাদেশ") || lower.includes("bangladesh") || lower.includes("বঙ্গবন্ধু") || lower.includes("ইতিহাস")) {
      subject = "বাংলাদেশ বিষয়াবলী";
    } else if (lower.includes("আন্তর্জাতিক") || lower.includes("international") || lower.includes("জাতিসংঘ") || lower.includes("ভূ-রাজনীতি")) {
      subject = "আন্তর্জাতিক বিষয়াবলী";
    } else if (lower.includes("গণিত") || lower.includes("math") || lower.includes("বীজগণিত") || lower.includes("পাটিগণিত") || lower.includes("জ্যামিতি") || lower.includes("শতাংশ") || lower.includes("লাভ")) {
      subject = "গাণিতিক যুক্তি";
      minutes = 50;
    } else if (lower.includes("মানসিক") || lower.includes("mental") || lower.includes("আইকিউ") || lower.includes("দিক") || lower.includes("সিরিজ")) {
      subject = "মানসিক দক্ষতা";
    } else if (lower.includes("বিজ্ঞান") || lower.includes("science") || lower.includes("পদার্থ") || lower.includes("রসায়ন") || lower.includes("জীববিজ্ঞান") || lower.includes("আলো") || lower.includes("শব্দ")) {
      subject = "সাধারণ বিজ্ঞান";
    } else if (lower.includes("কম্পিউটার") || lower.includes("আইসিটি") || lower.includes("ict") || lower.includes("computer") || lower.includes("নেটওয়ার্ক") || lower.includes("মেমোরি")) {
      subject = "কম্পিউটার ও তথ্যপ্রযুক্তি";
    } else if (lower.includes("ভূগোল") || lower.includes("দুর্যোগ") || lower.includes("পরিবেশ") || lower.includes("geography") || lower.includes("মানচিত্র")) {
      subject = "ভূগোল ও দুর্যোগ ব্যবস্থাপনা";
    } else if (lower.includes("সুশাসন") || lower.includes("নৈতিকতা") || lower.includes("ethics") || lower.includes("মূল্যবোধ")) {
      subject = "নৈতিকতা ও সুশাসন";
    }

    tasks.push({
      title: cleanLine,
      source,
      subject,
      sourceDetails,
      percentageWeight: 0,
      estimatedMinutes: minutes,
      importance: (subject === "বাংলা সাহিত্য ও ব্যাকরণ" || subject === "বাংলাদেশ বিষয়াবলী" || subject === "English Language & Literature") ? "high" : "medium",
      strategicTip: `৫১তম বিসিএস: ${subject} অংশে নিয়মিত অনুশীলন ও রিভিশন ধরে রাখুন।`
    });
  });

  const taskCount = Math.max(1, tasks.length);
  const baseWeight = Math.floor(100 / taskCount);
  let remainder = 100 - (baseWeight * taskCount);

  tasks.forEach((t, i) => {
    t.percentageWeight = baseWeight + (i === taskCount - 1 ? remainder : 0);
  });

  const totalMin = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return {
    daySummary: `আজকের জন্য মোট ${taskCount}টি বিষয় নির্ধারণ করা হয়েছে। মোট সময় আনুমানিক ${totalMin} মিনিট।`,
    totalEstimatedMinutes: totalMin,
    strategyAdvice: "ধাপ ১: মূল বই থেকে টপিকটি রিডিং পড়ুন। ধাপ ২: প্রশ্নব্যাংক সলভ করে বিগত সালের প্যাটার্ন দেখুন। ধাপ ৩: LiveMCQ দিয়ে এক্সাম প্র্যাকটিস করুন।",
    tasks
  };
}
