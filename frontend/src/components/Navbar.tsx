import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GitBranch, Shield, Terminal, User, ExternalLink, FileText, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');
  const [activeSection, setActiveSection] = React.useState<string>('');

  // Scroll spy to highlight active section in navbar
  React.useEffect(() => {
    if (isAdmin) return;

    const sections = ['projects', 'labs', 'skills', 'about', 'platform'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      if (window.scrollY < 300) {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAdmin]);

  // Smooth scroll with arrival effect
  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();

    if (location.pathname !== '/') {
      window.location.href = `/#${targetId}`;
      return;
    }

    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    setActiveSection(targetId);

    // Calculate position taking fixed 64px header into account
    const headerOffset = 76;
    const elementPosition = targetEl.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });

    // Apply arrival glow effect
    targetEl.classList.remove('section-arrive-highlight');
    // Force DOM reflow to re-trigger CSS keyframe if already clicked
    void targetEl.offsetWidth;
    targetEl.classList.add('section-arrive-highlight');

    setTimeout(() => {
      targetEl.classList.remove('section-arrive-highlight');
    }, 1500);
  };

  const navLinks = [
    { id: 'projects', label: 'Projects', hideClass: '' },
    { id: 'labs', label: 'Networking Labs', hideClass: '' },
    { id: 'skills', label: 'Skills & Tools', hideClass: 'hidden md:block' },
    { id: 'about', label: 'About', hideClass: 'hidden sm:block' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group" aria-label="Sumith Mittapelli Portfolio Home">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sky-400 group-hover:border-sky-500/50 transition-colors shadow-sm">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-sky-400 transition-colors">
                Sumith Mittapelli
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Software Engineer | Cloud & Networking
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-4 text-sm font-medium">
          {!isAdmin ? (
            <>
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleScrollToSection(e, link.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 relative ${link.hideClass} ${
                      isActive
                        ? 'text-sky-400 bg-sky-500/10 border border-sky-500/30 font-semibold shadow-sm shadow-sky-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                    )}
                  </a>
                );
              })}
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
                <a
                  href="/resume.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5"
                  title="Preview interactive resume"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Resume</span>
                </a>
                <a
                  href="/resume.pdf"
                  download="Sumith_Mittapelli_Resume.pdf"
                  className="px-2 py-1 rounded-md text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-all flex items-center gap-1 border-l border-slate-800 pl-1.5"
                  title="Download Resume PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </a>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="px-3 py-1.5 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Portfolio
              </Link>
              {isAuthenticated && (
                <div className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center gap-1.5 text-xs font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Mode</span>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
