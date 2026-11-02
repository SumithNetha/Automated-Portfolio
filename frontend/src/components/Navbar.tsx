import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GitBranch, Shield, Terminal, User, ExternalLink, FileText, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group" aria-label="Sumith Mittapelli Portfolio Home">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sky-400 group-hover:border-sky-500/50 transition-colors shadow-sm">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-sky-400 transition-colors">
                Sumith Mittapelli
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Software, Cloud & Network Systems Engineer
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-4 text-sm font-medium">
          {!isAdmin ? (
            <>
              <a
                href="#projects"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                Projects
              </a>
              <a
                href="#labs"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                Networking Labs
              </a>
              <a
                href="#skills"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors hidden md:block"
              >
                Skills & Tech
              </a>
              <a
                href="#about"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors hidden sm:block"
              >
                About
              </a>
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
                <a
                  href="/resume.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5"
                  title="Preview interactive resume"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Resume</span>
                </a>
                <a
                  href="/resume.pdf"
                  download="Sumith_Mittapelli_Resume.pdf"
                  className="px-2 py-1 rounded-md text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-all flex items-center gap-1 border-l border-slate-800 pl-1.5"
                  title="Download Resume PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </a>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="px-3 py-1.5 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Portfolio
              </Link>
              {isAuthenticated && (
                <div className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center gap-1.5 text-xs font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Mode</span>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
