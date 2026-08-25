import React, { useState, useEffect } from "react";
import { 
  Award, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart2, 
  Smartphone,
  FileQuestion,
  HelpCircle
} from "lucide-react";
import { getMockScores, saveMockScore } from "../lib/storage";
import { MockExamScore, BCSSubject } from "../types";
import { BCS_SUBJECTS, formatBanglaDate, toBengaliNumber } from "../lib/bcsSyllabus";

export const LiveMCQScoreTracker: React.FC = () => {
  const [scores, setScores] = useState<MockExamScore[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [source, setSource] = useState<'LiveMCQ' | 'Question Bank' | 'Model Test' | 'Self Practice'>('LiveMCQ');
  const [subject, setSubject] = useState<string>("বাংলাদেশ বিষয়াবলী");
  const [totalQuestions, setTotalQuestions] = useState(50);
  const [correctAnswers, setCorrectAnswers] = useState(40);
  const [wrongAnswers, setWrongAnswers] = useState(5);
  const [negativePerWrong, setNegativePerWrong] = useState(0.5); // BCS prelim is 0.5 deduction
  const [rank, setRank] = useState("");
  const [weakTopics, setWeakTopics] = useState("");

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    const list = await getMockScores();
    setScores(list);
  };

  const calculatedNegative = parseFloat((wrongAnswers * negativePerWrong).toFixed(2));
  const calculatedObtained = parseFloat((correctAnswers - calculatedNegative).toFixed(2));
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newScore: MockExamScore = {
      id: `score_${Date.now()}`,
      date,
      title,
      source,
      subject,
      totalQuestions: Number(totalQuestions),
      correctAnswers: Number(correctAnswers),
      wrongAnswers: Number(wrongAnswers),
      negativeMarks: calculatedNegative,
      obtainedMarks: calculatedObtained,
      totalMarks: Number(totalQuestions), // 1 mark per question in BCS prelim
      rank,
      weakTopics,
    };

    await saveMockScore(newScore);
    await loadScores();
    setIsAdding(false);

    // Reset Form
    setTitle("");
    setWeakTopics("");
    setRank("");
  };

  // Aggregated Stats
  const totalTests = scores.length;
  const avgMarks = totalTests > 0
    ? parseFloat((scores.reduce((sum, s) => sum + s.obtainedMarks, 0) / totalTests).toFixed(1))
    : 0;
  const highestMark = totalTests > 0
    ? Math.max(...scores.map(s => s.obtainedMarks))
    : 0;
  const avgAccuracy = totalTests > 0
    ? Math.round(scores.reduce((sum, s) => sum + (s.correctAnswers / (s.totalQuestions || 1)) * 100, 0) / totalTests)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
              LiveMCQ ও মডেল টেস্ট স্কোর ট্র্যাকার
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              ডেইলি টেস্ট, প্রশ্নব্যাংক ও সাবজেক্ট ফাইনালের নেগেটিভ মার্কিং সহ প্রগ্রেস ট্র্যাক
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? "ফর্ম বন্ধ করুন" : "নতুন এক্সাম স্কোর যোগ"}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-1">
          <span className="text-xs text-stone-500 font-semibold">মোট পরীক্ষা দিয়েছেন</span>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
            {toBengaliNumber(totalTests)} <span className="text-xs font-normal text-stone-500">টি</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-1">
          <span className="text-xs text-stone-500 font-semibold">গড় প্রাপ্ত নম্বর (Net)</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {toBengaliNumber(avgMarks)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-1">
          <span className="text-xs text-stone-500 font-semibold">সর্বোচ্চ নম্বর</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {toBengaliNumber(highestMark)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs space-y-1">
          <span className="text-xs text-stone-500 font-semibold">গড় এক্যুরেসি (সঠিকের হার)</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {toBengaliNumber(avgAccuracy)}%
          </div>
        </div>

      </div>

      {/* Add Exam Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-800 border-2 border-blue-500/40 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-200 dark:border-stone-700">
            এক্সাম বা প্রশ্ন সমাধানের ফলাফল লিপিবদ্ধ করুন
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                পরীক্ষার নাম / টপিক *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="যেমন: LiveMCQ 51st BCS Daily Exam #22 (সংবিধান ও মুক্তিযুদ্ধ)"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                পরীক্ষার তারিখ
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            {/* Source Platform */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                উৎস / প্ল্যাটফর্ম
              </label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              >
                <option value="LiveMCQ">LiveMCQ App / PDF Exam</option>
                <option value="Question Bank">বিসিএস বিগত প্রশ্নব্যাংক</option>
                <option value="Model Test">কোচিং / স্পেশাল মডেল টেস্ট</option>
                <option value="Self Practice">নিজস্ব প্র্যাকটিস</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                বিষয় (Subject)
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              >
                {BCS_SUBJECTS.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
                <option value="পূর্ণাঙ্গ মডেল টেস্ট (200 Marks)">পূর্ণাঙ্গ মডেল টেস্ট (২০০ নম্বর)</option>
              </select>
            </div>

            {/* Total Questions */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                মোট প্রশ্ন সংখ্যা
              </label>
              <input
                type="number"
                min="5"
                value={totalQuestions}
                onChange={e => setTotalQuestions(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            {/* Correct */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                সঠিক উত্তর সংখ্যা (Correct)
              </label>
              <input
                type="number"
                min="0"
                max={totalQuestions}
                value={correctAnswers}
                onChange={e => setCorrectAnswers(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            {/* Wrong */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                ভুল উত্তর সংখ্যা (Wrong)
              </label>
              <input
                type="number"
                min="0"
                value={wrongAnswers}
                onChange={e => setWrongAnswers(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            {/* Rank / Merit */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                LiveMCQ তে অবস্থান / Rank (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={rank}
                onChange={e => setRank(e.target.value)}
                placeholder="যেমন: 45th out of 3,200"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            {/* Weak Topics */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                যেসব টপিকে ভুল হয়েছে বা রিভিশন লাগবে (Weak Topics)
              </label>
              <input
                type="text"
                value={weakTopics}
                onChange={e => setWeakTopics(e.target.value)}
                placeholder="যেমন: সংবিধানের অনুচ্ছেদ ৪৮, বঙ্গভঙ্গের সাল ও লর্ড কার্জনের সংস্কার"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>
          </div>

          {/* Auto calculated Live Preview */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              নেগেটিভ মার্কিং বাদ দিয়ে প্রাপ্ত নম্বর: <strong className="text-sm font-black">{calculatedObtained}</strong> / {totalQuestions}
            </span>
            <span className="text-stone-600 dark:text-stone-300">
              (ভুল উত্তরের জন্য কাটা: {calculatedNegative} নম্বর | এক্যুরেসি: {accuracy}%)
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs"
            >
              স্কোর সেভ করুন
            </button>
          </div>
        </form>
      )}

      {/* Scores Table & Cards */}
      <div className="space-y-3">
        {scores.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center space-y-2">
            <Award className="w-8 h-8 text-blue-500 mx-auto" />
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              এখনও কোনো এক্সাম রেকর্ড যোগ করা হয়নি
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              LiveMCQ বা প্রশ্নব্যাংক সলভ করার পর আপনার প্রাপ্ত মার্কস ও ভুলের হিসাব রাখতে ওপরের বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          scores.map(item => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {item.source}
                  </span>
                  <span className="font-semibold text-stone-500">
                    {item.subject}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-500">
                    {formatBanglaDate(item.date)}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                  {item.title}
                </h4>

                {item.weakTopics && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>দুর্বল টপিক: {item.weakTopics}</span>
                  </p>
                )}

                {item.rank && (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    🏆 অবস্থান / Rank: <strong className="text-stone-800 dark:text-stone-200">{item.rank}</strong>
                  </p>
                )}
              </div>

              {/* Score Box */}
              <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                    {toBengaliNumber(item.obtainedMarks)} <span className="text-xs font-normal text-stone-400">/ {toBengaliNumber(item.totalQuestions)}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">
                    সঠিক: {toBengaliNumber(item.correctAnswers)} | ভুল: {toBengaliNumber(item.wrongAnswers)} (-{toBengaliNumber(item.negativeMarks)})
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
