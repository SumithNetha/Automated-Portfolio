import React from 'react';
import { X, ExternalLink, Github, CheckCircle2, Network, Cpu, FileCode2, Layers, ShieldCheck } from 'lucide-react';
import { PortfolioEntryItem } from '../api/client';

interface Props {
  entry: PortfolioEntryItem | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<Props> = ({ entry, onClose }) => {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/90 sticky top-0 z-20">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {entry.primaryCategory}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Evidence-Verified
              </span>
              <span className="text-xs text-slate-400">
                v{entry.contentVersion} • Commit {entry.lastAnalysedCommitSha.substring(0, 7)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{entry.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Overview */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Overview
            </h3>
            <p className="text-slate-200 leading-relaxed text-base">{entry.overview}</p>
          </div>

          {/* Detailed Description */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Technical Description
            </h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
              {entry.detailedDescription}
            </p>
          </div>

          {/* Practical Labs Section (for CCNA / Networking) */}
          {entry.practicalLabs && entry.practicalLabs.length > 0 && (
            <div className="border border-sky-900/40 bg-sky-950/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4 text-sky-400">
                <Network className="w-5 h-5" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  Practical Lab Topologies & Configurations
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entry.practicalLabs.map((lab, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-sky-500/30 transition-colors"
                  >
                    <h4 className="font-semibold text-white text-sm mb-2">{lab.title}</h4>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {lab.topics.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {lab.evidenceFiles && lab.evidenceFiles.length > 0 && (
                      <div className="text-[11px] text-slate-400 space-y-1">
                        <span className="font-medium text-slate-400 flex items-center gap-1">
                          <FileCode2 className="w-3 h-3 text-sky-400" /> Evidence Configurations:
                        </span>
                        <div className="font-mono text-slate-300 pl-4 space-y-0.5 truncate">
                          {lab.evidenceFiles.slice(0, 3).map((f, fIdx) => (
                            <div key={fIdx} className="truncate">
                              • {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Implemented */}
          {entry.features && entry.features.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Key Features & Capabilities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entry.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/40 border border-slate-800/60"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-200 font-medium text-xs">{feat.name}</div>
                      {feat.evidenceFile && (
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-xs">
                          {feat.evidenceFile}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture Summary */}
          {entry.architectureSummary && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center gap-2 mb-2 text-slate-300">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Architecture Summary
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {entry.architectureSummary}
              </p>
            </div>
          )}

          {/* Demonstrated Contributions */}
          {entry.demonstratedContributions && entry.demonstratedContributions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Demonstrated Engineering Contributions
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 pl-1">
                {entry.demonstratedContributions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Technologies */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Technologies & Tools
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entry.technologies.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-sky-300 border border-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Source: <code className="font-mono text-slate-300">{entry.sourceRepoFullName}</code>
          </span>
          <div className="flex items-center gap-3">
            {entry.demoUrl && (
              <a
                href={entry.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Live Demo
              </a>
            )}
            <a
              href={entry.sourceRepoHtmlUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 border border-slate-700 shadow-sm"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
