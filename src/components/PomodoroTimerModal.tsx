import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  CheckCircle2, 
  Sparkles, 
  Coffee, 
  BookOpen 
} from "lucide-react";
import { StudyTask } from "../types";
import { toBengaliNumber } from "../lib/bcsSyllabus";

interface PomodoroTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTask: StudyTask | null;
  onCompleteSession: (task: StudyTask | null, studiedMinutes: number) => void;
}

export const PomodoroTimerModal: React.FC<PomodoroTimerModalProps> = ({
  isOpen,
  onClose,
  activeTask,
  onCompleteSession,
}) => {
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [studyDuration, setStudyDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [studiedSecondsTotal, setStudiedSecondsTotal] = useState(0);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (activeTask && activeTask.estimatedMinutes) {
      setStudyDuration(Math.min(60, activeTask.estimatedMinutes));
      setTimeLeft(Math.min(60, activeTask.estimatedMinutes) * 60);
    } else {
      setStudyDuration(25);
      setTimeLeft(25 * 60);
    }
    setIsRunning(false);
    setStudiedSecondsTotal(0);
  }, [activeTask, isOpen]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            // play beep notification if available
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(800, ctx.currentTime);
              osc.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            } catch (e) {}

            return 0;
          }
          if (mode === 'study') {
            setStudiedSecondsTotal(s => s + 1);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = (m: number, s: number) => {
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${toBengaliNumber(mm)}:${toBengaliNumber(ss)}`;
  };

  const handleReset = (targetMode: 'study' | 'break' = mode) => {
    setIsRunning(false);
    setMode(targetMode);
    setTimeLeft(targetMode === 'study' ? studyDuration * 60 : breakDuration * 60);
  };

  const handleFinish = () => {
    const minutesRecorded = Math.max(1, Math.round(studiedSecondsTotal / 60));
    onCompleteSession(activeTask, minutesRecorded);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 text-center space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <Timer className="w-5 h-5" />
            <span>বিসিএস ফোকাস টাইমার (Pomodoro)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Task Info if any */}
        {activeTask ? (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-left space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
              বর্তমান পড়ার টাস্ক:
            </span>
            <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
              {activeTask.title}
            </p>
            <p className="text-[11px] text-stone-500">
              বিষয়: {activeTask.subject}
            </p>
          </div>
        ) : (
          <div className="text-xs text-stone-500">
            গভীর মনোযোগ দিয়ে পড়াশোনার জন্য টাইমার চালু করুন
          </div>
        )}

        {/* Study / Break Switch */}
        <div className="flex p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl max-w-xs mx-auto text-xs font-semibold">
          <button
            onClick={() => handleReset('study')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              mode === 'study'
                ? 'bg-white dark:bg-stone-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                : 'text-stone-500'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>পড়ার সময়</span>
          </button>
          <button
            onClick={() => handleReset('break')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              mode === 'break'
                ? 'bg-white dark:bg-stone-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-stone-500'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>ছোট বিরতি</span>
          </button>
        </div>

        {/* Big Digital Countdown Clock */}
        <div className="py-4">
          <div className="text-5xl sm:text-6xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-mono">
            {formatTime(minutes, seconds)}
          </div>
          <p className="text-xs text-stone-400 mt-2">
            {mode === 'study' ? "📚 পূর্ণ মনোযোগ দিয়ে পড়ুন" : "☕ একটু পানি পান করুন এবং চোখকে বিশ্রাম দিন"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleReset(mode)}
            className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition"
            title="রিসেট করুন"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-2xl text-white font-bold text-base shadow-lg transition active:scale-95 flex items-center gap-2 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>পজ করুন</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>শুরু করুন</span>
              </>
            )}
          </button>

          <button
            onClick={handleFinish}
            className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition"
            title="সেশন শেষ ও সেভ করুন"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
