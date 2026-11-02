import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  ExternalLink,
  Github,
  Mail,
  Linkedin,
  Network,
  Code2,
  Cloud,
  Shield,
  MapPin,
  Sparkles,
  Download,
  Eye,
  CheckCircle2,
  Cpu,
  FileCode2,
  Terminal as TerminalIcon,
  Server,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { api, PortfolioEntryItem, PublicProfile, PublicStats, CategorySummary } from '../api/client';
import { ProjectTunnel } from '../components/ProjectTunnel';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { HeroTechAnimation } from '../components/HeroTechAnimation';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const HomePage: React.FC = () => {
  const [entries, setEntries] = useState<PortfolioEntryItem[]>([]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModalEntry, setActiveModalEntry] = useState<PortfolioEntryItem | null>(null);

  // Progressive scroll reveal hooks
  const projectsSection = useScrollReveal<HTMLDivElement>({ threshold: 0.08 });
  const labsSection = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const skillsSection = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const aboutSection = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const platformSection = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  useEffect(() => {
    // Initial fetch of profile, stats, categories
    api
      .getProfile()
      .then((res) => {
        if (res.success) setProfile(res.data);
      })
      .catch((err) => console.error('Failed to load profile:', err));

    api
      .getStats()
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .catch((err) => console.error('Failed to load stats:', err));

    api
      .getCategories()
      .then((catRes) => {
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

  const handleScrollToProjects = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('projects');
    if (target) {
      const headerOffset = 76;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative pt-16 pb-16 overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-900/60 to-slate-950">
        {/* Restrained background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[260px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7">
              {/* Eyebrow */}
              <div className="mb-4 hero-enter-1">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider uppercase bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  SOFTWARE ENGINEERING · CLOUD · NETWORKING
                </span>
              </div>

              {/* Main Heading & Professional Title */}
              <div className="mb-4 hero-enter-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">
                  Hi, I'm Sumith Mittapelli.
                </h1>
                <div className="text-xl sm:text-2xl font-bold text-sky-400 tracking-tight">
                  Software Engineer | Cloud & Networking
                </div>
              </div>

              {/* Verified Professional Background Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-5 text-xs text-slate-300 font-medium hero-enter-3">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                  Former Associate Software Engineer at Tech Mahindra
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AWS Certified Cloud Practitioner
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  B.E. Computer Science and Engineering
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  Based in Hyderabad, India
                </span>
              </div>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6 max-w-2xl font-normal hero-enter-4">
                I build software applications and explore cloud infrastructure, computer networking, and cybersecurity through practical projects and hands-on experiments.
              </p>

              {/* Statistics Section (Meaningful data) */}
              <div
                className="grid grid-cols-3 gap-3.5 max-w-lg mb-8 hero-enter-4"
                role="region"
                aria-label="Portfolio Statistics"
              >
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800/90">
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight mb-1">
                    {stats?.totalProjects ?? (entries.length > 0 ? entries.length : 7)}
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Curated Projects
                  </div>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800/90">
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tracking-tight mb-1">
                    {stats?.totalPracticalLabs ?? 4}
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Networking Labs
                  </div>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800/90">
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-sky-400 tracking-tight mb-1">
                    {stats?.totalTechnologies ?? 24}
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Technologies & Tools
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 hero-enter-5">
                {/* 1. Explore Projects */}
                <a
                  href="#projects"
                  onClick={handleScrollToProjects}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all shadow-sm flex items-center gap-2"
                >
                  <span>Explore Projects</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                {/* 2. View Resume */}
                <a
                  href={profile?.resumeUrl || '/resume.html'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm transition-colors border border-slate-800 flex items-center gap-2 shadow-sm"
                  title="View interactive resume"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>View Resume</span>
                </a>

                {/* 3. GitHub */}
                <a
                  href={profile?.githubUsername ? `https://github.com/${profile.githubUsername}` : 'https://github.com/SumithNetha'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium border border-slate-800"
                  aria-label="GitHub Profile"
                  title="GitHub Profile"
                >
                  <Github className="w-4 h-4" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>

                {/* 4. LinkedIn */}
                <a
                  href={profile?.linkedinUrl || 'https://www.linkedin.com/in/sumith-mittapelli-6aa6a0200'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium border border-slate-800"
                  aria-label="LinkedIn Profile"
                  title="LinkedIn Profile"
                >
                  <Linkedin className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </a>

                {/* 5. Contact Me */}
                <a
                  href={`mailto:${profile?.email || 'm.sumith231@gmail.com'}`}
                  className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium border border-slate-800"
                  aria-label="Contact Sumith Mittapelli"
                  title="Send Email"
                >
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">Contact Me</span>
                </a>
              </div>
            </div>

            {/* Right Interactive Terminal Column */}
            <div className="lg:col-span-5 flex justify-center w-full hero-enter-right">
              <HeroTechAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Main Portfolio Explorer Section */}
      <section
        id="projects"
        ref={projectsSection.ref}
        className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1"
      >
        {/* Section Header */}
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 reveal-init ${
            projectsSection.isRevealed ? 'reveal-visible' : ''
          }`}
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              Selected Projects & Engineering Works
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Curated software applications, practical networking laboratories, and web systems backed by repository evidence and continuous updates.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects, technologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-sans"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === ''
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name === selectedCategory ? '' : cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Project Sequential Tunnels */}
        {isLoading ? (
          <div className="flex flex-col gap-3.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-20 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse"
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
              Try adjusting your search criteria or category filter to explore all verified engineering projects.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {entries.map((entry, idx) => (
              <div
                key={entry._id}
                className={`reveal-init ${projectsSection.isRevealed ? 'reveal-visible' : ''}`}
                style={{ transitionDelay: `${Math.min(idx * 70, 420)}ms` }}
              >
                <ProjectTunnel
                  entry={entry}
                  index={idx}
                  onSelect={(selected) => setActiveModalEntry(selected)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Networking & Practical Labs Section */}
      <section
        id="labs"
        ref={labsSection.ref}
        className="py-16 bg-slate-900/30 border-y border-slate-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-start gap-3.5 mb-10 reveal-init ${
              labsSection.isRevealed ? 'reveal-visible' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
                Networking & Practical Labs
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                Hands-on networking experiments covering Cisco routing, switching, network segmentation, security controls, and troubleshooting.
              </p>
            </div>
          </div>

          {/* 3 Core Lab Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Category 1 */}
            <div
              className={`p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 reveal-init flex flex-col justify-between ${
                labsSection.isRevealed ? 'reveal-visible stagger-1' : ''
              }`}
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4 font-mono font-bold text-xs">
                  01
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  VLAN Segmentation & Trunking
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Practical switch port configuration, VLAN isolation, 802.1Q encapsulation, Native VLAN hardening considerations, Inter-VLAN routing with Router-on-a-Stick, and VTP domain management.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800">
                {['VLAN Configuration', '802.1Q Trunking', 'Native VLAN', 'Inter-VLAN Routing', 'VTP', 'Switch Ports'].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Category 2 */}
            <div
              className={`p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 reveal-init flex flex-col justify-between ${
                labsSection.isRevealed ? 'reveal-visible stagger-2' : ''
              }`}
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 font-mono font-bold text-xs">
                  02
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  OSPF Dynamic Routing
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  OSPFv2 configuration, single-area backbone Area 0 and multi-area routing topologies, neighbor adjacency formation, DR/BDR election states, OSPF metric cost calculations, and routing table verification.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800">
                {['OSPFv2', 'Single & Multi-Area', 'Neighbor Adjacency', 'DR/BDR Election', 'OSPF Metrics', 'Troubleshooting'].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Category 3 */}
            <div
              className={`p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 reveal-init flex flex-col justify-between ${
                labsSection.isRevealed ? 'reveal-visible stagger-3' : ''
              }`}
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 font-mono font-bold text-xs">
                  03
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Network Security & NAT
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Standard and Extended Access Control Lists (ACLs) for 5-tuple traffic filtering, dynamic Network Address Translation (NAT), Port Address Translation (PAT / NAT Overload), and RFC 1918 private IP mapping.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800">
                {['Standard ACLs', 'Extended ACLs', 'Dynamic NAT', 'PAT / NAT Overload', 'RFC 1918', 'Traffic Filtering'].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Practical Networking Topics */}
          <div
            className={`p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 reveal-init ${
              labsSection.isRevealed ? 'reveal-visible stagger-4' : ''
            }`}
          >
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Additional Practical Networking Topics Covered in Labs
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs text-slate-300 font-medium">
              {[
                'STP & Rapid PVST',
                'EtherChannel & LACP',
                'First-Hop HSRP',
                'IPv4 & IPv6 Addressing',
                'Subnetting & VLSM',
                'DHCP & Helper Addresses',
                'DNS Resolution',
                'Static Routing',
                'Cisco IOS Diagnostics',
                'Packet Tracer Topologies',
              ].map((topic, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800/70 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Skills & Tools Section */}
      <section id="skills" ref={skillsSection.ref} className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div
          className={`mb-10 text-center reveal-init ${
            skillsSection.isRevealed ? 'reveal-visible' : ''
          }`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Technical Skills & Tools
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Technologies and tools applied across software development, AWS cloud infrastructure, networking labs, and automated testing.
          </p>
        </div>

        {/* 5 Disciplines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Programming & Development */}
          <div
            className={`p-6 rounded-2xl bg-slate-900/60 border border-slate-800 reveal-init ${
              skillsSection.isRevealed ? 'reveal-visible stagger-1' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4 text-sky-400 font-semibold text-sm">
              <Code2 className="w-5 h-5" />
              <span>Programming & Development</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Java', 'Python', 'JavaScript', 'TypeScript', 'PHP', 'HTML', 'CSS', 'React', 'Node.js', 'Express'].map(
                (s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-800/90 text-slate-200 border border-slate-700/50">
                    {s}
                  </span>
                )
              )}
            </div>
          </div>

          {/* 2. Cloud & Infrastructure */}
          <div
            className={`p-6 rounded-2xl bg-slate-900/60 border border-slate-800 reveal-init ${
              skillsSection.isRevealed ? 'reveal-visible stagger-2' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4 text-cyan-400 font-semibold text-sm">
              <Cloud className="w-5 h-5" />
              <span>Cloud & Infrastructure</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['AWS (EC2, VPC, S3, RDS, Lambda, EFS)', 'Linux (Ubuntu)', 'Bash Shell', 'Docker'].map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-800/90 text-slate-200 border border-slate-700/50">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Networking */}
          <div
            className={`p-6 rounded-2xl bg-slate-900/60 border border-slate-800 reveal-init ${
              skillsSection.isRevealed ? 'reveal-visible stagger-3' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4 text-emerald-400 font-semibold text-sm">
              <Network className="w-5 h-5" />
              <span>Networking</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Cisco IOS', 'IPv4 / IPv6', 'Subnetting & VLSM', 'VLANs', '802.1Q Trunking', 'STP', 'NAT / PAT', 'ACLs', 'OSPF', 'HSRP'].map(
                (s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-800/90 text-slate-200 border border-slate-700/50">
                    {s}
                  </span>
                )
              )}
            </div>
          </div>

          {/* 4. Automation & Testing */}
          <div
            className={`p-6 rounded-2xl bg-slate-900/60 border border-slate-800 reveal-init ${
              skillsSection.isRevealed ? 'reveal-visible stagger-4' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4 text-amber-400 font-semibold text-sm">
              <Server className="w-5 h-5" />
              <span>Automation & Testing</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Selenium WebDriver', 'TestNG', 'Data-driven testing', 'Git', 'GitHub', 'GitHub Actions'].map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-800/90 text-slate-200 border border-slate-700/50">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* 5. Security & Cybersecurity */}
          <div
            className={`p-6 rounded-2xl bg-slate-900/60 border border-slate-800 reveal-init md:col-span-2 lg:col-span-2 ${
              skillsSection.isRevealed ? 'reveal-visible stagger-5' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4 text-purple-400 font-semibold text-sm">
              <Shield className="w-5 h-5" />
              <span>Security & Cybersecurity</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Network security fundamentals',
                'Wireshark packet analysis',
                'Nmap network scanning',
                'Linux security utilities',
                'Network intrusion detection (CNN ML)',
                'Access Control Lists (ACLs)',
              ].map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-800/90 text-slate-200 border border-slate-700/50">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Me Section */}
      <section id="about" ref={aboutSection.ref} className="py-16 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl reveal-init ${
              aboutSection.isRevealed ? 'reveal-visible stagger-1' : ''
            }`}
          >
            <h2 className="text-2xl font-bold text-white tracking-tight mb-5">
              About Me
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              <p>
                I'm a Computer Science graduate interested in software engineering, cloud infrastructure, networking, and cybersecurity.
              </p>
              <p>
                I previously worked as an Associate Software Engineer at Tech Mahindra, where I gained professional software engineering experience.
              </p>
              <p>
                Outside professional work, I develop personal projects and practical laboratories to strengthen my understanding of application development, AWS services, Linux, Cisco networking, and network security.
              </p>
              <p>
                I enjoy understanding how systems work, troubleshooting technical problems, and connecting software development with infrastructure and security.
              </p>
              <p>
                My current focus is strengthening practical engineering skills and building projects that demonstrate what I learn.
              </p>
            </div>

            {/* Structured Credentials & Background Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70">
                <div className="font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold text-[11px]">
                  Professional Background
                </div>
                <div className="text-white font-medium text-sm mb-0.5">
                  Associate Software Engineer
                </div>
                <div className="text-slate-400">Tech Mahindra • Quality Assurance & Automation</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70">
                <div className="font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold text-[11px]">
                  Education
                </div>
                <div className="text-white font-medium text-sm mb-0.5">
                  B.E. Computer Science and Engineering
                </div>
                <div className="text-slate-400">Matrusri Engineering College • Graduation 2024 • 8.1 CGPA</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70">
                <div className="font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold text-[11px]">
                  Cloud Certification
                </div>
                <div className="text-white font-medium text-sm mb-0.5">
                  AWS Certified Cloud Practitioner
                </div>
                <div className="text-slate-400">Amazon Web Services • Core Services & Cloud Architecture</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70">
                <div className="font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold text-[11px]">
                  Networking Laboratory
                </div>
                <div className="text-white font-medium text-sm mb-0.5">
                  Cisco CCNA Practical Labs
                </div>
                <div className="text-slate-400">Hands-on routing, switching, VLAN, and OSPF configurations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Architecture Section: An Automated Portfolio Powered by GitHub */}
      <section
        id="platform"
        ref={platformSection.ref}
        className="py-16 border-t border-slate-900 bg-slate-900/40"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl reveal-init ${
              platformSection.isRevealed ? 'reveal-visible stagger-1' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2 text-sky-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <GitBranch className="w-4 h-4" />
              <span>Platform Engineering</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
              An Automated Portfolio Powered by GitHub
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 font-normal">
              This portfolio uses GitHub integration and an automated content-processing pipeline to keep project information synchronized with repository changes. When an authorized repository receives a push event, the backend processes the webhook, validates the event, analyzes repository information, classifies the project, and prepares content for portfolio publication.
            </p>

            {/* Implemented Components Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-0.5">GitHub Integration & Monitoring</div>
                  <div className="text-slate-400 leading-normal">
                    Secure webhook endpoint receiving push events from authorized repositories.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-0.5">HMAC-SHA256 Signature Verification</div>
                  <div className="text-slate-400 leading-normal">
                    Cryptographic timing-safe verification guarantees payload authenticity.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-0.5">Repository Metadata & Content Extraction</div>
                  <div className="text-slate-400 leading-normal">
                    Inspects file trees, manifests (e.g. package.json), and documentation for evidence.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-0.5">AI-Assisted Description Generation</div>
                  <div className="text-slate-400 leading-normal">
                    Structured Zod schema output validated across Mock, OpenAI, and Gemini providers.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-0.5">Deterministic Validation & Secret Checks</div>
                  <div className="text-slate-400 leading-normal">
                    Credential scanning redacts secrets and blocks automated publication of sensitive files.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-0.5">Manual Review & Override Controls</div>
                  <div className="text-slate-400 leading-normal">
                    Owner-curated edits in the Admin dashboard are locked and never overwritten by updates.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Detail Modal */}
      {activeModalEntry && (
        <ProjectDetailModal
          entry={activeModalEntry}
          onClose={() => setActiveModalEntry(null)}
        />
      )}
    </div>
  );
};
