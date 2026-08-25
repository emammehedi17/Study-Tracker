import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { auth, db } from "./firebase";
import { DailyTablePlan, TableTopicItem, UserStats } from "../types";
import { DEFAULT_DAY_1_TOPICS, getInitialDay1Plan, computeCellWeights } from "./bcsSyllabus";

const LOCAL_TABLE_PLANS_KEY = "bcs51_table_plans";
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

// Compute total completed percentage for a plan
export function calculatePlanPercentage(topics: TableTopicItem[]): number {
  if (!topics || topics.length === 0) return 0;
  
  let totalAchieved = 0;
  const weightedTopics = computeCellWeights(topics);

  weightedTopics.forEach((t) => {
    if (t.textbook) totalAchieved += t.textbookWeight || 0;
    if (t.livemcq) totalAchieved += t.livemcqWeight || 0;
    if (t.qbank) totalAchieved += t.qbankWeight || 0;
    if (t.others) totalAchieved += t.othersWeight || 0;
  });

  return Math.min(100, Math.round(totalAchieved));
}

// Ensure initial seed plan if totally empty
export function initSeedDataIfNeeded(todayDate: string): DailyTablePlan {
  const allPlans = getLocal<Record<string, DailyTablePlan>>(LOCAL_TABLE_PLANS_KEY, {});
  if (!allPlans[todayDate] || !allPlans[todayDate].topics || allPlans[todayDate].topics.length === 0) {
    const sample = getInitialDay1Plan(todayDate);
    allPlans[todayDate] = sample;
    setLocal(LOCAL_TABLE_PLANS_KEY, allPlans);
    return sample;
  }
  return allPlans[todayDate];
}

// Reset date plan to default Day-1 topics
export function resetToDay1Plan(targetDate: string): DailyTablePlan {
  const allPlans = getLocal<Record<string, DailyTablePlan>>(LOCAL_TABLE_PLANS_KEY, {});
  const sample = getInitialDay1Plan(targetDate);
  allPlans[targetDate] = sample;
  setLocal(LOCAL_TABLE_PLANS_KEY, allPlans);
  return sample;
}

// Get Daily Table Plan
export async function getDailyPlan(date: string): Promise<DailyTablePlan> {
  const allPlans = getLocal<Record<string, DailyTablePlan>>(LOCAL_TABLE_PLANS_KEY, {});
  const user = auth.currentUser;

  if (allPlans[date]) {
    return allPlans[date];
  }

  if (user) {
    try {
      const planDocRef = doc(db, "users", user.uid, "tablePlans", date);
      const planSnap = await getDoc(planDocRef);
      if (planSnap.exists()) {
        const data = planSnap.data() as DailyTablePlan;
        allPlans[date] = data;
        setLocal(LOCAL_TABLE_PLANS_KEY, allPlans);
        return data;
      }
    } catch (err) {
      console.warn("Firestore fetch failed, returning initial template:", err);
    }
  }

  const initial = getInitialDay1Plan(date);
  allPlans[date] = initial;
  setLocal(LOCAL_TABLE_PLANS_KEY, allPlans);
  return initial;
}

// Save Daily Table Plan
export async function saveDailyPlan(plan: DailyTablePlan): Promise<void> {
  const user = auth.currentUser;
  
  // Calculate percentage
  const weightedTopics = computeCellWeights(plan.topics);
  const completionPercentage = calculatePlanPercentage(weightedTopics);
  
  const updatedPlan: DailyTablePlan = {
    ...plan,
    topics: weightedTopics,
    completionPercentage,
    updatedAt: new Date().toISOString(),
  };

  // 1. Local storage save
  const allPlans = getLocal<Record<string, DailyTablePlan>>(LOCAL_TABLE_PLANS_KEY, {});
  allPlans[plan.date] = updatedPlan;
  setLocal(LOCAL_TABLE_PLANS_KEY, allPlans);

  // 2. Update Streak in stats
  updateUserStreak(plan.date);

  // 3. Firestore save if signed in
  if (user) {
    try {
      const planDocRef = doc(db, "users", user.uid, "tablePlans", plan.date);
      await setDoc(planDocRef, updatedPlan, { merge: true });
    } catch (err) {
      console.warn("Firestore table plan save failed:", err);
    }
  }
}

// Calculate Weekly Progress
export function getWeeklyProgress(currentDateStr: string): {
  averageWeeklyPercentage: number;
  daysData: { date: string; dayNameBn: string; percentage: number; isCurrent: boolean }[];
} {
  const allPlans = getLocal<Record<string, DailyTablePlan>>(LOCAL_TABLE_PLANS_KEY, {});
  const current = new Date(currentDateStr + "T00:00:00");
  
  // Find Monday of current week (or Sunday)
  const dayOfWeek = current.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  const daysNamesBn = ["সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি", "রবি"];
  const daysData: { date: string; dayNameBn: string; percentage: number; isCurrent: boolean }[] = [];
  let totalPctSum = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const plan = allPlans[dateStr];
    const percentage = plan ? (plan.completionPercentage || 0) : 0;
    
    totalPctSum += percentage;
    daysData.push({
      date: dateStr,
      dayNameBn: daysNamesBn[i],
      percentage,
      isCurrent: dateStr === currentDateStr,
    });
  }

  const averageWeeklyPercentage = Math.round(totalPctSum / 7);

  return {
    averageWeeklyPercentage,
    daysData,
  };
}

// Check if a day's required study checkboxes (Textbook, LiveMCQ, Q-Bank) are checked (Others is excluded)
export function isDayAllChecked(plan?: DailyTablePlan | null): boolean {
  if (!plan || !plan.topics || plan.topics.length === 0) return false;

  return plan.topics.every((t) => {
    const tbOk = !!t.textbook;
    const liveOk = !!t.livemcq;
    const qbOk = !!t.qbank;
    // Others is purely optional/custom and does NOT count towards the strike requirement
    return tbOk && liveOk && qbOk;
  });
}

// Dynamically calculate current consecutive streak
export function calculateCurrentStreak(referenceDateStr: string): number {
  const allPlans = getLocal<Record<string, DailyTablePlan>>(LOCAL_TABLE_PLANS_KEY, {});
  const refPlan = allPlans[referenceDateStr];

  // If the active day's checkboxes are not ALL checked, streak is 0
  if (!isDayAllChecked(refPlan)) {
    return 0;
  }

  let streak = 1;
  const parts = referenceDateStr.split("-").map(Number);
  if (parts.length !== 3) return 1;

  const cursor = new Date(parts[0], parts[1] - 1, parts[2]);

  // Check previous consecutive days
  while (true) {
    cursor.setDate(cursor.getDate() - 1);
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;

    const prevPlan = allPlans[dateKey];
    if (isDayAllChecked(prevPlan)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// User Stats & Streak
function updateUserStreak(date: string): number {
  const streak = calculateCurrentStreak(date);
  const stats: UserStats = {
    streakDays: streak,
    lastStudiedDate: date,
  };
  setLocal(LOCAL_STATS_KEY, stats);
  return streak;
}

export function getUserStats(referenceDate?: string): UserStats {
  const todayStr = referenceDate || new Date().toISOString().split("T")[0];
  const streak = calculateCurrentStreak(todayStr);
  return {
    streakDays: streak,
    lastStudiedDate: todayStr,
  };
}
