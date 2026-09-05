import React from 'react';
import type { User } from 'firebase/auth';
import { LogOut, LogIn } from 'lucide-react';
import { loginWithGoogle, logout } from '../lib/firebase';
import { DoodleSparkle } from './Doodles';

interface HeaderProps {
  user: User | null;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, loading }) => {
  return (
    <nav
      id="app-header"
      className="sticky top-0 z-30 backdrop-blur-md bg-[#FCFAF6]/90 border-b border-[#6B1D2F]/15 transition-all"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#6B1D2F] rounded-xl flex items-center justify-center text-[#FCFAF6] shadow-scrapbook rotate-[-2deg] border border-[#360B15]">
            <DoodleSparkle className="w-4 h-4 text-[#FDE8E9]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif italic font-bold tracking-tight text-[#360B15]">
              Re<span className="text-[#83243A] font-serif not-italic">:</span>mind
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-[#83243A] uppercase tracking-[0.25em] bg-[#FDE8E9]/80 px-2 py-0.5 rounded-full border border-[#F2B3B8]/60">
              Personal Vault
            </span>
          </div>
        </div>

        {/* User / Sign-in */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[#F5EFE4] animate-pulse border border-[#ECE2D0]" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full ring-2 ring-[#83243A]/40 object-cover shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#FDE8E9] text-[#6B1D2F] font-serif font-bold text-xs flex items-center justify-center border border-[#F2B3B8]">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-medium text-[#360B15] leading-tight font-sans">
                    {user.displayName || 'Friend'}
                  </span>
                  <span className="text-xs text-[#83243A]/60 leading-tight truncate max-w-[140px] font-mono">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                id="sign-out-button"
                onClick={() => logout()}
                title="Sign out"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#541423] hover:text-[#6B1D2F] bg-[#FFFDF9] hover:bg-[#FDE8E9]/50 border border-[#6B1D2F]/20 shadow-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              id="header-sign-in-button"
              onClick={() => loginWithGoogle()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-serif font-medium text-[#FCFAF6] bg-[#6B1D2F] hover:bg-[#541423] shadow-scrapbook active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
