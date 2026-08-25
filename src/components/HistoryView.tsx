import React, { useState, useEffect } from "react";
import { 
  History, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Copy, 
  BookOpen, 
  Smartphone, 
  FileQuestion, 
  Repeat, 
  Clock, 
  ArrowRight,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { getAllDailyPlans } from "../lib/storage";
import { DailyPlan, StudyTask } from "../types";
import { formatBanglaDate, toBengaliNumber, SOURCE_CONFIG } from "../lib/bcsSyllabus";

interface HistoryViewProps {
  todayDate: string;
  onSelectDate: (date: string) => void;
  onCopyIncompleteTasksToToday: (tasks: StudyTask[]) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  todayDate,
  onSelectDate,
  onCopyIncompleteTasksToToday,
}) => {
  const [plans, setPlans] = useState<Record<string, DailyPlan>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPlanDate, setSelectedPlanDate] = useState<string | null>(null);

  useEffect(() => {
    loadAllPlans();
  }, []);

  const loadAllPlans = async () => {
    setLoading(true);
    try {
      const all = await getAllDailyPlans();
      setPlans(all);
      const sortedDates = Object.keys(all).sort().reverse();
      if (sortedDates.length > 0 && !selectedPlanDate) {
        setSelectedPlanDate(sortedDates[0]);
      }
    } catch (e) {
      console.error("Error loading plans history:", e);
    } finally {
      setLoading(false);
    }
  };

  const sortedDates = Object.keys(plans).sort().reverse();
  const currentSelectedPlan = selectedPlanDate ? plans[selectedPlanDate] : null;

  const incompleteTasks = currentSelectedPlan
    ? currentSelectedPlan.tasks.filter(t => !t.completed)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
              পূর্বের দিনলিপি ও পড়ার হিস্ট্রি (Study History)
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              বিগত দিনগুলোর অগ্রগতি পর্যালোচনা করুন ও অপূর্ণ টাস্ক রিভিশন দিন
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 self-start sm:self-auto">
          মোট রেকর্ড: {toBengaliNumber(sortedDates.length)} দিন
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Date List */}
        <div className="lg:col-span-1 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1">
            তারিখের তালিকা
          </h3>

          {sortedDates.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
              এখনও কোনো দিনলিপি রেকর্ড নেই।
            </div>
          ) : (
            sortedDates.map(dateStr => {
              const p = plans[dateStr];
              const isSelected = selectedPlanDate === dateStr;
              const isToday = dateStr === todayDate;
              const comp = p.completionPercentage || 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedPlanDate(dateStr)}
                  className={`w-full p-3.5 rounded-xl text-left transition border flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-500 shadow-xs'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {formatBanglaDate(dateStr)}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                          আজ
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {p.tasks.length}টি টাস্ক • {p.tasks.filter(t => t.completed).length}টি সম্পন্ন
                    </p>
                  </div>

                  {/* Completion badge */}
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                      comp === 100
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        : comp >= 50
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}>
                      {toBengaliNumber(comp)}%
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Day Details */}
        <div className="lg:col-span-2 space-y-4">
          {currentSelectedPlan ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-5">
              
              {/* Day Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-700 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                      {formatBanglaDate(currentSelectedPlan.date)}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    মোট সম্পন্ন অগ্রগতি: {toBengaliNumber(currentSelectedPlan.completionPercentage)}%
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectDate(currentSelectedPlan.date)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-xs font-semibold text-stone-800 dark:text-stone-200 transition"
                  >
                    <span>এই দিনে যান</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {incompleteTasks.length > 0 && currentSelectedPlan.date !== todayDate && (
                    <button
                      onClick={() => onCopyIncompleteTasksToToday(incompleteTasks)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                      title="এই দিনের অপূর্ণ টাস্কগুলো আজকের পড়ার রুটিনে নিয়ে যান"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>অপূর্ণ টাস্ক আজকেই পড়ুন ({toBengaliNumber(incompleteTasks.length)})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Day Summary if any */}
              {currentSelectedPlan.daySummary && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300">
                  <span className="font-bold">সারসংক্ষেপ: </span>
                  <span>{currentSelectedPlan.daySummary}</span>
                </div>
              )}

              {/* Day Reflection if any */}
              {currentSelectedPlan.dayReflection && (
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-200">
                  <span className="font-bold">দিনের মন্তব্য: </span>
                  <span>{currentSelectedPlan.dayReflection}</span>
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  টাস্কের তালিকা ({toBengaliNumber(currentSelectedPlan.tasks.length)}টি):
                </h4>

                {currentSelectedPlan.tasks.map(task => {
                  const config = SOURCE_CONFIG[task.source || 'textbook'];
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                        task.completed
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <div className="mt-0.5">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-400 shrink-0" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-semibold border ${config.bgClass} ${config.textClass} ${config.borderClass}`}>
                            {config.nameBangla}
                          </span>
                          <span className="text-stone-500 dark:text-stone-400">
                            {task.subject}
                          </span>
                          <span className="ml-auto font-bold text-stone-700 dark:text-stone-300">
                            গুরুত্ব: {toBengaliNumber(task.percentageWeight)}%
                          </span>
                        </div>

                        <p className={`font-semibold ${task.completed ? 'line-through text-stone-500' : 'text-stone-900 dark:text-stone-100'}`}>
                          {task.title}
                        </p>

                        {task.sourceDetails && (
                          <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                            • {task.sourceDetails}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-xs text-stone-500 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
              বাম পাশের তালিকা থেকে একটি তারিখ নির্বাচন করুন।
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
