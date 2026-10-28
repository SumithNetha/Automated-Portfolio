import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GitBranch, Shield, Terminal, User, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-sky-400 transition-colors">
                DevPortfolio
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Auto-curated & evidence-driven from GitHub
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-4 text-sm font-medium">
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
            </>
          ) : (
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Portfolio
            </Link>
          )}

          {/* Admin link */}
          <Link
            to={isAuthenticated ? '/admin' : '/login'}
            className="ml-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white hover:border-sky-500/50 hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-semibold">{isAuthenticated ? 'Admin Dashboard' : 'Admin'}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
