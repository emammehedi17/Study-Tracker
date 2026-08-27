import React, { useState, useEffect, useMemo } from "react";
import { 
  Check, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen,
  FileText,
  Code,
  Edit3,
  Copy,
  Layers,
  Sparkles,
  AlertCircle,
  Undo2,
  Redo2,
  X,
  CheckSquare,
  Flame
} from "lucide-react";
import { DailyTablePlan, TableTopicItem, UncompletedTask } from "../types";
import { 
  toBengaliNumber, 
  computeCellWeights, 
  adjustWeightsOnTopicEdit,
  getTotalCellWeightSum,
  formatBanglaDate, 
  calculatePlanPercentage,
  parseTopicsFromCode,
  exportTopicsToCodeFormat
} from "../lib/bcsSyllabus";
import confetti from "canvas-confetti";

interface TableStudyTrackerProps {
  plan: DailyTablePlan;
  currentDate: string;
  weeklyStats: {
    averageWeeklyPercentage: number;
    daysData: { date: string; dayNameBn: string; percentage: number; isCurrent: boolean }[];
  };
  onUpdatePlan: (updatedPlan: DailyTablePlan) => void;
  onResetToDay1: () => void;
  onDateChange: (date: string) => void;
  uncompletedTasks?: UncompletedTask[];
  onOpenUncompletedTasks?: () => void;
}

export const TableStudyTracker: React.FC<TableStudyTrackerProps> = ({
  plan,
  currentDate,
  weeklyStats,
  onUpdatePlan,
  onResetToDay1,
  onDateChange,
  uncompletedTasks = [],
  onOpenUncompletedTasks,
}) => {
  const [newTopicText, setNewTopicText] = useState("");
  const [newTopicDetails, setNewTopicDetails] = useState("");
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Undo & Redo History Stacks (holds up to 7 actions)
  const [undoStack, setUndoStack] = useState<DailyTablePlan[]>([]);
  const [redoStack, setRedoStack] = useState<DailyTablePlan[]>([]);

  // Reset history stack when date changes
  useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, [currentDate]);

  // Push previous state to undo stack and clear redo stack upon new user modifications
  const updatePlanWithHistory = (newPlan: DailyTablePlan) => {
    setUndoStack((prev) => {
      const snapshot: DailyTablePlan = JSON.parse(JSON.stringify(plan));
      const nextStack = [snapshot, ...prev];
      return nextStack.slice(0, 7);
    });
    setRedoStack([]);
    onUpdatePlan(newPlan);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [previousPlan, ...remainingUndo] = undoStack;

    // Push current snapshot to redo stack (up to 7)
    setRedoStack((prev) => {
      const snapshot: DailyTablePlan = JSON.parse(JSON.stringify(plan));
      const nextStack = [snapshot, ...prev];
      return nextStack.slice(0, 7);
    });
    setUndoStack(remainingUndo);

    onUpdatePlan(previousPlan);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [nextPlan, ...remainingRedo] = redoStack;

    // Push current snapshot to undo stack (up to 7)
    setUndoStack((prev) => {
      const snapshot: DailyTablePlan = JSON.parse(JSON.stringify(plan));
      const nextStack = [snapshot, ...prev];
      return nextStack.slice(0, 7);
    });
    setRedoStack(remainingRedo);

    onUpdatePlan(nextPlan);
  };

  // Keyboard shortcut listener for Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undoStack, redoStack, plan]);

  // Code / Bulk Topic Editor Modal
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeParseError, setCodeParseError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Inline Topic & Percentage Editor (on Double Click)
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    topic: string;
    details: string;
    textbookWeight: number;
    livemcqWeight: number;
    qbankWeight: number;
    othersWeight: number;
  }>({
    topic: "",
    details: "",
    textbookWeight: 0,
    livemcqWeight: 0,
    qbankWeight: 0,
    othersWeight: 0,
  });

  const startEditingTopic = (topic: TableTopicItem) => {
    setEditingTopicId(topic.id);
    setEditForm({
      topic: topic.topic,
      details: topic.details || "",
      textbookWeight: topic.textbookWeight ?? 0,
      livemcqWeight: topic.livemcqWeight ?? 0,
      qbankWeight: topic.qbankWeight ?? 0,
      othersWeight: topic.othersWeight ?? 0,
    });
  };

  const handleSaveInlineEdit = () => {
    if (!editingTopicId) return;
    if (!editForm.topic.trim()) return;

    // Automatically rebalance all other percentages equally so total sum is strictly 100%
    const reweighted = adjustWeightsOnTopicEdit(plan.topics, editingTopicId, {
      textbookWeight: editForm.textbookWeight,
      livemcqWeight: editForm.livemcqWeight,
      qbankWeight: editForm.qbankWeight,
      othersWeight: editForm.othersWeight,
    });

    const finalizedTopics = reweighted.map((t) => {
      if (t.id === editingTopicId) {
        return {
          ...t,
          topic: editForm.topic.trim(),
          details: editForm.details.trim() || undefined,
        };
      }
      return t;
    });

    const calculatedPct = calculatePlanPercentage(finalizedTopics);

    updatePlanWithHistory({
      ...plan,
      topics: finalizedTopics,
      completionPercentage: calculatedPct,
    });

    setEditingTopicId(null);
  };

  const handleCancelInlineEdit = () => {
    setEditingTopicId(null);
  };

  // Derive real-time daily percentage
  const currentDailyPercentage = calculatePlanPercentage(plan.topics);

  // Open Code Modal with current topics pre-populated
  const handleOpenCodeModal = () => {
    const formatted = exportTopicsToCodeFormat(plan.topics);
    setCodeContent(formatted);
    setCodeParseError("");
    setIsCodeModalOpen(true);
  };

  // Apply parsed topics from code editor
  const handleApplyCode = (mode: "replace" | "append") => {
    if (!codeContent.trim()) {
      setCodeParseError("অনুগ্রহ করে টপিক কোড বা টেক্সট লিখুন।");
      return;
    }

    const baseTopics = mode === "replace" ? [] : plan.topics;
    const result = parseTopicsFromCode(codeContent, plan.topics);

    if (result.topics.length === 0) {
      setCodeParseError("কোনো টপিক সঠিকভাবে শনাক্ত করা যায়নি। ফরম্যাটটি চেক করুন।");
      return;
    }

    const combined = mode === "replace" ? result.topics : [...plan.topics, ...result.topics];
    const reweighted = computeCellWeights(combined);
    const calculatedPct = calculatePlanPercentage(reweighted);

    updatePlanWithHistory({
      ...plan,
      topics: reweighted,
      completionPercentage: calculatedPct,
    });

    setIsCodeModalOpen(false);
  };

  // Toggle a specific cell in a topic
  const handleToggleCell = (
    topicId: string, 
    column: 'textbook' | 'livemcq' | 'qbank' | 'others'
  ) => {
    let triggeredComplete = false;

    const updatedTopics = plan.topics.map((item) => {
      if (item.id === topicId) {
        const nextValue = !item[column];
        if (nextValue) {
          triggeredComplete = true;
        }
        return {
          ...item,
          [column]: nextValue,
        };
      }
      return item;
    });

    if (triggeredComplete) {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
    }

    const calculatedPct = calculatePlanPercentage(updatedTopics);

    updatePlanWithHistory({
      ...plan,
      topics: updatedTopics,
      completionPercentage: calculatedPct,
    });
  };

  // Add new topic row
  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicText.trim()) return;

    const newTopic: TableTopicItem = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      topic: newTopicText.trim(),
      details: newTopicDetails.trim() || undefined,
      textbook: false,
      livemcq: false,
      qbank: false,
      others: false,
    };

    const updatedTopics = computeCellWeights([...plan.topics, newTopic]);
    const calculatedPct = calculatePlanPercentage(updatedTopics);

    updatePlanWithHistory({
      ...plan,
      topics: updatedTopics,
      completionPercentage: calculatedPct,
    });

    setNewTopicText("");
    setNewTopicDetails("");
    setIsAddingRow(false);
  };

  // Delete topic row
  const handleDeleteTopic = (topicId: string) => {
    const remaining = plan.topics.filter((t) => t.id !== topicId);
    const reweighted = computeCellWeights(remaining);
    const calculatedPct = calculatePlanPercentage(reweighted);

    updatePlanWithHistory({
      ...plan,
      topics: reweighted,
      completionPercentage: calculatedPct,
    });
  };

  // Check all cells
  const handleCheckAll = () => {
    const allChecked = plan.topics.map((t) => ({
      ...t,
      textbook: true,
      livemcq: true,
      qbank: true,
      others: t.othersWeight && t.othersWeight > 0 ? true : t.others,
    }));

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    });

    const calculatedPct = calculatePlanPercentage(allChecked);

    updatePlanWithHistory({
      ...plan,
      topics: allChecked,
      completionPercentage: calculatedPct,
    });
  };

  // Uncheck all cells
  const handleUncheckAll = () => {
    if (!window.confirm("আজকের সব টিক মার্ক রিসেট করতে চান?")) return;
    const cleared = plan.topics.map((t) => ({
      ...t,
      textbook: false,
      livemcq: false,
      qbank: false,
      others: false,
    }));
    updatePlanWithHistory({
      ...plan,
      topics: cleared,
      completionPercentage: 0,
    });
  };

  // Total checked count & total possible checks
  const totalCells = plan.topics.length * 4;
  const checkedCells = plan.topics.reduce((acc, t) => {
    return acc + (t.textbook ? 1 : 0) + (t.livemcq ? 1 : 0) + (t.qbank ? 1 : 0) + (t.others ? 1 : 0);
  }, 0);

  const weightedTopics = computeCellWeights(plan.topics);

  // Urgent uncompleted tasks calculation (due today or overdue)
  const urgentTasks = useMemo(() => {
    return uncompletedTasks.filter((t) => {
      if (t.completed) return false;
      try {
        const today = new Date(currentDate + "T00:00:00");
        const target = new Date(t.deadlineDate + "T00:00:00");
        const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff <= 0; // due today or overdue
      } catch {
        return false;
      }
    });
  }, [uncompletedTasks, currentDate]);

  const pendingTasksCount = uncompletedTasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* Urgent Uncompleted Tasks Alert Banner */}
      {urgentTasks.length > 0 && onOpenUncompletedTasks && (
        <div 
          onClick={onOpenUncompletedTasks}
          className="p-3 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 shadow-xs flex items-center justify-between gap-3 text-xs sm:text-sm text-rose-900 dark:text-rose-200 cursor-pointer hover:bg-rose-100/80 dark:hover:bg-rose-950/60 transition group animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <div className="font-semibold">
              <span className="font-bold text-rose-700 dark:text-rose-300">🔔 অসম্পূর্ণ টাস্কের ডেডলাইন আজ:</span>{' '}
              আজ {toBengaliNumber(urgentTasks.length)} টি অসম্পূর্ণ বিষয়ের ডেডলাইন উপস্থিত! দ্রুত সম্পন্ন করুন।
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs group-hover:bg-rose-700 transition shadow-2xs"
          >
            টাস্ক লিস্ট দেখুন &rarr;
          </button>
        </div>
      )}

      {/* 1. PROGRESS DASHBOARD: Daily & Weekly Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Daily Progress Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
                  আজকের পড়া ({formatBanglaDate(currentDate)})
                </span>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  দৈনিক প্রগ্রেস: <span className="text-emerald-600 dark:text-emerald-400">{toBengaliNumber(currentDailyPercentage)}%</span>
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {toBengaliNumber(checkedCells)} / {toBengaliNumber(totalCells)} টি পড়া শেষ
              </span>
            </div>
          </div>

          {/* Daily Progress Bar */}
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200/60 dark:border-stone-700/60">
            <div 
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${currentDailyPercentage}%` }}
            />
          </div>
        </div>

        {/* Weekly Progress Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
                  চলতি সপ্তাহের ধারাবাহিকতা
                </span>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  সাপ্তাহিক গড়: <span className="text-blue-600 dark:text-blue-400">{toBengaliNumber(weeklyStats.averageWeeklyPercentage)}%</span>
                </h3>
              </div>
            </div>
          </div>

          {/* Weekly Progress Bar & Day Pills */}
          <div className="space-y-2">
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200/60 dark:border-stone-700/60">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${weeklyStats.averageWeeklyPercentage}%` }}
              />
            </div>

            {/* 7 Days Mini Indicator */}
            <div className="grid grid-cols-7 gap-1 pt-1">
              {weeklyStats.daysData.map((day) => (
                <button
                  key={day.date}
                  onClick={() => onDateChange(day.date)}
                  className={`py-1 px-0.5 rounded-lg text-center transition flex flex-col items-center cursor-pointer ${
                    day.isCurrent
                      ? "bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold"
                      : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium"
                  }`}
                  title={`${day.date}: ${day.percentage}%`}
                >
                  <span className="text-[10px]">{day.dayNameBn}</span>
                  <span className={`text-[11px] font-mono ${day.percentage > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-stone-400"}`}>
                    {toBengaliNumber(day.percentage)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 2. TABLE ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
            সিলেবাস টেবিল ({formatBanglaDate(currentDate)})
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
            (মোট {toBengaliNumber(plan.topics.length)} টি টপিক)
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>মোট ওয়েট: ১০০%</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          
          {/* Undo & Redo History (Last 7 Actions) */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
            <button
              id="btn-undo-action"
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                undoStack.length > 0
                  ? "text-stone-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 shadow-xs cursor-pointer"
                  : "text-stone-400 dark:text-stone-600 cursor-not-allowed opacity-40"
              }`}
              title={
                undoStack.length > 0
                  ? `পূর্বাবস্থায় ফিরুন (Undo - Ctrl+Z) • ${undoStack.length}/৭ টি অ্যাকশন সংরক্ষিত`
                  : "পূর্বাবস্থায় ফেরার মতো কোনো অ্যাকশন নেই"
              }
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
              {undoStack.length > 0 && (
                <span className="text-[10px] font-bold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-1.5 py-0.2 rounded-full font-mono">
                  {toBengaliNumber(undoStack.length)}
                </span>
              )}
            </button>

            <button
              id="btn-redo-action"
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                redoStack.length > 0
                  ? "text-stone-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 shadow-xs cursor-pointer"
                  : "text-stone-400 dark:text-stone-600 cursor-not-allowed opacity-40"
              }`}
              title={
                redoStack.length > 0
                  ? `পুনরায় করুন (Redo - Ctrl+Y) • ${redoStack.length}/৭ টি অ্যাকশন`
                  : "পুনরায় করার মতো কোনো অ্যাকশন নেই"
              }
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span>Redo</span>
              {redoStack.length > 0 && (
                <span className="text-[10px] font-bold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-1.5 py-0.2 rounded-full font-mono">
                  {toBengaliNumber(redoStack.length)}
                </span>
              )}
            </button>
          </div>

          {/* Add Single Topic */}
          <button
            id="btn-add-single-topic"
            onClick={() => setIsAddingRow(!isAddingRow)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ নতুন টপিক</span>
          </button>

          {/* Edit/Add with Code (Bulk Format) */}
          <button
            id="btn-edit-code-format"
            onClick={handleOpenCodeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 text-xs font-semibold shadow-xs transition cursor-pointer"
            title="কোড বা টেক্সট ফরম্যাটে টপিক এবং পার্সেন্টেজ লিখুন"
          >
            <Code className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>কোড এডিটর</span>
          </button>

          {/* Uncompleted Tasks Action Button */}
          {onOpenUncompletedTasks && (
            <button
              id="btn-action-uncompleted-tasks"
              type="button"
              onClick={onOpenUncompletedTasks}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                urgentTasks.length > 0
                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400/50"
                  : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700"
              }`}
              title="অসম্পূর্ণ টাস্ক ও ডেডলাইন ম্যানেজ করুন"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>অসম্পূর্ণ টাস্ক</span>
              {pendingTasksCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                  urgentTasks.length > 0 
                    ? "bg-white text-rose-600" 
                    : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                }`}>
                  {toBengaliNumber(pendingTasksCount)}
                </span>
              )}
            </button>
          )}

          {/* Check All */}
          {plan.topics.length > 0 && (
            <button
              id="btn-check-all-topics"
              onClick={handleCheckAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold border border-emerald-300 dark:border-emerald-700/60 shadow-xs transition cursor-pointer"
              title="আজকের সব ঘরে টিক দিন"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>সব টিক দিন</span>
            </button>
          )}

          {/* Uncheck All */}
          {checkedCells > 0 && (
            <button
              id="btn-uncheck-all-topics"
              onClick={handleUncheckAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium border border-red-200 dark:border-red-900/50 transition cursor-pointer"
              title="সব টিক আনচেক করুন"
            >
              <span>আনচেক</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100/70 dark:bg-stone-800/50 text-[11px] text-stone-500 dark:text-stone-400 border border-stone-200/60 dark:border-stone-700/60">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>যেকোনো <strong>টপিকের নাম</strong> বা <strong>পার্সেন্টেজে ডাবল ক্লিক (Double Click)</strong> করে সরাসরি এডিট ও সেভ করতে পারবেন। কোনো ভুলে <strong>Undo (Ctrl+Z)</strong> বা <strong>Redo (Ctrl+Y)</strong> ব্যবহার করুন।</span>
      </div>

      {/* 3. ADD NEW TOPIC INLINE FORM */}
      {isAddingRow && (
        <form onSubmit={handleAddTopic} className="p-4 rounded-2xl bg-white dark:bg-stone-900 border-2 border-emerald-500/50 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>টেবিলে নতুন ১টি টপিক যুক্ত করুন</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingRow(false)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
            >
              বাতিল
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                টপিকের নাম / অধ্যায় *
              </label>
              <input
                type="text"
                required
                value={newTopicText}
                onChange={(e) => setNewTopicText(e.target.value)}
                placeholder="যেমন: সমাস ও সন্ধি বিশ্লেষণ"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                উৎস বা নোট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={newTopicDetails}
                onChange={(e) => setNewTopicDetails(e.target.value)}
                placeholder="যেমন: LiveMCQ শিট নং-৪ ও ৯ম শ্রেণির বোর্ড বই"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingRow(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              টেবিলে সেভ করুন
            </button>
          </div>
        </form>
      )}

      {/* 4. MAIN SYLLABUS TABLE TRACKER */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs overflow-x-auto sm:overflow-x-visible">
        <table className="w-full text-left border-collapse">
          
          {/* Table Header - Fixed at the top under Navbar (top-16) when scrolled */}
          <thead className="bg-stone-100 dark:bg-stone-900">
            <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase tracking-wider">
              
              {/* Topic Column */}
              <th className="sticky top-16 z-20 bg-stone-100 dark:bg-stone-900 py-3.5 px-4 min-w-[180px] sm:min-w-[220px] first:rounded-tl-2xl border-b border-stone-200 dark:border-stone-800 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-stone-500" />
                  <span>Topic (টপিক)</span>
                </div>
              </th>

              {/* Textbook Column */}
              <th className="sticky top-16 z-20 bg-stone-100 dark:bg-stone-900 py-3.5 px-3 text-center min-w-[100px] sm:min-w-[110px] border-b border-stone-200 dark:border-stone-800 shadow-2xs">
                <div className="flex flex-col items-center">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Textbook</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">বোর্ড বই</span>
                </div>
              </th>

              {/* LiveMCQ PDF Column */}
              <th className="sticky top-16 z-20 bg-stone-100 dark:bg-stone-900 py-3.5 px-3 text-center min-w-[110px] sm:min-w-[120px] border-b border-stone-200 dark:border-stone-800 shadow-2xs">
                <div className="flex flex-col items-center">
                  <span className="text-blue-700 dark:text-blue-400 font-bold">LiveMCQ PDF</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">পিডিএফ শিট</span>
                </div>
              </th>

              {/* Q-Bank Column */}
              <th className="sticky top-16 z-20 bg-stone-100 dark:bg-stone-900 py-3.5 px-3 text-center min-w-[100px] sm:min-w-[110px] border-b border-stone-200 dark:border-stone-800 shadow-2xs">
                <div className="flex flex-col items-center">
                  <span className="text-amber-700 dark:text-amber-400 font-bold">Q-Bank</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">প্রশ্নব্যাংক</span>
                </div>
              </th>

              {/* Others Column */}
              <th className="sticky top-16 z-20 bg-stone-100 dark:bg-stone-900 py-3.5 px-3 text-center min-w-[90px] sm:min-w-[100px] border-b border-stone-200 dark:border-stone-800 shadow-2xs">
                <div className="flex flex-col items-center">
                  <span className="text-purple-700 dark:text-purple-400 font-bold">Others</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">রিভিশন/অন্যান্য</span>
                </div>
              </th>

              {/* Row Delete Action */}
              <th className="sticky top-16 z-20 bg-stone-100 dark:bg-stone-900 py-3.5 px-2 text-center w-10 last:rounded-tr-2xl border-b border-stone-200 dark:border-stone-800 shadow-2xs"></th>

            </tr>
          </thead>

            {/* Table Body Rows */}
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs sm:text-sm">
              {weightedTopics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500 dark:text-stone-400 text-xs">
                    কোনো টপিক পাওয়া যায়নি। উপরে "+ নতুন টপিক" অথবা "কোড এডিটর" বাটন দিয়ে যোগ করুন।
                  </td>
                </tr>
              ) : (
                weightedTopics.map((item, index) => {
                  const isAllChecked = item.textbook && item.livemcq && item.qbank && item.others;
                  const isEditing = editingTopicId === item.id;

                  if (isEditing) {
                    return (
                      <tr 
                        key={item.id} 
                        className="bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-500 shadow-sm"
                      >
                        {/* Topic Name & Details Inputs */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={editForm.topic}
                              onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEdit();
                                if (e.key === "Escape") handleCancelInlineEdit();
                              }}
                              placeholder="টপিকের নাম..."
                              className="w-full px-2.5 py-1 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={editForm.details}
                              onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEdit();
                                if (e.key === "Escape") handleCancelInlineEdit();
                              }}
                              placeholder="উৎস বা নোট (ঐচ্ছিক)"
                              className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>টপিক যোগফল: {(Number(editForm.textbookWeight || 0) + Number(editForm.livemcqWeight || 0) + Number(editForm.qbankWeight || 0) + Number(editForm.othersWeight || 0)).toFixed(2)}% (বাকিগুলো সমানভাবে ব্যালেন্স হবে)</span>
                            </div>
                          </div>
                        </td>

                        {/* Textbook % input */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <label className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">Textbook %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.textbookWeight}
                              onChange={(e) => setEditForm({ ...editForm, textbookWeight: parseFloat(e.target.value) || 0 })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEdit();
                                if (e.key === "Escape") handleCancelInlineEdit();
                              }}
                              className="w-16 px-1.5 py-1 text-center font-mono text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </td>

                        {/* LiveMCQ % input */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <label className="text-[10px] text-blue-700 dark:text-blue-300 font-bold">LiveMCQ %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.livemcqWeight}
                              onChange={(e) => setEditForm({ ...editForm, livemcqWeight: parseFloat(e.target.value) || 0 })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEdit();
                                if (e.key === "Escape") handleCancelInlineEdit();
                              }}
                              className="w-16 px-1.5 py-1 text-center font-mono text-xs font-bold rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </td>

                        {/* Q-Bank % input */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <label className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">Q-Bank %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.qbankWeight}
                              onChange={(e) => setEditForm({ ...editForm, qbankWeight: parseFloat(e.target.value) || 0 })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEdit();
                                if (e.key === "Escape") handleCancelInlineEdit();
                              }}
                              className="w-16 px-1.5 py-1 text-center font-mono text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </td>

                        {/* Others % input */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <label className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">Others %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.othersWeight}
                              onChange={(e) => setEditForm({ ...editForm, othersWeight: parseFloat(e.target.value) || 0 })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEdit();
                                if (e.key === "Escape") handleCancelInlineEdit();
                              }}
                              className="w-16 px-1.5 py-1 text-center font-mono text-xs font-bold rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </td>

                        {/* Save / Cancel buttons */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={handleSaveInlineEdit}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                              title="সেভ করুন (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelInlineEdit}
                              className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 transition cursor-pointer"
                              title="বাতিল (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr 
                      key={item.id}
                      className={`group transition-colors duration-150 ${
                        isAllChecked 
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20" 
                          : "hover:bg-stone-50/80 dark:hover:bg-stone-800/40"
                      }`}
                    >
                      
                      {/* Topic Name & Details */}
                      <td 
                        onDoubleClick={() => startEditingTopic(item)}
                        className="py-3 px-4 cursor-pointer select-none"
                        title="ডাবল ক্লিক করে নাম ও পার্সেন্টেজ এডিট করুন"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className={`font-semibold leading-snug block ${
                              isAllChecked 
                                ? "text-emerald-900 dark:text-emerald-200 line-through opacity-80" 
                                : "text-stone-900 dark:text-stone-100"
                            }`}>
                              {toBengaliNumber(index + 1)}. {item.topic}
                            </span>
                            {item.details && (
                              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                {item.details}
                              </p>
                            )}
                          </div>

                          {/* Hover Edit Pencil Icon */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingTopic(item);
                            }}
                            className="p-1 rounded-md text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0"
                            title="টপিক ও পার্সেন্টেজ এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 1. Textbook Cell */}
                      <td 
                        onClick={() => handleToggleCell(item.id, 'textbook')}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditingTopic(item);
                        }}
                        className={`py-3 px-2 text-center cursor-pointer select-none transition ${
                          item.textbook 
                            ? "bg-emerald-100/50 dark:bg-emerald-950/50" 
                            : "hover:bg-stone-100 dark:hover:bg-stone-800/60"
                        }`}
                        title="ক্লিক করে টিক দিন • ডাবল ক্লিকে পার্সেন্টেজ এডিট করুন"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div 
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                              item.textbook
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "border-2 border-stone-300 dark:border-stone-600 text-transparent"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <span className={`text-[10px] font-mono font-medium ${
                            item.textbook ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-stone-400"
                          }`}>
                            +{toBengaliNumber(item.textbookWeight || 0)}%
                          </span>
                        </div>
                      </td>

                      {/* 2. LiveMCQ PDF Cell */}
                      <td 
                        onClick={() => handleToggleCell(item.id, 'livemcq')}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditingTopic(item);
                        }}
                        className={`py-3 px-2 text-center cursor-pointer select-none transition ${
                          item.livemcq 
                            ? "bg-blue-100/50 dark:bg-blue-950/50" 
                            : "hover:bg-stone-100 dark:hover:bg-stone-800/60"
                        }`}
                        title="ক্লিক করে টিক দিন • ডাবল ক্লিকে পার্সেন্টেজ এডিট করুন"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div 
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                              item.livemcq
                                ? "bg-blue-600 text-white shadow-xs"
                                : "border-2 border-stone-300 dark:border-stone-600 text-transparent"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <span className={`text-[10px] font-mono font-medium ${
                            item.livemcq ? "text-blue-700 dark:text-blue-300 font-bold" : "text-stone-400"
                          }`}>
                            +{toBengaliNumber(item.livemcqWeight || 0)}%
                          </span>
                        </div>
                      </td>

                      {/* 3. Q-Bank Cell */}
                      <td 
                        onClick={() => handleToggleCell(item.id, 'qbank')}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditingTopic(item);
                        }}
                        className={`py-3 px-2 text-center cursor-pointer select-none transition ${
                          item.qbank 
                            ? "bg-amber-100/50 dark:bg-amber-950/50" 
                            : "hover:bg-stone-100 dark:hover:bg-stone-800/60"
                        }`}
                        title="ক্লিক করে টিক দিন • ডাবল ক্লিকে পার্সেন্টেজ এডিট করুন"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div 
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                              item.qbank
                                ? "bg-amber-600 text-white shadow-xs"
                                : "border-2 border-stone-300 dark:border-stone-600 text-transparent"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <span className={`text-[10px] font-mono font-medium ${
                            item.qbank ? "text-amber-700 dark:text-amber-300 font-bold" : "text-stone-400"
                          }`}>
                            +{toBengaliNumber(item.qbankWeight || 0)}%
                          </span>
                        </div>
                      </td>

                      {/* 4. Others Cell */}
                      <td 
                        onClick={() => handleToggleCell(item.id, 'others')}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditingTopic(item);
                        }}
                        className={`py-3 px-2 text-center cursor-pointer select-none transition ${
                          item.others 
                            ? "bg-purple-100/50 dark:bg-purple-950/50" 
                            : "hover:bg-stone-100 dark:hover:bg-stone-800/60"
                        }`}
                        title="ক্লিক করে টিক দিন • ডাবল ক্লিকে পার্সেন্টেজ এডিট করুন"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div 
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                              item.others
                                ? "bg-purple-600 text-white shadow-xs"
                                : "border-2 border-stone-300 dark:border-stone-600 text-transparent"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <span className={`text-[10px] font-mono font-medium ${
                            item.others ? "text-purple-700 dark:text-purple-300 font-bold" : "text-stone-400"
                          }`}>
                            +{toBengaliNumber(item.othersWeight || 0)}%
                          </span>
                        </div>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingTopic(item)}
                            className="p-1 rounded-lg text-stone-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                            title="এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(item.id)}
                            className="p-1 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                            title="টপিকটি মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

      {/* 5. CODE FORMAT / BULK TOPIC EDITOR MODAL */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    কোড ফরম্যাটে টপিক ও পার্সেন্টেজ লিখুন ({formatBanglaDate(currentDate)})
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    প্রতি লাইনে নিচের নির্দিষ্ট ফরম্যাট অনুযায়ী লিখুন
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCodeModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              
              {/* Format Guide Box */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/70 rounded-xl border border-stone-200 dark:border-stone-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 dark:text-stone-100">নির্দিষ্ট ফরম্যাট:</span>
                  <span className="text-[10px] text-stone-500 font-mono">Others percent will always be zero</span>
                </div>
                <div className="p-2 bg-white dark:bg-stone-900 rounded-lg font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border border-stone-200 dark:border-stone-700 overflow-x-auto select-all">
                  1. topic &gt; textbook percent &gt; LIVE MCQ pdf percent &gt; Q- Bank percent &gt; 0
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  💡 <strong>উদাহরণ:</strong><br />
                  1. সমাস ও সন্ধি বিশ্লেষণ &gt; 3.75 &gt; 8.38 &gt; 3.13 &gt; 0<br />
                  2. কারক, বিভক্তি ও পদ &gt; 3.75 &gt; 8.38 &gt; 3.13 &gt; 0
                </p>
              </div>

              {/* Code Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    টপিক কোড / টেক্সট:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(codeContent);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-emerald-600 transition cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? "কপি হয়েছে!" : "কোড কপি করুন"}</span>
                  </button>
                </div>

                <textarea
                  value={codeContent}
                  onChange={(e) => {
                    setCodeContent(e.target.value);
                    if (codeParseError) setCodeParseError("");
                  }}
                  rows={9}
                  placeholder={`1. সমাস ও সন্ধি বিশ্লেষণ > 3.75 > 8.38 > 3.13 > 0\n2. কারক ও বিভক্তি > 3.75 > 8.38 > 3.13 > 0`}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                />
              </div>

              {/* Error Warning */}
              {codeParseError && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{codeParseError}</span>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between gap-2 p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50">
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
              >
                বাতিল
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyCode("append")}
                  className="px-3 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 text-xs font-semibold transition cursor-pointer"
                  title="বর্তমান তালিকার শেষে যোগ করুন"
                >
                  + নিচে যুক্ত করুন
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyCode("replace")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  title="পুরো দিনটির সিলেবাস এটি দিয়ে রিপ্লেস করুন"
                >
                  আজকের সিলেবাস সেভ করুন
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

