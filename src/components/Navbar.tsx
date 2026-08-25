import React, { useState } from "react";
import { 
  BookOpen, 
  Calendar, 
  Flame, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X
} from "lucide-react";
import { User, signInWithPopup, auth, googleProvider, signOut } from "../lib/firebase";
import { toBengaliNumber, formatBanglaDate } from "../lib/bcsSyllabus";

interface NavbarProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  user: User | null;
  streakDays: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onDateChange,
  darkMode,
  onToggleDarkMode,
  user,
  streakDays,
}) => {
  const [showDomainHelpModal, setShowDomainHelpModal] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "";

  // Handle Google Login with graceful fallback
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (
        err?.code === "auth/unauthorized-domain" || 
        err?.message?.includes("unauthorized domain")
      ) {
        setShowDomainHelpModal(true);
      } else if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        // user closed popup
      } else {
        alert("গুগল সাইন-ইন করতে সমস্যা হয়েছে (" + (err.code || err.message) + ")।");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  // Get today's local YYYY-MM-DD
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = getTodayStr();

  // Date Shift Helpers (safe from UTC timezone offset glitches)
  const handleShiftDate = (days: number) => {
    const parts = currentDate.split("-").map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dt = String(d.getDate()).padStart(2, "0");
      onDateChange(`${y}-${m}-${dt}`);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dt = String(d.getDate()).padStart(2, "0");
      onDateChange(`${y}-${m}-${dt}`);
    }
  };

  const handleGoToToday = () => {
    onDateChange(todayStr);
  };

  const isToday = currentDate === todayStr;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md transition-colors duration-200 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Main Row */}
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  ৫১তম বিসিএস স্টাডি ট্র্যাকার
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block">
                Textbook • LiveMCQ PDF • Q-Bank • Others
              </p>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200/80 dark:border-stone-700/80">
            <button
              id="nav-prev-date-btn"
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 active:scale-95 transition cursor-pointer"
              title="আগের দিন"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1.5 px-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 hidden sm:inline" />
              <span>{formatBanglaDate(currentDate)}</span>
            </div>

            <button
              id="nav-next-date-btn"
              onClick={() => handleShiftDate(1)}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 active:scale-95 transition cursor-pointer"
              title="পরের দিন"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Direct 'আজ' (Today) Button */}
            <button
              id="btn-go-to-today"
              onClick={handleGoToToday}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                isToday 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-stone-600 border border-emerald-300 dark:border-emerald-700/60"
              }`}
              title="বর্তমান আজকের তারিখে যান"
            >
              আজ
            </button>
          </div>

          {/* Right Side: Streak, Dark Mode, Auth */}
          <div className="flex items-center gap-2">
            
            {/* Streak */}
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold"
              title="পড়ার ধারাবাহিকতা"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{toBengaliNumber(streakDays)} দিন</span>
            </div>

            {/* Dark Mode */}
            <button
              id="btn-toggle-darkmode"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition"
              title={darkMode ? "লাইট মোড" : "ডার্ক মোড"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* User Auth */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-7 h-7 rounded-full border border-emerald-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  id="btn-user-logout"
                  onClick={handleLogout}
                  className="text-stone-400 hover:text-red-500 p-1"
                  title="লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-google-login"
                onClick={handleGoogleLogin}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 text-xs font-semibold transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">লগইন</span>
              </button>
            )}

          </div>
        </div>

      </div>

      {/* Firebase Domain Authorization Help Modal */}
      {showDomainHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden space-y-4 p-5 sm:p-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  ফায়ারবেস ডোমেইন অনুমোদন প্রয়োজন
                </h3>
              </div>
              <button
                onClick={() => setShowDomainHelpModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              গুগল অথেনটিকেশন সিকিউরিটির জন্য আপনার বর্তমান ডোমেইনটি Firebase Console-এ <strong>Authorized domains</strong> তালিকায় যোগ করতে হবে।
            </p>

            <div className="p-3 bg-stone-100 dark:bg-stone-800/90 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block">আপনার বর্তমান ডোমেইন:</span>
                <code className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all">
                  {currentHostname}
                </code>
              </div>
              <button
                onClick={handleCopyDomain}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? "কপি হয়েছে!" : "কপি করুন"}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs text-stone-700 dark:text-stone-300">
              <p className="font-bold text-stone-900 dark:text-stone-100">কীভাবে যোগ করবেন:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-stone-600 dark:text-stone-400">
                <li>
                  Firebase Console-এর <a 
                    href="https://console.firebase.google.com/project/study-plan-17/authentication/settings" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    Authentication Settings <ExternalLink className="w-3 h-3" />
                  </a> পেজে যান।
                </li>
                <li>নিচের দিকে <strong>"Authorized domains"</strong> সেকশনে <strong>"Add domain"</strong> বাটনে ক্লিক করুন।</li>
                <li>উপরে কপি করা ডোমেইন পেস্ট করে <strong>Add</strong> বাটনে সেভ করুন।</li>
              </ol>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
              💡 নোট: ডোমেইন যোগ না করলেও আপনার পড়ার প্রগ্রেস লোকাল স্টোরেজে ১০০% নিরাপদ থাকবে।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setShowDomainHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200"
              >
                ঠিক আছে
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
