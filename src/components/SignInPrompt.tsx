import React, { useState } from 'react';
import { Shield, BookmarkCheck, ArrowRight, Loader2 } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { WashiTape, DoodleSparkle, DoodleFlower } from './Doodles';

export const SignInPrompt: React.FC = () => {
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      setErrorMsg(null);
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setErrorMsg('Sign-in cancelled or failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 px-4">
      <div
        id="welcome-card"
        className="relative overflow-hidden rounded-3xl bg-[#FFFDF9] border-2 border-[#BA1B35]/20 shadow-scrapbook-lg p-8 sm:p-10 text-center"
      >
        {/* Playful Washi Tape accent */}
        <WashiTape color="lavender" className="-top-2 left-1/2 -translate-x-1/2" rotate="-rotate-1" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Emblem */}
          <div className="w-16 h-16 rounded-2xl bg-[#FDECEF] text-[#BA1B35] border border-[#F8CDD5] flex items-center justify-center mb-6 shadow-xs rotate-[-3deg]">
            <DoodleFlower className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#561320] mb-2.5 tracking-tight">
            Welcome to Re:mind
          </h2>

          <p className="text-[#661223]/80 text-sm sm:text-base leading-relaxed max-w-md mb-8 font-sans">
            Your personal tactile knowledge vault. Capture fleeting thoughts, key takeaways, and serendipitous connections—stored securely with your Google account.
          </p>

          {/* Value highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-md mb-8 text-left">
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0] shadow-2xs">
              <Shield className="w-4 h-4 text-[#BA1B35] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-serif font-bold text-[#561320] block">Private & Isolated</span>
                <span className="text-[#661223]/70 font-sans">Enforced per-user in Firestore</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0] shadow-2xs">
              <BookmarkCheck className="w-4 h-4 text-[#BA1B35] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-serif font-bold text-[#561320] block">Summaries & Tags</span>
                <span className="text-[#661223]/70 font-sans">Synthesized via Gemini AI</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="w-full mb-4 p-3 text-xs rounded-xl bg-[#FFF6F7] text-[#BA1B35] border border-[#F2A9B6]">
              {errorMsg}
            </div>
          )}

          <button
            id="google-signin-btn"
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full sm:w-auto min-w-[250px] inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl font-serif font-bold text-sm sm:text-base text-[#FCFAF7] bg-[#BA1B35] hover:bg-[#9C182F] shadow-scrapbook active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-60 cursor-pointer border border-[#8E162B]"
          >
            {signingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#FDECEF]" />
                <span>Opening vault...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 opacity-75" />
              </>
            )}
          </button>

          <div className="mt-4 flex items-center gap-1 text-[11px] text-[#BA1B35]/65 font-mono">
            <DoodleSparkle className="w-3 h-3 text-[#BA1B35]/50" />
            <span>Encrypted & private session</span>
          </div>
        </div>
      </div>
    </div>
  );
};

