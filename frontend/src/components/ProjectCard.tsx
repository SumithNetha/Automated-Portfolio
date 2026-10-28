import React from 'react';
import { ExternalLink, Github, Network, Layers, Sparkles, ArrowRight } from 'lucide-react';
import { PortfolioEntryItem } from '../api/client';

interface Props {
  entry: PortfolioEntryItem;
  onSelect: (entry: PortfolioEntryItem) => void;
}

export const ProjectCard: React.FC<Props> = ({ entry, onSelect }) => {
  const isLab = entry.entryType === 'lab_collection' || entry.practicalLabs?.length > 0;

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden">
      {/* Decorative gradient glow at top corner */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {entry.primaryCategory}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            {entry.isFeatured && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Sparkles className="w-3 h-3" /> Featured
              </span>
            )}
            <span>v{entry.contentVersion}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(entry)}
          className="text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors cursor-pointer mb-2"
        >
          {entry.title}
        </h3>

        {/* Overview */}
        <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 mb-4">
          {entry.overview}
        </p>

        {/* Lab or Feature Highlight */}
        {isLab && entry.practicalLabs && entry.practicalLabs.length > 0 ? (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
            <Network className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-medium text-slate-200">
              {entry.practicalLabs.length} Practical Network Labs Verified
            </span>
          </div>
        ) : entry.features && entry.features.length > 0 ? (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-slate-200">
              {entry.features.length} Implemented Core Features
            </span>
          </div>
        ) : null}

        {/* Technologies Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {entry.technologies.slice(0, 5).map((tech, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60"
            >
              {tech}
            </span>
          ))}
          {entry.technologies.length > 5 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800/40">
              +{entry.technologies.length - 5}
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
