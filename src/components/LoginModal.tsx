import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Loader2, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  onSuccess?: (jwtToken: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  message,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const { user, signOut, handleDirectAdminLogin, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('mio_jwt_token') : null;
  });

  // Admin fallback login fields
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // 1. Session Listener: Capture JWT from Google OAuth redirect and persist for Express backend
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        const token = session.access_token;
        setJwtToken(token);
        // Save JWT for API requests to the Express backend
        localStorage.setItem('mio_jwt_token', token);
        if (onSuccess) {
          onSuccess(token);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('mio_jwt_token');
        setJwtToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onSuccess]);

  // 2. Trigger Google OAuth Consent Screen
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Google OAuth initialization error:', err);
      setErrorMessage(err.message || 'Failed to initiate Google authentication.');
      setIsLoading(false);
    }
  };

  // Direct Admin login submission (fallback)
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) {
      setErrorMessage('Please enter both admin email and password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await handleDirectAdminLogin(adminEmail, adminPassword);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2A2141]/80 backdrop-blur-sm flex items-center justify-center p-4 text-left">
      <div className="relative w-full max-w-md bg-[#F9F8FC] rounded-3xl shadow-2xl border border-[#EAE6F4] overflow-hidden my-6">
        {/* Header banner */}
        <div className="p-6 bg-white border-b border-[#EAE6F4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2A2141] text-[#9B8EC7] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#2A2141] font-semibold">
                MIO Client Authentication
              </h3>
              <p className="text-[11px] text-[#2A2141]/60">
                Secure access via Supabase &amp; Google OAuth
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#2A2141]/60 hover:text-[#2A2141] hover:bg-[#F9F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {message && (
            <div className="p-3 bg-[#F1EEF9] border border-[#EAE6F4] rounded-2xl text-xs text-[#2A2141]/80">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-[#D95D39]/10 border border-[#D95D39]/30 rounded-2xl flex items-start gap-2.5 text-xs text-[#D95D39]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D95D39]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {user ? (
            /* User already authenticated */
            <div className="bg-white p-5 rounded-2xl border border-[#EAE6F4] space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-serif text-sm font-semibold text-[#2A2141]">
                    Authenticated Session
                  </p>
                  <p className="text-xs text-[#2A2141]/70 font-mono truncate max-w-[220px]">
                    {user.email}
                  </p>
                </div>
              </div>

              {jwtToken && (
                <div className="p-3 bg-[#F9F8FC] rounded-xl border border-[#EAE6F4]">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-[#2A2141]/50 block mb-1">
                    Supabase JWT Captured &amp; Saved
                  </span>
                  <p className="font-mono text-[10px] text-[#2A2141]/70 truncate">
                    Bearer {jwtToken.slice(0, 24)}...
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-[#2A2141] text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#3D315B] transition-colors cursor-pointer"
                >
                  Continue Browsing
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="px-4 py-2.5 border border-[#EAE6F4] text-[#D95D39] rounded-xl text-xs font-medium hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : !showAdminForm ? (
            /* Primary Google OAuth Trigger Button */
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-white hover:bg-[#F9F8FC] border border-[#EAE6F4] hover:border-[#9B8EC7] rounded-2xl text-xs font-medium text-[#2A2141] flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#9B8EC7]" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span className="font-semibold">
                  {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#EAE6F4] w-full" />
                <span className="bg-[#F9F8FC] px-3 text-[10px] uppercase tracking-widest text-[#2A2141]/40 font-mono">
                  OR
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAdminForm(true)}
                className="w-full py-2.5 bg-transparent hover:bg-white text-[#2A2141]/70 hover:text-[#2A2141] text-xs font-medium rounded-xl border border-dashed border-[#EAE6F4] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#9B8EC7]" />
                <span>Atelier Curator / Director Sign-In</span>
              </button>
            </div>
          ) : (
            /* Admin Credentials Form */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1 font-medium">
                  Curator Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="sojolislam576@gmail.com"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE6F4] rounded-xl text-xs outline-none text-[#2A2141] focus:border-[#9B8EC7]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#2A2141]/70 mb-1 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE6F4] rounded-xl text-xs outline-none text-[#2A2141] focus:border-[#9B8EC7]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminForm(false)}
                  className="px-4 py-2.5 border border-[#EAE6F4] rounded-xl text-xs text-[#2A2141]/60 hover:text-[#2A2141] cursor-pointer"
                >
                  Back to Google
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-[#2A2141] hover:bg-[#3D315B] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isLoading ? 'Verifying...' : 'Sign In as Admin'}
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-[#EAE6F4] flex items-center justify-between text-[11px] text-[#2A2141]/50 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9B8EC7]" /> 256-Bit TLS Provenance
            </span>
            <span>MIO Atelier Inc.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
