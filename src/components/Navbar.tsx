import React from "react";
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
  Layers
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
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google login error:", err);
      // If popup fails or is blocked, notify gracefully
      alert("গুগল সাইন-ইন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন। " + (err.message || ""));
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
    </header>
  );
};
