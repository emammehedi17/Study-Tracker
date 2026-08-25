import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User, auth } from "./lib/firebase";
import { getDailyPlan, saveDailyPlan, initSeedDataIfNeeded, getUserStats } from "./lib/storage";
import { DailyPlan, StudyTask, UserStats } from "./types";
import { Navbar } from "./components/Navbar";
import { DailyTracker } from "./components/DailyTracker";
import { WeeklyAnalytics } from "./components/WeeklyAnalytics";
import { HistoryView } from "./components/HistoryView";
import { LiveMCQScoreTracker } from "./components/LiveMCQScoreTracker";
import { MistakeNotebook } from "./components/MistakeNotebook";
import { AIPlanAnalyzerModal } from "./components/AIPlanAnalyzerModal";
import { PomodoroTimerModal } from "./components/PomodoroTimerModal";
import { SamplePlansDrawer } from "./components/SamplePlansDrawer";
import { Flame, Target, BookOpen, Clock, Sparkles } from "lucide-react";
import { toBengaliNumber } from "./lib/bcsSyllabus";

export default function App() {
  const todayStr = new Date().toISOString().split("T")[0];
  
  // App States
  const [currentDate, setCurrentDate] = useState<string>(todayStr);
  const [currentPlan, setCurrentPlan] = useState<DailyPlan>(() => initSeedDataIfNeeded(todayStr));
  const [activeTab, setActiveTab] = useState<'today' | 'analytics' | 'history' | 'scores' | 'mistakes'>('today');
  const [user, setUser] = useState<User | null>(null);
  const [streakDays, setStreakDays] = useState<number>(1);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("bcs51_theme") === "dark" || false;
  });

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isSamplePlansOpen, setIsSamplePlansOpen] = useState(false);
  const [activeTimerTask, setActiveTimerTask] = useState<StudyTask | null>(null);

  // Sync Dark Mode class to documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bcs51_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bcs51_theme", "light");
    }
  }, [darkMode]);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // reload plan when auth state becomes ready
      loadPlanForDate(currentDate);
    });
    return () => unsubscribe();
  }, [currentDate]);

  // Load Plan when date changes
  useEffect(() => {
    loadPlanForDate(currentDate);
    const stats = getUserStats();
    setStreakDays(stats.streakDays || 1);
  }, [currentDate]);

  const loadPlanForDate = async (dateStr: string) => {
    try {
      const plan = await getDailyPlan(dateStr);
      setCurrentPlan(plan);
    } catch (e) {
      console.error("Failed to load daily plan:", e);
    }
  };

  const handleUpdatePlan = async (updatedPlan: DailyPlan) => {
    setCurrentPlan(updatedPlan);
    await saveDailyPlan(updatedPlan);
    const stats = getUserStats();
    setStreakDays(stats.streakDays || 1);
  };

  // AI Plan Application
  const handleApplyAiPlan = async (
    newTasks: StudyTask[], 
    summary?: string, 
    strategyAdvice?: string, 
    replaceExisting: boolean = true
  ) => {
    const finalTasks = replaceExisting ? newTasks : [...currentPlan.tasks, ...newTasks];
    const totalEst = finalTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);

    const updatedPlan: DailyPlan = {
      ...currentPlan,
      tasks: finalTasks,
      daySummary: summary || currentPlan.daySummary,
      strategyAdvice: strategyAdvice || currentPlan.strategyAdvice,
      totalEstimatedMinutes: totalEst,
    };

    await handleUpdatePlan(updatedPlan);
    setActiveTab('today');
  };

  // Load Sample Plan
  const handleSelectSamplePlan = async (samplePlan: DailyPlan) => {
    const planToSave: DailyPlan = {
      ...samplePlan,
      date: currentDate,
    };
    await handleUpdatePlan(planToSave);
    setActiveTab('today');
  };

  // Copy incomplete tasks from history to today
  const handleCopyIncompleteTasksToToday = async (incompleteTasks: StudyTask[]) => {
    if (incompleteTasks.length === 0) return;
    
    // Switch to today
    setCurrentDate(todayStr);
    const todayPlan = await getDailyPlan(todayStr);

    const clonedTasks: StudyTask[] = incompleteTasks.map(t => ({
      ...t,
      id: `task_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completed: false,
      completedAt: undefined,
    }));

    const updatedTodayPlan: DailyPlan = {
      ...todayPlan,
      tasks: [...todayPlan.tasks, ...clonedTasks],
    };

    await handleUpdatePlan(updatedTodayPlan);
    setActiveTab('today');
  };

  // Focus Timer complete session handler
  const handleCompleteTimerSession = async (task: StudyTask | null, studiedMinutes: number) => {
    if (!task) {
      // Just add to general daily study minutes
      const updated: DailyPlan = {
        ...currentPlan,
        actualStudyMinutes: (currentPlan.actualStudyMinutes || 0) + studiedMinutes,
      };
      await handleUpdatePlan(updated);
      return;
    }

    const updatedTasks = currentPlan.tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          actualMinutes: (t.actualMinutes || 0) + studiedMinutes,
          completed: true,
          completedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    const updatedPlan: DailyPlan = {
      ...currentPlan,
      tasks: updatedTasks,
      actualStudyMinutes: (currentPlan.actualStudyMinutes || 0) + studiedMinutes,
    };

    await handleUpdatePlan(updatedPlan);
  };

  const handleStartTimerForTask = (task: StudyTask) => {
    setActiveTimerTask(task);
    setIsTimerModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        user={user}
        streakDays={streakDays}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenTimerModal={() => {
          setActiveTimerTask(null);
          setIsTimerModalOpen(true);
        }}
        onOpenSamplePlans={() => setIsSamplePlansOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* BCS Motivation & Target Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-stone-800 dark:text-stone-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>🎯 লক্ষ্য: <strong>৫১তম বিসিএস প্রিলিমিনারি ক্যাডার প্রস্তুতি</strong></span>
            <span className="text-stone-400 hidden sm:inline">•</span>
            <span className="text-stone-500 dark:text-stone-400 hidden sm:inline">
              পাঠ্যবই থিওরি + LiveMCQ ডেইলি টেস্ট + বিগত প্রশ্নব্যাংক সমাধান
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-stone-500 dark:text-stone-400">
              ক্লাউড সিঙ্ক: <strong className={user ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 font-medium"}>{user ? "✓ রিয়েলটাইম ফায়ারবেস যুক্ত" : "অফলাইন/গেস্ট মোড (লগইন করে সিঙ্ক করুন)"}</strong>
            </span>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'today' && (
          <DailyTracker
            plan={currentPlan}
            onUpdatePlan={handleUpdatePlan}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onStartTimerForTask={handleStartTimerForTask}
            onOpenSamplePlans={() => setIsSamplePlansOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <WeeklyAnalytics currentDate={currentDate} />
        )}

        {activeTab === 'history' && (
          <HistoryView
            todayDate={todayStr}
            onSelectDate={(date) => {
              setCurrentDate(date);
              setActiveTab('today');
            }}
            onCopyIncompleteTasksToToday={handleCopyIncompleteTasksToToday}
          />
        )}

        {activeTab === 'scores' && (
          <LiveMCQScoreTracker />
        )}

        {activeTab === 'mistakes' && (
          <MistakeNotebook />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 py-4 text-center text-xs text-stone-500 dark:text-stone-400">
        <p>৫১তম বিসিএস স্টাডি ট্র্যাকার • টেক্সটবুক • লাইভ এমসিকিউ শিট • বিগত প্রশ্নব্যাংক অ্যানালাইটিক্স</p>
      </footer>

      {/* Modals */}
      <AIPlanAnalyzerModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        targetDate={currentDate}
        onApplyPlan={handleApplyAiPlan}
      />

      <PomodoroTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        activeTask={activeTimerTask}
        onCompleteSession={handleCompleteTimerSession}
      />

      <SamplePlansDrawer
        isOpen={isSamplePlansOpen}
        onClose={() => setIsSamplePlansOpen(false)}
        onSelectSamplePlan={handleSelectSamplePlan}
      />

    </div>
  );
}
