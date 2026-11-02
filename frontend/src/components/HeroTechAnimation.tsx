import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Sparkles } from 'lucide-react';

interface TerminalEntry {
  type: 'cmd' | 'output' | 'error' | 'success';
  content: string;
}

export const HeroTechAnimation: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<TerminalEntry[]>([
    {
      type: 'cmd',
      content: 'help',
    },
    {
      type: 'output',
      content:
        'Available commands:\n  bio        - View background and technical profile\n  certs      - List CCNA and networking certifications\n  skills     - Print key full-stack & systems competencies\n  ping       - Run simulated ICMP ping test to 8.8.8.8\n  projects   - Show featured automated engineering projects\n  clear      - Clear the terminal screen',
    },
  ]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of terminal when history changes
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // 3D Perspective tilt handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === 'clear') {
      setHistory([]);
      return;
    }

    const newHistory: TerminalEntry[] = [
      ...history,
      { type: 'cmd', content: cmd },
    ];

    if (trimmed === 'help') {
      newHistory.push({
        type: 'output',
        content:
          'Available commands:\n  bio        - View background and technical profile\n  certs      - List CCNA and networking certifications\n  skills     - Print key full-stack & systems competencies\n  ping       - Run simulated ICMP ping test to 8.8.8.8\n  projects   - Show featured automated engineering projects\n  clear      - Clear the terminal screen',
      });
      setHistory(newHistory);
    } else if (trimmed === 'bio') {
      newHistory.push({
        type: 'output',
        content:
          'Sumith Mittapelli | Systems & Full-Stack Engineer\nBased in Hyderabad, India.\nSpecializing in bridging Cisco CCNA enterprise networking fundamentals with autonomous AI Vibe Coding and resilient full-stack cloud platforms.',
      });
      setHistory(newHistory);
    } else if (trimmed === 'certs') {
      newHistory.push({
        type: 'success',
        content:
          '[✓] Cisco Certified Network Associate (CCNA) Curriculum & Enterprise Labs\n[✓] AWS Certified Cloud Practitioner\n[✓] B.E. Computer Science & Engineering (Matrusri Eng. College • 8.1 CGPA)',
      });
      setHistory(newHistory);
    } else if (trimmed === 'skills') {
      newHistory.push({
        type: 'output',
        content:
          '• AI Vibe Coding: Agentic AI pairing (Claude, Gemini), high-velocity architecture, automated test suites\n• Systems & Networking: Cisco IOS, OSPF Area 0, BGP, VLANs, 802.1Q, HSRP, Wireshark, PAT\n• Full-Stack: TypeScript, Node.js, Express, React, Python, REST & Webhooks\n• Cloud & DevOps: Docker, Linux (Ubuntu), Git CI/CD, AWS, Zero-Trust',
      });
      setHistory(newHistory);
    } else if (trimmed === 'projects') {
      newHistory.push({
        type: 'output',
        content:
          '1. AI Portfolio Ingestion Engine\n   Automated GitHub webhook pipeline, Gemini AI classifier, HMAC-SHA256 verification (24 tests pass)\n2. CCNA Enterprise Campus Mesh & PacketPulse\n   OSPF Area 0, 802.1Q trunking, HSRP gateway failover, ICMP packet trace\n3. Zero-Trust Ingress Security Gateway\n   Reverse proxy, token bucket rate limiter, mTLS & JWT security',
      });
      setHistory(newHistory);
    } else if (trimmed === 'ping') {
      setIsPinging(true);
      newHistory.push({
        type: 'output',
        content:
          'PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=1.42 ms\n64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=1.38 ms\n64 bytes from 8.8.8.8: icmp_seq=3 ttl=118 time=1.41 ms\n--- 8.8.8.8 ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss, time 2002ms\nrtt min/avg/max/mdev = 1.38/1.40/1.42/0.02 ms',
      });
      setHistory(newHistory);
      setTimeout(() => setIsPinging(false), 800);
    } else {
      newHistory.push({
        type: 'error',
        content: `bash: ${cmd}: command not found. Type 'help' for available commands.`,
      });
      setHistory(newHistory);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    executeCommand(inputVal);
    setInputVal('');
  };

  return (
    <div
      className="relative w-full max-w-xl mx-auto select-none font-mono"
      style={{ perspective: '1200px' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient Cyber Aura Glow behind card */}
      <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 via-cyan-500/15 to-emerald-500/20 rounded-3xl blur-2xl opacity-75 pointer-events-none transition-opacity duration-700" />

      {/* Main Terminal Card with 3D Tilt */}
      <div
        style={{
          transform: isHovered
            ? `rotateY(${mousePos.x * 6}deg) rotateX(${-mousePos.y * 6}deg) translateZ(12px)`
            : 'rotateY(0deg) rotateX(0deg) translateZ(0px)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
        className="relative rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl overflow-hidden"
      >
        {/* Terminal Title Bar */}
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
          {/* Mac Traffic Lights */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block" />
          </div>

          {/* Centered Window Title */}
          <div className="text-xs text-slate-300 font-mono tracking-tight flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>sumith@enterprise-gw: ~ (bash)</span>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-medium">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>vibe-mode: active</span>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          className="p-5 text-[12.5px] leading-relaxed text-slate-300 h-96 overflow-y-auto terminal-scrollbar flex flex-col font-mono"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Welcome & System Banner */}
          <div className="text-slate-400 mb-1">
            Sumith Mittapelli Telemetry Terminal v2.4.0 (x86_64-pc-linux-gnu)
          </div>
          <div className="text-slate-400 mb-3">
            Type <span className="text-sky-400 font-semibold">'help'</span> to see available commands or click quick actions below.
          </div>
          <div className="text-emerald-400 flex items-center gap-1.5 mb-4">
            <span>✓</span>
            <span>Network interfaces initialized. OSPF Area 0 converged.</span>
          </div>

          {/* History */}
          {history.map((entry, idx) => (
            <div key={idx} className="mb-2.5">
              {entry.type === 'cmd' ? (
                <div className="flex items-center gap-2 text-white">
                  <span className="text-emerald-400 font-bold">visitor@mittapelli:~$</span>
                  <span className="font-semibold text-slate-100">{entry.content}</span>
                </div>
              ) : (
                <div
                  className={`whitespace-pre-wrap pl-0 ${
                    entry.type === 'error'
                      ? 'text-rose-400'
                      : entry.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  {entry.content}
                </div>
              )}
            </div>
          ))}

          {/* Active Command Input Line */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
            <span className="text-emerald-400 font-bold shrink-0">visitor@mittapelli:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-[12.5px] p-0 focus:ring-0"
              placeholder={isPinging ? 'Pinging 8.8.8.8...' : 'Type command (bio, certs, skills, ping, projects)...'}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <span className="w-2 h-4 bg-sky-400 animate-pulse shrink-0" />
          </form>

          <div ref={terminalEndRef} />
        </div>

        {/* Quick Action Chips Footer */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 text-[11px] hidden sm:inline">Quick commands:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['bio', 'certs', 'skills', 'ping', 'projects', 'clear'].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => executeCommand(cmd)}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 hover:border-sky-500/40 text-[11px] transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
