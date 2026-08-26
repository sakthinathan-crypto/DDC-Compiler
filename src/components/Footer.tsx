import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigateToAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToAdmin }) => {
  return (
    <footer
      id="app-footer"
      className="w-full bg-[#08090e] border-t border-slate-800/80 py-8 px-4 mt-auto transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center gap-4">
        {/* Top Titles */}
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-200">
            Designers Domain Club Compiler
          </h3>
          <p className="text-xs font-mono text-amber-400/90 font-medium">
            Breach the Bug • Find it. Fix it. Beat the clock.
          </p>
        </div>

        {/* Middle: Designed by Aegis Branding */}
        <div id="footer-aegis-branding" className="flex flex-col items-center gap-1.5 my-1">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Designed by Aegis
          </span>
          <div className="w-28 sm:w-32 h-10 flex items-center justify-center bg-black/30 rounded-md px-2 py-1 border border-slate-800/60">
            <img
              src="/brand/aegis-logo.svg"
              alt="Aegis Logo"
              className="max-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Admin Portal Link & Copyright */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/60 w-full max-w-md">
          <span>&copy; {new Date().getFullYear()} Designers Domain Club</span>
          <span>•</span>
          {onNavigateToAdmin ? (
            <button
              onClick={onNavigateToAdmin}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500/80" />
              Admin Portal
            </button>
          ) : (
            <a
              href="#admin"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500/80" />
              Admin Portal
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};

