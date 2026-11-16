import React, { useState } from 'react';
import {
  ExternalLink,
  Github,
  Network,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  GitCommit,
} from 'lucide-react';
import { PortfolioEntryItem } from '../api/client';

function timeAgo(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'recently';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatCommitSha(sha: string | undefined): string | null {
  if (!sha) return null;
  // If it's a real git commit hash (alphanumeric 0-9, a-f)
  if (/^[0-9a-f]{7,40}$/i.test(sha)) {
    return sha.substring(0, 7);
  }
  // If it's a seed or placeholder (e.g. seed_init_sha), omit the technical placeholder
  if (sha.includes('seed') || sha.includes('init') || sha.includes('head')) {
    return null;
  }
  return sha.substring(0, 7);
}

interface Props {
  entry: PortfolioEntryItem;
  index: number;
  onSelect: (entry: PortfolioEntryItem) => void;
  onTagSelect?: (tag: string) => void;
}

export const ProjectTunnel: React.FC<Props> = ({ entry, index, onSelect, onTagSelect }) => {
  const [isLocked, setIsLocked] = useState(false);
  const isLab = entry.entryType === 'lab_collection' || entry.practicalLabs?.length > 0;
  const hasPushUpdate = entry.contentVersion > 1 || (entry.recentPushUpdates && entry.recentPushUpdates.length > 0);

  // Category specific accent colors
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Networking Labs':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
          glow: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
          border: 'group-hover:border-emerald-500/40',
          indicator: 'bg-emerald-400',
        };
      case 'Cybersecurity Projects':
        return {
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
          glow: 'from-purple-500/15 via-purple-500/5 to-transparent',
          border: 'group-hover:border-purple-500/40',
          indicator: 'bg-purple-400',
        };
      case 'Cloud Projects':
        return {
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
          glow: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
          border: 'group-hover:border-cyan-500/40',
          indicator: 'bg-cyan-400',
        };
      case 'Web Development':
        return {
          badge: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
          glow: 'from-sky-500/15 via-sky-500/5 to-transparent',
          border: 'group-hover:border-sky-500/40',
          indicator: 'bg-sky-400',
        };
      default:
        return {
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          glow: 'from-slate-500/15 via-slate-500/5 to-transparent',
          border: 'group-hover:border-slate-600',
          indicator: 'bg-slate-400',
        };
    }
  };

  const theme = getCategoryTheme(entry.primaryCategory);
  const sequenceNumber = String(index + 1).padStart(2, '0');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsLocked((prev) => !prev);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isLocked}
      aria-label={`Project: ${entry.title}. Category: ${entry.primaryCategory}. Click or press Enter to inspect full specifications.`}
      onClick={() => setIsLocked((prev) => !prev)}
      onKeyDown={handleKeyDown}
      className={`group relative w-full rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-slate-900/65 backdrop-blur-xl shadow-lg transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-sky-500/5 hover:bg-slate-900/90 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
        theme.border
      } ${isLocked ? 'border-sky-500/40 bg-slate-900/95 ring-1 ring-sky-500/30' : ''}`}
    >
      {/* Tunnel Depth Backlight */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${theme.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
      />

      {/* Subtle Longitudinal Tunnel Edge Highlights */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700/60 to-transparent group-hover:via-sky-400/40 transition-all pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-800/60 to-transparent pointer-events-none" />

      {/* =========================================================================
          RESTING / COLLAPSED TUNNEL BAR (Always Visible)
          Contains: Sequence #, Belonging Category, Project Title, and Live Demo
         ========================================================================= */}
      <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-6 flex-wrap sm:flex-nowrap">
        {/* Left Section: Sequence Hub + Category Badge + Project Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Sequence Number Pill / Tunnel Aperture */}
          <div className="flex items-center justify-center shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 group-hover:text-white group-hover:border-sky-500/40 group-hover:bg-slate-900 transition-all font-mono font-bold text-xs shadow-inner">
            <span>{sequenceNumber}</span>
          </div>

          {/* Project Belonging Category Badge */}
          <span
            className={`shrink-0 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold border ${theme.badge} shadow-sm`}
          >
            {entry.primaryCategory}
          </span>

          {/* Push Updated micro-indicator */}
          {hasPushUpdate && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Zap className="w-2.5 h-2.5" /> Updated
            </span>
          )}

          {/* Live GitHub Sync Indicator */}
          <div className="hidden lg:inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>Synced via GitHub Webhook</span>
            <span className="text-slate-400">• Updated {timeAgo(entry.updatedAt)}</span>
            {formatCommitSha(entry.lastAnalysedCommitSha) && (
              <span className="text-sky-300">({formatCommitSha(entry.lastAnalysedCommitSha)})</span>
            )}
          </div>

          {/* Project Title */}
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors truncate">
            {entry.title}
          </h3>
        </div>

        {/* Right Section: Live Demo Link + Expand Indicator */}
        <div
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto sm:ml-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Live Demo Link (Only shown when actual verified URL exists and is not a placeholder) */}
          {entry.demoUrl && !entry.demoUrl.includes('example.com') && entry.demoUrl.startsWith('http') && (
            <a
              href={entry.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 shadow-sm shrink-0"
              title="Open Live Demonstration"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Demo</span>
            </a>
          )}

          {/* Expand Chevron Icon (Smoothly Rotates on Hover) */}
          <div
            className={`p-1.5 rounded-full bg-slate-800/60 text-slate-400 group-hover:text-sky-400 group-hover:bg-slate-800 transition-all duration-300 ${
              isLocked ? 'rotate-180 text-sky-400' : 'group-hover:rotate-180'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          EXPANDABLE TUNNEL INTERIOR (Revealed On Hover / Click)
          Reveals: Overview details, verified modules, tech pills, Code, and Explore Details
         ========================================================================= */}
      <div
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLocked
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-slate-800/60 relative z-10">
            {/* Project Overview */}
            <p className="text-sm text-slate-300 leading-relaxed mt-3 mb-4 max-w-4xl">
              {entry.overview}
            </p>

            {/* Verified Existing Work & Practical Labs Highlights */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {/* Live GitHub Webhook Sync Pill (visible on all screens inside) */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Synced via GitHub Webhook</span>
                <span className="text-slate-400">• Updated {timeAgo(entry.updatedAt)}</span>
                {formatCommitSha(entry.lastAnalysedCommitSha) && (
                  <span className="text-sky-300 font-semibold">({formatCommitSha(entry.lastAnalysedCommitSha)})</span>
                )}
              </div>

              {entry.existingModules && entry.existingModules.length > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white font-medium">{entry.existingModules.length}</strong> verified modules (
                    {entry.existingModules.slice(0, 2).join(', ')}
                    {entry.existingModules.length > 2 ? '...' : ''})
                  </span>
                </div>
              ) : isLab && entry.practicalLabs && entry.practicalLabs.length > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                  <Network className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-medium text-slate-200">
                    {entry.practicalLabs.length} Practical Network Labs Verified
                  </span>
                </div>
              ) : null}

              {entry.isFeatured && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                  <Sparkles className="w-3 h-3" /> Featured Project
                </span>
              )}

              <span className="text-[11px] font-mono text-slate-500">
                v{entry.contentVersion} • Commit Grounded
              </span>
            </div>

            {/* Technologies Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              <span className="text-xs text-slate-400 mr-1 font-medium">Stack:</span>
              {entry.technologies.map((tech, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagSelect?.(tech);
                  }}
                  className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-sky-500/20 hover:text-sky-300 hover:border-sky-500/40 transition-colors cursor-pointer"
                  title={`Filter by ${tech}`}
                >
                  {tech}
                </button>
              ))}
            </div>

            {/* Hovered Action Buttons: Git Source Code + Explore Details */}
            <div
              className="pt-3 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                {/* Git Source Code Link */}
                <a
                  href={entry.sourceRepoHtmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 transition-all flex items-center gap-2 border border-slate-700/70 shadow-sm"
                >
                  <Github className="w-4 h-4" />
                  <span>Code Repository</span>
                </a>

                {/* Live Demo Link (only shown when actual verified URL exists) */}
                {entry.demoUrl && !entry.demoUrl.includes('example.com') && entry.demoUrl.startsWith('http') && (
                  <a
                    href={entry.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-500/15 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 border border-emerald-500/30 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Live Implementation</span>
                  </a>
                )}
              </div>

              {/* Full Explore Details Modal Button */}
              <button
                onClick={() => onSelect(entry)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/20 group/btn"
              >
                <span>Explore Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
