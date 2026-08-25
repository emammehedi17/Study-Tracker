import React, { useState, useRef } from "react";
import { 
  Sparkles, 
  UploadCloud, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Loader2, 
  Check, 
  AlertCircle, 
  BookOpen, 
  Smartphone, 
  FileQuestion, 
  Repeat, 
  Scale, 
  Plus, 
  Trash2,
  Lightbulb
} from "lucide-react";
import { DailyPlan, StudyTask, StudySource, BCSSubject, AIPlanAnalysisResponse } from "../types";
import { SOURCE_CONFIG, toBengaliNumber } from "../lib/bcsSyllabus";
import { analyzePlanOffline } from "../lib/offlineAnalyzer";

interface AIPlanAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  onApplyPlan: (newTasks: StudyTask[], summary?: string, strategyAdvice?: string, replaceExisting?: boolean) => void;
}

export const AIPlanAnalyzerModal: React.FC<AIPlanAnalyzerModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  onApplyPlan,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analyzedResult, setAnalyzedResult] = useState<AIPlanAnalysisResponse | null>(null);
  const [replaceMode, setReplaceMode] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle image file selection
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("অনুগ্রহ করে একটি সঠিক ছবির ফাইল (PNG, JPG, WebP) নির্বাচন করুন।");
      return;
    }
    setErrorMsg(null);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Execute Gemini AI Plan Analysis
  const handleAnalyze = async () => {
    if (activeInputTab === 'text' && !inputText.trim()) {
      setErrorMsg("অনুগ্রহ করে আপনার পড়ার তালিকা লিখুন।");
      return;
    }
    if (activeInputTab === 'image' && !imagePreview) {
      setErrorMsg("অনুগ্রহ করে রুটিন বা পড়ার তালিকার একটি স্ক্রিনশট আপলোড করুন।");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        targetDate,
      };

      if (activeInputTab === 'text') {
        payload.text = inputText;
      } else if (imagePreview) {
        payload.imageBase64 = imagePreview;
        payload.mimeType = imageMimeType;
        if (inputText.trim()) {
          payload.text = inputText;
        }
      }

      try {
        const response = await fetch("/api/analyze-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            setAnalyzedResult(json.data);
            return;
          }
        }
        // If API fails or 404 on static deployment, fallback to smart offline parser
        const offlineResult = analyzePlanOffline(inputText || "৫১তম বিসিএস স্টাডি প্ল্যান", targetDate);
        setAnalyzedResult(offlineResult);
      } catch (err: any) {
        console.warn("Backend API not reachable (static host), using smart local analyzer:", err);
        const offlineResult = analyzePlanOffline(inputText || "৫১তম বিসিএস স্টাডি প্ল্যান", targetDate);
        setAnalyzedResult(offlineResult);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Modify analyzed task weight locally if user adjusts
  const handleWeightChange = (index: number, newWeight: number) => {
    if (!analyzedResult) return;
    const updated = [...analyzedResult.tasks];
    updated[index].percentageWeight = newWeight;
    setAnalyzedResult({ ...analyzedResult, tasks: updated });
  };

  // Remove task from analysis
  const handleRemoveTask = (index: number) => {
    if (!analyzedResult) return;
    const updated = analyzedResult.tasks.filter((_, idx) => idx !== index);
    setAnalyzedResult({ ...analyzedResult, tasks: updated });
  };

  // Apply to Daily Plan
  const handleApply = () => {
    if (!analyzedResult || analyzedResult.tasks.length === 0) return;

    const formattedTasks: StudyTask[] = analyzedResult.tasks.map((t, idx) => ({
      id: `ai_task_${Date.now()}_${idx}`,
      title: t.title,
      source: t.source,
      subject: t.subject,
      sourceDetails: t.sourceDetails || "",
      percentageWeight: Number(t.percentageWeight) || 20,
      estimatedMinutes: Number(t.estimatedMinutes) || 45,
      completed: false,
      importance: t.importance || 'medium',
      strategicTip: t.strategicTip,
    }));

    onApplyPlan(
      formattedTasks,
      analyzedResult.daySummary,
      analyzedResult.strategyAdvice,
      replaceMode
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                AI স্টাডি প্ল্যান ও শতকরা গুরুত্ব অ্যানালাইজার
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                পড়ার রুটিনের স্ক্রিনশট বা টেক্সট থেকে সোর্স ও ১০০% ওয়েট স্বয়ংক্রিয় তৈরি
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Input Method Switcher */}
          {!analyzedResult && (
            <div className="space-y-4">
              <div className="flex p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveInputTab('text')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                    activeInputTab === 'text'
                      ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>পড়ার তালিকা লিখুন (Text)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInputTab('image')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                    activeInputTab === 'image'
                      ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>রুটিনের ছবি / স্ক্রিনশট (Image/SS)</span>
                </button>
              </div>

              {/* Text Area Input */}
              {activeInputTab === 'text' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    আজকে যা যা পড়তে চান তা লিখুন (বাংলা বা ইংরেজি):
                  </label>
                  <textarea
                    rows={6}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="উদাহরণ:
১. বাংলা ব্যাকরণ: ধ্বনি পরিবর্তন ও ন-ত্ব ষ-ত্ব বিধান (MP3 বাংলা পৃঃ ২৫-৩৩)
২. বাংলাদেশ বিষয়াবলী: LiveMCQ সংবিধান ডেইলি এক্সাম ও পিডিএফ #১২
৩. English: Subject-Verb Agreement বিগত সালের প্রশ্নব্যাংক সলভ
৪. সাধারণ বিজ্ঞান: পদার্থবিজ্ঞান কাজ, শক্তি ও ক্ষমতা বোর্ড বই"
                    className="w-full p-3 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    💡 টিপ: কোনো বই বা LiveMCQ PDF এর নাম লিখলে AI স্বয়ংক্রিয়ভাবে সোর্স এবং গুরুত্ব নির্ধারণ করবে।
                  </p>
                </div>
              )}

              {/* Image Upload Area */}
              {activeInputTab === 'image' && (
                <div className="space-y-3">
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-stone-50/50 dark:bg-stone-900/50"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files && handleFileChange(e.target.files[0])}
                    />

                    {imagePreview ? (
                      <div className="space-y-3">
                        <img
                          src={imagePreview}
                          alt="Uploaded plan"
                          className="max-h-48 mx-auto rounded-lg object-contain shadow-xs border border-stone-200 dark:border-stone-700"
                        />
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ ছবি আপলোড সম্পন্ন হয়েছে। পরিবর্তন করতে ক্লিক করুন।
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                          স্ক্রিনশট বা রুটিনের ছবি এখানে টেনে এনে ছাড়ুন অথবা ক্লিক করে নির্বাচন করুন
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          (কোচিং রুটিন, লাইভ এমসিকিউ শিডিউল, বা ডায়েরিতে লেখা রুটিনের ছবি)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Optional text note with image */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      ছবির সাথে কোনো বিশেষ নির্দেশ থাকলে লিখুন (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder="যেমন: শুধুমাত্র ১ ও ২ নম্বর টপিকগুলো নিও"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Analyzed Results Preview */}
          {analyzedResult && (
            <div className="space-y-4">
              
              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>AI বিশ্লেষণ সম্পন্ন ({toBengaliNumber(analyzedResult.tasks.length)}টি টপিক সনাক্ত করা হয়েছে)</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200">
                  {analyzedResult.daySummary}
                </p>
                {analyzedResult.strategyAdvice && (
                  <p className="text-xs text-emerald-900 dark:text-emerald-300 font-medium flex items-start gap-1">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{analyzedResult.strategyAdvice}</span>
                  </p>
                )}
              </div>

              {/* Tasks Weight Review Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                  <span>নির্ধারিত টাস্ক ও শতকরা গুরুত্ব (Total: 100%)</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    মোট আনুমানিক সময়: {toBengaliNumber(analyzedResult.totalEstimatedMinutes)} মিনিট
                  </span>
                </div>

                <div className="space-y-2">
                  {analyzedResult.tasks.map((task, idx) => {
                    const config = SOURCE_CONFIG[task.source || 'textbook'];
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-semibold border ${config.bgClass} ${config.textClass} ${config.borderClass}`}>
                              {config.nameBangla}
                            </span>
                            <span className="text-stone-500 dark:text-stone-400">
                              {task.subject}
                            </span>
                          </div>
                          <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                            {task.title}
                          </p>
                          {task.sourceDetails && (
                            <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                              {task.sourceDetails}
                            </p>
                          )}
                          {task.strategicTip && (
                            <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                              💡 {task.strategicTip}
                            </p>
                          )}
                        </div>

                        {/* Weight adjustment */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-1">
                            <label className="text-[11px] text-stone-500 font-semibold">গুরুত্ব %:</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={task.percentageWeight}
                              onChange={e => handleWeightChange(idx, Number(e.target.value))}
                              className="w-14 px-2 py-1 text-center font-bold rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTask(idx)}
                            className="p-1 text-stone-400 hover:text-red-500 transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Replace or Append Choice */}
              <div className="flex items-center gap-4 text-xs font-semibold text-stone-700 dark:text-stone-300 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="replacePlan"
                    checked={replaceMode}
                    onChange={() => setReplaceMode(true)}
                    className="text-emerald-600"
                  />
                  <span>আজকের আগের টাস্ক মুছে নতুনগুলো সেট করুন</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="replacePlan"
                    checked={!replaceMode}
                    onChange={() => setReplaceMode(false)}
                    className="text-emerald-600"
                  />
                  <span>বিদ্যমান তালিকার সাথে যুক্ত করুন</span>
                </label>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-center justify-between">
          {analyzedResult ? (
            <>
              <button
                type="button"
                onClick={() => setAnalyzedResult(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
              >
                ← পুনরায় ইনপুট দিন
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition"
              >
                <Check className="w-4 h-4" />
                <span>আজকের রুটিনে যোগ করুন</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
              >
                বাতিল
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleAnalyze}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI বিশ্লেষণ করছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>বিশ্লেষণ ও শতকরা ভাগ করুন</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
