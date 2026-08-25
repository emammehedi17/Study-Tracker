import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User, auth } from "./lib/firebase";
import { 
  getDailyPlan, 
  saveDailyPlan, 
  initSeedDataIfNeeded, 
  resetToDay1Plan, 
  getUserStats,
  getWeeklyProgress 
} from "./lib/storage";
import { DailyTablePlan } from "./types";
import { Navbar } from "./components/Navbar";
import { TableStudyTracker } from "./components/TableStudyTracker";

export default function App() {
  const todayStr = new Date().toISOString().split("T")[0];

  // App States
  const [currentDate, setCurrentDate] = useState<string>(todayStr);
  const [currentPlan, setCurrentPlan] = useState<DailyTablePlan>(() => initSeedDataIfNeeded(todayStr));
  const [user, setUser] = useState<User | null>(null);
  const [streakDays, setStreakDays] = useState<number>(1);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("bcs51_dark_mode") === "true";
  });
  const [weeklyStats, setWeeklyStats] = useState(() => getWeeklyProgress(todayStr));

  // Sync Dark Mode class to documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("bcs51_dark_mode", String(darkMode));
  }, [darkMode]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      loadPlanForDate(currentDate);
    });
    return () => unsubscribe();
  }, []);

  // Load Plan when date changes
  useEffect(() => {
    loadPlanForDate(currentDate);
    setWeeklyStats(getWeeklyProgress(currentDate));
  }, [currentDate]);

  const loadPlanForDate = async (date: string) => {
    const plan = await getDailyPlan(date);
    setCurrentPlan(plan);
    const stats = getUserStats();
    setStreakDays(stats.streakDays || 1);
  };

  // Plan Update Handler
  const handleUpdatePlan = async (updatedPlan: DailyTablePlan) => {
    setCurrentPlan(updatedPlan);
    await saveDailyPlan(updatedPlan);
    const stats = getUserStats();
    setStreakDays(stats.streakDays || 1);
    setWeeklyStats(getWeeklyProgress(currentDate));
  };

  // Reset to Day-1 Syllabus
  const handleResetToDay1 = async () => {
    const day1 = resetToDay1Plan(currentDate);
    await handleUpdatePlan(day1);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200 flex flex-col font-sans">
      
      {/* Top Simple Header */}
      <Navbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        user={user}
        streakDays={streakDays}
      />

      {/* Main Single-View Table Tracker Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-4">
        <TableStudyTracker
          plan={currentPlan}
          currentDate={currentDate}
          weeklyStats={weeklyStats}
          onUpdatePlan={handleUpdatePlan}
          onResetToDay1={handleResetToDay1}
          onDateChange={setCurrentDate}
        />
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-stone-200 dark:border-stone-800/80 bg-white/50 dark:bg-stone-900/50 py-3 text-center text-xs text-stone-500 dark:text-stone-400">
        <p>৫১তম বিসিএস স্টাডি ট্র্যাকার • Textbook • LiveMCQ PDF • Q-Bank • Others</p>
      </footer>

    </div>
  );
}
