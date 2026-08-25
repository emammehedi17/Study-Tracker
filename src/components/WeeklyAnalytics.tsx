import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Flame, 
  BookOpen, 
  Smartphone, 
  FileQuestion, 
  Repeat, 
  Loader2, 
  Award,
  AlertCircle,
  Lightbulb
} from "lucide-react";
import { getWeeklyAnalyticsData, getUserStats } from "../lib/storage";
import { AIMentorFeedback, UserStats } from "../types";
import { toBengaliNumber } from "../lib/bcsSyllabus";

interface WeeklyAnalyticsProps {
  currentDate: string;
}

export const WeeklyAnalytics: React.FC<WeeklyAnalyticsProps> = ({ currentDate }) => {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats>(getUserStats());
  
  const [aiFeedback, setAiFeedback] = useState<AIMentorFeedback | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [currentDate]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getWeeklyAnalyticsData();
      setWeeklyData(data);
      setUserStats(getUserStats());
    } catch (e) {
      console.error("Error loading analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAiFeedback = async () => {
    if (!weeklyData) return;
    setLoadingAi(true);
    setAiError(null);

    try {
      const sourcesBreakdown = {
        textbook: weeklyData.sourceDistribution.find((s: any) => s.sourceKey === 'textbook')?.value || 0,
        livemcq: weeklyData.sourceDistribution.find((s: any) => s.sourceKey === 'livemcq')?.value || 0,
        question_bank: weeklyData.sourceDistribution.find((s: any) => s.sourceKey === 'question_bank')?.value || 0,
      };

      const res = await fetch("/api/generate-ai-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklyStats: weeklyData.chartData,
          completedRate: weeklyData.overallAvgCompletion,
          streak: userStats.streakDays,
          sourcesBreakdown,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "AI ফিডব্যাক জেনারেট করা যায়নি");
      }

      setAiFeedback(json.data);
    } catch (err: any) {
      console.error("AI feedback error:", err);
      setAiError("AI মেন্টর ফিডব্যাক তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading || !weeklyData) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
          সাপ্তাহিক পারফরম্যান্স রিপোর্ট লোড হচ্ছে...
        </p>
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#a855f7'];

  return (
    <div className="space-y-6">

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Weekly Avg Completion */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-semibold">সাপ্তাহিক গড় অগ্রগতি</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
            {toBengaliNumber(weeklyData.overallAvgCompletion)}%
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            গত ৭ দিনের কমপ্লিশন রেট
          </p>
        </div>

        {/* Total Study Hours */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-semibold">মোট পড়ার সময়</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
            {toBengaliNumber(weeklyData.totalStudyHours)} <span className="text-sm font-bold text-stone-500">ঘণ্টা</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            ৭ দিনে সম্পন্ন সেশন
          </p>
        </div>

        {/* Completed Tasks */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-semibold">সম্পন্ন টপিক</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
            {toBengaliNumber(weeklyData.completedTasksTotal)} <span className="text-sm font-bold text-stone-500">টি</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            পাঠ্যবই + MCQ + প্রশ্নব্যাংক
          </p>
        </div>

        {/* Streak */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-semibold">ধারাবাহিকতা (Streak)</span>
            <Flame className="w-4 h-4 text-red-500 fill-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
            {toBengaliNumber(userStats.streakDays)} <span className="text-sm font-bold text-stone-500">দিন</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            নিয়মিত পড়ার রেকর্ড
          </p>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Completion % Bar Chart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                দৈনিক লক্ষ্য পূরণ হার (Daily Completion %)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                প্রতিদিনের মোট ১০০% টার্গেটের মধ্যে সম্পন্ন হওয়া হার
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value}% সম্পন্ন`, 'লক্ষ্য পূরণ']}
                  labelFormatter={(label) => `দিন: ${label}`}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="completion" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Study Time Hours Trend */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                পড়ার সময় (মিনিট / ঘণ্টা)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                প্রতিদিন কোন সময়ে কতক্ষণ পড়াশোনা করা হয়েছে
              </p>
            </div>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" মি." />
                <Tooltip
                  formatter={(value: any) => [`${value} মিনিট (${(Number(value)/60).toFixed(1)} ঘণ্টা)`, 'মোট সময়']}
                  labelFormatter={(label) => `দিন: ${label}`}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="studyMinutes"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Sources Distribution Breakdown */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
            সোর্স অনুসারে পড়ার বিভাজন (Source Balance)
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            পাঠ্যবই, লাইভ এমসিকিউ শিট, এবং বিগত সালের প্রশ্নব্যাংকের মাঝে আপনার ভারসাম্য
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {weeklyData.sourceDistribution.map((src: any) => (
            <div
              key={src.name}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  {src.name}
                </span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: src.color }} />
              </div>
              <div className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {toBengaliNumber(src.value)} <span className="text-xs font-normal text-stone-500">টাস্ক সম্পন্ন</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI BCS Mentor Weekly Habit Coach & Motivation */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-md relative overflow-hidden space-y-4">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                AI বিসিএস মেন্টর পারফরম্যান্স রিভিউ ও পরামর্শ
              </h3>
              <p className="text-xs text-emerald-200/80">
                আপনার পড়ার অভ্যাস ও সোর্স ব্যালেন্স অনুযায়ী ৫১তম বিসিএস প্রস্তুতি কৌশল
              </p>
            </div>
          </div>

          <button
            onClick={handleFetchAiFeedback}
            disabled={loadingAi}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
          >
            {loadingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>মেন্টর অ্যানালাইসিস করছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{aiFeedback ? "পুনরায় বিশ্লেষণ করুন" : "মেন্টর পরামর্শ দেখুন"}</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {aiFeedback ? (
          <div className="space-y-4 pt-2 border-t border-emerald-800/60">
            
            {/* Verdict */}
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                মেন্টরের মূল্যায়ন (Verdict)
              </span>
              <p className="text-sm sm:text-base font-medium text-emerald-50 leading-relaxed">
                {aiFeedback.mentorVerdict}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>আপনার শক্তিশালী দিকসমূহ:</span>
                </span>
                <ul className="space-y-1.5 text-xs text-emerald-100/90">
                  {aiFeedback.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>সামনে যা যা উন্নয়ন করতে পারেন:</span>
                </span>
                <ul className="space-y-1.5 text-xs text-emerald-100/90">
                  {aiFeedback.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Motivational Quote */}
            {aiFeedback.motivationalQuote && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <p className="text-xs sm:text-sm font-semibold italic text-emerald-200">
                  "{aiFeedback.motivationalQuote}"
                </p>
              </div>
            )}

          </div>
        ) : (
          !loadingAi && (
            <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-center space-y-2">
              <p className="text-xs sm:text-sm text-emerald-200">
                আপনার পড়ার অভ্যাস, টেক্সটবুক বনাম লাইভ এমসিকিউ পড়ার অনুপাত এবং ধারাবাহিকতা বিশ্লেষণ করে মেন্টর পরামর্শ পেতে ওপরের বাটনে ক্লিক করুন।
              </p>
            </div>
          )
        )}

      </div>

    </div>
  );
};
