import React, { useState, useEffect } from "react";
import { 
  BookMarked, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Sparkles, 
  RotateCw, 
  AlertCircle,
  HelpCircle,
  Check
} from "lucide-react";
import { getMistakeNotes, saveMistakeNote, deleteMistakeNote } from "../lib/storage";
import { MistakeNote } from "../types";
import { BCS_SUBJECTS, formatBanglaDate, toBengaliNumber } from "../lib/bcsSyllabus";

export const MistakeNotebook: React.FC = () => {
  const [notes, setNotes] = useState<MistakeNote[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Form states
  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [subject, setSubject] = useState("বাংলা সাহিত্য ও ব্যাকরণ");
  const [source, setSource] = useState("LiveMCQ Daily Test");

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const list = await getMistakeNotes();
    setNotes(list);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !correctAnswer.trim()) return;

    const newNote: MistakeNote = {
      id: `mistake_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      question,
      correctAnswer,
      explanation,
      subject,
      source,
      reviewedCount: 0,
      mastered: false,
    };

    await saveMistakeNote(newNote);
    await loadNotes();
    setIsAdding(false);

    // Reset
    setQuestion("");
    setCorrectAnswer("");
    setExplanation("");
  };

  const handleIncrementReview = async (note: MistakeNote) => {
    const updated = {
      ...note,
      reviewedCount: (note.reviewedCount || 0) + 1,
    };
    await saveMistakeNote(updated);
    await loadNotes();
  };

  const handleToggleMastered = async (note: MistakeNote) => {
    const updated = {
      ...note,
      mastered: !note.mastered,
    };
    await saveMistakeNote(updated);
    await loadNotes();
  };

  const handleDelete = async (id: string) => {
    await deleteMistakeNote(id);
    await loadNotes();
  };

  const filteredNotes = notes.filter(n => {
    if (selectedSubject === "all") return true;
    return n.subject === selectedSubject;
  });

  const masteredCount = notes.filter(n => n.mastered).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
              ভুল হওয়া প্রশ্নের খাতা (Mistake Notebook & Spaced Repetition)
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              লাইভ এমসিকিউ বা প্রশ্নব্যাংক সলভের সময় যেসব প্রশ্ন ভুল হয়েছে সেগুলো স্পেশাল নোট রাখুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? "ফর্ম বন্ধ করুন" : "ভুল প্রশ্ন যুক্ত করুন"}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300 font-semibold">
          মোট সংরক্ষিত প্রশ্ন: {toBengaliNumber(notes.length)}টি
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-semibold">
          আয়ত্তে এসেছে (Mastered): {toBengaliNumber(masteredCount)}টি
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-semibold">
          রিভিশন বাকি: {toBengaliNumber(notes.length - masteredCount)}টি
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddNote} className="p-5 rounded-2xl bg-white dark:bg-stone-800 border-2 border-purple-500/40 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-200 dark:border-stone-700">
            ভুল হওয়া প্রশ্ন বা বিভ্রান্তিকর তথ্য লিপিবদ্ধ করুন
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                প্রশ্ন / কনফিউজিং টপিক *
              </label>
              <textarea
                rows={2}
                required
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="যেমন: 'চর্যাপদ' প্রথম কোথা থেকে এবং কোন ভাষায় রচিত হয়েছিল?"
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                সঠিক উত্তর *
              </label>
              <input
                type="text"
                required
                value={correctAnswer}
                onChange={e => setCorrectAnswer(e.target.value)}
                placeholder="যেমন: নেপালের রাজদরবারের রয়েল লাইব্রেরি থেকে হরপ্রসাদ শাস্ত্রী আবিষ্কার করেন (১৯০৭)"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                বিসিএস বিষয় (Subject)
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              >
                {BCS_SUBJECTS.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                উৎস / পরীক্ষার নাম
              </label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="যেমন: LiveMCQ Subject Final Exam / ৪৪তম বিসিএস"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                সংক্ষিপ্ত ব্যাখ্যা বা শর্টকাট মনে রাখার উপায় (Explanation)
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder="ভুল যেন আর না হয় তার জন্য ব্যাখ্যা বা টেকনিক লিখে রাখুন..."
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-xs"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {/* Filter by Subject */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedSubject("all")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedSubject === "all"
              ? "bg-purple-600 text-white"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
          }`}
        >
          সকল বিষয় ({toBengaliNumber(notes.length)})
        </button>

        {BCS_SUBJECTS.map(s => {
          const count = notes.filter(n => n.subject === s.name).length;
          if (count === 0) return null;
          return (
            <button
              key={s.name}
              onClick={() => setSelectedSubject(s.name)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedSubject === s.name
                  ? "bg-purple-600 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              }`}
            >
              {s.name} ({toBengaliNumber(count)})
            </button>
          );
        })}
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-purple-400 mx-auto" />
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              কোনো ভুল প্রশ্নের নোট নেই
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              LiveMCQ পরীক্ষা দেওয়ার সময় যেসব প্রশ্নে দ্বিধাদ্বন্দ্ব বা ভুল হয়, সেগুলো এখানে লিখে রাখুন যাতে পরীক্ষার আগে রিভিশন দেওয়া যায়।
            </p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`p-4 sm:p-5 rounded-2xl border transition ${
                note.mastered
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-80'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {note.subject}
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      উৎস: {note.source}
                    </span>
                    <span className="text-stone-400 text-[11px]">•</span>
                    <span className="text-stone-400 text-[11px]">
                      {formatBanglaDate(note.date)}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    প্রশ্ন: {note.question}
                  </h4>

                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
                    <strong className="text-emerald-700 dark:text-emerald-300 block mb-0.5">✓ সঠিক উত্তর:</strong>
                    <span>{note.correctAnswer}</span>
                  </div>

                  {note.explanation && (
                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300">
                      <strong className="text-stone-500 block mb-0.5">ব্যাখ্যা ও শর্টকাট:</strong>
                      <span>{note.explanation}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <button
                      onClick={() => handleIncrementReview(note)}
                      className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>রিভিউ করেছি ({toBengaliNumber(note.reviewedCount || 0)} বার)</span>
                    </button>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleMastered(note)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      note.mastered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-emerald-100 hover:text-emerald-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{note.mastered ? "আয়ত্তে এসেছে" : "আয়ত্তে আসেনি"}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
