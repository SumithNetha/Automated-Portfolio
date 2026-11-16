import React from 'react';
import { GitBranch, Shield, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#E5E2DC] bg-[#F3F1EC] py-12 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#141413] text-[#FAF9F5] flex items-center justify-center font-mono text-xs font-bold">
            SM
          </div>
          <div>
            <div className="text-sm font-semibold text-[#141413] tracking-tight">
              Sumith Mittapelli — Engineering Portfolio
            </div>
            <p className="text-xs font-mono text-[#85837D]">
              Automated repository pipeline • Continuous GitHub verification
            </p>
          </div>
        </div>

        {/* Center / Security badge */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#52514E] px-3 py-1.5 rounded-md bg-[#FAF9F5] border border-[#E5E2DC]">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Webhook HMAC Verified • Secret Scanning Active</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4 text-xs font-mono text-[#52514E]">
          <span>Hyderabad, India</span>
          <button
            onClick={scrollToTop}
            className="p-2 rounded-md bg-[#FAF9F5] border border-[#E5E2DC] text-[#141413] hover:bg-[#EAE7E0] transition-colors cursor-pointer"
            title="Back to top"
            aria-label="Back to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
