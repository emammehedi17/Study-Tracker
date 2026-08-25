import React, { useState } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Calendar, 
  BarChart3, 
  History, 
  Award, 
  Flame, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  Timer, 
  ChevronLeft, 
  ChevronRight,
  BookMarked,
  Layers,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X
} from "lucide-react";
import { User, signInWithPopup, signOut, googleProvider, auth } from "../lib/firebase";
import { formatBanglaDate, toBengaliNumber } from "../lib/bcsSyllabus";

interface NavbarProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  activeTab: 'today' | 'analytics' | 'history' | 'scores' | 'mistakes';
  onTabChange: (tab: 'today' | 'analytics' | 'history' | 'scores' | 'mistakes') => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  user: User | null;
  streakDays: number;
  onOpenAiModal: () => void;
  onOpenTimerModal: () => void;
  onOpenSamplePlans: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onDateChange,
  activeTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
  user,
  streakDays,
  onOpenAiModal,
  onOpenTimerModal,
  onOpenSamplePlans,
}) => {
  const [showDomainHelpModal, setShowDomainHelpModal] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google login error:", err);
      if (
        err?.code === "auth/unauthorized-domain" ||
        err?.message?.includes("unauthorized-domain") ||
        err?.message?.includes("auth/unauthorized-domain")
      ) {
        setShowDomainHelpModal(true);
      } else if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        // User closed popup, do nothing
      } else {
        alert("গুগল সাইন-ইন করতে সমস্যা হয়েছে (" + (err.code || err.message) + ")। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    }
  };

  const handleCopyDomain = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleShiftDate = (days: number) => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const isToday = currentDate === new Date().toISOString().split("T")[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md transition-colors duration-200 shadow-xs">
      {/* Top Banner with Title, Streak & User Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & BCS Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  ৫১তম বিসিএস স্টাডি ট্র্যাকার
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  51st BCS Prep
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 hidden md:block">
                পাঠ্যবই • LiveMCQ • প্রশ্নব্যাংক স্মার্ট ট্র্যাকিং
              </p>
            </div>
          </div>

          {/* Center Date Navigator (when on Today tab) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              id="nav-prev-date-btn"
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 transition"
              title="আগের দিন"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-800 dark:text-stone-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{formatBanglaDate(currentDate)}</span>
              {isToday && (
                <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  আজ
                </span>
              )}
            </div>

            <button
              id="nav-next-date-btn"
              onClick={() => handleShiftDate(1)}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 transition"
              title="পরের দিন"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                id="nav-today-btn"
                onClick={() => onDateChange(new Date().toISOString().split("T")[0])}
                className="ml-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-1.5"
              >
                আজকে যান
              </button>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Streak Badge */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold"
              title="টানা পড়ার স্ট্রিক"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{toBengaliNumber(streakDays)} দিন</span>
            </div>

            {/* AI Assistant Button */}
            <button
              id="btn-open-ai-analyzer"
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI রুটিন অ্যানালাইজার</span>
              <span className="sm:hidden">AI রুটিন</span>
            </button>

            {/* Focus Timer Button */}
            <button
              id="btn-open-pomodoro"
              onClick={onOpenTimerModal}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition"
              title="স্টাডি ফোকাস টাইমার"
            >
              <Timer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="btn-toggle-darkmode"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition"
              title={darkMode ? "লাইট মোড চালু করুন" : "চোখের সুরক্ষায় ডার্ক মোড"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-stone-200 dark:border-stone-700">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-7 h-7 rounded-full border border-emerald-500 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <button
                  id="btn-user-logout"
                  onClick={handleLogout}
                  className="text-xs text-stone-500 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 p-1"
                  title="লগআউট"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-google-login"
                onClick={handleGoogleLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 text-xs sm:text-sm font-semibold transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google লগইন</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Date Switcher */}
        <div className="flex lg:hidden items-center justify-between py-2 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-1 rounded text-stone-600 dark:text-stone-300 text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> আগের দিন
          </button>
          <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{formatBanglaDate(currentDate)}</span>
          </div>
          <button
            onClick={() => handleShiftDate(1)}
            className="p-1 rounded text-stone-600 dark:text-stone-300 text-xs flex items-center gap-1"
          >
            পরের দিন <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar">
          <button
            id="tab-today-checklist"
            onClick={() => onTabChange('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'today'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>আজকের পড়ার তালিকা</span>
          </button>

          <button
            id="tab-weekly-analytics"
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>সাপ্তাহিক অ্যানালিটিক্স ও AI মেন্টর</span>
          </button>

          <button
            id="tab-history-log"
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>পূর্বের দিনলিপি</span>
          </button>

          <button
            id="tab-mock-scores"
            onClick={() => onTabChange('scores')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'scores'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>LiveMCQ ও টেস্ট মার্কস</span>
          </button>

          <button
            id="tab-mistake-notes"
            onClick={() => onTabChange('mistakes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'mistakes'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>ভুল প্রশ্ন খাতা (Mistake Bank)</span>
          </button>

          <button
            id="btn-sample-routines"
            onClick={onOpenSamplePlans}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>স্যাম্পল রুটিন</span>
          </button>
        </nav>
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
              গুগল অথেনটিকেশন সিকিউরিটির জন্য আপনার Netlify বা কাস্টম হোস্ট ডোমেইনটি Firebase Console-এ <strong>Authorized domains</strong> তালিকায় যোগ করতে হবে।
            </p>

            {/* Copy Hostname Box */}
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

            {/* Step-by-Step Instructions */}
            <div className="space-y-2 text-xs text-stone-700 dark:text-stone-300">
              <p className="font-bold text-stone-900 dark:text-stone-100">কীভাবে যোগ করবেন (মাত্র ৩টি সহজ ধাপ):</p>
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
                <li>উপরে কপি করা ডোমেইন (<code className="text-emerald-600">{currentHostname}</code>) পেস্ট করে <strong>Add</strong> বাটনে সেভ করুন।</li>
              </ol>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
              💡 নোট: ডোমেইন যোগ না করলেও আপনার সকল পড়ার তালিকা, রুটিন এবং স্কোর ব্রাউজারের লোকাল মেমোরিতে ১০০% সেভ থাকবে।
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <a
                href="https://console.firebase.google.com/project/study-plan-17/authentication/settings"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <span>Firebase Settings এ যান</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowDomainHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700"
              >
                গেস্ট মোডে রাখুন
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
