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
      className="sticky top-0 z-30 backdrop-blur-md bg-[#FCFAF7]/90 border-b border-[#BA1B35]/15 transition-all"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#BA1B35] rounded-xl flex items-center justify-center text-[#FCFAF7] shadow-scrapbook rotate-[-2deg] border border-[#8E162B]">
            <DoodleSparkle className="w-4 h-4 text-[#FDECEF]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif italic font-bold tracking-tight text-[#561320]">
              Re<span className="text-[#BA1B35] font-serif not-italic">:</span>mind
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-[#9C182F] uppercase tracking-[0.25em] bg-[#FDECEF] px-2.5 py-0.5 rounded-full border border-[#F8CDD5]">
              Personal Vault
            </span>
          </div>
        </div>

        {/* User / Sign-in */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[#F6EFE6] animate-pulse border border-[#ECE2D5]" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full ring-2 ring-[#BA1B35]/40 object-cover shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#FDECEF] text-[#BA1B35] font-serif font-bold text-xs flex items-center justify-center border border-[#F8CDD5]">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-medium text-[#561320] leading-tight font-sans">
                    {user.displayName || 'Friend'}
                  </span>
                  <span className="text-xs text-[#8E162B]/70 leading-tight truncate max-w-[140px] font-mono">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                id="sign-out-button"
                onClick={() => logout()}
                title="Sign out"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#751225] hover:text-[#561320] bg-[#FFFDF9] hover:bg-[#FDECEF]/70 border border-[#BA1B35]/20 shadow-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              id="header-sign-in-button"
              onClick={() => loginWithGoogle()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-serif font-medium text-[#FCFAF7] bg-[#BA1B35] hover:bg-[#9C182F] shadow-scrapbook active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer border border-[#8E162B]"
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
