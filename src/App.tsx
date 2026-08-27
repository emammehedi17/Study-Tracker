import React, { useState, useEffect, useRef, useMemo } from "react";
import { onAuthStateChanged, User, auth } from "./lib/firebase";
import { 
  getDailyPlan, 
  saveDailyPlan, 
  initSeedDataIfNeeded, 
  resetToDay1Plan, 
  getUserStats,
  getWeeklyProgress,
  subscribeToUserPlans,
  getLocal,
  getLocalUncompletedTasks,
  saveUncompletedTask,
  deleteUncompletedTask,
  toggleUncompletedTaskStatus,
  subscribeToUncompletedTasks
} from "./lib/storage";
import { calculatePlanPercentage, computeCellWeights } from "./lib/bcsSyllabus";
import { DailyTablePlan, UncompletedTask, TableTopicItem } from "./types";
import { Navbar } from "./components/Navbar";
import { TableStudyTracker } from "./components/TableStudyTracker";
import { UncompletedTasksModal } from "./components/UncompletedTasksModal";

export default function App() {
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const todayStr = getTodayStr();

  // App States
  const [currentDate, setCurrentDate] = useState<string>(todayStr);
  const [currentPlan, setCurrentPlan] = useState<DailyTablePlan>(() => initSeedDataIfNeeded(todayStr));
  const [user, setUser] = useState<User | null>(null);
  const [streakDays, setStreakDays] = useState<number>(1);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("bcs51_dark_mode") === "true";
  });
  const [weeklyStats, setWeeklyStats] = useState(() => getWeeklyProgress(todayStr));
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(false);

  // Uncompleted Tasks State & Modal
  const [uncompletedTasks, setUncompletedTasks] = useState<UncompletedTask[]>(() => getLocalUncompletedTasks());
  const [isUncompletedTasksModalOpen, setIsUncompletedTasksModalOpen] = useState<boolean>(false);

  const currentDateRef = useRef(currentDate);
  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);

  // Sync Dark Mode class to documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("bcs51_dark_mode", String(darkMode));
  }, [darkMode]);

  // Auth Listener and Real-time Multi-Device Firestore Subscription
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let unsubscribeTasks: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      if (unsubscribeTasks) {
        unsubscribeTasks();
        unsubscribeTasks = null;
      }

      if (currentUser) {
        setIsLiveSynced(true);
        // Subscribe to real-time table plans updates from Firestore
        unsubscribeSnapshot = subscribeToUserPlans(currentUser.uid, (allPlans) => {
          const activeDate = currentDateRef.current;
          if (allPlans[activeDate]) {
            setCurrentPlan(allPlans[activeDate]);
          }
          setWeeklyStats(getWeeklyProgress(activeDate));
          const stats = getUserStats(activeDate);
          setStreakDays(stats.streakDays ?? 0);
        });

        // Subscribe to real-time uncompleted tasks updates
        unsubscribeTasks = subscribeToUncompletedTasks(currentUser.uid, (remoteTasks) => {
          setUncompletedTasks(remoteTasks);
        });
      } else {
        setIsLiveSynced(false);
      }

      loadPlanForDate(currentDateRef.current);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
      if (unsubscribeTasks) {
        unsubscribeTasks();
      }
    };
  }, []);

  // Load Plan when date changes
  useEffect(() => {
    loadPlanForDate(currentDate);
    setWeeklyStats(getWeeklyProgress(currentDate));
  }, [currentDate]);

  const loadPlanForDate = async (date: string) => {
    const plan = await getDailyPlan(date);
    setCurrentPlan(plan);
    const stats = getUserStats(date);
    setStreakDays(stats.streakDays ?? 0);
  };

  // Plan Update Handler (saves locally and synchronizes to Firestore in real-time)
  const handleUpdatePlan = async (updatedPlan: DailyTablePlan) => {
    const calculatedPct = calculatePlanPercentage(updatedPlan.topics);
    const finalPlan: DailyTablePlan = {
      ...updatedPlan,
      completionPercentage: calculatedPct,
    };
    setCurrentPlan(finalPlan);
    await saveDailyPlan(finalPlan);
    const stats = getUserStats(currentDate);
    setStreakDays(stats.streakDays ?? 0);
    setWeeklyStats(getWeeklyProgress(currentDate));
  };

  // Reset to Day-1 Syllabus
  const handleResetToDay1 = async () => {
    const day1 = resetToDay1Plan(currentDate);
    await handleUpdatePlan(day1);
  };

  // Uncompleted Tasks handlers
  const handleSaveTask = async (task: UncompletedTask) => {
    await saveUncompletedTask(task);
    setUncompletedTasks(getLocalUncompletedTasks());
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteUncompletedTask(taskId);
    setUncompletedTasks(getLocalUncompletedTasks());
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleUncompletedTaskStatus(taskId);
    setUncompletedTasks(getLocalUncompletedTasks());
  };

  // Transfer an uncompleted task directly into the current day's table plan
  const handleAddTopicFromUncompletedTask = (topicName: string, subject?: string) => {
    const displayTitle = subject ? `${subject}: ${topicName}` : topicName;
    const newTopic: TableTopicItem = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      topic: displayTitle,
      details: "ব্যাকলগ থেকে আজকের টেবিলে যুক্ত",
      textbook: false,
      livemcq: false,
      qbank: false,
      others: false,
    };

    const updatedTopics = computeCellWeights([...currentPlan.topics, newTopic]);
    const calculatedPct = calculatePlanPercentage(updatedTopics);

    handleUpdatePlan({
      ...currentPlan,
      topics: updatedTopics,
      completionPercentage: calculatedPct,
    });

    setIsUncompletedTasksModalOpen(false);
  };

  // Calculate stats for uncompleted tasks (due today, overdue, total)
  const { urgentTasksCount, pendingTasksCount } = useMemo(() => {
    let urgent = 0;
    let pending = 0;
    uncompletedTasks.forEach((t) => {
      if (!t.completed) {
        pending++;
        try {
          const today = new Date(currentDate + "T00:00:00");
          const target = new Date(t.deadlineDate + "T00:00:00");
          const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diff <= 0) {
            urgent++;
          }
        } catch {
          // ignore date parse issue
        }
      }
    });
    return { urgentTasksCount: urgent, pendingTasksCount: pending };
  }, [uncompletedTasks, currentDate]);

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
        isLiveSynced={isLiveSynced}
        uncompletedTasksCount={pendingTasksCount}
        urgentTasksCount={urgentTasksCount}
        onOpenUncompletedTasks={() => setIsUncompletedTasksModalOpen(true)}
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
          uncompletedTasks={uncompletedTasks}
          onOpenUncompletedTasks={() => setIsUncompletedTasksModalOpen(true)}
        />
      </main>

      {/* Uncompleted Tasks Modal & Backlog Manager */}
      <UncompletedTasksModal
        isOpen={isUncompletedTasksModalOpen}
        onClose={() => setIsUncompletedTasksModalOpen(false)}
        tasks={uncompletedTasks}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        onToggleTask={handleToggleTask}
        onAddTopicToTodayTable={handleAddTopicFromUncompletedTask}
        currentDate={currentDate}
      />

      {/* Minimal Footer */}
      <footer className="w-full border-t border-stone-200 dark:border-stone-800/80 bg-white/50 dark:bg-stone-900/50 py-3 text-center text-xs text-stone-500 dark:text-stone-400">
        <p>৫১তম বিসিএস স্টাডি ট্র্যাকার • Textbook • LiveMCQ PDF • Q-Bank • Others</p>
      </footer>

    </div>
  );
}


