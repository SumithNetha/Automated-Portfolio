import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

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
        'Available commands:\n  about     - Professional background and identity\n  skills    - Technical skills, tools, and platforms\n  projects  - Curated engineering repositories\n  labs      - Practical networking laboratories\n  github    - GitHub profile and repository links\n  ping      - Simulated ICMP network diagnostic\n  clear     - Clear terminal buffer',
    },
  ]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll inside terminal container only (prevents unwanted window scrolling)
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTo({
        top: terminalBodyRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [history]);

  // Subtle 3D Perspective tilt handler
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
          'Available commands:\n  about     - Professional background and identity\n  skills    - Technical skills, tools, and platforms\n  projects  - Curated engineering repositories\n  labs      - Practical networking laboratories\n  github    - GitHub profile and repository links\n  ping      - Simulated ICMP network diagnostic\n  clear     - Clear terminal buffer',
      });
      setHistory(newHistory);
    } else if (trimmed === 'about' || trimmed === 'bio') {
      newHistory.push({
        type: 'output',
        content:
          'Sumith Mittapelli | Software Engineer | Cloud & Networking\n' +
          '• B.E. Computer Science and Engineering, Matrusri Engineering College (2024, 8.1 CGPA)\n' +
          '• Former Associate Software Engineer at Tech Mahindra\n' +
          '• AWS Certified Cloud Practitioner\n' +
          '• Practical Cisco networking & CCNA-level hands-on laboratory experience\n' +
          '• Based in Hyderabad, India',
      });
      setHistory(newHistory);
    } else if (trimmed === 'skills') {
      newHistory.push({
        type: 'output',
        content:
          'Technical Skills & Tools:\n' +
          '• Programming & Development: Java, Python, JavaScript, TypeScript, PHP, React, Node.js, Express\n' +
          '• Cloud & Infrastructure: AWS (EC2, VPC, S3, RDS, Lambda, EFS), Linux, Bash, Docker\n' +
          '• Networking: Cisco IOS, IPv4/IPv6, Subnetting, VLANs, Trunking, STP, NAT/PAT, ACLs, OSPF, HSRP\n' +
          '• Automation & Testing: Selenium, TestNG, Data-driven testing, Git, GitHub Actions\n' +
          '• Security & Tools: Network security fundamentals, Wireshark, Nmap, Network intrusion detection',
      });
      setHistory(newHistory);
    } else if (trimmed === 'projects') {
      newHistory.push({
        type: 'output',
        content:
          'Curated Engineering Projects:\n' +
          '1. MECS Placement Portal — Web-based placement management platform\n' +
          '2. IoT Network Intrusion Detection — ML intrusion detection in IoT traffic using CNN\n' +
          '3. Cisco CCNA Practical Labs — Practical networking exercises (VLANs, OSPF, NAT, ACLs)\n' +
          '4. CarCare Connect — Web application for automotive maintenance workflows\n' +
          '5. DoodleRush — Real-time multiplayer drawing and guessing game\n' +
          '6. Ringside Rumble — Real-time multiplayer wrestling card game\n' +
          '7. Automated Portfolio — Automated GitHub push analysis and controlled publication',
      });
      setHistory(newHistory);
    } else if (trimmed === 'labs') {
      newHistory.push({
        type: 'output',
        content:
          'Practical Cisco Networking Laboratories:\n' +
          '• VLAN Segmentation & Trunking: 802.1Q encapsulation, Native VLAN, Inter-VLAN routing, VTP\n' +
          '• OSPF Dynamic Routing: OSPFv2, single/multi-area, DR/BDR election, neighbor adjacency, metrics\n' +
          '• Network Security & NAT: Standard/Extended ACLs, dynamic NAT, PAT / NAT Overload, RFC 1918\n' +
          '• Additional: STP/RSTP, EtherChannel, LACP, HSRP, IPv4/IPv6, Subnetting & VLSM',
      });
      setHistory(newHistory);
    } else if (trimmed === 'github') {
      newHistory.push({
        type: 'output',
        content:
          'GitHub Profile: https://github.com/SumithNetha\n' +
          'Repository: https://github.com/SumithNetha/Automated-Portfolio\n' +
          'All repositories are verified against real commit histories and manifests.',
      });
      setHistory(newHistory);
    } else if (trimmed === 'ping') {
      setIsPinging(true);
      newHistory.push({
        type: 'output',
        content:
          '[SIMULATION: ICMP Echo diagnostic to 8.8.8.8]\n' +
          'PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n' +
          '64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=1.42 ms (simulated)\n' +
          '64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=1.38 ms (simulated)\n' +
          '64 bytes from 8.8.8.8: icmp_seq=3 ttl=118 time=1.41 ms (simulated)\n' +
          '--- 8.8.8.8 simulated ping statistics ---\n' +
          '3 packets transmitted, 3 received, 0% packet loss\n' +
          'Notice: Synthetic test for terminal interaction demonstration.',
      });
      setHistory(newHistory);
      setTimeout(() => setIsPinging(false), 600);
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
      {/* Subtle ambient border backlight */}
      <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/10 via-slate-700/10 to-emerald-500/10 rounded-2xl blur-lg opacity-40 pointer-events-none" />

      {/* Main Terminal Card */}
      <div
        style={{
          transform: isHovered
            ? `rotateY(${mousePos.x * 4}deg) rotateX(${-mousePos.y * 4}deg) translateZ(8px)`
            : 'rotateY(0deg) rotateX(0deg) translateZ(0px)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        }}
        className="relative rounded-2xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden"
      >
        {/* Terminal Title Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          {/* Window Title */}
          <div className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>sumith@enterprise-gw: ~ (bash)</span>
          </div>

          {/* Explicit Simulation Label as instructed */}
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/80 font-medium">
            DEMO TERMINAL — SIMULATED OUTPUT
          </span>
        </div>

        {/* Terminal Body */}
        <div
          ref={terminalBodyRef}
          className="p-4 text-[12.5px] leading-relaxed text-slate-300 h-96 overflow-y-auto terminal-scrollbar flex flex-col font-mono"
          onClick={() => inputRef.current?.focus()}
        >
          {/* System Banner */}
          <div className="text-slate-400 text-xs mb-1">
            Sumith Mittapelli Terminal Interface v2.4 (x86_64-pc-linux-gnu)
          </div>
          <div className="text-slate-400 text-xs mb-3">
            Type <span className="text-sky-400 font-semibold">'help'</span> or select a command below to explore credentials.
          </div>
          <div className="text-emerald-400 text-xs flex items-center gap-1.5 mb-3">
            <span>✓</span>
            <span>Local demo sandbox active • Factual profile loaded</span>
          </div>

          {/* History */}
          {history.map((entry, idx) => (
            <div key={idx} className="mb-2.5">
              {entry.type === 'cmd' ? (
                <div className="flex items-center gap-2 text-white">
                  <span className="text-emerald-400 font-bold text-xs">visitor@mittapelli:~$</span>
                  <span className="font-semibold text-slate-100">{entry.content}</span>
                </div>
              ) : (
                <div
                  className={`whitespace-pre-wrap pl-0 text-xs ${
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
            <span className="text-emerald-400 font-bold text-xs shrink-0">visitor@mittapelli:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-xs p-0 focus:ring-0"
              placeholder={isPinging ? 'Simulating ping...' : 'Type command (about, skills, projects, labs, github)...'}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <span className="w-1.5 h-3.5 bg-sky-400 animate-pulse shrink-0" />
          </form>
        </div>

        {/* Quick Action Chips Footer */}
        <div className="px-3.5 py-2 bg-slate-900/70 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 text-[11px] hidden sm:inline">Commands:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['about', 'skills', 'projects', 'labs', 'github', 'ping', 'clear'].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  executeCommand(cmd);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-300 border border-slate-700/80 text-[11px] transition-colors focus-visible:ring-1 focus-visible:ring-sky-400"
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
