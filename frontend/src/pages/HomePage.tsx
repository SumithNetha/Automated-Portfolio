import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Network,
  Cloud,
  Code2,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Github,
  Mail,
  Linkedin,
  Cpu,
  CheckCircle,
} from 'lucide-react';
import { api, PortfolioEntryItem, PublicProfile, CategorySummary, PublicStats } from '../api/client';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectTunnel } from '../components/ProjectTunnel';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { HeroTechAnimation } from '../components/HeroTechAnimation';

export const HomePage: React.FC = () => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [entries, setEntries] = useState<PortfolioEntryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModalEntry, setActiveModalEntry] = useState<PortfolioEntryItem | null>(null);

  useEffect(() => {
    // Initial fetch of profile, stats, categories
    Promise.all([api.getProfile(), api.getStats(), api.getCategories()])
      .then(([profRes, statsRes, catRes]) => {
        if (profRes.success) setProfile(profRes.data);
        if (statsRes.success) setStats(statsRes.data);
        if (catRes.success) setCategories(catRes.data);
      })
      .catch((err) => console.error('Failed to load metadata:', err));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    api
      .getEntries({ category: selectedCategory, search: searchQuery })
      .then((res) => {
        if (res.success) setEntries(res.data);
      })
      .catch((err) => console.error('Failed to fetch entries:', err))
      .finally(() => setIsLoading(false));
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-900/60 to-slate-950">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7">
              {/* Live Indicator Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-700/80 text-slate-300 mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Evidence-Grounding Pipeline Active</span>
                <span className="text-slate-500">•</span>
                <span className="text-sky-400 font-mono text-[11px]">Git Push → Auto-Curate</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
                Engineering systems,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400">
                  cloud architectures,
                </span>{' '}
                & practical networking.
              </h1>

              {/* Bio */}
              <p className="text-lg text-slate-300 leading-relaxed mb-8">
                {profile?.bio ||
                  'Building verified full-stack applications, distributed cloud services, and Cisco networking laboratories. Every entry is automatically maintained from real commit changes and repository evidence.'}
              </p>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-4 max-w-lg mb-8">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-2xl font-bold text-white mb-0.5">
                    {stats?.totalProjects ?? entries.length}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Projects Curated</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-2xl font-bold text-sky-400 mb-0.5">
                    {stats?.totalPracticalLabs ?? 3}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Verified Labs</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-2xl font-bold text-cyan-400 mb-0.5">
                    {stats?.totalTechnologies ?? 16}+
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Technologies</div>
                </div>
              </div>

              {/* Profile Action Links */}
              <div className="flex flex-wrap items-center gap-3">
                {profile?.githubUsername && (
                  <a
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-semibold border border-slate-700 shadow-sm"
                  >
                    <Github className="w-4 h-4" />
                    GitHub Profile
                  </a>
                )}
                {profile?.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-semibold border border-slate-800 shadow-sm"
                  >
                    <Linkedin className="w-4 h-4 text-sky-400" />
                    LinkedIn
                  </a>
                )}
                {profile?.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="px-4 py-2.5 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors flex items-center gap-2 text-sm font-semibold border border-sky-500/20"
                  >
                    <Mail className="w-4 h-4" />
                    Contact
                  </a>
                )}
              </div>
            </div>

            {/* Right Interactive Cyber Animation Column */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <HeroTechAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Main Portfolio Explorer Section */}
      <section id="projects" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
              Portfolio & Engineering Works
            </h2>
            <p className="text-sm text-slate-400">
              Sequential engineering tunnels • Hover over any tunnel to inspect verified architecture details, tech stack, and source code.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects, labs, tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'All'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>All Works</span>
            {stats && stats.totalProjects > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === 'All' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {stats.totalProjects}
              </span>
            )}
          </button>
          {categories
            .filter((cat) => cat.count > 0)
            .map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedCategory === cat.name ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
        </div>

        {/* Project Sequential Tunnels */}
        {isLoading ? (
          <div className="flex flex-col gap-3.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-16 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Layers className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300 mb-1">
              No portfolio entries found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search criteria or category filter, or connect additional repositories in the admin portal.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {entries.map((entry, idx) => (
              <ProjectTunnel
                key={entry._id}
                entry={entry}
                index={idx}
                onSelect={(selected) => setActiveModalEntry(selected)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Practical Labs Spotlight Section */}
      <section id="labs" className="py-16 bg-slate-900/30 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Networking & CCNA Practical Laboratories
              </h2>
              <p className="text-xs text-slate-400">
                Validated Cisco Packet Tracer, GNS3 topologies, routing protocols, and access control configurations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4 font-mono font-bold text-xs">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                VLAN Segmentation & Trunking
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                802.1Q encapsulation, Native VLAN hardening, Router-on-a-Stick inter-VLAN routing, and VTP domain management.
              </p>
              <div className="flex flex-wrap gap-1">
                {['802.1Q', 'Trunking', 'Inter-VLAN', 'Cisco 2960'].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 font-mono font-bold text-xs">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                OSPFv2 Dynamic Routing Topologies
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Single and multi-area OSPF design, Designated Router (DR/BDR) election, metric cost adjustments, and neighbor adjacency diagnostics.
              </p>
              <div className="flex flex-wrap gap-1">
                {['OSPFv2', 'Area 0', 'DR/BDR', 'Cisco 1941'].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 font-mono font-bold text-xs">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Security ACLs & Overloaded NAT
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Standard and Extended Access Control Lists (ACLs) enforcing strict egress/ingress rules and Port Address Translation (PAT).
              </p>
              <div className="flex flex-wrap gap-1">
                {['Extended ACL', 'NAT / PAT', 'RFC 1918', 'Packet Tracer'].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills & Technologies Section */}
      <section id="skills" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
            Demonstrated Core Competencies
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Practical skills verified across repository source code, deployment scripts, and running configurations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-sky-400 font-semibold text-sm">
              <Code2 className="w-4 h-4" />
              <span>Full-Stack & Languages</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['TypeScript', 'JavaScript', 'Node.js', 'Express', 'React', 'Python', 'Bash / Shell', 'MongoDB'].map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-200">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold text-sm">
              <Network className="w-4 h-4" />
              <span>Networking Systems</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Cisco IOS', 'VLANs', '802.1Q', 'OSPFv2', 'STP', 'ACLs', 'NAT / PAT', 'Subnetting'].map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-200">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-cyan-400 font-semibold text-sm">
              <Cloud className="w-4 h-4" />
              <span>Cloud & DevOps</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['AWS VPC', 'ECS Fargate', 'Terraform', 'Docker', 'Kubernetes', 'GitHub Actions', 'Linux'].map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-200">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-purple-400 font-semibold text-sm">
              <Shield className="w-4 h-4" />
              <span>Security & Reliability</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['HMAC Webhooks', 'Secret Scanning', 'JWT Auth', 'Rate Limiting', 'TLS Hardening', 'Audit Logs'].map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-4">
              About This Platform & Architecture
            </h2>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <p>
                This portfolio operates on a single-owner, fully automated pipeline: whenever code is pushed to authorized GitHub repositories, webhooks securely trigger incremental analysis, secret validation, and category classification.
              </p>
              <p>
                Rather than treating each commit as an isolated daily log, the system understands repositories as complete, structured bodies of work—updating existing project descriptions or lab collections as technical depth expands over time.
              </p>
              <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Deterministic category classification
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Credential exposure safeguards
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Protected manual owner overrides
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        entry={activeModalEntry}
        onClose={() => setActiveModalEntry(null)}
      />
    </div>
  );
};
