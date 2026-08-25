import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import { auth, db } from "./firebase";
import { DailyPlan, MockExamScore, MistakeNote, UserStats, StudyTask, StudySource } from "../types";
import { SAMPLE_BCS_PLANS } from "./bcsSyllabus";

const LOCAL_PLANS_KEY = "bcs51_daily_plans";
const LOCAL_MOCK_KEY = "bcs51_mock_scores";
const LOCAL_MISTAKES_KEY = "bcs51_mistake_notes";
const LOCAL_STATS_KEY = "bcs51_user_stats";

// Helper to get local storage JSON
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

// Helper to set local storage JSON
function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

// Ensure initial seed plan if totally empty
export function initSeedDataIfNeeded(todayDate: string): DailyPlan {
  const allPlans = getLocal<Record<string, DailyPlan>>(LOCAL_PLANS_KEY, {});
  if (!allPlans[todayDate]) {
    const sample = { ...SAMPLE_BCS_PLANS[0].plan, date: todayDate };
    allPlans[todayDate] = sample;
    setLocal(LOCAL_PLANS_KEY, allPlans);
    return sample;
  }
  return allPlans[todayDate];
}

// Save Daily Plan (both to Firestore if authenticated & localStorage)
export async function saveDailyPlan(plan: DailyPlan): Promise<void> {
  const user = auth.currentUser;
  
  // 1. Calculate and update completion percentage based on task weights
  const totalWeight = plan.tasks.reduce((sum, t) => sum + (Number(t.percentageWeight) || 0), 0);
  const completedWeight = plan.tasks
    .filter(t => t.completed)
    .reduce((sum, t) => sum + (Number(t.percentageWeight) || 0), 0);
  
  const completionPercentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  
  const updatedPlan: DailyPlan = {
    ...plan,
    completionPercentage,
    updatedAt: new Date().toISOString()
  };

  // 2. Save to Local Storage Cache
  const allPlans = getLocal<Record<string, DailyPlan>>(LOCAL_PLANS_KEY, {});
  allPlans[plan.date] = updatedPlan;
  setLocal(LOCAL_PLANS_KEY, allPlans);

  // 3. Save to Firestore if user is signed in
  if (user) {
    try {
      const planDocRef = doc(db, "users", user.uid, "dailyPlans", plan.date);
      await setDoc(planDocRef, updatedPlan, { merge: true });
    } catch (err) {
      console.warn("Firestore save failed, cached locally:", err);
    }
  }

  // 4. Update Stats
  updateGlobalStats(updatedPlan);
}

// Get Daily Plan for a specific date
export async function getDailyPlan(dateStr: string): Promise<DailyPlan> {
  const user = auth.currentUser;
  
  if (user) {
    try {
      const planDocRef = doc(db, "users", user.uid, "dailyPlans", dateStr);
      const snapshot = await getDoc(planDocRef);
      if (snapshot.exists()) {
        const firestorePlan = snapshot.data() as DailyPlan;
        // sync to local cache
        const allPlans = getLocal<Record<string, DailyPlan>>(LOCAL_PLANS_KEY, {});
        allPlans[dateStr] = firestorePlan;
        setLocal(LOCAL_PLANS_KEY, allPlans);
        return firestorePlan;
      }
    } catch (e) {
      console.warn("Firestore fetch error, reading local cache:", e);
    }
  }

  // Fallback to local
  const allPlans = getLocal<Record<string, DailyPlan>>(LOCAL_PLANS_KEY, {});
  if (allPlans[dateStr]) {
    return allPlans[dateStr];
  }

  // Default empty plan for new date
  return {
    date: dateStr,
    tasks: [],
    daySummary: "আজকের জন্য নতুন কোনো পড়ার রুটিন যোগ করা হয়নি। রুটিনের ছবি আপলোড করুন অথবা টাস্ক অ্যাড করুন।",
    completionPercentage: 0,
    updatedAt: new Date().toISOString()
  };
}

// Get all daily plans for weekly overview and history
export async function getAllDailyPlans(): Promise<Record<string, DailyPlan>> {
  const user = auth.currentUser;
  const localPlans = getLocal<Record<string, DailyPlan>>(LOCAL_PLANS_KEY, {});

  if (user) {
    try {
      const plansCol = collection(db, "users", user.uid, "dailyPlans");
      const snap = await getDocs(plansCol);
      const remotePlans: Record<string, DailyPlan> = { ...localPlans };
      snap.forEach(docSnap => {
        const data = docSnap.data() as DailyPlan;
        remotePlans[data.date] = data;
      });
      setLocal(LOCAL_PLANS_KEY, remotePlans);
      return remotePlans;
    } catch (e) {
      console.warn("Firestore bulk fetch error:", e);
    }
  }

  return localPlans;
}

// Helper: Calculate Last 7 Days / Weekly stats
export async function getWeeklyAnalyticsData(): Promise<{
  dates: string[];
  chartData: {
    date: string;
    dayLabel: string;
    completion: number;
    tasksCount: number;
    completedCount: number;
    studyMinutes: number;
  }[];
  sourceDistribution: { name: string; value: number; color: string; sourceKey: StudySource }[];
  overallAvgCompletion: number;
  totalStudyHours: number;
  completedTasksTotal: number;
}> {
  const allPlans = await getAllDailyPlans();
  const daysList: string[] = [];
  const today = new Date();
  
  // Last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    daysList.push(d.toISOString().split("T")[0]);
  }

  const dayNamesShort = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

  const sourcesCount: Record<StudySource, number> = {
    textbook: 0,
    livemcq: 0,
    question_bank: 0,
    revision: 0
  };

  let totalPercentageSum = 0;
  let totalMinutes = 0;
  let totalTasks = 0;
  let totalCompletedTasks = 0;

  const chartData = daysList.map(dateStr => {
    const d = new Date(dateStr + "T00:00:00");
    const dayLabel = `${dayNamesShort[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`;
    const plan = allPlans[dateStr];

    if (!plan || !plan.tasks || plan.tasks.length === 0) {
      return {
        date: dateStr,
        dayLabel,
        completion: 0,
        tasksCount: 0,
        completedCount: 0,
        studyMinutes: 0
      };
    }

    const comp = plan.completionPercentage || 0;
    totalPercentageSum += comp;
    
    plan.tasks.forEach(t => {
      totalTasks++;
      if (t.completed) {
        totalCompletedTasks++;
        const sKey = (t.source || "textbook") as StudySource;
        sourcesCount[sKey] = (sourcesCount[sKey] || 0) + 1;
        totalMinutes += t.actualMinutes || t.estimatedMinutes || 30;
      }
    });

    const dayMinutes = plan.tasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + (t.actualMinutes || t.estimatedMinutes || 30), 0);

    return {
      date: dateStr,
      dayLabel,
      completion: comp,
      tasksCount: plan.tasks.length,
      completedCount: plan.tasks.filter(t => t.completed).length,
      studyMinutes: dayMinutes
    };
  });

  const sourceDistribution = [
    { name: "পাঠ্যবই ও ডাইজেস্ট (Textbooks)", value: sourcesCount.textbook, color: "#10b981", sourceKey: "textbook" as StudySource },
    { name: "LiveMCQ PDFs ও এক্সাম", value: sourcesCount.livemcq, color: "#3b82f6", sourceKey: "livemcq" as StudySource },
    { name: "বিসিএস প্রশ্নব্যাংক (Question Bank)", value: sourcesCount.question_bank, color: "#f59e0b", sourceKey: "question_bank" as StudySource },
    { name: "রিভিশন ও দুর্বল টপিক (Revision)", value: sourcesCount.revision, color: "#a855f7", sourceKey: "revision" as StudySource }
  ];

  return {
    dates: daysList,
    chartData,
    sourceDistribution,
    overallAvgCompletion: Math.round(totalPercentageSum / 7),
    totalStudyHours: parseFloat((totalMinutes / 60).toFixed(1)),
    completedTasksTotal: totalCompletedTasks
  };
}

// Mock Exam Scores Management
export async function getMockScores(): Promise<MockExamScore[]> {
  const user = auth.currentUser;
  const localScores = getLocal<MockExamScore[]>(LOCAL_MOCK_KEY, []);

  if (user) {
    try {
      const colRef = collection(db, "users", user.uid, "mockScores");
      const q = query(colRef, orderBy("date", "desc"), limit(50));
      const snap = await getDocs(q);
      const remoteScores: MockExamScore[] = [];
      snap.forEach(d => remoteScores.push({ id: d.id, ...(d.data() as any) }));
      if (remoteScores.length > 0) {
        setLocal(LOCAL_MOCK_KEY, remoteScores);
        return remoteScores;
      }
    } catch (e) {
      console.warn("Error fetching mock scores:", e);
    }
  }

  return localScores;
}

export async function saveMockScore(score: MockExamScore): Promise<void> {
  const current = getLocal<MockExamScore[]>(LOCAL_MOCK_KEY, []);
  const updated = [score, ...current.filter(s => s.id !== score.id)];
  setLocal(LOCAL_MOCK_KEY, updated);

  const user = auth.currentUser;
  if (user) {
    try {
      const docRef = doc(db, "users", user.uid, "mockScores", score.id);
      await setDoc(docRef, score, { merge: true });
    } catch (e) {
      console.warn("Failed saving mock score to Firestore:", e);
    }
  }
}

export async function deleteMockScore(scoreId: string): Promise<void> {
  const current = getLocal<MockExamScore[]>(LOCAL_MOCK_KEY, []);
  const updated = current.filter(s => s.id !== scoreId);
  setLocal(LOCAL_MOCK_KEY, updated);

  const user = auth.currentUser;
  if (user) {
    try {
      const docRef = doc(db, "users", user.uid, "mockScores", scoreId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Failed deleting mock score from Firestore:", e);
    }
  }
}

// Mistake Notes (ভুল হওয়া প্রশ্নের খাতা / Spaced Repetition)
export async function getMistakeNotes(): Promise<MistakeNote[]> {
  const user = auth.currentUser;
  const localMistakes = getLocal<MistakeNote[]>(LOCAL_MISTAKES_KEY, []);

  if (user) {
    try {
      const colRef = collection(db, "users", user.uid, "mistakeNotes");
      const snap = await getDocs(colRef);
      const remoteList: MistakeNote[] = [];
      snap.forEach(d => remoteList.push({ id: d.id, ...(d.data() as any) }));
      if (remoteList.length > 0) {
        setLocal(LOCAL_MISTAKES_KEY, remoteList);
        return remoteList;
      }
    } catch (e) {
      console.warn("Error fetching mistake notes:", e);
    }
  }

  return localMistakes;
}

export async function saveMistakeNote(note: MistakeNote): Promise<void> {
  const current = getLocal<MistakeNote[]>(LOCAL_MISTAKES_KEY, []);
  const updated = [note, ...current.filter(n => n.id !== note.id)];
  setLocal(LOCAL_MISTAKES_KEY, updated);

  const user = auth.currentUser;
  if (user) {
    try {
      const docRef = doc(db, "users", user.uid, "mistakeNotes", note.id);
      await setDoc(docRef, note, { merge: true });
    } catch (e) {
      console.warn("Failed saving mistake note to Firestore:", e);
    }
  }
}

export async function deleteMistakeNote(noteId: string): Promise<void> {
  const current = getLocal<MistakeNote[]>(LOCAL_MISTAKES_KEY, []);
  const updated = current.filter(n => n.id !== noteId);
  setLocal(LOCAL_MISTAKES_KEY, updated);

  const user = auth.currentUser;
  if (user) {
    try {
      const docRef = doc(db, "users", user.uid, "mistakeNotes", noteId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Failed deleting mistake note from Firestore:", e);
    }
  }
}

// Calculate streak and overall user stats
function updateGlobalStats(latestPlan: DailyPlan): void {
  const allPlans = getLocal<Record<string, DailyPlan>>(LOCAL_PLANS_KEY, {});
  allPlans[latestPlan.date] = latestPlan;
  
  // Calculate streak
  const dates = Object.keys(allPlans).sort().reverse();
  let streak = 0;
  const todayStr = new Date().toISOString().split("T")[0];
  let checkDate = new Date(todayStr);

  for (let i = 0; i < 60; i++) {
    const dStr = checkDate.toISOString().split("T")[0];
    const plan = allPlans[dStr];
    if (plan && plan.completionPercentage >= 40) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0 && (!plan || plan.completionPercentage < 40)) {
      // today is still in progress, check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const stats: UserStats = {
    totalTasksCompleted: Object.values(allPlans).reduce((sum, p) => sum + (p.tasks?.filter(t => t.completed).length || 0), 0),
    totalStudyMinutes: Object.values(allPlans).reduce((sum, p) => sum + (p.actualStudyMinutes || (p.tasks?.filter(t => t.completed).reduce((s, t) => s + (t.estimatedMinutes || 30), 0) || 0)), 0),
    streakDays: streak,
    lastStudiedDate: latestPlan.date,
    averageWeeklyScore: latestPlan.completionPercentage,
    sourcesCompletedCount: {
      textbook: 0,
      livemcq: 0,
      question_bank: 0,
      revision: 0
    }
  };

  setLocal(LOCAL_STATS_KEY, stats);
}

export function getUserStats(): UserStats {
  return getLocal<UserStats>(LOCAL_STATS_KEY, {
    totalTasksCompleted: 0,
    totalStudyMinutes: 0,
    streakDays: 1,
    lastStudiedDate: new Date().toISOString().split("T")[0],
    averageWeeklyScore: 0,
    sourcesCompletedCount: {
      textbook: 0,
      livemcq: 0,
      question_bank: 0,
      revision: 0
    }
  });
}
