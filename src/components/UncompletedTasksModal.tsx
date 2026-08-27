import React, { useState, useMemo } from "react";
import { 
  X, 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  ArrowRightCircle, 
  Flame, 
  Bell, 
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  Filter
} from "lucide-react";
import { UncompletedTask } from "../types";
import { toBengaliNumber, formatBanglaDate } from "../lib/bcsSyllabus";

interface UncompletedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: UncompletedTask[];
  onSaveTask: (task: UncompletedTask) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onAddTopicToTodayTable: (topicName: string, subject?: string) => void;
  currentDate: string;
}

const SUBJECT_OPTIONS = [
  "বাংলা সাহিত্য ও ব্যাকরণ",
  "ইংরেজি ভাষা ও সাহিত্য",
  "বাংলাদেশ বিষয়াবলী",
  "আন্তর্জাতিক বিষয়াবলী",
  "গাণিতিক যুক্তি",
  "মানসিক দক্ষতা",
  "সাধারণ বিজ্ঞান",
  "কম্পিউটার ও তথ্যপ্রযুক্তি",
  "ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা",
  "নৈতিকতা, মূল্যবোধ ও সুশাসন",
  "মডেল টেস্ট / রিভিশন",
  "অন্যান্য"
];

export const UncompletedTasksModal: React.FC<UncompletedTasksModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSaveTask,
  onDeleteTask,
  onToggleTask,
  onAddTopicToTodayTable,
  currentDate,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "due_today" | "upcoming" | "completed">("all");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [originalDate, setOriginalDate] = useState(currentDate);
  const [deadlineDate, setDeadlineDate] = useState(currentDate);
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("high");
  const [notes, setNotes] = useState("");
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  // Helper to get day difference relative to currentDate
  const getDayDiff = (targetDateStr: string) => {
    try {
      const today = new Date(currentDate + "T00:00:00");
      const target = new Date(targetDateStr + "T00:00:00");
      const diffTime = target.getTime() - today.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Categorize Tasks
  const taskStats = useMemo(() => {
    let dueTodayCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    tasks.forEach((t) => {
      if (t.completed) {
        completedCount++;
      } else {
        const diff = getDayDiff(t.deadlineDate);
        if (diff === 0) {
          dueTodayCount++;
        } else if (diff < 0) {
          overdueCount++;
        } else {
          upcomingCount++;
        }
      }
    });

    return {
      total: tasks.length,
      dueTodayCount,
      overdueCount,
      urgentCount: dueTodayCount + overdueCount,
      upcomingCount,
      completedCount,
    };
  }, [tasks, currentDate]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (activeTab === "completed") return t.completed;
      if (t.completed) return false;

      const diff = getDayDiff(t.deadlineDate);
      if (activeTab === "due_today") return diff <= 0;
      if (activeTab === "upcoming") return diff > 0;
      return true; // "all" pending
    });
  }, [tasks, activeTab, currentDate]);

  if (!isOpen) return null;

  const handleOpenAddForm = () => {
    setEditingTaskId(null);
    setTitle("");
    setOriginalDate(currentDate);
    setDeadlineDate(currentDate);
    setSubject(SUBJECT_OPTIONS[0]);
    setPriority("high");
    setNotes("");
    setIsAddingTask(true);
  };

  const handleOpenEditForm = (task: UncompletedTask) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setOriginalDate(task.originalDate);
    setDeadlineDate(task.deadlineDate);
    setSubject(task.subject || SUBJECT_OPTIONS[0]);
    setPriority(task.priority || "medium");
    setNotes(task.notes || "");
    setIsAddingTask(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskObj: UncompletedTask = {
      id: editingTaskId || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      originalDate: originalDate.trim() || currentDate,
      deadlineDate: deadlineDate.trim() || currentDate,
      subject,
      priority,
      notes: notes.trim(),
      completed: editingTaskId ? (tasks.find(t => t.id === editingTaskId)?.completed || false) : false,
      createdAt: editingTaskId ? (tasks.find(t => t.id === editingTaskId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveTask(taskObj);
    setIsAddingTask(false);
    setEditingTaskId(null);
    setTitle("");
    setNotes("");
  };

  const setDeadlinePreset = (daysFromToday: number) => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + daysFromToday);
    setDeadlineDate(d.toISOString().split("T")[0]);
  };

  return (
    <div 
      id="uncompleted-tasks-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="uncompleted-tasks-modal-container"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              taskStats.urgentCount > 0 
                ? "bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 animate-pulse" 
                : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  অসম্পূর্ণ টাস্ক ও ব্যাকলগ
                </h2>
                {taskStats.urgentCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse">
                    <Flame className="w-3 h-3" />
                    <span>{toBengaliNumber(taskStats.urgentCount)} টি জরুরি ডেডলাইন</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                যেসব টপিক বা পড়া নির্দিষ্ট দিনে বাকি রয়ে গেছে তা ডেডলাইন দিয়ে ট্র্যাক করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingTask && (
              <button
                id="btn-modal-add-task-open"
                type="button"
                onClick={handleOpenAddForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">+ নতুন অসম্পূর্ণ টাস্ক</span>
                <span className="sm:hidden">+ যোগ করুন</span>
              </button>
            )}
            <button
              id="btn-modal-close"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Urgent Deadline Notification Banner (if any due today or overdue) */}
        {taskStats.urgentCount > 0 && (
          <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <span className="font-semibold">
                🔔 <strong>ডেডলাইন সতর্কতা:</strong> আজ {taskStats.dueTodayCount > 0 ? `${toBengaliNumber(taskStats.dueTodayCount)} টি টাস্কের ডেডলাইন আজ` : ""}{taskStats.overdueCount > 0 ? ` এবং ${toBengaliNumber(taskStats.overdueCount)} টি টাস্কের ডেডলাইন পার হয়ে গেছে!` : "!"}
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab("due_today");
                setIsAddingTask(false);
              }}
              className="shrink-0 font-bold underline hover:text-rose-950 dark:hover:text-rose-100 cursor-pointer"
            >
              জরুরিগুলো দেখুন
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* 1. Add / Edit Task Form */}
          {isAddingTask ? (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-700">
                <h3 className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{editingTaskId ? "টাস্ক সম্পাদনা করুন" : "নতুন অসম্পূর্ণ টাস্ক যোগ করুন"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  বাতিল
                </button>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  টাস্কের নাম / টপিক *
                </label>
                <input
                  type="text"
                  required
                  placeholder="উদা: বাংলা সাহিত্য: মধ্যযুগ ও বৈষ্ণব পদাবলী রিভিশন ও ২০০টি MCQ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Subject & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    বিষয় (Subject)
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    অগ্রাধিকার (Priority)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPriority("high")}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        priority === "high"
                          ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                          : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      }`}
                    >
                      জরুরি (High)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority("medium")}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        priority === "medium"
                          ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                          : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      }`}
                    >
                      মাঝারি (Med)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority("low")}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        priority === "low"
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                          : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      সাধারণ (Low)
                    </button>
                  </div>
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Original Day / Date */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    কোন দিনের টাস্ক ছিল? (Original Date)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={originalDate}
                      onChange={(e) => setOriginalDate(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setOriginalDate(currentDate)}
                      className="px-2 py-1 text-[11px] font-semibold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600"
                      title="আজকের তারিখ সিলেক্ট করুন"
                    >
                      আজ
                    </button>
                  </div>
                </div>

                {/* Deadline Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      ডেডলাইনের শেষ তারিখ *
                    </label>
                    <div className="flex items-center gap-1 text-[10px] text-stone-500">
                      <span>কুইক:</span>
                      <button type="button" onClick={() => setDeadlinePreset(0)} className="hover:underline font-semibold text-emerald-600">আজ</button>
                      <span>•</span>
                      <button type="button" onClick={() => setDeadlinePreset(1)} className="hover:underline font-semibold text-emerald-600">+১ দিন</button>
                      <span>•</span>
                      <button type="button" onClick={() => setDeadlinePreset(3)} className="hover:underline font-semibold text-emerald-600">+৩ দিন</button>
                      <span>•</span>
                      <button type="button" onClick={() => setDeadlinePreset(7)} className="hover:underline font-semibold text-emerald-600">+৭ দিন</button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  কেন বাকি ছিল বা বিশেষ নোট (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="উদা: বোর্ড বইয়ের ১৫-২৫ পৃষ্ঠা পড়া হয়েছিল, বাকি ২০ পেজ ও প্রশ্নব্যাংক আজ রাতে শেষ করতে হবে..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingTaskId ? "আপডেট সংরক্ষণ করুন" : "টাস্ক সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* 2. Tabs Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 overflow-x-auto">
            
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                activeTab === "all"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-bold"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <span>সকল বাকি টাস্ক</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                {toBengaliNumber(tasks.filter(t => !t.completed).length)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("due_today")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                activeTab === "due_today"
                  ? "bg-rose-500 text-white shadow-2xs font-bold"
                  : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>আজ ও মেয়াদোত্তীর্ণ</span>
              {taskStats.urgentCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-rose-600">
                  {toBengaliNumber(taskStats.urgentCount)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                activeTab === "upcoming"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-bold"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>আসন্ন ডেডলাইন</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                {toBengaliNumber(taskStats.upcomingCount)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                activeTab === "completed"
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-bold"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>সম্পন্ন হয়েছে</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                {toBengaliNumber(taskStats.completedCount)}
              </span>
            </button>

          </div>

          {/* 3. Task List */}
          {filteredTasks.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/40">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                {activeTab === "completed" 
                  ? "এখনো কোনো সম্পন্ন টাস্ক নেই" 
                  : activeTab === "due_today" 
                    ? "আজকের ডেডলাইনের কোনো অসম্পূর্ণ টাস্ক নেই! দারুণ!" 
                    : "কোনো অসম্পূর্ণ টাস্ক নেই"}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                {activeTab === "completed"
                  ? "বাকি থাকা টাস্কগুলো শেষ করে টিক দিন, সেগুলো এখানে জমা থাকবে।"
                  : "কোনো দিনের পড়া বা টপিক মিস হলে '+ নতুন অসম্পূর্ণ টাস্ক' বাটনে ক্লিক করে ডেডলাইন সহ নোট করে রাখুন।"}
              </p>
              {!isAddingTask && activeTab !== "completed" && (
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ নতুন টাস্ক যোগ করুন</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map((task) => {
                const diff = getDayDiff(task.deadlineDate);
                const isDueToday = !task.completed && diff === 0;
                const isOverdue = !task.completed && diff < 0;
                const isUrgent = isDueToday || isOverdue;

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl border transition-all duration-200 ${
                      task.completed
                        ? "bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-70"
                        : isUrgent
                          ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80 shadow-xs ring-1 ring-rose-400/40"
                          : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 shadow-2xs"
                    } p-3.5 sm:p-4`}
                  >
                    <div className="flex items-start gap-3">
                      
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 shrink-0 text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                        title={task.completed ? "অসম্পূর্ণ হিসেবে চিহ্নিত করুন" : "সম্পন্ন হয়েছে হিসেবে চিহ্নিত করুন"}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <Circle className={`w-5 h-5 ${isUrgent ? "text-rose-500 animate-pulse" : "text-stone-400"}`} />
                        )}
                      </button>

                      {/* Main Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          
                          {/* Subject Pill */}
                          {task.subject && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                              <Tag className="w-2.5 h-2.5 text-stone-400" />
                              <span>{task.subject}</span>
                            </span>
                          )}

                          {/* Priority Badge */}
                          {task.priority === "high" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              জরুরি (High)
                            </span>
                          )}
                          {task.priority === "medium" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              মাঝারি
                            </span>
                          )}

                          {/* Deadline Status Badge */}
                          {task.completed ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ✓ সম্পন্ন
                            </span>
                          ) : isDueToday ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-600 text-white animate-pulse shadow-xs">
                              <Flame className="w-3 h-3" />
                              <span>আজকের ডেডলাইন! (Today)</span>
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-700 text-white shadow-xs">
                              <AlertTriangle className="w-3 h-3" />
                              <span>মেয়াদ শেষ ({toBengaliNumber(Math.abs(diff))} দিন অতিবাহিত)</span>
                            </span>
                          ) : diff === 1 ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              আগামীকাল শেষ সময়
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                              {toBengaliNumber(diff)} দিন বাকি
                            </span>
                          )}

                        </div>

                        {/* Title */}
                        <h4 className={`text-sm sm:text-base font-bold ${
                          task.completed 
                            ? "line-through text-stone-400 dark:text-stone-500" 
                            : isUrgent 
                              ? "text-rose-950 dark:text-rose-100" 
                              : "text-stone-900 dark:text-stone-100"
                        }`}>
                          {task.title}
                        </h4>

                        {/* Date Information */}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>মূল দিন: <strong>{formatBanglaDate(task.originalDate)}</strong></span>
                          </span>
                          <span className="text-stone-300 dark:text-stone-700">•</span>
                          <span className={`flex items-center gap-1 font-semibold ${
                            isUrgent ? "text-rose-600 dark:text-rose-400" : ""
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>ডেডলাইন: <strong>{formatBanglaDate(task.deadlineDate)}</strong></span>
                          </span>
                        </div>

                        {/* Notes toggle if exists */}
                        {task.notes && (
                          <div className="mt-2 text-xs bg-stone-100/80 dark:bg-stone-800/80 p-2.5 rounded-xl text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60">
                            <div className="font-semibold text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">
                              নোট / বিস্তারিত:
                            </div>
                            <p className="whitespace-pre-wrap">{task.notes}</p>
                          </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex-wrap">
                          
                          {/* Quick Add to Today's Syllabus Table */}
                          {!task.completed && (
                            <button
                              type="button"
                              onClick={() => {
                                onAddTopicToTodayTable(task.title, task.subject);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                              title="এই অসম্পূর্ণ টাস্কটি সরাসরি আজকের সিলেবাস ট্র্যাকার টেবিলে একটি টপিক হিসেবে যোগ করুন"
                            >
                              <ArrowRightCircle className="w-3.5 h-3.5" />
                              <span>আজকের সিলেবাস টেবিলে যোগ করুন</span>
                            </button>
                          )}

                          <div className="flex items-center gap-1 ml-auto">
                            <button
                              type="button"
                              onClick={() => handleOpenEditForm(task)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                              title="সম্পাদনা করুন"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
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

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>মোট অসম্পূর্ণ টাস্ক: <strong>{toBengaliNumber(tasks.filter(t => !t.completed).length)} টি</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold hover:bg-stone-300 dark:hover:bg-stone-700 transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
