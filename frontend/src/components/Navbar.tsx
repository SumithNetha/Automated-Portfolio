import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GitBranch, Shield, Terminal, User, ExternalLink, FileText, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

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
    { id: 'projects', label: 'Selected Work', hideClass: '' },
    { id: 'labs', label: 'Networking Labs', hideClass: '' },
    { id: 'skills', label: 'Capabilities', hideClass: 'hidden md:block' },
    { id: 'about', label: 'Experience & About', hideClass: 'hidden sm:block' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E2DC] bg-[#FAF9F5]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Editorial Brand Mark */}
        <Link to="/" className="flex items-center gap-3 group" aria-label="Sumith Mittapelli Portfolio Home">
          <BrandLogo size={34} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-[#141413] group-hover:text-[#1E40AF] transition-colors">
                Sumith Mittapelli
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-[#52514E] bg-[#F3F1EC] border border-[#E5E2DC]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#85837D] hidden sm:block">
              Software Engineer • Cloud & Networking
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-4 text-xs font-mono font-medium">
          {!isAdmin ? (
            <>
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleScrollToSection(e, link.id)}
                    className={`px-3 py-1.5 rounded-md transition-all duration-150 relative ${link.hideClass} ${
                      isActive
                        ? 'text-[#141413] font-semibold bg-[#F3F1EC] border border-[#E5E2DC]'
                        : 'text-[#52514E] hover:text-[#141413] hover:bg-[#F3F1EC]/60'
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}

              {/* Action Buttons: Resume & PDF */}
              <div className="flex items-center gap-1 bg-[#F3F1EC] border border-[#E5E2DC] rounded-md p-0.5 ml-1">
                <button
                  type="button"
                  onClick={() => {
                    if (location.pathname !== '/') {
                      window.location.href = '/#resume';
                    } else {
                      window.dispatchEvent(new CustomEvent('open-resume-preview'));
                    }
                  }}
                  className="px-2.5 py-1 rounded text-xs font-mono font-medium text-[#141413] hover:bg-[#EAE7E0] transition-all flex items-center gap-1.5 cursor-pointer"
                  title="View resume within this page"
                >
                  <FileText className="w-3.5 h-3.5 text-[#52514E]" />
                  <span>Resume</span>
                </button>
                <a
                  href="/api/resume/download"
                  download="Sumith_Mittapelli_Resume.pdf"
                  className="px-2 py-1 rounded text-xs font-mono font-medium text-[#1E40AF] hover:text-[#1D4ED8] hover:bg-[#EAE7E0] transition-all flex items-center gap-1 border-l border-[#E5E2DC] pl-1.5"
                  title="Download Resume PDF directly"
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
                className="px-3 py-1.5 rounded-md text-[#1E40AF] hover:text-[#1D4ED8] bg-[#F3F1EC] border border-[#E5E2DC] transition-colors flex items-center gap-1.5 text-xs font-mono"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Public Portfolio
              </Link>
              {isAuthenticated && (
                <div className="px-2.5 py-1 rounded-md bg-[#141413] text-[#FAF9F5] flex items-center gap-1.5 text-[11px] font-mono font-semibold">
                  <Shield className="w-3 h-3 text-emerald-400" />
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
