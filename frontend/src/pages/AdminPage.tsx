import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  BookOpen,
  AlertTriangle,
  Activity,
  UserCheck,
  RotateCw,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Save,
  Lock,
  LogOut,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, PortfolioEntryItem } from '../api/client';

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'repos' | 'portfolio' | 'review' | 'jobs' | 'profile'>('overview');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [monitoredRepos, setMonitoredRepos] = useState<any[]>([]);
  const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntryItem[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const [editingEntry, setEditingEntry] = useState<PortfolioEntryItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const loadData = async () => {
    try {
      const [statsRes, reposRes, entriesRes, jobsRes, profRes] = await Promise.all([
        api.getDashboardStats(),
        api.getMonitoredRepos(),
        api.getAdminPortfolio(),
        api.getJobs(),
        api.getAdminProfile(),
      ]);

      if (statsRes.success) setDashboardStats(statsRes.data);
      if (reposRes.success) setMonitoredRepos(reposRes.data);
      if (entriesRes.success) setPortfolioEntries(entriesRes.data);
      if (jobsRes.success) setJobs(jobsRes.data);
      if (profRes.success) setAdminProfile(profRes.data);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      // Poll jobs & stats periodically
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleToggleMonitoring = async (repo: any) => {
    try {
      const newStatus = !repo.isMonitored;
      const res = await api.toggleMonitorRepo({
        githubRepoId: repo.id,
        fullName: repo.fullName,
        name: repo.name,
        owner: repo.owner,
        htmlUrl: repo.htmlUrl,
        isPrivate: repo.isPrivate,
        defaultBranch: repo.defaultBranch,
        isMonitored: newStatus,
        primaryCategory: repo.primaryCategory,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: newStatus
            ? `Monitoring enabled for ${repo.fullName}`
            : `Monitoring disabled for ${repo.fullName}`,
        });
        await loadData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleTriggerSync = async (repoId: string, fullName: string) => {
    try {
      const res = await api.triggerSyncRepo(repoId);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Re-analysis job (${res.jobId}) scheduled for ${fullName}`,
        });
        await loadData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleApproveEntry = async (id: string, title: string) => {
    try {
      const res = await api.approvePortfolioEntry(id);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Approved and published "${title}"` });
        await loadData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveEntryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    setIsUpdating(true);
    try {
      const res = await api.updatePortfolioEntry(editingEntry._id, {
        title: editingEntry.title,
        overview: editingEntry.overview,
        detailedDescription: editingEntry.detailedDescription,
        primaryCategory: editingEntry.primaryCategory,
        publicationStatus: editingEntry.publicationStatus,
        isFeatured: editingEntry.isFeatured,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Entry updated. Manual override lock preserved for owner edits.`,
        });
        setEditingEntry(null);
        await loadData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const res = await api.retryJob(jobId);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Job ${jobId} scheduled for retry.` });
        await loadData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteEntry = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the portfolio entry "${title}"?`)) {
      return;
    }
    try {
      const res = await api.deletePortfolioEntry(id);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Entry "${title}" deleted successfully.` });
        await loadData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteRepo = async (dbId: string, fullName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove repository "${fullName}" and delete all its associated portfolio entries?`
      )
    ) {
      return;
    }
    try {
      const res = await api.deleteRepository(dbId);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Repository "${fullName}" and portfolio data removed.` });
        await loadData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;

    try {
      const res = await api.updateAdminProfile(adminProfile);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Profile and publication policies updated.' });
        await loadData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const reviewEntries = portfolioEntries.filter(
    (e) => e.publicationStatus === 'needs_review' || e.sensitiveContentBlocked
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Top Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Console</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Single Owner
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <code className="text-slate-300">{user?.email}</code> • Background pipeline active
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadData();
                setStatusMessage({ type: 'success', text: 'Dashboard refreshed.' });
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
              title="Refresh Data"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => logout().then(() => navigate('/'))}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 text-xs font-semibold border border-rose-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div
            className={`p-3 rounded-xl flex items-center justify-between text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'repos', label: 'GitHub Repositories', icon: GitBranch, badge: monitoredRepos.filter((r) => r.isMonitored).length },
            { id: 'portfolio', label: 'Portfolio Entries', icon: BookOpen, badge: portfolioEntries.length },
            { id: 'review', label: 'Review Queue', icon: AlertTriangle, badge: reviewEntries.length, badgeColor: 'bg-amber-500/20 text-amber-300' },
            { id: 'jobs', label: 'Processing Jobs', icon: Activity },
            { id: 'profile', label: 'Profile & Policies', icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      tab.badgeColor || (isActive ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-medium text-slate-400 mb-1">Monitored Repos</div>
                <div className="text-2xl font-bold text-white">{dashboardStats?.monitoredCount ?? 0}</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-medium text-slate-400 mb-1">Published Entries</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {dashboardStats?.publishedCount ?? 0}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-medium text-slate-400 mb-1">Pending Review</div>
                <div className="text-2xl font-bold text-amber-400">
                  {dashboardStats?.reviewCount ?? 0}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-medium text-slate-400 mb-1">Active Jobs</div>
                <div className="text-2xl font-bold text-sky-400">
                  {dashboardStats?.activeJobsCount ?? 0}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-medium text-slate-400 mb-1">Failed Jobs</div>
                <div className="text-2xl font-bold text-rose-400">
                  {dashboardStats?.failedJobsCount ?? 0}
                </div>
              </div>
            </div>

            {/* Recent Push Deliveries */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                Recent GitHub Webhook Push Events
              </h2>
              {dashboardStats?.recentPushes?.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No webhook deliveries received yet. Push a commit to any monitored repository to see real-time updates.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="pb-3">Delivery ID</th>
                        <th className="pb-3">Repository</th>
                        <th className="pb-3">Commit SHA</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {dashboardStats?.recentPushes?.map((p: any) => (
                        <tr key={p._id}>
                          <td className="py-3 font-mono text-slate-400">{p.deliveryId}</td>
                          <td className="py-3 font-medium text-white">{p.repoFullName}</td>
                          <td className="py-3 font-mono text-sky-400">{p.commitSha.substring(0, 7)}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                p.status === 'accepted'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">
                            {new Date(p.receivedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GITHUB REPOSITORIES TAB */}
        {activeTab === 'repos' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Authorized GitHub Repositories</h2>
                <p className="text-xs text-slate-400">
                  Select which repositories the automatic portfolio pipeline monitors. Only authorized repositories are processed.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {monitoredRepos.map((repo) => (
                <div
                  key={repo.id}
                  className={`p-5 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    repo.isMonitored
                      ? 'bg-slate-900/80 border-sky-500/30'
                      : 'bg-slate-950/40 border-slate-800 opacity-75'
                  }`}
                >
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="font-bold text-white text-base">{repo.fullName}</span>
                      {repo.isPrivate ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Private
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          Public
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {repo.primaryCategory}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-2">{repo.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>Branch: {repo.defaultBranch}</span>
                      {repo.lastProcessedCommitSha && (
                        <span>Last Commit: {repo.lastProcessedCommitSha.substring(0, 7)}</span>
                      )}
                      <span>Status: {repo.lastAnalysisStatus}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {repo.isMonitored && repo.dbId && (
                      <button
                        onClick={() => handleTriggerSync(repo.dbId, repo.fullName)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 border border-slate-700"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        Re-Analyze
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleMonitoring(repo)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        repo.isMonitored
                          ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20'
                          : 'bg-sky-500 text-white hover:bg-sky-400 shadow-md shadow-sky-500/20'
                      }`}
                    >
                      {repo.isMonitored ? 'Disable Monitoring' : 'Monitor Repository'}
                    </button>

                    {repo.dbId && (
                      <button
                        onClick={() => handleDeleteRepo(repo.dbId, repo.fullName)}
                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700 transition-colors"
                        title="Delete Repository and Portfolio Content"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PORTFOLIO ENTRIES TAB */}
        {activeTab === 'portfolio' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Portfolio Content Management</h2>
                <p className="text-xs text-slate-400">
                  Review generated project descriptions, toggle visibility, and customize titles without AI overwriting your manual changes.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-3">Title & Category</th>
                    <th className="pb-3">Source Repository</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Overrides</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {portfolioEntries.map((entry) => (
                    <tr key={entry._id}>
                      <td className="py-4">
                        <div className="font-bold text-white text-sm">{entry.title}</div>
                        <span className="text-[11px] text-sky-400">{entry.primaryCategory}</span>
                      </td>
                      <td className="py-4 font-mono text-slate-400">{entry.sourceRepoFullName}</td>
                      <td className="py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            entry.publicationStatus === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : entry.publicationStatus === 'needs_review'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {entry.publicationStatus}
                        </span>
                      </td>
                      <td className="py-4">
                        {entry.manualOverrides &&
                        Object.values(entry.manualOverrides).some(Boolean) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">AI-Managed</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-xs font-semibold border border-slate-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry._id, entry.title)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700 transition-colors"
                            title="Delete Portfolio Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEW QUEUE TAB */}
        {activeTab === 'review' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-2">Review & Safety Queue</h2>
            <p className="text-xs text-slate-400 mb-6">
              Entries flagged due to sensitive pattern alerts, private repository policy, or classification uncertainty.
            </p>

            {reviewEntries.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">All clear! No items awaiting review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewEntries.map((item) => (
                  <div key={item._id} className="p-5 rounded-xl bg-slate-950/60 border border-amber-500/30">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-base">{item.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                            {item.publicationStatus}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400">{item.sourceRepoFullName}</div>
                      </div>

                      <button
                        onClick={() => handleApproveEntry(item._id, item.title)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Publish
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 mb-3">{item.overview}</p>

                    {item.sensitiveWarnings && item.sensitiveWarnings.length > 0 && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-rose-400">
                          <ShieldAlert className="w-4 h-4" />
                          Sensitive Pattern Flags (Redacted):
                        </div>
                        {item.sensitiveWarnings.map((w, idx) => (
                          <div key={idx} className="font-mono text-[11px] pl-5">
                            • {w}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROCESSING JOBS TAB */}
        {activeTab === 'jobs' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-2">Asynchronous Pipeline Jobs</h2>
            <p className="text-xs text-slate-400 mb-6">
              Track webhook push tasks, initial analyses, and retry failed operations.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-3">Job ID</th>
                    <th className="pb-3">Trigger</th>
                    <th className="pb-3">Repository</th>
                    <th className="pb-3">Commit</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td className="py-3 font-mono text-slate-400">{job.jobId}</td>
                      <td className="py-3 font-medium text-slate-200">{job.triggerType}</td>
                      <td className="py-3 font-medium text-white">{job.repoFullName}</td>
                      <td className="py-3 font-mono text-sky-400">{job.commitSha?.substring(0, 7)}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            job.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : job.status === 'processing'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse'
                              : job.status === 'failed'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetryJob(job.jobId)}
                            className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs font-semibold"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROFILE & POLICIES TAB */}
        {activeTab === 'profile' && adminProfile && (
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <h2 className="text-lg font-bold text-white mb-2">Owner Profile & Publication Rules</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={adminProfile.ownerName || ''}
                  onChange={(e) => setAdminProfile({ ...adminProfile, ownerName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Headline</label>
                <input
                  type="text"
                  value={adminProfile.headline || ''}
                  onChange={(e) => setAdminProfile({ ...adminProfile, headline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Public Biography</label>
              <textarea
                rows={3}
                value={adminProfile.bio || ''}
                onChange={(e) => setAdminProfile({ ...adminProfile, bio: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Username</label>
                <input
                  type="text"
                  value={adminProfile.githubUsername || ''}
                  onChange={(e) => setAdminProfile({ ...adminProfile, githubUsername: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={adminProfile.email || ''}
                  onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={adminProfile.linkedinUrl || ''}
                  onChange={(e) => setAdminProfile({ ...adminProfile, linkedinUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
              </div>
            </div>

            {/* Publication Policies */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Publication Safeguard Policies</h3>

              <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminProfile.publicationSettings?.autoPublishConfident ?? true}
                  onChange={(e) =>
                    setAdminProfile({
                      ...adminProfile,
                      publicationSettings: {
                        ...adminProfile.publicationSettings,
                        autoPublishConfident: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span>Automatically publish confident, evidence-verified updates to public portfolio</span>
              </label>

              <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminProfile.publicationSettings?.blockPrivateByDefault ?? true}
                  onChange={(e) =>
                    setAdminProfile({
                      ...adminProfile,
                      publicationSettings: {
                        ...adminProfile.publicationSettings,
                        blockPrivateByDefault: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span>Never auto-publish private repository content (send to review queue)</span>
              </label>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-xs hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </form>
        )}
      </div>

      {/* Entry Editor Modal with Manual Override Protections */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setEditingEntry(null)} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Portfolio Entry</h3>
                <p className="text-xs text-sky-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Manual override protection will preserve your edits
                </p>
              </div>
              <button onClick={() => setEditingEntry(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntryEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Project Title</label>
                <input
                  type="text"
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Short Overview</label>
                <textarea
                  rows={2}
                  value={editingEntry.overview}
                  onChange={(e) => setEditingEntry({ ...editingEntry, overview: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  value={editingEntry.detailedDescription}
                  onChange={(e) => setEditingEntry({ ...editingEntry, detailedDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingEntry.primaryCategory}
                    onChange={(e) => setEditingEntry({ ...editingEntry, primaryCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Publication Status</label>
                  <select
                    value={editingEntry.publicationStatus}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, publicationStatus: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={editingEntry.isFeatured}
                  onChange={(e) => setEditingEntry({ ...editingEntry, isFeatured: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500"
                />
                <span>Pin as Featured Project</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-400 transition-colors shadow-md shadow-sky-500/20"
                >
                  {isUpdating ? 'Saving...' : 'Save & Lock Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
