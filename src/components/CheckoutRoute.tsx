import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldAlert, Sparkles, LogIn } from 'lucide-react';

interface CheckoutRouteProps {
  children: ReactNode;
  onInterceptAuthRequired: (message?: string) => void;
  isOpen: boolean;
}

export const CheckoutRoute: React.FC<CheckoutRouteProps> = ({
  children,
  onInterceptAuthRequired,
  isOpen,
}) => {
  const { user, isLoading } = useAuth();

  if (!isOpen) return null;

  // While auth status is loading from Supabase session, show subtle loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2A2141]/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#F9F8FC] p-8 rounded-3xl border border-[#EAE6F4] shadow-2xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#9B8EC7] border-t-transparent animate-spin" />
          <p className="text-xs text-[#2A2141] font-medium">Validating client credentials with Supabase...</p>
        </div>
      </div>
    );
  }

  // If no authenticated session exists, intercept the flow and display the Google Sign-In gate
  if (!isLoading && !user) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2A2141]/85 backdrop-blur-sm flex items-center justify-center p-4 text-left">
        <div className="relative w-full max-w-md bg-[#F9F8FC] rounded-3xl shadow-2xl border border-[#EAE6F4] overflow-hidden p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2A2141] text-[#9B8EC7] flex items-center justify-center shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2A2141]">
                Authentication Required
              </h3>
              <p className="text-xs text-[#2A2141]/60">
                Please authenticate your dossier before proceeding to pay
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EAE6F4] text-xs text-[#2A2141]/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <Sparkles className="w-4 h-4 text-[#9B8EC7]" />
              <span>Checkout Session Guard</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              In accordance with atelier purchase protocols, an active authenticated session is required.
              Sign in with Google to access saved shipping addresses, active carts, and track delivery status.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => onInterceptAuthRequired('Please authenticate with Google to complete your order')}
              className="w-full bg-[#2A2141] hover:bg-[#3D315B] text-[#F9F8FC] py-3.5 rounded-2xl text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#9B8EC7]" />
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active user session verified: Render CheckoutModal with full dossier access
  return <>{children}</>;
};
