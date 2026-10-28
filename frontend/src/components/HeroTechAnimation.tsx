import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Cpu,
  Network,
  Cloud,
  CheckCircle2,
  Terminal,
  Zap,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TelemetryEvent {
  time: string;
  stage: string;
  detail: string;
  color: string;
}

const TELEMETRY_FEED: TelemetryEvent[] = [
  {
    time: '00:01.2',
    stage: 'GIT HOOK',
    detail: 'Push event detected: feat(routing): OSPF Area 0 & NAT Overload',
    color: 'text-sky-400',
  },
  {
    time: '00:02.1',
    stage: 'SECURITY',
    detail: 'Secret scanner verified: 0 credentials exposed in tree',
    color: 'text-emerald-400',
  },
  {
    time: '00:03.4',
    stage: 'EVIDENCE',
    detail: 'Validated 11 Cisco .pkt & .ios configs in Week-07/17',
    color: 'text-amber-400',
  },
  {
    time: '00:04.6',
    stage: 'GEMINI AI',
    detail: 'Synthesizing architecture facts with 99.4% confidence',
    color: 'text-purple-400',
  },
  {
    time: '00:05.2',
    stage: 'LIVE SYNC',
    detail: 'Portfolio entry published • Demo URL verified • 200 OK',
    color: 'text-cyan-400',
  },
  {
    time: '00:06.0',
    stage: 'VIBE CODING',
    detail: 'Agentic AI pairing active • Rapid systems synthesis',
    color: 'text-sky-300',
  },
];

export const HeroTechAnimation: React.FC = () => {
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Cycle telemetry ticker every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEventIndex((prev) => (prev + 1) % TELEMETRY_FEED.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

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

  const currentEvent = TELEMETRY_FEED[activeEventIndex];

  return (
    <div
      className="relative w-full max-w-xl mx-auto select-none"
      style={{ perspective: '1200px' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient Cyber Aura Glow behind the card */}
      <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 via-cyan-500/20 to-indigo-600/20 rounded-3xl blur-2xl opacity-70 pointer-events-none transition-opacity duration-700 group-hover:opacity-100" />

      {/* Floating Hologram Chip 1: Top Right */}
      <div className="absolute -top-4 -right-2 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-lg backdrop-blur-md animate-float-slow">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>Live Webhook Sync Active</span>
      </div>

      {/* Floating Hologram Chip 2: Bottom Left */}
      <div className="absolute -bottom-4 -left-2 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-sky-500/30 text-sky-300 text-xs font-semibold shadow-lg backdrop-blur-md animate-float-delayed">
        <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
        <span>100% Grounded in GitHub Evidence</span>
      </div>

      {/* Main Console Chassis with 3D Tilt */}
      <div
        className="relative rounded-2xl bg-slate-900/85 border border-slate-700/70 p-6 shadow-2xl backdrop-blur-xl overflow-hidden transition-transform duration-200 ease-out"
        style={{
          transform: isHovered
            ? `rotateY(${mousePos.x * 12}deg) rotateX(${-mousePos.y * 12}deg) translateZ(10px)`
            : 'rotateY(0deg) rotateX(0deg) translateZ(0px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Window / Telemetry Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 ml-2">pipeline-monitor.v2</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>ONLINE</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">0.04s latency</span>
          </div>
        </div>

        {/* Central Architecture Topology Graphic */}
        <div className="relative h-64 my-4 flex items-center justify-center">
          {/* Animated Connecting SVG Laser Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 460 256">
            <defs>
              <linearGradient id="laserSky" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="laserEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Path 1: GitHub (Top-Left 80, 50) -> Center Core (230, 128) */}
            <path
              d="M 90 60 Q 140 120 210 128"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
            />
            <path
              d="M 90 60 Q 140 120 210 128"
              fill="none"
              stroke="url(#laserSky)"
              strokeWidth="2"
              className="animate-laser"
            />

            {/* Path 2: CCNA Labs (Bottom-Left 80, 200) -> Center Core (230, 128) */}
            <path
              d="M 90 196 Q 140 136 210 128"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
            />
            <path
              d="M 90 196 Q 140 136 210 128"
              fill="none"
              stroke="url(#laserSky)"
              strokeWidth="2"
              className="animate-laser-fast"
            />

            {/* Path 3: Center Core (230, 128) -> Cloud (Top-Right 370, 60) */}
            <path
              d="M 250 128 Q 320 120 370 60"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
            />
            <path
              d="M 250 128 Q 320 120 370 60"
              fill="none"
              stroke="url(#laserEmerald)"
              strokeWidth="2"
              className="animate-laser"
            />

            {/* Path 4: Center Core (230, 128) -> Verified Live (Bottom-Right 370, 196) */}
            <path
              d="M 250 128 Q 320 136 370 196"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
            />
            <path
              d="M 250 128 Q 320 136 370 196"
              fill="none"
              stroke="url(#laserEmerald)"
              strokeWidth="2"
              className="animate-laser-fast"
            />
          </svg>

          {/* Node 1: GitHub Origin (Top-Left) */}
          <div
            onMouseEnter={() => setActiveNode('github')}
            onMouseLeave={() => setActiveNode(null)}
            className="absolute top-2 left-4 flex flex-col items-center group/node cursor-pointer transition-transform hover:scale-105"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10 group-hover/node:border-sky-400">
              <GitBranch className="w-6 h-6 animate-pulse" />
            </div>
            <div className="mt-1 text-center">
              <div className="text-[11px] font-bold text-white tracking-wide">Git Push</div>
              <div className="text-[9px] font-mono text-sky-400">webhook.ts</div>
            </div>
          </div>

          {/* Node 2: Cisco CCNA Labs (Bottom-Left) */}
          <div
            onMouseEnter={() => setActiveNode('ccna')}
            onMouseLeave={() => setActiveNode(null)}
            className="absolute bottom-2 left-4 flex flex-col items-center group/node cursor-pointer transition-transform hover:scale-105"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 group-hover/node:border-cyan-400">
              <Network className="w-6 h-6" />
            </div>
            <div className="mt-1 text-center">
              <div className="text-[11px] font-bold text-white tracking-wide">Cisco Labs</div>
              <div className="text-[9px] font-mono text-cyan-400">NAT & OSPF</div>
            </div>
          </div>

          {/* Center Centerpiece: Gemini AI Engine Core */}
          <div
            onMouseEnter={() => setActiveNode('ai')}
            onMouseLeave={() => setActiveNode(null)}
            className="relative flex flex-col items-center group/core cursor-pointer z-10 transition-transform hover:scale-110"
          >
            {/* Glowing outer rings */}
            <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 opacity-40 blur-md animate-pulse" />
            <div className="absolute -inset-6 rounded-full border border-sky-500/30 animate-pulse-ring pointer-events-none" />
            <div className="absolute -inset-10 rounded-full border border-indigo-500/20 animate-spin-orbit pointer-events-none" />

            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-cyan-300">
                <Cpu className="w-7 h-7 text-cyan-300 animate-pulse" />
                <span className="text-[8px] font-mono font-bold tracking-widest text-sky-300 uppercase">
                  AI CORE
                </span>
              </div>
            </div>

            <div className="mt-2 text-center">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 border border-sky-400/30 text-sky-300">
                Gemini Engine
              </span>
            </div>
          </div>

          {/* Node 3: Cloud Architectures (Top-Right) */}
          <div
            onMouseEnter={() => setActiveNode('cloud')}
            onMouseLeave={() => setActiveNode(null)}
            className="absolute top-2 right-4 flex flex-col items-center group/node cursor-pointer transition-transform hover:scale-105"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 group-hover/node:border-indigo-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div className="mt-1 text-center">
              <div className="text-[11px] font-bold text-white tracking-wide">Cloud Systems</div>
              <div className="text-[9px] font-mono text-indigo-400">AWS & Docker</div>
            </div>
          </div>

          {/* Node 4: Verified Portfolio Live (Bottom-Right) */}
          <div
            onMouseEnter={() => setActiveNode('live')}
            onMouseLeave={() => setActiveNode(null)}
            className="absolute bottom-2 right-4 flex flex-col items-center group/node cursor-pointer transition-transform hover:scale-105"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 group-hover/node:border-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="mt-1 text-center">
              <div className="text-[11px] font-bold text-white tracking-wide">Live Demo</div>
              <div className="text-[9px] font-mono text-emerald-400">Vercel & Render</div>
            </div>
          </div>
        </div>

        {/* Dynamic Node Detail Callout (appears on hover) */}
        <div className="min-h-[28px] text-center mb-2">
          {activeNode === 'github' && (
            <p className="text-xs text-sky-300 font-mono animate-fadeIn">
              ⚡ Webhook listener captures push events and commit manifests in real time
            </p>
          )}
          {activeNode === 'ccna' && (
            <p className="text-xs text-cyan-300 font-mono animate-fadeIn">
              🌐 Cisco CCNA labs: 11 weeks of verified .ios CLI running configs & Packet Tracer files
            </p>
          )}
          {activeNode === 'ai' && (
            <p className="text-xs text-purple-300 font-mono animate-fadeIn">
              🧠 Google Gemini AI synthesizes architecture without fabricating ungrounded claims
            </p>
          )}
          {activeNode === 'cloud' && (
            <p className="text-xs text-indigo-300 font-mono animate-fadeIn">
              ☁️ Cloud re/Start Python automation, Leaflet maps, and containerized microservices
            </p>
          )}
          {activeNode === 'live' && (
            <p className="text-xs text-emerald-300 font-mono animate-fadeIn">
              🚀 Direct demonstration links verified and rendered alongside repository code
            </p>
          )}
          {!activeNode && (
            <p className="text-[11px] text-slate-500 font-mono">
              Hover over any node to inspect telemetry & verified evidence flow
            </p>
          )}
        </div>

        {/* Live Event Terminal Log Ticker */}
        <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-800/60 text-[10px] text-slate-400 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Autonomous Pipeline Event Stream</span>
            <span className="ml-auto flex items-center gap-1 text-emerald-400 font-mono text-[9px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              STREAMING
            </span>
          </div>

          <div className="flex items-start gap-2 pt-0.5">
            <span className="text-slate-500 text-[10px] select-none">[{currentEvent.time}]</span>
            <span
              className={`font-bold text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 ${currentEvent.color}`}
            >
              {currentEvent.stage}
            </span>
            <span className="text-slate-200 text-[11px] flex-1 truncate">
              {currentEvent.detail}
            </span>
            <span className="w-1.5 h-3 bg-sky-400 animate-pulse ml-1 inline-block" />
          </div>
        </div>

        {/* Quick Capabilities Bar at the bottom */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-sky-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Vibe Coded Architecture</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero Hallucinations</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>CI/CD Grounded</span>
          </span>
        </div>
      </div>
    </div>
  );
};
