import React, { useState, useEffect } from 'react';
import {
  initFirebase,
  getFirebaseConfig,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from '../firebase.ts';
import {
  ShieldCheck,
  Lock,
  LogIn,
  LogOut,
  Settings,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Terminal,
  ExternalLink
} from 'lucide-react';

interface AuthGateProps {
  children: (user: User | null, onLogout: () => void) => React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState(getFirebaseConfig());
  const [rawConfigInput, setRawConfigInput] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const activeConfig = getFirebaseConfig();
    if (activeConfig.apiKey && activeConfig.projectId) {
      setIsConfigured(true);
      const { auth } = initFirebase(activeConfig);
      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        return () => unsubscribe();
      }
    }
    setLoading(false);
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      const { auth } = initFirebase();
      if (!auth) {
        setShowConfigModal(true);
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        console.info('Google Sign-In popup closed by user.');
        setAuthError(null);
        return;
      }
      console.error('Google Sign-In Error:', err);
      let msg = err.message || 'Google sign-in failed.';
      if (err.code === 'auth/unauthorized-domain') {
        msg = 'Domain not authorized. Please add this domain to Firebase Console -> Authentication -> Settings -> Authorized domains.';
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/invalid-api-key') {
        msg = 'Firebase Authentication is not enabled or credentials need verification.';
        setShowConfigModal(true);
      }
      setAuthError(msg);
    }
  };

  const handleLogout = async () => {
    try {
      const { auth } = initFirebase();
      if (auth) {
        await signOut(auth);
        setUser(null);
      }
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsed = config;
      if (rawConfigInput.trim()) {
        // Try parsing snippet e.g. const firebaseConfig = { ... }
        const match = rawConfigInput.match(/\{[\s\S]*\}/);
        if (match) {
          // Clean keys to valid JSON format if needed
          const cleaned = match[0]
            .replace(/([a-zA-Z0-9_-]+)\s*:/g, '"$1":')
            .replace(/'/g, '"')
            .replace(/,\s*\}/g, '}');
          parsed = JSON.parse(cleaned);
        } else {
          parsed = JSON.parse(rawConfigInput);
        }
      }

      localStorage.setItem('sql_agent_firebase_config', JSON.stringify(parsed));
      setConfig(parsed);
      setIsConfigured(true);
      setShowConfigModal(false);
      setAuthError(null);

      // Re-init
      const { auth } = initFirebase(parsed);
      if (auth) {
        onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
        });
      }
    } catch (err: any) {
      setAuthError('Could not parse Firebase config. Please verify the JSON or snippet format.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
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
      <div className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold shadow-inner">
            <Database className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-200 tracking-tight text-sm">
            Retail SQL Agent & Analytics
          </span>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors"
          title="Configure Firebase Keys"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Firebase Setup</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Security Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              Authentication Required
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              This business intelligence and SQL agent workspace is protected. Sign in with your Google account to access data analytics.
            </p>
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

            {!isConfigured && (
              <p className="text-center text-xs text-amber-400/90 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-lg">
                ⚠️ Firebase Web API credentials not set yet.{' '}
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="underline font-medium hover:text-amber-200"
                >
                  Click here to paste your Firebase config
                </button>
              </p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              OAuth 2.0 Protected
            </span>
            <span>Single-Sign-On</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-slate-600">
        Enterprise Retail SQL Agent · Read-Only Safeguard Active
      </div>

      {/* Firebase Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                Firebase OAuth Web Configuration
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste the <code className="text-cyan-300">firebaseConfig</code> object from your Firebase Console (Project Settings &rarr; Your apps &rarr; Web app).
            </p>

            <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Paste Config Snippet or JSON:
                </label>
                <textarea
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "retail-store-sql-agent.firebaseapp.com",\n  projectId: "retail-store-sql-agent",\n  storageBucket: "retail-store-sql-agent.firebasestorage.app",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
                  value={rawConfigInput}
                  onChange={(e) => setRawConfigInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
