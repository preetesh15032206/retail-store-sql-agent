import React, { useState, useEffect } from 'react';
import { Database, Lock, AlertCircle, ShieldCheck, UserCheck, Sparkles, Terminal } from 'lucide-react';
import {
  initFirebase,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from '../firebase.ts';

interface AuthGateProps {
  children: (user: User | null, onLogout: () => void) => React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInstance, setAuthInstance] = useState<any>(null);

  useEffect(() => {
    try {
      const { auth } = initFirebase();
      if (!auth) {
        setLoading(false);
        return;
      }
      setAuthInstance(auth);

      const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
        setUser(currentUser);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Auth initialization error:', err);
      setLoading(false);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    let auth = authInstance;
    if (!auth) {
      const res = initFirebase();
      auth = res.auth;
      setAuthInstance(auth);
    }

    if (!auth) {
      setAuthError('Authentication service is initializing. Please try again.');
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not yet authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.');
      } else {
        setAuthError(err.message || 'Google Sign-in failed. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    if (authInstance) {
      try {
        await signOut(authInstance);
        setUser(null);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  // While checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-sm font-mono text-slate-400">Verifying security credentials...</p>
      </div>
    );
  }

  // If user is authenticated, render the main protected workspace!
  if (user) {
    return <>{children(user, handleLogout)}</>;
  }

  // Not authenticated: Display clean Google OAuth Login Gate
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold shadow-inner">
            <Database className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-200 tracking-tight text-sm">
            Retail SQL Agent & Analytics
          </span>
        </div>

        {/* Developer Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-medium text-slate-200">Preetesh Kumar Chaudhary</span>
          <span className="text-slate-600 hidden xs:inline">•</span>
          <span className="text-cyan-400 font-mono hidden xs:inline">2306209</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-purple-400 font-medium hidden sm:inline">GenAI</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Security Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              Authentication Required
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Sign in with your authorized Google account to access real-time retail store data analytics, AI SQL generation, and business insights.
            </p>
          </div>

          {/* Developer Card Badge inside Gate */}
          <div className="mb-6 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-left space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-medium uppercase tracking-wider text-slate-500 text-[10px]">Lead Engineer / Creator</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-medium text-[10px]">
                GenAI
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">
                Preetesh Kumar Chaudhary
              </span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                2306209
              </span>
            </div>
          </div>

          {authError && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="leading-snug">{authError}</div>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-150 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
            >
              {/* Google Colorful G SVG */}
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
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
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              OAuth 2.0 Protected
            </span>
            <span>Single Sign-On</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950/80 px-4 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Created by</span>
          <strong className="text-slate-300 font-medium">Preetesh Kumar Chaudhary</strong>
          <span>(ID: <span className="text-cyan-400 font-mono">2306209</span>)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50 text-[10px] font-semibold">
            GenAI
          </span>
          <span>· Enterprise Retail SQL Studio</span>
        </div>
      </footer>
    </div>
  );
};
