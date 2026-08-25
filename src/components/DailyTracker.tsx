import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Sparkles, 
  Clock, 
  BookOpen, 
  FileQuestion, 
  Smartphone, 
  Repeat, 
  Trash2, 
  Edit3, 
  Lightbulb, 
  Play, 
  Check, 
  Scale, 
  Layers,
  ArrowRight,
  TrendingUp,
  Filter,
  Save
} from "lucide-react";
import { DailyPlan, StudyTask, StudySource, BCSSubject } from "../types";
import { SOURCE_CONFIG, BCS_SUBJECTS, toBengaliNumber } from "../lib/bcsSyllabus";

interface DailyTrackerProps {
  plan: DailyPlan;
  onUpdatePlan: (updatedPlan: DailyPlan) => void;
  onOpenAiModal: () => void;
  onStartTimerForTask: (task: StudyTask) => void;
  onOpenSamplePlans: () => void;
}

export const DailyTracker: React.FC<DailyTrackerProps> = ({
  plan,
  onUpdatePlan,
  onOpenAiModal,
  onStartTimerForTask,
  onOpenSamplePlans,
}) => {
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<StudySource | 'all'>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // New task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState<BCSSubject>("বাংলা সাহিত্য ও ব্যাকরণ");
  const [taskSource, setTaskSource] = useState<StudySource>("textbook");
  const [taskSourceDetails, setTaskSourceDetails] = useState("");
  const [taskMinutes, setTaskMinutes] = useState(45);
  const [taskWeight, setTaskWeight] = useState(25);
  const [taskTip, setTaskTip] = useState("");

  // Day Reflection / Notes
  const [dayReflection, setDayReflection] = useState(plan.dayReflection || "");
  const [isSavedReflection, setIsSavedReflection] = useState(false);

  useEffect(() => {
    setDayReflection(plan.dayReflection || "");
  }, [plan.date, plan.dayReflection]);

  // Calculate current completion percentage & source metrics
  const totalTasksCount = plan.tasks.length;
  const completedTasksCount = plan.tasks.filter(t => t.completed).length;

  const totalWeight = plan.tasks.reduce((sum, t) => sum + (Number(t.percentageWeight) || 0), 0);
  const completedWeight = plan.tasks
    .filter(t => t.completed)
    .reduce((sum, t) => sum + (Number(t.percentageWeight) || 0), 0);

  const completionPct = totalWeight > 0 ? Math.min(100, Math.round((completedWeight / totalWeight) * 100)) : 0;

  // Source-wise metrics
  const sourceStats: Record<StudySource, { total: number; completed: number; weightTotal: number; weightCompleted: number }> = {
    textbook: { total: 0, completed: 0, weightTotal: 0, weightCompleted: 0 },
    livemcq: { total: 0, completed: 0, weightTotal: 0, weightCompleted: 0 },
    question_bank: { total: 0, completed: 0, weightTotal: 0, weightCompleted: 0 },
    revision: { total: 0, completed: 0, weightTotal: 0, weightCompleted: 0 },
  };

  plan.tasks.forEach(task => {
    const s = task.source || 'textbook';
    if (sourceStats[s]) {
      sourceStats[s].total += 1;
      sourceStats[s].weightTotal += Number(task.percentageWeight) || 0;
      if (task.completed) {
        sourceStats[s].completed += 1;
        sourceStats[s].weightCompleted += Number(task.percentageWeight) || 0;
      }
    }
  });

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = plan.tasks.map(task => {
      if (task.id === taskId) {
        const nextCompleted = !task.completed;
        return {
          ...task,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return task;
    });

    const newCompletedWeight = updatedTasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + (Number(t.percentageWeight) || 0), 0);
    const newTotalWeight = updatedTasks.reduce((sum, t) => sum + (Number(t.percentageWeight) || 0), 0);
    const newPct = newTotalWeight > 0 ? Math.min(100, Math.round((newCompletedWeight / newTotalWeight) * 100)) : 0;

    // Trigger celebratory confetti when reaching 100% completion!
    if (newPct === 100 && completionPct < 100) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
      });
    }

    onUpdatePlan({
      ...plan,
      tasks: updatedTasks,
      completionPercentage: newPct,
    });
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    const filteredTasks = plan.tasks.filter(t => t.id !== taskId);
    onUpdatePlan({
      ...plan,
      tasks: filteredTasks,
    });
  };

  // Normalize / Rebalance Weights to 100%
  const handleNormalizeWeights = () => {
    if (plan.tasks.length === 0) return;
    const count = plan.tasks.length;
    const equalShare = Math.floor(100 / count);
    const remainder = 100 - (equalShare * count);

    const rebalancedTasks = plan.tasks.map((task, idx) => ({
      ...task,
      percentageWeight: equalShare + (idx === count - 1 ? remainder : 0)
    }));

    onUpdatePlan({
      ...plan,
      tasks: rebalancedTasks,
    });
  };

  // Add or Update Task
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTaskId) {
      // Edit existing
      const updated = plan.tasks.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            title: taskTitle,
            subject: taskSubject,
            source: taskSource,
            sourceDetails: taskSourceDetails,
            estimatedMinutes: Number(taskMinutes) || 30,
            percentageWeight: Number(taskWeight) || 20,
            strategicTip: taskTip,
          };
        }
        return t;
      });
      onUpdatePlan({ ...plan, tasks: updated });
      setEditingTaskId(null);
    } else {
      // Add new
      const newTask: StudyTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: taskTitle,
        subject: taskSubject,
        source: taskSource,
        sourceDetails: taskSourceDetails,
        estimatedMinutes: Number(taskMinutes) || 45,
        percentageWeight: Number(taskWeight) || 20,
        completed: false,
        strategicTip: taskTip,
      };

      onUpdatePlan({
        ...plan,
        tasks: [...plan.tasks, newTask],
      });
    }

    // Reset Form
    setTaskTitle("");
    setTaskSourceDetails("");
    setTaskTip("");
    setIsAddingTask(false);
  };

  const startEditTask = (task: StudyTask) => {
    setTaskTitle(task.title);
    setTaskSubject(task.subject as BCSSubject);
    setTaskSource(task.source);
    setTaskSourceDetails(task.sourceDetails || "");
    setTaskMinutes(task.estimatedMinutes);
    setTaskWeight(task.percentageWeight);
    setTaskTip(task.strategicTip || "");
    setEditingTaskId(task.id);
    setIsAddingTask(true);
  };

  // Save Daily Reflection
  const handleSaveReflection = () => {
    onUpdatePlan({
      ...plan,
      dayReflection: dayReflection,
    });
    setIsSavedReflection(true);
    setTimeout(() => setIsSavedReflection(false), 2000);
  };

  // Filter tasks based on selected tab
  const filteredTasks = plan.tasks.filter(task => {
    if (selectedSourceFilter === 'all') return true;
    return task.source === selectedSourceFilter;
  });

  return (
    <div className="space-y-6">

      {/* Hero Progress & Daily Overview Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700 shadow-xs relative overflow-hidden">
        
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Overall Completion Circle & Status */}
          <div className="flex items-center gap-5">
            {/* Circular Gauge / Percentage Indicator */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Track circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-stone-100 dark:stroke-stone-700/80"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Active progress stroke */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-emerald-600 dark:stroke-emerald-500 transition-all duration-700 ease-out"
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionPct / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-50">
                  {toBengaliNumber(completionPct)}%
                </span>
                <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 -mt-1">
                  সম্পন্ন
                </span>
              </div>
            </div>

            {/* Overview text */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                  আজকের প্রস্তুতি লক্ষ্য
                </h2>
                {completionPct === 100 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                    🎉 লক্ষ্য পূরণ!
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-xl">
                {plan.daySummary || "আজকের প্রয়োজনীয় পাঠ্যবই, লাইভ এমসিকিউ শিট ও বিগত প্রশ্নব্যাংকের তালিকা নিচে দেওয়া হলো।"}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {toBengaliNumber(completedTasksCount)}/{toBengaliNumber(totalTasksCount)} টাস্ক সম্পন্ন
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  মোট গুরুত্ব: {toBengaliNumber(completedWeight)}/{toBengaliNumber(totalWeight)}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
            <button
              id="btn-trigger-ai-plan"
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI রুটিন / ছবি থেকে লোড</span>
            </button>

            <button
              id="btn-add-manual-task"
              onClick={() => {
                setEditingTaskId(null);
                setTaskTitle("");
                setIsAddingTask(!isAddingTask);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 text-xs sm:text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন টাস্ক</span>
            </button>
          </div>
        </div>

        {/* Strategy Advice Banner if provided */}
        {plan.strategyAdvice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
            <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold mr-1">বিসিএস স্ট্র্যাটেজি পরামর্শ:</span>
              <span>{plan.strategyAdvice}</span>
            </div>
          </div>
        )}

        {/* Source-wise Progress Distribution Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-stone-100 dark:border-stone-700/60">
          
          {/* Textbook Box */}
          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> পাঠ্যবই
              </span>
              <span>{toBengaliNumber(sourceStats.textbook.completed)}/{toBengaliNumber(sourceStats.textbook.total)}</span>
            </div>
            <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${sourceStats.textbook.total > 0 ? (sourceStats.textbook.completed / sourceStats.textbook.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* LiveMCQ Box */}
          <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> LiveMCQ
              </span>
              <span>{toBengaliNumber(sourceStats.livemcq.completed)}/{toBengaliNumber(sourceStats.livemcq.total)}</span>
            </div>
            <div className="w-full bg-blue-200/60 dark:bg-blue-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${sourceStats.livemcq.total > 0 ? (sourceStats.livemcq.completed / sourceStats.livemcq.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Question Bank Box */}
          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-1">
                <FileQuestion className="w-3.5 h-3.5" /> প্রশ্নব্যাংক
              </span>
              <span>{toBengaliNumber(sourceStats.question_bank.completed)}/{toBengaliNumber(sourceStats.question_bank.total)}</span>
            </div>
            <div className="w-full bg-amber-200/60 dark:bg-amber-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-amber-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${sourceStats.question_bank.total > 0 ? (sourceStats.question_bank.completed / sourceStats.question_bank.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Revision Notes Box */}
          <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/50">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-800 dark:text-purple-300">
              <span className="flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5" /> রিভিশন
              </span>
              <span>{toBengaliNumber(sourceStats.revision.completed)}/{toBengaliNumber(sourceStats.revision.total)}</span>
            </div>
            <div className="w-full bg-purple-200/60 dark:bg-purple-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-purple-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${sourceStats.revision.total > 0 ? (sourceStats.revision.completed / sourceStats.revision.total) * 100 : 0}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Manual Task Add / Edit Modal Form */}
      {isAddingTask && (
        <form onSubmit={handleSaveTask} className="p-5 rounded-2xl bg-white dark:bg-stone-800 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
            <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              {editingTaskId ? "টাস্ক সম্পাদনা করুন" : "নতুন পড়ার টাস্ক যুক্ত করুন"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddingTask(false);
                setEditingTaskId(null);
              }}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              বাতিল
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                টপিক / পড়ার শিরোনাম *
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="যেমন: বাংলা ব্যাকরণ - কারক ও বিভক্তি"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                পড়ার উৎস (Source) *
              </label>
              <select
                value={taskSource}
                onChange={e => setTaskSource(e.target.value as StudySource)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              >
                <option value="textbook">পাঠ্যবই ও ডাইজেস্ট (Textbooks)</option>
                <option value="livemcq">লাইভ এমসিকিউ শিট ও এক্সাম (LiveMCQ PDFs)</option>
                <option value="question_bank">বিসিএস ও পিএসসি প্রশ্নব্যাংক (Question Bank)</option>
                <option value="revision">রিভিশন ও ভুল প্রশ্নের খাতা (Revision)</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                বিসিএস বিষয় (Subject) *
              </label>
              <select
                value={taskSubject}
                onChange={e => setTaskSubject(e.target.value as BCSSubject)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              >
                {BCS_SUBJECTS.map(s => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({toBengaliNumber(s.marks)} নম্বর)
                  </option>
                ))}
              </select>
            </div>

            {/* Source Details / Pages */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                বইয়ের নাম / পৃষ্ঠা / PDF নম্বর
              </label>
              <input
                type="text"
                value={taskSourceDetails}
                onChange={e => setTaskSourceDetails(e.target.value)}
                placeholder="যেমন: MP3 বাংলা পৃঃ ৪০-৪৮ অথবা LiveMCQ PDF #৭"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* Percentage Weight & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  শতকরা গুরুত্ব (% Weight)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={taskWeight}
                  onChange={e => setTaskWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  সময় (মিনিট)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={taskMinutes}
                  onChange={e => setTaskMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* Strategic Tip */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                পড়ার স্পেশাল নোট বা টিপস (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={taskTip}
                onChange={e => setTaskTip(e.target.value)}
                placeholder="যেমন: কারক নির্ণয়ে ক্রিয়াকে প্রশ্ন করার চার্টটি ভালো করে দেখতে হবে"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs"
            >
              {editingTaskId ? "হালনাগাদ করুন" : "টাস্ক যোগ করুন"}
            </button>
          </div>
        </form>
      )}

      {/* Task Filters & Weight Balance Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
        
        {/* Source Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedSourceFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              selectedSourceFilter === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
          >
            সব ({toBengaliNumber(plan.tasks.length)})
          </button>

          <button
            onClick={() => setSelectedSourceFilter('textbook')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              selectedSourceFilter === 'textbook'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>পাঠ্যবই ({toBengaliNumber(sourceStats.textbook.total)})</span>
          </button>

          <button
            onClick={() => setSelectedSourceFilter('livemcq')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              selectedSourceFilter === 'livemcq'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>LiveMCQ ({toBengaliNumber(sourceStats.livemcq.total)})</span>
          </button>

          <button
            onClick={() => setSelectedSourceFilter('question_bank')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              selectedSourceFilter === 'question_bank'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>প্রশ্নব্যাংক ({toBengaliNumber(sourceStats.question_bank.total)})</span>
          </button>

          <button
            onClick={() => setSelectedSourceFilter('revision')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              selectedSourceFilter === 'revision'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>রিভিশন ({toBengaliNumber(sourceStats.revision.total)})</span>
          </button>
        </div>

        {/* Rebalance & Weight Indicator */}
        <div className="flex items-center gap-2 ml-auto">
          {totalWeight !== 100 && plan.tasks.length > 0 && (
            <button
              onClick={handleNormalizeWeights}
              title="সকল টাস্কের শতকরা গুরুত্ব সমানভাবে ভাগ বা ১০০% এডজাস্ট করুন"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 transition"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>১০০% ব্যালেন্স করুন</span>
            </button>
          )}

          <span className="text-xs text-stone-500 dark:text-stone-400">
            মোট গুরুত্ব: <strong className={totalWeight === 100 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 font-bold"}>{toBengaliNumber(totalWeight)}%</strong>
          </span>
        </div>
      </div>

      {/* Task Checklist Items */}
      {filteredTasks.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-stone-800/50 border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
            আজকের জন্য কোনো টাস্ক পাওয়া যায়নি
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            আপনি আপনার পড়ার রুটিনের ছবি আপলোড করতে পারেন অথবা AI দিয়ে আপনার পড়ার তালিকা বিশ্লেষণ করিয়ে শতকরা ভাগ করে নিতে পারেন।
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Sparkles className="w-4 h-4" /> AI দিয়ে রুটিন লোড করুন
            </button>
            <button
              onClick={onOpenSamplePlans}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-200 text-xs font-semibold transition"
            >
              <Layers className="w-4 h-4" /> স্যাম্পল রুটিন দেখুন
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const config = SOURCE_CONFIG[task.source || 'textbook'];
            return (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className={`p-4 rounded-2xl transition-all duration-200 border ${
                  task.completed
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-90'
                    : 'bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  
                  {/* Interactive Tick Checkbox */}
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`shrink-0 mt-1 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-emerald-600 text-white scale-105'
                        : 'border-2 border-stone-300 dark:border-stone-600 hover:border-emerald-500 text-transparent'
                    }`}
                    title={task.completed ? "সম্পন্ন হয়েছে (আনচেক করতে ক্লিক করুন)" : "সম্পন্ন করতে ক্লিক করুন"}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    
                    {/* Header Badges: Source, Subject, Weight */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      
                      {/* Source Tag */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${config.bgClass} ${config.textClass} ${config.borderClass}`}>
                        {task.source === 'textbook' && <BookOpen className="w-3 h-3" />}
                        {task.source === 'livemcq' && <Smartphone className="w-3 h-3" />}
                        {task.source === 'question_bank' && <FileQuestion className="w-3 h-3" />}
                        {task.source === 'revision' && <Repeat className="w-3 h-3" />}
                        <span>{config.nameBangla}</span>
                      </span>

                      {/* Subject Tag */}
                      <span className="px-2 py-0.5 rounded-md font-medium bg-stone-100 dark:bg-stone-700/80 text-stone-700 dark:text-stone-300">
                        {task.subject}
                      </span>

                      {/* Percentage Weight Badge */}
                      <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Scale className="w-3 h-3 text-amber-600" />
                        <span>গুরুত্ব: {toBengaliNumber(task.percentageWeight)}%</span>
                      </span>

                    </div>

                    {/* Task Title */}
                    <h4 className={`text-sm sm:text-base font-semibold leading-snug ${
                      task.completed
                        ? 'line-through text-stone-500 dark:text-stone-400'
                        : 'text-stone-900 dark:text-stone-100'
                    }`}>
                      {task.title}
                    </h4>

                    {/* Source Details / Specific Page or Exam Reference */}
                    {task.sourceDetails && (
                      <p className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1 font-medium">
                        <span className="text-stone-400">•</span>
                        <span>{task.sourceDetails}</span>
                      </p>
                    )}

                    {/* Strategic AI BCS Tip */}
                    {task.strategicTip && (
                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-700/60 flex items-start gap-1.5 text-xs text-stone-700 dark:text-stone-300">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{task.strategicTip}</span>
                      </div>
                    )}

                    {/* Action Bar: Timer, Estimated Duration, Edit, Delete */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      
                      <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>আনুমানিক: {toBengaliNumber(task.estimatedMinutes)} মিনিট</span>
                        </span>
                        {task.completedAt && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ সম্পন্ন হয়েছে
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        {/* Start Focus Timer for this Task */}
                        <button
                          onClick={() => onStartTimerForTask(task)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition"
                          title="এই টপিকের জন্য পড়ার টাইমার চালু করুন"
                        >
                          <Play className="w-3 h-3 fill-emerald-600" />
                          <span>টাইমার</span>
                        </button>

                        {/* Edit Task */}
                        <button
                          onClick={() => startEditTask(task)}
                          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Task */}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Study Reflection & Notes Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-emerald-600" />
            <span>আজকের পড়ার সারসংক্ষেপ ও ব্যক্তিগত মন্তব্য (Self Reflection)</span>
          </h3>
          <button
            onClick={handleSaveReflection}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavedReflection ? "সংরক্ষিত!" : "সেভ করুন"}</span>
          </button>
        </div>
        <textarea
          rows={3}
          value={dayReflection}
          onChange={e => setDayReflection(e.target.value)}
          placeholder="আজকে পড়ার অভিজ্ঞতা কেমন ছিল? কোন টপিকটি বেশি কঠিন লেগেছে বা আগামীকাল কী রিভিশন দিতে হবে তা লিখে রাখুন..."
          className="w-full p-3 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        />
      </div>

    </div>
  );
};
