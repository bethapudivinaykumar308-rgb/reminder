import React from 'react';
import {
  Zap,
  PhoneCall,
  MessageSquare,
  Sparkles,
  LogOut,
  Sliders,
  CheckCircle2,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UtilitySettings } from '../types';

interface NavbarProps {
  user: User | null;
  token: string | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  activeTab: 'dashboard' | 'history' | 'analytics' | 'templates' | 'no_whatsapp';
  setActiveTab: (tab: 'dashboard' | 'history' | 'analytics' | 'templates') => void;
  settings: UtilitySettings;
  onOpenSettings: () => void;
  onOpenWorkspace: () => void;
  onCurrencyChange: (curr: string) => void;
  onOpenLauncherVerify?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  token,
  onLogin,
  onLogout,
  isLoggingIn,
  activeTab,
  setActiveTab,
  settings,
  onOpenSettings,
  onOpenWorkspace,
  onCurrencyChange,
  onOpenLauncherVerify,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 shadow-md shadow-blue-500/20 text-white">
              <Zap className="w-6 h-6 animate-pulse text-amber-300" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-700 bg-clip-text text-transparent">
                  VoltRemind AI
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-200">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  Gemini 3.1 Pro High-Thinking
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block truncate max-w-xs font-medium">
                {settings.utilityName || 'Automated Electricity Bill Recovery'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Defaulters Master
            </button>
            <button
              id="nav-tab-history"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              SMS & Call Logs
            </button>
            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
              Recovery Analytics
            </button>
            <button
              id="nav-tab-templates"
              onClick={() => setActiveTab('templates')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-violet-500" />
              AI Script Studio
            </button>
          </nav>

          {/* Right Action Controls: Currency, Google Workspace Status, User / Sign In */}
          <div className="flex items-center gap-2.5">
            {/* Currency Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-medium">
              {(['₹', '$', '€', '£'] as const).map((curr) => (
                <button
                  key={curr}
                  id={`btn-currency-${curr}`}
                  onClick={() => onCurrencyChange(curr)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    settings.currency === curr
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            {/* Launcher Mobile Line Badge / Trigger */}
            {onOpenLauncherVerify && (
              <button
                id="btn-navbar-launcher-verify"
                onClick={onOpenLauncherVerify}
                title="Verify Launcher Mobile Number for sending SMS and Calls"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  settings.isLauncherPhoneVerified
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <Smartphone className={`w-3.5 h-3.5 ${settings.isLauncherPhoneVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="hidden sm:inline font-mono font-bold">
                  {settings.launcherPhone || 'లాంచర్ మొబైల్'}
                </span>
                {settings.isLauncherPhoneVerified ? (
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                ) : (
                  <span className="px-1 py-0.2 rounded text-[9px] bg-amber-200 text-amber-900 font-bold">
                    ధృవీకరించండి
                  </span>
                )}
              </button>
            )}

            {/* Google Workspace Integration Button */}
            <button
              id="btn-open-workspace"
              onClick={onOpenWorkspace}
              title="Google Workspace Hub (Sheets, Gmail, Calendar, Docs, Drive, Contacts)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 transition-colors shadow-xs"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
                alt="Google Workspace"
                className="w-4 h-4"
                referrerPolicy="no-referrer"
              />
              <span className="hidden sm:inline font-semibold">Workspace</span>
              {token && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
            </button>

            {/* Settings Button */}
            <button
              id="btn-navbar-settings"
              onClick={onOpenSettings}
              title="Utility Settings"
              className="p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Google Sign In / User Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full ring-2 ring-blue-500/30 object-cover"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    ● Firebase Auth
                  </p>
                </div>
                <button
                  id="btn-sign-out"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-google-signin"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-all disabled:opacity-50"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200/60 overflow-x-auto gap-1 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
            }`}
          >
            ⚡ Defaulters
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'history' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
            }`}
          >
            💬 SMS & Calls
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
            }`}
          >
            📈 Analytics
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'templates' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
            }`}
          >
            🎙️ Voice Studio
          </button>
        </div>
      </div>
    </header>
  );
};
