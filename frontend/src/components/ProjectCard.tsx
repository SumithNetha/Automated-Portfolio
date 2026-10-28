import React from 'react';
import { ExternalLink, Github, Network, Layers, Sparkles, ArrowRight, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { PortfolioEntryItem } from '../api/client';

interface Props {
  entry: PortfolioEntryItem;
  onSelect: (entry: PortfolioEntryItem) => void;
}

export const ProjectCard: React.FC<Props> = ({ entry, onSelect }) => {
  const isLab = entry.entryType === 'lab_collection' || entry.practicalLabs?.length > 0;
  const hasPushUpdate = entry.contentVersion > 1 || (entry.recentPushUpdates && entry.recentPushUpdates.length > 0);

  // Category specific styling accents
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Networking Labs':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Cybersecurity Projects':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Cloud Projects':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Web Development':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden">
      {/* Decorative gradient glow at top corner */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />

      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(entry.primaryCategory)}`}>
              {entry.primaryCategory}
            </span>
            {hasPushUpdate && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                <Zap className="w-3 h-3 text-emerald-400" /> Push Updated
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            {entry.isFeatured && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Sparkles className="w-3 h-3" /> Featured
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">v{entry.contentVersion}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(entry)}
          className="text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors cursor-pointer mb-2 line-clamp-2"
        >
          {entry.title}
        </h3>

        {/* Overview */}
        <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 mb-4">
          {entry.overview}
        </p>

        {/* What is Currently Existing in Repository */}
        {entry.existingModules && entry.existingModules.length > 0 ? (
          <div className="mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Existing Verified Work:</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1">
              {entry.existingModules.slice(0, 3).map((mod, i) => (
                <li key={i} className="truncate flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-sky-400 shrink-0" />
                  <span className="truncate">{mod}</span>
                </li>
              ))}
              {entry.existingModules.length > 3 && (
                <li className="text-[11px] text-slate-400 font-medium pl-2.5">
                  +{entry.existingModules.length - 3} more verified modules
                </li>
              )}
            </ul>
          </div>
        ) : isLab && entry.practicalLabs && entry.practicalLabs.length > 0 ? (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
            <Network className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-slate-200">
              {entry.practicalLabs.length} Practical Network Labs Verified
            </span>
          </div>
        ) : null}

        {/* Technologies Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {entry.technologies.slice(0, 4).map((tech, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60"
            >
              {tech}
            </span>
          ))}
          {entry.technologies.length > 4 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800/40">
              +{entry.technologies.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <a
          href={entry.sourceRepoHtmlUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Github className="w-4 h-4" />
          <span>Code</span>
        </a>

        <button
          onClick={() => onSelect(entry)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white transition-all flex items-center gap-1 group/btn"
        >
          <span>Explore Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
