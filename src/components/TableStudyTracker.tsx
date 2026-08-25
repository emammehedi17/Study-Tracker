import React, { useState } from "react";
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
  HelpCircle,
  Layers,
  Sparkles
} from "lucide-react";
import { DailyTablePlan, TableTopicItem } from "../types";
import { toBengaliNumber, computeCellWeights, formatBanglaDate, calculatePlanPercentage } from "../lib/bcsSyllabus";
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
}

export const TableStudyTracker: React.FC<TableStudyTrackerProps> = ({
  plan,
  currentDate,
  weeklyStats,
  onUpdatePlan,
  onResetToDay1,
  onDateChange,
}) => {
  const [newTopicText, setNewTopicText] = useState("");
  const [newTopicDetails, setNewTopicDetails] = useState("");
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Derive real-time daily percentage
  const currentDailyPercentage = calculatePlanPercentage(plan.topics);

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

    onUpdatePlan({
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

    onUpdatePlan({
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

    onUpdatePlan({
      ...plan,
      topics: reweighted,
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
    onUpdatePlan({
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

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
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
                  className={`py-1 px-0.5 rounded-lg text-center transition flex flex-col items-center ${
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
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
            ৫১তম বিসিএস • ডে-১ সিলেবাস টেবিল
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
            (মোট {toBengaliNumber(plan.topics.length)} টি টপিক)
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setIsAddingRow(!isAddingRow)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ নতুন টপিক</span>
          </button>

          <button
            onClick={onResetToDay1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium border border-stone-200 dark:border-stone-700 transition"
            title="মূল সিলেবাসে রিসেট করুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">সিলেবাস রিসেট</span>
          </button>

          {checkedCells > 0 && (
            <button
              onClick={handleUncheckAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition"
              title="সব টিক আনচেক করুন"
            >
              <span>আনচেক</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. ADD NEW TOPIC INLINE FORM */}
      {isAddingRow && (
        <form onSubmit={handleAddTopic} className="p-4 rounded-2xl bg-white dark:bg-stone-900 border-2 border-emerald-500/50 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>টেবিলে নতুন টপিক যুক্ত করুন</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingRow(false)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
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
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
            >
              টেবিলে সেভ করুন
            </button>
          </div>
        </form>
      )}

      {/* 4. MAIN SYLLABUS TABLE TRACKER */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* Table Header */}
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase tracking-wider">
                
                {/* Topic Column */}
                <th className="py-3 px-4 min-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-stone-500" />
                    <span>Topic (টপিক)</span>
                  </div>
                </th>

                {/* Textbook Column */}
                <th className="py-3 px-3 text-center min-w-[110px]">
                  <div className="flex flex-col items-center">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Textbook</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">বোর্ড বই</span>
                  </div>
                </th>

                {/* LiveMCQ PDF Column */}
                <th className="py-3 px-3 text-center min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span className="text-blue-700 dark:text-blue-400 font-bold">LiveMCQ PDF</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">পিডিএফ শিট</span>
                  </div>
                </th>

                {/* Q-Bank Column */}
                <th className="py-3 px-3 text-center min-w-[110px]">
                  <div className="flex flex-col items-center">
                    <span className="text-amber-700 dark:text-amber-400 font-bold">Q-Bank</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">প্রশ্নব্যাংক</span>
                  </div>
                </th>

                {/* Others Column */}
                <th className="py-3 px-3 text-center min-w-[100px]">
                  <div className="flex flex-col items-center">
                    <span className="text-purple-700 dark:text-purple-400 font-bold">Others</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">রিভিশন/অন্যান্য</span>
                  </div>
                </th>

                {/* Row Delete Action */}
                <th className="py-3 px-2 text-center w-10"></th>

              </tr>
            </thead>

            {/* Table Body Rows */}
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs sm:text-sm">
              {weightedTopics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500 dark:text-stone-400 text-xs">
                    কোনো টপিক পাওয়া যায়নি। উপরে "+ নতুন টপিক" বাটন দিয়ে যোগ করুন।
                  </td>
                </tr>
              ) : (
                weightedTopics.map((item, index) => {
                  const isAllChecked = item.textbook && item.livemcq && item.qbank && item.others;

                  return (
                    <tr 
                      key={item.id}
                      className={`transition-colors duration-150 ${
                        isAllChecked 
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20" 
                          : "hover:bg-stone-50/80 dark:hover:bg-stone-800/40"
                      }`}
                    >
                      
                      {/* Topic Name & Details */}
                      <td className="py-3 px-4">
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
                      </td>

                      {/* 1. Textbook Cell */}
                      <td 
                        onClick={() => handleToggleCell(item.id, 'textbook')}
                        className={`py-3 px-2 text-center cursor-pointer select-none transition ${
                          item.textbook 
                            ? "bg-emerald-100/50 dark:bg-emerald-950/50" 
                            : "hover:bg-stone-100 dark:hover:bg-stone-800/60"
                        }`}
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
                        className={`py-3 px-2 text-center cursor-pointer select-none transition ${
                          item.livemcq 
                            ? "bg-blue-100/50 dark:bg-blue-950/50" 
                            : "hover:bg-stone-100 dark:hover:bg-stone-800/60"
                        }`}
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
                        className={`py-3 px-2 text-center cursor-pointer select-none transition ${
                          item.qbank 
                            ? "bg-amber-100/50 dark:bg-amber-950/50" 
                            : "hover:bg-stone-100 dark:hover:bg-stone-800/60"
                        }`}
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
                        className={`py-3 px-2 text-center cursor-pointer select-none transition ${
                          item.others 
                            ? "bg-purple-100/50 dark:bg-purple-950/50" 
                            : "hover:bg-stone-100 dark:hover:bg-stone-800/60"
                        }`}
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

                      {/* Delete Row Button */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleDeleteTopic(item.id)}
                          className="p-1 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                          title="টপিকটি মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
};
