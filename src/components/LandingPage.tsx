import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Layers, CheckCircle2, Shield, Zap, AlertCircle, ArrowRight, UserCheck, Sparkles, User, ChevronDown, ChevronUp } from 'lucide-react';
import { LocalUser } from '../AuthWrapper';

interface LandingPageProps {
  onLocalLogin?: (user: LocalUser) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLocalLogin }) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('Rahul Sriwastaw');
  const [customEmail, setCustomEmail] = useState('rahul@testfactory.org');

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      let friendlyError = error?.message || 'Login failed. Please try again.';
      const code = error?.code || '';

      if (code === 'auth/operation-not-allowed') {
        friendlyError = 'Google Sign-In is not enabled in the Firebase Console for this project. Please use Quick Demo Login below.';
      } else if (code === 'auth/unauthorized-domain') {
        friendlyError = 'localhost is not authorized in Firebase Authentication domains. Use Quick Demo Login below to access.';
      } else if (code === 'auth/popup-closed-by-user') {
        friendlyError = 'Sign-in popup was closed before completion.';
      } else if (code === 'auth/popup-blocked') {
        friendlyError = 'Sign-in popup was blocked by your browser. Please allow popups or use Quick Login.';
      } else if (code.startsWith('auth/')) {
        friendlyError = `Firebase Authentication (${code}): ${error.message}`;
      }

      setErrorMessage(friendlyError);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleQuickLogin = () => {
    if (onLocalLogin) {
      onLocalLogin({
        uid: 'usr_editor_amit',
        displayName: 'Amit Kumar',
        email: 'amit.editor@testfactory.org',
        role: 'editor'
      });
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    if (onLocalLogin) {
      onLocalLogin({
        uid: `usr_${Date.now()}`,
        displayName: customName.trim(),
        email: customEmail.trim() || `${customName.toLowerCase().replace(/\s+/g, '.')}@testfactory.org`,
        role: 'editor'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col items-center justify-center font-sans p-6 text-slate-100">
      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/60 p-8 text-center">
        {/* Brand Icon & Heading */}
        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/20">
          <Layers className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Test Factory <span className="text-blue-400 font-light">MCQ</span>
        </h1>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed max-w-sm mx-auto">
          High-performance question bank studio, LaTeX editor & multi-base Airtable manager.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-left">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[11px] font-medium text-slate-300 block">Multi-Base</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[11px] font-medium text-slate-300 block">Fast LaTeX</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <Shield className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-[11px] font-medium text-slate-300 block">ImgBB CDN</span>
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-left flex items-start gap-3 text-amber-200 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-300 mb-1">Sign-In Notice</p>
              <p className="leading-relaxed opacity-90">{errorMessage}</p>
              <button
                type="button"
                onClick={handleQuickLogin}
                className="mt-2 inline-flex items-center gap-1.5 font-bold text-amber-300 hover:text-amber-100 underline decoration-amber-400/50"
              >
                Continue with 1-Click Quick Login instead &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Primary Action: 1-Click Quick Login */}
        <button
          onClick={handleQuickLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl px-5 py-3.5 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 mb-3"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="text-sm tracking-wide">Enter Workspace (Quick Login)</span>
          <ArrowRight className="w-4 h-4 text-blue-200" />
        </button>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl px-4 py-3 transition-colors text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 mb-4 disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
        </button>

        {/* Custom Name / Identity Section */}
        <div className="border-t border-slate-800 pt-4 mt-2">
          <button
            type="button"
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Login with custom name & email</span>
            {showCustomForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCustomForm && (
            <form onSubmit={handleCustomSubmit} className="mt-4 space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Rahul Sriwastaw"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. rahul@testfactory.org"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg px-3 py-2 text-xs transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enter as {customName || 'Editor'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Test Factory CMS &bull; Multi-Base Question Bank Studio
      </div>
    </div>
  );
};
