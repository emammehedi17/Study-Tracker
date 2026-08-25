import React from "react";
import { X, Layers, Check, BookOpen, Smartphone, FileQuestion, Sparkles, Scale } from "lucide-react";
import { SAMPLE_BCS_PLANS, SOURCE_CONFIG, toBengaliNumber } from "../lib/bcsSyllabus";
import { DailyPlan, StudyTask } from "../types";

interface SamplePlansDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSamplePlan: (plan: DailyPlan) => void;
}

export const SamplePlansDrawer: React.FC<SamplePlansDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSamplePlan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                ৫১তম বিসিএস স্যাম্পল ডেইলি রুটিন
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                পাঠ্যবই, লাইভ এমসিকিউ ও প্রশ্নব্যাংকের সমন্বয়ে তৈরি আদর্শ রুটিন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plans List */}
        <div className="space-y-4">
          {SAMPLE_BCS_PLANS.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800/60 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {item.subtitle}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectSamplePlan(item.plan);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition self-start sm:self-auto"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>এই রুটিন লোড করুন</span>
                </button>
              </div>

              {/* Tasks Mini List */}
              <div className="space-y-1.5 pt-1">
                {item.plan.tasks.map((task: StudyTask) => {
                  const config = SOURCE_CONFIG[task.source || 'textbook'];
                  return (
                    <div
                      key={task.id}
                      className="p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`px-1.5 py-0.5 rounded-sm font-semibold text-[10px] border ${config.bgClass} ${config.textClass} ${config.borderClass}`}>
                          {config.nameBangla}
                        </span>
                        <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                          {task.title}
                        </span>
                      </div>
                      <span className="shrink-0 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                        {toBengaliNumber(task.percentageWeight)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
