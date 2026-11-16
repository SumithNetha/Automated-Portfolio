import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
  Eye,
  CheckCircle2,
  FileCode2,
  Server,
  ArrowRight,
  GitBranch,
  X,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Cpu,
  BookOpen,
  Calendar,
  MapPin,
  Check,
} from 'lucide-react';
import { api, PortfolioEntryItem, PublicProfile, PublicStats, CategorySummary } from '../api/client';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { useScrollReveal } from '../hooks/useScrollReveal';

const CATEGORY_PILLS = ['All', 'Full-Stack', 'Networking / CCNA', 'Cloud / DevOps', 'AI'] as const;

export const HomePage: React.FC = () => {
  const [entries, setEntries] = useState<PortfolioEntryItem[]>([]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModalEntry, setActiveModalEntry] = useState<PortfolioEntryItem | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);
  const [activeLabTab, setActiveLabTab] = useState<number>(0);
  const [activeTier, setActiveTier] = useState<1 | 2 | 3 | null>(null);

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

    setIsLoading(true);
    api
      .getEntries()
      .then((res) => {
        if (res.success) setEntries(res.data);
      })
      .catch((err) => console.error('Failed to fetch entries:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // In-page resume modal triggers from navigation & URL hash
  useEffect(() => {
    const handleOpenResume = () => {
      setIsResumeModalOpen(true);
    };

    const handleHashCheck = () => {
      if (window.location.hash === '#resume') {
        setIsResumeModalOpen(true);
      }
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'close-resume') {
        handleCloseResumeModal();
      }
    };

    window.addEventListener('open-resume-preview', handleOpenResume);
    window.addEventListener('hashchange', handleHashCheck);
    window.addEventListener('message', handleMessage);
    handleHashCheck();

    return () => {
      window.removeEventListener('open-resume-preview', handleOpenResume);
      window.removeEventListener('hashchange', handleHashCheck);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Keyboard shortcut: close modal on Escape
  useEffect(() => {
    if (!isResumeModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseResumeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResumeModalOpen]);

  const handleCloseResumeModal = () => {
    setIsResumeModalOpen(false);
    if (window.location.hash === '#resume') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // 1. Category Filtering
      if (selectedCategory && selectedCategory !== 'All') {
        const cat = (entry.primaryCategory || '').toLowerCase();
        if (selectedCategory === 'Full-Stack') {
          if (!cat.includes('web') && !cat.includes('full') && !cat.includes('software')) return false;
        } else if (selectedCategory === 'Networking / CCNA') {
          if (!cat.includes('network') && !cat.includes('ccna') && !cat.includes('routing')) return false;
        } else if (selectedCategory === 'Cloud / DevOps') {
          if (!cat.includes('cloud') && !cat.includes('devops') && !cat.includes('aws')) return false;
        } else if (selectedCategory === 'AI') {
          if (!cat.includes('ai') && !cat.includes('machine') && !cat.includes('ml')) return false;
        }
      }

      // 2. Clickable Tech-Tag Filtering
      if (selectedTag) {
        const hasTag = entry.technologies?.some(
          (t) => t.toLowerCase() === selectedTag.toLowerCase()
        );
        if (!hasTag) return false;
      }

      // 3. Real-Time Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = entry.title?.toLowerCase().includes(q);
        const inOverview = entry.overview?.toLowerCase().includes(q);
        const inDesc = entry.detailedDescription?.toLowerCase().includes(q);
        const inTech = entry.technologies?.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inOverview && !inDesc && !inTech) return false;
      }

      return true;
    });
  }, [entries, selectedCategory, selectedTag, searchQuery]);

  // Separate flagship primary case study from secondary engineering ledger
  const flagshipEntry = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    const featured = filteredEntries.find((e) => e.isFeatured);
    return featured || filteredEntries[0];
  }, [filteredEntries]);

  const secondaryEntries = useMemo(() => {
    if (!flagshipEntry) return filteredEntries;
    return filteredEntries.filter((e) => e._id !== flagshipEntry._id);
  }, [filteredEntries, flagshipEntry]);

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

  // Structured Cisco Networking Labs Data
  const networkingLabs = [
    {
      id: 1,
      title: '802.1Q VLAN Segmentation & Router-on-a-Stick',
      category: 'Switching & Routing',
      objective: 'Isolate departmental traffic using VLANs, establish 802.1Q trunking between access and distribution switches, and route inter-VLAN traffic via subinterfaces.',
      concepts: ['IEEE 802.1Q Trunking', 'Native VLAN Hardening', 'Router Subinterfaces', 'VTP Transparent Mode'],
      cliSnippet: `Switch(config)# vlan 10
Switch(config-vlan)# name Engineering
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk native vlan 99

Router(config)# interface GigabitEthernet0/0.10
Router(config-subif)# encapsulation dot1Q 10
Router(config-subif)# ip address 192.168.10.1 255.255.255.0
Router(config-subif)# description Engineering_Gateway`,
      verification: 'show vlan brief • show interfaces trunk • show ip route',
    },
    {
      id: 2,
      title: 'OSPFv2 Dynamic Routing (Area 0 Backbone & Adjacencies)',
      category: 'Interior Gateway Protocols',
      objective: 'Configure open shortest path first (OSPF) routing across multiple router segments, achieve neighbor full-state adjacency, and verify DR/BDR election states.',
      concepts: ['Link-State Protocol', 'Area 0 Backbone', 'DR/BDR Election', 'Cost Metric Calculation', 'Fast Convergence'],
      cliSnippet: `Router(config)# router ospf 1
Router(config-router)# router-id 1.1.1.1
Router(config-router)# network 10.0.0.0 0.0.0.3 area 0
Router(config-router)# network 192.168.10.0 0.0.0.255 area 0
Router(config-router)# passive-interface GigabitEthernet0/1
Router(config-router)# auto-cost reference-bandwidth 1000`,
      verification: 'show ip ospf neighbor • show ip ospf database • show ip route ospf',
    },
    {
      id: 3,
      title: 'Dynamic NAT & Port Address Translation (NAT Overload)',
      category: 'Network Edge & Addressing',
      objective: 'Translate RFC 1918 private IPv4 subnets into a single public edge IP address using Port Address Translation (PAT) to enable secure outbound internet connectivity.',
      concepts: ['RFC 1918 Private Addressing', 'NAT Overload (PAT)', 'Inside/Outside Interface Mapping', 'Translation State Table'],
      cliSnippet: `Router(config)# access-list 1 permit 192.168.0.0 0.0.255.255
Router(config)# ip nat inside source list 1 interface GigabitEthernet0/1 overload

Router(config)# interface GigabitEthernet0/0
Router(config-if)# ip nat inside
Router(config)# interface GigabitEthernet0/1
Router(config-if)# ip nat outside`,
      verification: 'show ip nat translations • show ip nat statistics • debug ip nat',
    },
    {
      id: 4,
      title: 'Standard & Extended Access Control Lists (ACLs)',
      category: 'Network Security',
      objective: 'Enforce perimeter security and network segmentation by filtering IPv4 packets using 5-tuple matching criteria (protocol, source IP, destination IP, port).',
      concepts: ['5-Tuple Traffic Filtering', 'Inbound vs Outbound Placement', 'Implicit Deny Rule', 'Port-Level Security (TCP 80/443)'],
      cliSnippet: `Router(config)# ip access-list extended RESTRICT_SALES
Router(config-ext-nacl)# permit tcp 192.168.10.0 0.0.0.255 host 192.168.20.50 eq 443
Router(config-ext-nacl)# deny ip 192.168.10.0 0.0.0.255 192.168.20.0 0.0.0.255
Router(config-ext-nacl)# permit ip any any

Router(config)# interface GigabitEthernet0/0.10
Router(config-subif)# ip access-group RESTRICT_SALES in`,
      verification: 'show access-lists • show ip interface GigabitEthernet0/0.10',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#141413]">
      {/* Editorial Hero Section */}
      <section className="relative pt-14 pb-16 border-b border-[#E5E2DC] bg-[#FAF9F5] overflow-hidden">
        {/* Subtle Architectural Drafting Grid with Intersection Crosshairs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 48%, rgba(0,0,0,0) 86%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 48%, rgba(0,0,0,0) 86%)',
          }}
        >
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="drafting-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                {/* 1px grid lines in #EAE7E1 at 40% opacity */}
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#EAE7E1" strokeWidth="1" strokeOpacity="0.4" />
                {/* Tiny crosshair + marker at key intersections */}
                <path d="M -3 0 L 3 0 M 0 -3 L 0 3" fill="none" stroke="#D5D0C6" strokeWidth="0.8" strokeOpacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#drafting-grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Eyebrow Index Kicker */}
          <div className="flex flex-wrap items-center gap-3 mb-6 font-mono text-xs text-[#52514E] uppercase tracking-wider">
            <span className="font-semibold text-[#141413]">ENGINEERING INDEX</span>
            <span className="text-[#85837D]">•</span>
            <span>HYDERABAD, INDIA</span>
            <span className="text-[#85837D]">•</span>
            <span className="text-emerald-700 font-medium">AVAILABLE FOR FULL-TIME ROLES</span>
          </div>

          {/* 12-Column Desktop Grid for Hero Intro (Left: Narrative, Right: System Schematic) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-8">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7">
              <h1 className="text-3xl sm:text-5xl lg:text-[3.15rem] font-bold text-[#141413] tracking-tight leading-[1.15] mb-5">
                Engineering software applications, AWS cloud infrastructure, and computer networks.
              </h1>
              <p className="text-base text-[#52514E] leading-relaxed font-normal">
                Former Associate Software Engineer at Tech Mahindra with a Bachelor of Engineering in Computer Science (8.1 CGPA) and AWS Certified Cloud Practitioner credentials. I design dependable backend architectures, automated test suites, and practical Cisco network topologies grounded in verified repository code.
              </p>
            </div>

            {/* Right Column: Minimalist Technical SVG System Schematic */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="border border-[#E5E2DC] rounded-lg bg-[#FAF9F5]/90 p-4 font-mono text-xs shadow-sm">
                <div className="flex items-center justify-between text-[#85837D] text-[10px] uppercase tracking-wider pb-2 mb-3 border-b border-[#E5E2DC]">
                  <span className="font-semibold text-[#141413]">SYSTEM TOPOLOGY SCHEMATIC</span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    LIVE MODEL
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {/* Node 1: App & QA Tier */}
                  <div
                    onMouseEnter={() => setActiveTier(1)}
                    onMouseLeave={() => setActiveTier(null)}
                    className={`p-3 rounded border transition-all duration-150 cursor-pointer ${
                      activeTier === 1
                        ? 'bg-[#EAE7E0] border-[#141413] shadow-sm'
                        : 'bg-[#F3F1EC] border-[#D4D0C8] hover:border-[#141413]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#141413] text-[11px]">01. APP & QA TIER</span>
                      <span className="text-[10px] text-[#85837D]">JAVA / TS</span>
                    </div>
                    <div className="text-[10px] text-[#52514E] truncate">
                      Node.js • Java • Selenium WebDriver • TestNG
                    </div>
                  </div>

                  {/* Flow Connector 1 -> 2 */}
                  <div className="flex items-center justify-center my-0.5 relative py-1">
                    <svg className="w-full h-5 overflow-visible" viewBox="0 0 240 20">
                      {/* Base line */}
                      <line x1="120" y1="0" x2="120" y2="20" stroke="#D4D0C8" strokeWidth="1" />
                      {/* Animated packet flow line */}
                      <line
                        x1="120"
                        y1="0"
                        x2="120"
                        y2="20"
                        stroke="#1E40AF"
                        strokeWidth="1.5"
                        className="animate-packet-flow"
                      />
                    </svg>
                    <span className="absolute bg-[#FAF9F5] px-2 py-0.5 rounded border border-[#E5E2DC] text-[9px] text-[#85837D] font-mono whitespace-nowrap">
                      HTTPS / Webhook ↓
                    </span>
                  </div>

                  {/* Node 2: AWS Cloud VPC */}
                  <div
                    onMouseEnter={() => setActiveTier(2)}
                    onMouseLeave={() => setActiveTier(null)}
                    className={`p-3 rounded border transition-all duration-150 cursor-pointer ${
                      activeTier === 2
                        ? 'bg-[#EAE7E0] border-[#141413] shadow-sm'
                        : 'bg-[#F3F1EC] border-[#D4D0C8] hover:border-[#141413]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#141413] text-[11px]">02. AWS CLOUD VPC</span>
                      <span className="text-[10px] text-[#1E40AF] font-semibold">CLOUD CERT</span>
                    </div>
                    <div className="text-[10px] text-[#52514E] truncate">
                      EC2 • ALB • IAM • S3 • RDS • Security Groups
                    </div>
                  </div>

                  {/* Flow Connector 2 -> 3 */}
                  <div className="flex items-center justify-center my-0.5 relative py-1">
                    <svg className="w-full h-5 overflow-visible" viewBox="0 0 240 20">
                      {/* Base line */}
                      <line x1="120" y1="0" x2="120" y2="20" stroke="#D4D0C8" strokeWidth="1" />
                      {/* Animated packet flow line */}
                      <line
                        x1="120"
                        y1="0"
                        x2="120"
                        y2="20"
                        stroke="#059669"
                        strokeWidth="1.5"
                        className="animate-packet-flow"
                      />
                    </svg>
                    <span className="absolute bg-[#FAF9F5] px-2 py-0.5 rounded border border-[#E5E2DC] text-[9px] text-[#85837D] font-mono whitespace-nowrap">
                      802.1Q Trunk / OSPF ↓
                    </span>
                  </div>

                  {/* Node 3: Cisco Network Core */}
                  <div
                    onMouseEnter={() => setActiveTier(3)}
                    onMouseLeave={() => setActiveTier(null)}
                    className={`p-3 rounded border transition-all duration-150 cursor-pointer ${
                      activeTier === 3
                        ? 'bg-[#EAE7E0] border-[#141413] shadow-sm'
                        : 'bg-[#F3F1EC] border-[#D4D0C8] hover:border-[#141413]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#141413] text-[11px]">03. CISCO NETWORK CORE</span>
                      <span className="text-[10px] text-[#059669] font-semibold">CCNA LAB</span>
                    </div>
                    <div className="text-[10px] text-[#52514E] truncate">
                      VLANs • Router-on-a-Stick • OSPFv2 • Extended ACLs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engineering Disciplines Grid (Editorial Specification Matrix with Two-Way Highlight) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E5E2DC] bg-[#F3F1EC] rounded-lg overflow-hidden mb-8 transition-colors">
            {/* Column 1 */}
            <div
              onMouseEnter={() => setActiveTier(1)}
              onMouseLeave={() => setActiveTier(null)}
              className={`p-6 border-b md:border-b-0 md:border-r border-[#E5E2DC] transition-all duration-150 cursor-pointer ${
                activeTier === 1 ? 'bg-[#EAE7E0]' : 'bg-[#F3F1EC]'
              }`}
            >
              <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>01 / SOFTWARE & SYSTEMS</span>
                {activeTier === 1 && <span className="w-1.5 h-1.5 rounded-full bg-[#141413]" />}
              </div>
              <h2 className="text-base font-bold text-[#141413] mb-2">
                Application & Automation
              </h2>
              <p className="text-xs text-[#52514E] leading-relaxed mb-4">
                Full-stack web services, Java backend engineering, automated regression testing with Selenium WebDriver & TestNG, and Page Object Model architectures.
              </p>
              <div className="font-mono text-[11px] text-[#52514E] space-y-1">
                <div>• Java, TypeScript, Python, Node.js</div>
                <div>• Selenium WebDriver, TestNG</div>
                <div>• REST APIs, Express, MongoDB</div>
              </div>
            </div>

            {/* Column 2 */}
            <div
              onMouseEnter={() => setActiveTier(2)}
              onMouseLeave={() => setActiveTier(null)}
              className={`p-6 border-b md:border-b-0 md:border-r border-[#E5E2DC] transition-all duration-150 cursor-pointer ${
                activeTier === 2 ? 'bg-[#EAE7E0]' : 'bg-[#F3F1EC]'
              }`}
            >
              <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>02 / CLOUD & INFRASTRUCTURE</span>
                {activeTier === 2 && <span className="w-1.5 h-1.5 rounded-full bg-[#141413]" />}
              </div>
              <h2 className="text-base font-bold text-[#141413] mb-2">
                AWS Cloud Architecture
              </h2>
              <p className="text-xs text-[#52514E] leading-relaxed mb-4">
                Certified foundational knowledge across core Amazon Web Services, Linux server administration, containerized environments, and cloud networking.
              </p>
              <div className="font-mono text-[11px] text-[#52514E] space-y-1">
                <div>• AWS Certified Cloud Practitioner</div>
                <div>• VPC, EC2, S3, RDS, Lambda, IAM</div>
                <div>• Linux (Ubuntu), Bash, Docker</div>
              </div>
            </div>

            {/* Column 3 */}
            <div
              onMouseEnter={() => setActiveTier(3)}
              onMouseLeave={() => setActiveTier(null)}
              className={`p-6 transition-all duration-150 cursor-pointer ${
                activeTier === 3 ? 'bg-[#EAE7E0]' : 'bg-[#F3F1EC]'
              }`}
            >
              <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>03 / COMPUTER NETWORKING</span>
                {activeTier === 3 && <span className="w-1.5 h-1.5 rounded-full bg-[#141413]" />}
              </div>
              <h2 className="text-base font-bold text-[#141413] mb-2">
                Cisco Routing & Switching
              </h2>
              <p className="text-xs text-[#52514E] leading-relaxed mb-4">
                Practical, hands-on CCNA-level networking laboratories: VLAN segmentation, inter-VLAN routing, OSPF dynamic routing, NAT/PAT, and packet filtering.
              </p>
              <div className="font-mono text-[11px] text-[#52514E] space-y-1">
                <div>• Cisco IOS Configuration</div>
                <div>• 802.1Q VLANs, Subinterfaces</div>
                <div>• OSPFv2, NAT/PAT, Extended ACLs</div>
              </div>
            </div>
          </div>

          {/* Action Ledger */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <a
              href="#projects"
              onClick={handleScrollToProjects}
              className="px-4 py-2.5 rounded bg-[#141413] hover:bg-[#2A2A28] text-[#FAF9F5] font-semibold transition-colors flex items-center gap-2"
            >
              <span>Explore Selected Work</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setIsResumeModalOpen(true)}
              className="px-4 py-2.5 rounded bg-[#F3F1EC] hover:bg-[#EAE7E0] text-[#141413] font-semibold border border-[#E5E2DC] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#52514E]" />
              <span>Preview Resume</span>
            </button>

            <a
              href="/api/resume/download"
              download="Sumith_Mittapelli_Resume.pdf"
              className="px-4 py-2.5 rounded bg-[#F3F1EC] hover:bg-[#EAE7E0] text-[#1E40AF] font-semibold border border-[#E5E2DC] transition-colors flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>

            <a
              href={profile?.githubUsername ? `https://github.com/${profile.githubUsername}` : 'https://github.com/SumithNetha'}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded bg-[#FAF9F5] hover:bg-[#F3F1EC] text-[#52514E] hover:text-[#141413] border border-[#E5E2DC] transition-colors flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            <a
              href={profile?.linkedinUrl || 'https://www.linkedin.com/in/sumith-mittapelli-6aa6a0200'}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded bg-[#FAF9F5] hover:bg-[#F3F1EC] text-[#52514E] hover:text-[#141413] border border-[#E5E2DC] transition-colors flex items-center gap-1.5"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </section>

      {/* Selected Projects Section (Editorial Case-Study & Engineering Ledger) */}
      <section
        id="projects"
        ref={projectsSection.ref}
        className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1"
      >
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-[#E5E2DC]">
          <div>
            <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-1">
              CURATED REPOSITORY INDEX
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#141413] tracking-tight">
              Selected Projects & Systems
            </h2>
            <p className="text-xs sm:text-sm text-[#52514E] max-w-2xl mt-1 leading-relaxed">
              Full-stack software applications, networking labs, and test automation systems synchronized dynamically via verified GitHub webhooks.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#85837D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by title, stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded bg-[#F3F1EC] border border-[#E5E2DC] text-xs font-mono text-[#141413] placeholder-[#85837D] focus:outline-none focus:border-[#1E40AF] transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            {CATEGORY_PILLS.map((catName) => {
              const isSelected = selectedCategory === catName;
              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setSelectedCategory(catName)}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#141413] text-[#FAF9F5] font-semibold'
                      : 'bg-[#F3F1EC] text-[#52514E] hover:text-[#141413] hover:bg-[#EAE7E0] border border-[#E5E2DC]'
                  }`}
                >
                  {catName}
                </button>
              );
            })}
          </div>

          {selectedTag && (
            <div className="flex items-center gap-2 font-mono text-xs text-[#52514E]">
              <span>Tag filter:</span>
              <span className="px-2 py-0.5 rounded bg-[#F3F1EC] border border-[#E5E2DC] text-[#141413] font-semibold flex items-center gap-1">
                {selectedTag}
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="hover:text-rose-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-full rounded border border-[#E5E2DC] bg-[#F3F1EC] p-6 animate-shimmer h-40"
              />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#E5E2DC] rounded bg-[#F3F1EC]/50 font-mono text-xs text-[#52514E]">
            No matching projects found. Reset filters to view all curated works.
          </div>
        ) : (
          <div className="space-y-10">
            {/* 1. Flagship Primary Case Study Feature */}
            {flagshipEntry && (
              <div className="border border-[#E5E2DC] rounded-lg bg-[#FAF9F5] p-6 sm:p-8 relative">
                {/* Header Tag */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 font-mono text-xs text-[#85837D] border-b border-[#E5E2DC] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#141413]">FLAGSHIP CASE STUDY / 01</span>
                    <span>•</span>
                    <span className="text-[#1E40AF] font-semibold">{flagshipEntry.primaryCategory}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Continuous GitHub Sync
                    </span>
                  </div>

                  {flagshipEntry.lastAnalysedCommitSha && (
                    <div className="text-[#85837D]">
                      Commit {flagshipEntry.lastAnalysedCommitSha.substring(0, 7)} • v{flagshipEntry.contentVersion}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Narrative & Technical Implementation */}
                  <div className="lg:col-span-7">
                    <h3 className="text-2xl sm:text-3xl font-bold text-[#141413] tracking-tight mb-3">
                      {flagshipEntry.title}
                    </h3>
                    <p className="text-sm text-[#52514E] leading-relaxed mb-6 font-normal">
                      {flagshipEntry.overview}
                    </p>

                    {/* Features / Highlights */}
                    {flagshipEntry.features && flagshipEntry.features.length > 0 && (
                      <div className="mb-6">
                        <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-2">
                          Key Technical Highlights
                        </div>
                        <ul className="space-y-1.5 text-xs text-[#52514E]">
                          {flagshipEntry.features.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#1E40AF] font-bold">•</span>
                              <span>
                                <strong className="text-[#141413] font-medium">{f.name}:</strong>{' '}
                                {f.description || (f.evidenceFile ? `Verified in ${f.evidenceFile}` : '')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Technical Specification Format (Text, Not Pills) */}
                    <div className="p-4 rounded bg-[#F3F1EC] border border-[#E5E2DC] font-mono text-xs text-[#52514E] space-y-1 mb-6">
                      <div>
                        <span className="text-[#141413] font-semibold">Technologies Applied:</span>{' '}
                        {flagshipEntry.technologies?.join(' • ')}
                      </div>
                      {flagshipEntry.existingModules && flagshipEntry.existingModules.length > 0 && (
                        <div>
                          <span className="text-[#141413] font-semibold">Verified Subsystems:</span>{' '}
                          {flagshipEntry.existingModules.slice(0, 5).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveModalEntry(flagshipEntry)}
                        className="px-4 py-2 rounded bg-[#141413] hover:bg-[#2A2A28] text-[#FAF9F5] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Inspect Full Technical Spec</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {flagshipEntry.demoUrl && !flagshipEntry.demoUrl.includes('example.com') && flagshipEntry.demoUrl.startsWith('http') && (
                        <a
                          href={flagshipEntry.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded bg-[#F3F1EC] hover:bg-[#EAE7E0] text-[#141413] font-semibold border border-[#E5E2DC] transition-colors flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Live Demo</span>
                        </a>
                      )}

                      <a
                        href={flagshipEntry.sourceRepoHtmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded bg-[#F3F1EC] hover:bg-[#EAE7E0] text-[#52514E] hover:text-[#141413] border border-[#E5E2DC] transition-colors flex items-center gap-1.5"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Source Code</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Column: Architectural Specification Block */}
                  <div className="lg:col-span-5 bg-[#141413] text-[#FAF9F5] rounded-lg p-5 font-mono text-xs border border-[#141413]">
                    <div className="flex items-center justify-between text-[#85837D] border-b border-[#2A2A28] pb-3 mb-3">
                      <span className="text-[#FAF9F5] font-semibold">SYSTEM SPECIFICATION</span>
                      <span>v{flagshipEntry.contentVersion}.0</span>
                    </div>

                    <div className="space-y-3 text-[11px] text-[#A8A29E]">
                      <div>
                        <div className="text-[#85837D] uppercase text-[10px]">Repository</div>
                        <div className="text-[#FAF9F5] font-semibold truncate">{flagshipEntry.sourceRepoFullName}</div>
                      </div>

                      <div>
                        <div className="text-[#85837D] uppercase text-[10px]">Architecture Pattern</div>
                        <div className="text-[#FAF9F5]">
                          {flagshipEntry.architectureSummary || 'Layered full-stack service architecture with verified component boundaries and webhook synchronization.'}
                        </div>
                      </div>

                      {flagshipEntry.recentPushUpdates && flagshipEntry.recentPushUpdates.length > 0 && (
                        <div>
                          <div className="text-[#85837D] uppercase text-[10px]">Latest Verified Commit</div>
                          <div className="text-emerald-400 font-semibold truncate">
                            {flagshipEntry.recentPushUpdates[0].commitSha} • {flagshipEntry.recentPushUpdates[0].message}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#2A2A28] flex items-center justify-between text-[10px]">
                        <span>SECURITY: CREDENTIAL CHECK PASSED</span>
                        <span className="text-emerald-400">STATUS: VERIFIED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Structured Engineering Ledger (Table View for Remaining Repositories) */}
            {secondaryEntries.length > 0 && (
              <div>
                <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-3">
                  SECONDARY ENGINEERING LEDGER & REPOSITORIES ({secondaryEntries.length})
                </div>

                <div className="border border-[#E5E2DC] rounded-lg overflow-hidden bg-[#FAF9F5]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E2DC] bg-[#F3F1EC] text-[#52514E]">
                          <th className="py-3 px-4 font-semibold w-12">#</th>
                          <th className="py-3 px-4 font-semibold">Project & Description</th>
                          <th className="py-3 px-4 font-semibold hidden md:table-cell">Category</th>
                          <th className="py-3 px-4 font-semibold hidden lg:table-cell">Core Stack</th>
                          <th className="py-3 px-4 font-semibold text-right">Specification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E2DC]">
                        {secondaryEntries.map((entry, idx) => (
                          <tr
                            key={entry._id}
                            className="hover:bg-[#F3F1EC]/70 transition-colors group cursor-pointer"
                            onClick={() => setActiveModalEntry(entry)}
                          >
                            <td className="py-3.5 px-4 text-[#85837D] font-mono">
                              {String(idx + 2).padStart(2, '0')}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#141413] group-hover:text-[#1E40AF] transition-colors">
                                {entry.title}
                              </div>
                              <div className="text-[11px] text-[#52514E] font-sans truncate max-w-md line-clamp-1">
                                {entry.overview}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 hidden md:table-cell">
                              <span className="px-2 py-0.5 rounded bg-[#F3F1EC] text-[#52514E] border border-[#E5E2DC] text-[11px]">
                                {entry.primaryCategory}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 hidden lg:table-cell text-[11px] text-[#52514E] max-w-xs truncate">
                              {entry.technologies?.slice(0, 4).join(', ')}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveModalEntry(entry);
                                }}
                                className="inline-flex items-center gap-1 text-[#1E40AF] hover:underline font-semibold text-[11px]"
                              >
                                <span>Inspect</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Practical Networking Lab Showcase (Dedicated Cisco & CCNA Studio) */}
      <section
        id="labs"
        ref={labsSection.ref}
        className="py-16 bg-[#F3F1EC] border-y border-[#E5E2DC]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-8">
            <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-1">
              PRACTICAL CCNA LABORATORY
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#141413] tracking-tight mb-2">
              Cisco Routing, Switching & Network Security
            </h2>
            <p className="text-xs sm:text-sm text-[#52514E] leading-relaxed font-normal">
              Hands-on network infrastructure laboratories configured and validated in Cisco Packet Tracer. These topologies model enterprise campus network segmentation, multi-area dynamic routing, perimeter packet filtering, and IPv4 address translation.
            </p>
          </div>

          {/* Interactive Lab Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 font-mono text-xs">
            {networkingLabs.map((lab, i) => (
              <button
                key={lab.id}
                type="button"
                onClick={() => setActiveLabTab(i)}
                className={`px-3.5 py-2 rounded text-left transition-colors cursor-pointer border ${
                  activeLabTab === i
                    ? 'bg-[#141413] text-[#FAF9F5] border-[#141413] font-semibold'
                    : 'bg-[#FAF9F5] text-[#52514E] hover:text-[#141413] hover:bg-[#EAE7E0] border-[#E5E2DC]'
                }`}
              >
                <span className="text-[10px] text-[#85837D] block">LAB {String(i + 1).padStart(2, '0')}</span>
                <span className="font-sans font-medium text-xs truncate max-w-[200px] block">{lab.title}</span>
              </button>
            ))}
          </div>

          {/* Active Lab Technical Document Card */}
          {networkingLabs[activeLabTab] && (
            <div className="border border-[#E5E2DC] rounded-lg bg-[#FAF9F5] p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Description Column */}
                <div className="lg:col-span-6 space-y-5">
                  <div>
                    <span className="font-mono text-xs text-[#1E40AF] font-semibold uppercase">
                      {networkingLabs[activeLabTab].category}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#141413] mt-1 mb-2">
                      {networkingLabs[activeLabTab].title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#52514E] leading-relaxed">
                      {networkingLabs[activeLabTab].objective}
                    </p>
                  </div>

                  {/* Core Concepts */}
                  <div>
                    <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-2">
                      Engineering Principles Tested
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#52514E]">
                      {networkingLabs[activeLabTab].concepts.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 p-2 rounded bg-[#F3F1EC] border border-[#E5E2DC]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span className="truncate">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verification Commands */}
                  <div className="p-3.5 rounded bg-[#F3F1EC] border border-[#E5E2DC] font-mono text-xs text-[#52514E]">
                    <span className="font-semibold text-[#141413]">CLI Diagnostics & Verification:</span>{' '}
                    <code className="text-[#1E40AF]">{networkingLabs[activeLabTab].verification}</code>
                  </div>
                </div>

                {/* Right Cisco IOS Configuration Console (High Contrast Dark Block) */}
                <div className="lg:col-span-6 bg-[#141413] text-[#FAF9F5] rounded-lg p-5 font-mono text-xs border border-[#141413]">
                  <div className="flex items-center justify-between text-[#85837D] border-b border-[#2A2A28] pb-3 mb-3">
                    <span className="text-[#FAF9F5] font-semibold flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      CISCO IOS RUNNING-CONFIG SNIPPET
                    </span>
                    <span className="text-[10px]">PACKET TRACER</span>
                  </div>

                  <pre className="text-[11px] leading-relaxed text-[#D6D3D1] overflow-x-auto whitespace-pre font-mono p-1">
                    {networkingLabs[activeLabTab].cliSnippet}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Additional Practical Networking Topics Ledger */}
          <div className="mt-8 p-5 rounded-lg bg-[#FAF9F5] border border-[#E5E2DC]">
            <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-3">
              ADDITIONAL TOPICS VALIDATED IN LABORATORY TOPOLOGIES
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 font-mono text-xs text-[#52514E]">
              {[
                'STP & Rapid PVST',
                'EtherChannel (LACP)',
                'First-Hop HSRP',
                'IPv4/IPv6 Addressing',
                'Subnetting & VLSM',
                'DHCP Helper Address',
                'DNS Server Mapping',
                'Static Route Metrics',
                'Switch Port Security',
                'Cisco CLI Diagnostics',
              ].map((topic, i) => (
                <div key={i} className="p-2 rounded bg-[#F3F1EC] border border-[#E5E2DC] flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#141413]" />
                  <span className="truncate">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Capabilities & Technical Skills Section */}
      <section id="skills" ref={skillsSection.ref} className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl mb-10">
          <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-1">
            TECHNICAL CAPABILITIES
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#141413] tracking-tight mb-2">
            Engineering Matrix & Applied Tools
          </h2>
          <p className="text-xs sm:text-sm text-[#52514E] leading-relaxed font-normal">
            Technologies and methods applied across professional quality engineering, AWS cloud deployments, and computer networking implementations.
          </p>
        </div>

        {/* 6 Structured Disciplines */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Discipline 1 */}
          <div className="p-5 rounded-lg bg-[#F3F1EC] border border-[#E5E2DC]">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#141413] mb-3">
              <Code2 className="w-4 h-4 text-[#1E40AF]" />
              <span>01 / PROGRAMMING & DEVELOPMENT</span>
            </div>
            <p className="text-xs text-[#52514E] mb-3 leading-relaxed">
              Core object-oriented backend languages and modern TypeScript full-stack environments.
            </p>
            <div className="space-y-1 font-mono text-xs text-[#141413]">
              <div>• Java, TypeScript, JavaScript, Python</div>
              <div>• Node.js, Express, REST APIs</div>
              <div>• React, HTML5, CSS3, Tailwind</div>
            </div>
          </div>

          {/* Discipline 2 */}
          <div className="p-5 rounded-lg bg-[#F3F1EC] border border-[#E5E2DC]">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#141413] mb-3">
              <Cloud className="w-4 h-4 text-[#1E40AF]" />
              <span>02 / CLOUD & INFRASTRUCTURE</span>
            </div>
            <p className="text-xs text-[#52514E] mb-3 leading-relaxed">
              Amazon Web Services architecture, identity access controls, and virtualized workloads.
            </p>
            <div className="space-y-1 font-mono text-xs text-[#141413]">
              <div>• AWS Certified Cloud Practitioner</div>
              <div>• VPC, EC2, S3, RDS, Lambda, IAM, EFS</div>
              <div>• Linux (Ubuntu), Bash Shell, Docker</div>
            </div>
          </div>

          {/* Discipline 3 */}
          <div className="p-5 rounded-lg bg-[#F3F1EC] border border-[#E5E2DC]">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#141413] mb-3">
              <Network className="w-4 h-4 text-[#1E40AF]" />
              <span>03 / NETWORKING & PROTOCOLS</span>
            </div>
            <p className="text-xs text-[#52514E] mb-3 leading-relaxed">
              Cisco campus network configurations, routing protocol convergence, and address allocation.
            </p>
            <div className="space-y-1 font-mono text-xs text-[#141413]">
              <div>• Cisco IOS, Packet Tracer Topologies</div>
              <div>• IPv4/IPv6, Subnetting, VLSM</div>
              <div>• VLANs, 802.1Q, OSPFv2, NAT/PAT, ACLs</div>
            </div>
          </div>

          {/* Discipline 4 */}
          <div className="p-5 rounded-lg bg-[#F3F1EC] border border-[#E5E2DC]">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#141413] mb-3">
              <Server className="w-4 h-4 text-[#1E40AF]" />
              <span>04 / AUTOMATION TESTING & QA</span>
            </div>
            <p className="text-xs text-[#52514E] mb-3 leading-relaxed">
              Enterprise test automation frameworks applied during associate software engineering work.
            </p>
            <div className="space-y-1 font-mono text-xs text-[#141413]">
              <div>• Selenium WebDriver, TestNG</div>
              <div>• Page Object Model (POM) Design</div>
              <div>• Data-Driven Test Automation</div>
            </div>
          </div>

          {/* Discipline 5 */}
          <div className="p-5 rounded-lg bg-[#F3F1EC] border border-[#E5E2DC]">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#141413] mb-3">
              <GitBranch className="w-4 h-4 text-[#1E40AF]" />
              <span>05 / TOOLING & PIPELINES</span>
            </div>
            <p className="text-xs text-[#52514E] mb-3 leading-relaxed">
              Version control, continuous integration webhooks, and enterprise workflow automation.
            </p>
            <div className="space-y-1 font-mono text-xs text-[#141413]">
              <div>• Git, GitHub Actions, Webhooks</div>
              <div>• Microsoft Power Automate, PVA</div>
              <div>• MongoDB, Document Caching</div>
            </div>
          </div>

          {/* Discipline 6 */}
          <div className="p-5 rounded-lg bg-[#F3F1EC] border border-[#E5E2DC]">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#141413] mb-3">
              <Shield className="w-4 h-4 text-[#1E40AF]" />
              <span>06 / SECURITY & DIAGNOSTICS</span>
            </div>
            <p className="text-xs text-[#52514E] mb-3 leading-relaxed">
              Network security controls, packet capture diagnostics, and automated secret scanning.
            </p>
            <div className="space-y-1 font-mono text-xs text-[#141413]">
              <div>• Access Control Lists (Standard/Extended)</div>
              <div>• Wireshark Packet Inspection, Nmap</div>
              <div>• HMAC-SHA256 Webhook Verification</div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Experience & Education Ledger */}
      <section id="about" ref={aboutSection.ref} className="py-16 border-t border-[#E5E2DC] bg-[#F3F1EC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border border-[#E5E2DC] rounded-lg bg-[#FAF9F5] p-6 sm:p-8">
            <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-1">
              CHRONOLOGY & BACKGROUND
            </div>
            <h2 className="text-2xl font-bold text-[#141413] tracking-tight mb-6">
              Professional Experience & Credentials
            </h2>

            {/* Timeline Ledger */}
            <div className="space-y-8 divide-y divide-[#E5E2DC]">
              {/* Position 1 */}
              <div className="pt-6 first:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                  <div className="text-base font-bold text-[#141413]">
                    Associate Software Engineer — Tech Mahindra Limited
                  </div>
                  <div className="font-mono text-xs text-[#85837D]">
                    Dec 2024 – May 2026 • Hyderabad, India
                  </div>
                </div>
                <div className="text-xs font-mono text-[#1E40AF] mb-2">
                  Professional Employment • Software Quality & Test Automation
                </div>
                <p className="text-xs text-[#52514E] leading-relaxed mb-3">
                  Developed and maintained automated regression suites in Java using Selenium WebDriver and TestNG. Implemented Page Object Model (POM) architectural design to enhance test suite maintainability, executed functional testing, and documented defects for engineering resolution.
                </p>
              </div>

              {/* Position 2 */}
              <div className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                  <div className="text-base font-bold text-[#141413]">
                    Intern — TechStar Group Inc
                  </div>
                  <div className="font-mono text-xs text-[#85837D]">
                    May 2023 – July 2023 • Hyderabad, India
                  </div>
                </div>
                <div className="text-xs font-mono text-[#1E40AF] mb-2">
                  Internship • Enterprise Process Automation
                </div>
                <p className="text-xs text-[#52514E] leading-relaxed">
                  Engineered internal service query chatbot workflows using Microsoft Power Platform (Power Automate and Power Virtual Agents) to automate employee support inquiries and reduce turnaround time.
                </p>
              </div>

              {/* Education & Certification Ledger Grid */}
              <div className="pt-6">
                <div className="font-mono text-xs font-semibold text-[#85837D] uppercase tracking-wider mb-4">
                  VERIFIED EDUCATION & CREDENTIALS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-4 rounded bg-[#F3F1EC] border border-[#E5E2DC]">
                    <div className="text-[#85837D] uppercase text-[10px] mb-1">ACADEMIC DEGREE</div>
                    <div className="font-bold text-[#141413] text-sm">B.E. Computer Science & Engineering</div>
                    <div className="text-[#52514E] mt-1 font-sans text-xs">
                      Matrusri Engineering College (Osmania University) • 2020 – 2024
                    </div>
                    <div className="mt-2 text-emerald-800 font-bold">Graduation CGPA: 8.1 / 10.0</div>
                  </div>

                  <div className="p-4 rounded bg-[#F3F1EC] border border-[#E5E2DC]">
                    <div className="text-[#85837D] uppercase text-[10px] mb-1">CLOUD CERTIFICATION</div>
                    <div className="font-bold text-[#141413] text-sm">AWS Certified Cloud Practitioner</div>
                    <div className="text-[#52514E] mt-1 font-sans text-xs">
                      Amazon Web Services (CLF-C02)
                    </div>
                    <div className="mt-2 text-[#1E40AF] font-bold">Foundational Cloud & Security Architecture</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Architecture Section: Automated GitHub Verification */}
      <section
        id="platform"
        ref={platformSection.ref}
        className="py-16 border-t border-[#E5E2DC] bg-[#FAF9F5]"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 rounded-lg bg-[#F3F1EC] border border-[#E5E2DC]">
            <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold text-[#1E40AF] uppercase tracking-wider">
              <GitBranch className="w-4 h-4" />
              <span>PORTFOLIO PLATFORM ARCHITECTURE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#141413] tracking-tight mb-2">
              Automated Portfolio Maintained via GitHub Webhooks
            </h2>
            <p className="text-xs sm:text-sm text-[#52514E] leading-relaxed mb-6 font-normal">
              This portfolio is an active engineering application with an automated backend synchronization pipeline. When new code is pushed to monitored repositories, an automated event is processed through the following verified pipeline:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E2DC] flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#141413] font-semibold">HMAC-SHA256 Payload Verification</div>
                  <div className="text-[#52514E] text-[11px] font-sans mt-0.5">
                    Timing-safe cryptographic signature validation on raw webhook payloads.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E2DC] flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#141413] font-semibold">Atomic Job Queue Processing</div>
                  <div className="text-[#52514E] text-[11px] font-sans mt-0.5">
                    Coalesces rapid pushes and claims jobs atomically to prevent race conditions.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E2DC] flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#141413] font-semibold">Full-Repository AST & Manifest Extraction</div>
                  <div className="text-[#52514E] text-[11px] font-sans mt-0.5">
                    Parses project file trees, dependency manifests, and verified code implementations.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E2DC] flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#141413] font-semibold">Secret Scanning & Deterministic Safety</div>
                  <div className="text-[#52514E] text-[11px] font-sans mt-0.5">
                    Redacts private credentials and guards against unintended sensitive disclosures.
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

      {/* In-Browser Interactive Resume Viewer (Floating Card Hovering on Page) */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden animate-fadeIn">
          {/* Backdrop over existing portfolio page */}
          <div
            className="fixed inset-0 bg-[#141413]/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseResumeModal}
          />

          {/* Floating Resume Card */}
          <div className="relative w-full max-w-4xl lg:max-w-5xl bg-[#FAF9F5] border border-[#E5E2DC] rounded-xl shadow-2xl overflow-hidden z-10 h-[92vh] flex flex-col">
            {/* Top-Right Circular Close Button */}
            <button
              type="button"
              onClick={handleCloseResumeModal}
              className="absolute top-3.5 right-4 sm:top-4 sm:right-6 z-20 w-8 h-8 rounded-full bg-[#F3F1EC] hover:bg-[#EAE7E0] text-[#52514E] hover:text-[#141413] border border-[#E5E2DC] flex items-center justify-center transition-all shadow-md cursor-pointer"
              title="Back to Portfolio (Esc)"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Embedded Interactive Resume */}
            <div className="flex-1 w-full h-full bg-[#FAF9F5] overflow-hidden">
              <iframe
                src="/resume.html"
                title="Sumith Mittapelli Interactive Resume"
                className="w-full h-full border-none block"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
