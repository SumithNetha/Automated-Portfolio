import React from 'react';
import { X, ExternalLink, Github, CheckCircle2, Network, Cpu, FileCode2, Layers, ShieldCheck, Zap, History, Clock } from 'lucide-react';
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
        className="fixed inset-0 bg-[#141413]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#FAF9F5] border border-[#E5E2DC] rounded-xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col text-[#141413]">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E2DC] flex items-start justify-between bg-[#FAF9F5] sticky top-0 z-20">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-[#F3F1EC] text-[#141413] font-semibold border border-[#E5E2DC]">
                {entry.primaryCategory}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Evidence
              </span>
              <span className="text-[#85837D]">
                v{entry.contentVersion} •{' '}
                {entry.sourceRepoHtmlUrl && entry.lastAnalysedCommitSha ? (
                  <a
                    href={`${entry.sourceRepoHtmlUrl}/commit/${entry.lastAnalysedCommitSha}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1E40AF] hover:underline underline-offset-2 transition-colors"
                    title="View analyzed commit on GitHub"
                  >
                    Commit {entry.lastAnalysedCommitSha.substring(0, 7)}
                  </a>
                ) : (
                  `Commit ${entry.lastAnalysedCommitSha.substring(0, 7)}`
                )}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#141413] tracking-tight">{entry.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-[#52514E] hover:text-[#141413] hover:bg-[#F3F1EC] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#52514E]">
          {/* Overview */}
          <div className="bg-[#F3F1EC] p-5 rounded-lg border border-[#E5E2DC]">
            <h3 className="text-xs font-mono font-semibold text-[#85837D] uppercase tracking-wider mb-2">
              Problem & System Overview
            </h3>
            <p className="text-[#141413] leading-relaxed text-base font-normal">{entry.overview}</p>
          </div>

          {/* What Currently Exists in Repository */}
          {entry.existingModules && entry.existingModules.length > 0 && (
            <div className="p-5 rounded-lg bg-[#FAF9F5] border border-[#E5E2DC]">
              <div className="flex items-center gap-2 text-[#141413] mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider">
                  Verified Repository Content & Subsystems
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {entry.existingModules.map((mod, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded bg-[#F3F1EC] border border-[#E5E2DC]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                    <span className="text-[#141413]">{mod}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Push Updates */}
          {entry.recentPushUpdates && entry.recentPushUpdates.length > 0 && (
            <div className="p-5 rounded-lg bg-emerald-50/50 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-900 mb-3 font-mono">
                <Zap className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Recent Push Updates & Continuous Refinement
                </h3>
              </div>
              <div className="space-y-2">
                {entry.recentPushUpdates.map((update, idx) => (
                  <div key={idx} className="p-3 rounded bg-white border border-emerald-200 text-xs">
                    <div className="flex items-center justify-between text-[#85837D] mb-1 font-mono text-[11px]">
                      <span className="text-[#1E40AF] font-semibold">Commit: {update.commitSha}</span>
                      <span>{new Date(update.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[#141413] font-medium mb-0.5">{update.message}</div>
                    <div className="text-[#52514E] text-[11px]">{update.addedInfo}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Description */}
          <div>
            <h3 className="text-xs font-mono font-semibold text-[#85837D] uppercase tracking-wider mb-2">
              Technical Implementation Details
            </h3>
            <p className="text-[#52514E] leading-relaxed whitespace-pre-line text-sm">
              {entry.detailedDescription}
            </p>
          </div>

          {/* Practical Labs Section */}
          {entry.practicalLabs && entry.practicalLabs.length > 0 && (
            <div className="border border-[#E5E2DC] bg-[#F3F1EC] rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4 text-[#141413]">
                <Network className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider">
                  Practical Lab Topologies & Configurations
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entry.practicalLabs.map((lab, i) => (
                  <div
                    key={i}
                    className="p-4 rounded bg-white border border-[#E5E2DC] transition-colors"
                  >
                    <h4 className="font-semibold text-[#141413] text-sm mb-2">{lab.title}</h4>
                    <div className="flex flex-wrap gap-1.5 mb-3 font-mono">
                      {lab.topics.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] bg-[#F3F1EC] text-[#52514E]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {lab.evidenceFiles && lab.evidenceFiles.length > 0 && (
                      <div className="text-[11px] text-[#85837D] space-y-1">
                        <span className="font-medium text-[#141413] flex items-center gap-1 font-mono">
                          <FileCode2 className="w-3 h-3 text-[#1E40AF]" /> Evidence Files:
                        </span>
                        <div className="font-mono text-[#52514E] pl-4 space-y-1 truncate">
                          {lab.evidenceFiles.slice(0, 4).map((f, fIdx) => {
                            const cleanPath = f.replace(/^\/+/, '');
                            const githubFileUrl = entry.sourceRepoHtmlUrl
                              ? `${entry.sourceRepoHtmlUrl}/blob/${entry.lastAnalysedCommitSha || 'main'}/${cleanPath}`
                              : null;

                            return (
                              <div key={fIdx} className="truncate">
                                {githubFileUrl ? (
                                  <a
                                    href={githubFileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#1E40AF] hover:underline transition-colors inline-flex items-center gap-1.5 group max-w-full truncate"
                                    title={`View ${cleanPath} on GitHub`}
                                  >
                                    <span className="truncate">• {cleanPath}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
                                  </a>
                                ) : (
                                  <span>• {cleanPath}</span>
                                )}
                              </div>
                            );
                          })}
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
              <h3 className="text-xs font-mono font-semibold text-[#85837D] uppercase tracking-wider mb-3">
                Key Verified Capabilities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entry.features.map((feat, idx) => {
                  const cleanEvidence = feat.evidenceFile?.replace(/^\/+/, '');
                  const featGithubUrl =
                    cleanEvidence && entry.sourceRepoHtmlUrl
                      ? `${entry.sourceRepoHtmlUrl}/blob/${entry.lastAnalysedCommitSha || 'main'}/${cleanEvidence}`
                      : null;

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded bg-[#F3F1EC] border border-[#E5E2DC]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[#141413] font-medium text-xs">{feat.name}</div>
                        {feat.evidenceFile && (
                          <div className="mt-1">
                            {featGithubUrl ? (
                              <a
                                href={featGithubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-mono text-[#1E40AF] hover:underline transition-colors truncate max-w-xs inline-flex items-center gap-1 group"
                                title={`Inspect evidence in ${cleanEvidence}`}
                              >
                                <span className="truncate">{cleanEvidence}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100 shrink-0" />
                              </a>
                            ) : (
                              <div className="text-[11px] font-mono text-[#85837D] truncate max-w-xs">
                                {feat.evidenceFile}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Architecture Summary */}
          {entry.architectureSummary && (
            <div className="p-4 rounded-lg bg-[#F3F1EC] border border-[#E5E2DC]">
              <div className="flex items-center gap-2 mb-2 text-[#141413]">
                <Layers className="w-4 h-4 text-[#1E40AF]" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider">
                  Architecture & System Topology
                </h3>
              </div>
              <p className="text-xs font-mono text-[#52514E] leading-relaxed">
                {entry.architectureSummary}
              </p>
            </div>
          )}

          {/* Demonstrated Contributions */}
          {entry.demonstratedContributions && entry.demonstratedContributions.length > 0 && (
            <div>
              <h3 className="text-xs font-mono font-semibold text-[#85837D] uppercase tracking-wider mb-2">
                Demonstrated Engineering Contributions
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-[#52514E] pl-1 font-normal">
                {entry.demonstratedContributions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Technologies */}
          <div>
            <h3 className="text-xs font-mono font-semibold text-[#85837D] uppercase tracking-wider mb-2">
              Technology Stack
            </h3>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {entry.technologies.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded bg-[#F3F1EC] text-[#141413] border border-[#E5E2DC]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#E5E2DC] bg-[#F3F1EC] flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs font-mono text-[#85837D]">
            Repository: <code className="text-[#141413]">{entry.sourceRepoFullName}</code>
          </span>
          <div className="flex items-center gap-3">
            {entry.demoUrl && !entry.demoUrl.includes('example.com') && entry.demoUrl.startsWith('http') && (
              <a
                href={entry.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded text-xs font-mono font-semibold bg-emerald-700 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Live Demo
              </a>
            )}
            <a
              href={entry.sourceRepoHtmlUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded text-xs font-mono font-semibold bg-[#141413] text-[#FAF9F5] hover:bg-[#2A2A28] transition-colors flex items-center gap-1.5"
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
