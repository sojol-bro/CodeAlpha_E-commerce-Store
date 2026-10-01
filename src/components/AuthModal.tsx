import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'admin';
  onAdminRedirect?: () => void;
  message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onAdminRedirect,
  message,
}) => {
  if (!isOpen) return null;

  const { signInWithGoogle, handleDirectAdminLogin, user, signOut } = useAuth();

  const [mode, setMode] = useState<'signin' | 'admin'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Google OAuth flow
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    const { error: authErr } = await signInWithGoogle();
    if (authErr) {
      setError(authErr.message || 'Google Sign-In failed');
      setIsSubmitting(false);
    }
  };

  // Task 2: Specific login handler checking exact credentials
  // Exact email: sojolislam576@gmail.com
  // Exact password: sojol@3997
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide email and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await handleDirectAdminLogin(email, password);

    if (res.success) {
      const isTargetAdmin = email.trim().toLowerCase() === 'sojolislam576@gmail.com';
      if (isTargetAdmin) {
        setSuccessNotice('Admin credentials verified. Routing to /admin dashboard...');
        setTimeout(() => {
          onClose();
          if (onAdminRedirect) {
            onAdminRedirect();
          }
        }, 800);
      } else {
        setSuccessNotice('Session authenticated.');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } else {
      setError(res.error || 'Invalid credentials.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2A2141]/80 backdrop-blur-sm flex items-center justify-center p-4 text-left">
      <div className="relative w-full max-w-md bg-[#F9F8FC] rounded-3xl shadow-2xl border border-[#EAE6F4] overflow-hidden">
        {/* Header banner */}
        <div className="p-6 bg-white border-b border-[#EAE6F4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2A2141] text-[#9B8EC7] flex items-center justify-center shadow-xs">
              {mode === 'admin' ? <Lock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#2A2141] font-semibold">
                {mode === 'admin' ? 'Atelier Administrative Portal' : 'Client Dossier Access'}
              </h3>
              <p className="text-xs text-[#2A2141]/60">
                {mode === 'admin' ? 'Secure authentication gate for directors' : 'Sign in to access checkout & orders'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F9F8FC] hover:bg-[#EAE6F4] text-[#2A2141] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {message && (
            <div className="p-3 bg-[#F1EEF9] border border-[#9B8EC7]/30 rounded-xl text-xs text-[#2A2141] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9B8EC7] shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div className="flex bg-[#F1EEF9] p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-[#2A2141] shadow-xs font-semibold'
                  : 'text-[#2A2141]/60 hover:text-[#2A2141]'
              }`}
            >
              Client Login / OAuth
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('admin');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'admin'
                  ? 'bg-white text-[#2A2141] shadow-xs font-semibold'
                  : 'text-[#2A2141]/60 hover:text-[#2A2141]'
              }`}
            >
              Admin Routing
            </button>
          </div>

          {/* Google Sign-In Primary (Task 1) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-white hover:bg-[#F9F8FC] text-[#2A2141] border border-[#EAE6F4] rounded-2xl text-xs font-semibold flex items-center justify-center gap-3 transition-all shadow-xs hover:border-[#9B8EC7] cursor-pointer"
            >
              {/* Google Brand Vector with compliant values */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4385F4"
                  d="M23.74 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.55.38-2.28V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.43l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.41-3.41C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.16c.95-2.83 3.6-4.99 6.72-4.99z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#EAE6F4]" />
              <span className="shrink-0 mx-3 text-[11px] text-[#2A2141]/40 uppercase tracking-wider">
                Or credential login
              </span>
              <div className="flex-grow border-t border-[#EAE6F4]" />
            </div>
          </div>

          {/* Direct Credential Form (with Task 2 hardcoded intercept) */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium flex items-center justify-between">
                <span>Email Address</span>
                {mode === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('sojolislam576@gmail.com');
                      setPassword('sojol@3997');
                    }}
                    className="text-[10px] text-[#9B8EC7] hover:underline"
                  >
                    Quick-fill Admin Creds
                  </button>
                )}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9B8EC7] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EAE6F4] rounded-xl text-xs text-[#2A2141] outline-none focus:border-[#9B8EC7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#2A2141]/70 mb-1 font-medium">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#9B8EC7] absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EAE6F4] rounded-xl text-xs text-[#2A2141] outline-none focus:border-[#9B8EC7]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#D95D39] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#2A2141] hover:bg-[#3D315B] text-[#F9F8FC] py-3 rounded-xl text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#9B8EC7]" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'admin' ? 'Authenticate & Enter /admin' : 'Access Account'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9B8EC7]" />
                </>
              )}
            </button>
          </form>

          {/* Security Warning Notice as requested */}
          <div className="p-3 bg-[#F1EEF9] rounded-xl border border-[#EAE6F4] text-[11px] text-[#2A2141]/80 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#2A2141]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D95D39]" />
              <span>Security Architecture Warning</span>
            </div>
            <p className="text-[10px] text-[#2A2141]/70 leading-relaxed">
              While hardcoded authentication routing functions as designated for rapid administration,
              storing static credentials directly in client-side bundles allows inspection via developer tools.
              Production deployments should utilize Supabase Auth with Row-Level Security (RLS) role claims.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { LoginModal } from './LoginModal';
export default AuthModal;
