import React from 'react';
import { GitBranch, Shield, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              AI-Powered Automatic GitHub Portfolio
            </div>
            <p className="text-xs text-slate-400">
              Push-to-portfolio pipeline • Grounded in verified repository evidence
            </p>
          </div>
        </div>

        {/* Center / Security badge */}
        <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Webhook HMAC Verified • Credential Protection Enabled</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Single-Owner Architecture</span>
          <button
            onClick={scrollToTop}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
