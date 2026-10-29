const API_BASE = '/api';

export interface PublicProfile {
  ownerName: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  location?: string;
  email?: string;
  githubUsername?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  resumeUrl?: string;
  resumeDownloadUrl?: string;
  resumeFileName?: string;
  resumeUpdatedAt?: string;
  resumeFileSize?: number;
  featuredSkills: string[];
}

export interface PortfolioEntryItem {
  _id: string;
  sourceRepoFullName: string;
  sourceRepoHtmlUrl: string;
  slug: string;
  title: string;
  overview: string;
  detailedDescription: string;
  entryType: 'project' | 'lab_collection' | 'learning_notes' | 'tool' | 'certification';
  primaryCategory: string;
  secondaryCategories: string[];
  technologies: string[];
  features: Array<{ name: string; description?: string; evidenceFile?: string }>;
  practicalLabs: Array<{ title: string; topics: string[]; evidenceFiles: string[] }>;
  existingModules?: string[];
  recentPushUpdates?: Array<{ commitSha: string; message: string; date: string; addedInfo: string }>;
  technicalConcepts: string[];
  architectureSummary?: string;
  demonstratedContributions: string[];
  demoUrl?: string;
  completionStatus: 'completed' | 'in_progress' | 'experimental' | 'archived';
  isFeatured: boolean;
  publicationStatus: 'published' | 'draft' | 'needs_review' | 'archived';
  sensitiveContentBlocked?: boolean;
  sensitiveWarnings?: string[];
  manualOverrides?: Record<string, boolean>;
  lastAnalysedCommitSha: string;
  contentVersion: number;
  lastPublishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  name: string;
  count: number;
}

export interface PublicStats {
  totalProjects: number;
  totalTechnologies: number;
  totalPracticalLabs: number;
}

// Token helper
export function getStoredToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('admin_token', token);
  } else {
    localStorage.removeItem('admin_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Public
  getProfile: () => request<{ success: boolean; data: PublicProfile }>('/public/profile'),
  getEntries: (params: { category?: string; search?: string; type?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.type) query.set('type', params.type);
    return request<{ success: boolean; count: number; data: PortfolioEntryItem[] }>(`/public/entries?${query.toString()}`);
  },
  getEntryBySlug: (slug: string) => request<{ success: boolean; data: PortfolioEntryItem }>(`/public/entries/${slug}`),
  getCategories: () => request<{ success: boolean; data: CategorySummary[] }>('/public/categories'),
  getStats: () => request<{ success: boolean; data: PublicStats }>('/public/stats'),

  // Auth
  login: (email: string, password: string) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  // Admin
  getDashboardStats: () => request<{ success: boolean; data: any }>('/admin/dashboard/stats'),
  getMonitoredRepos: () => request<{ success: boolean; data: any[] }>('/admin/github/repos'),
  toggleMonitorRepo: (payload: any) =>
    request<{ success: boolean; data: any; initialJobId?: string }>('/admin/github/monitor', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  triggerSyncRepo: (repoId: string) =>
    request<{ success: boolean; jobId: string }>('/admin/github/sync/' + repoId, {
      method: 'POST',
    }),
  reconcileRepos: () =>
    request<{ success: boolean; data: any; message: string }>('/admin/github/reconcile', {
      method: 'POST',
    }),
  getAdminPortfolio: (params: { status?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    return request<{ success: boolean; count: number; data: PortfolioEntryItem[] }>(`/admin/portfolio?${query.toString()}`);
  },
  updatePortfolioEntry: (id: string, payload: Partial<PortfolioEntryItem>) =>
    request<{ success: boolean; data: PortfolioEntryItem }>(`/admin/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  approvePortfolioEntry: (id: string) =>
    request<{ success: boolean; data: PortfolioEntryItem }>(`/admin/portfolio/${id}/approve`, {
      method: 'POST',
    }),
  deletePortfolioEntry: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/portfolio/${id}`, {
      method: 'DELETE',
    }),
  deleteRepository: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/repositories/${id}`, {
      method: 'DELETE',
    }),
  getJobs: () => request<{ success: boolean; data: any[] }>('/admin/jobs'),
  retryJob: (jobId: string) => request<{ success: boolean }>('/admin/jobs/' + jobId + '/retry', { method: 'POST' }),
  getAdminProfile: () => request<{ success: boolean; data: any }>('/admin/profile'),
  updateAdminProfile: (payload: any) =>
    request<{ success: boolean; data: any }>('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  uploadResume: (payload: { fileName: string; fileData: string }) =>
    request<{ success: boolean; message: string; data: any }>('/admin/resume/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
