import crypto from 'crypto';
import { config } from '../../config';

export interface GitHubRepoSummary {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  htmlUrl: string;
  description: string;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  language: string;
  homepage?: string;
}

export interface WebhookPushPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      name?: string;
      login: string;
    };
    html_url: string;
    default_branch: string;
    private: boolean;
    description: string | null;
  };
  commits: Array<{
    id: string;
    message: string;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  head_commit?: {
    id: string;
    message: string;
    added: string[];
    removed: string[];
    modified: string[];
  };
}

/**
 * Verify GitHub webhook HMAC SHA256 signature
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  secret: string = config.github.webhookSecret
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  const expectedPrefix = 'sha256=';
  if (!signatureHeader.startsWith(expectedPrefix)) {
    return false;
  }

  const signature = signatureHeader.substring(expectedPrefix.length);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody);
  const digest = hmac.digest('hex');

  const signatureBuffer = Buffer.from(signature, 'hex');
  const digestBuffer = Buffer.from(digest, 'hex');

  if (signatureBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
}

/**
 * GitHub API Client with token-awareness and rich offline/mock fallback for tests and zero-credential local dev
 */
export class GitHubService {
  private token: string;

  constructor(token?: string) {
    this.token = token || config.github.personalAccessToken;
  }

  /**
   * Fetch accessible repositories for current user (defaults to SumithNetha)
   */
  async listUserRepositories(): Promise<GitHubRepoSummary[]> {
    // If a personal token is provided, fetch authenticated repos
    if (this.token && !this.token.startsWith('ghp_your')) {
      try {
        const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AI-GitHub-Portfolio',
          },
        });

        if (res.ok) {
          const repos: any = await res.json();
          return repos.map((r: any) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            owner: r.owner.login,
            isPrivate: r.private,
            htmlUrl: r.html_url,
            description: r.description || '',
            defaultBranch: r.default_branch || 'main',
            starsCount: r.stargazers_count || 0,
            forksCount: r.forks_count || 0,
            language: r.language || '',
            homepage: r.homepage || '',
          }));
        }
      } catch (err) {
        console.warn('[GitHubService] Failed to fetch live authenticated repos:', err);
      }
    }

    // Unauthenticated fetch for SumithNetha's public repositories
    try {
      const res = await fetch('https://api.github.com/users/SumithNetha/repos?per_page=100&sort=updated', {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AI-GitHub-Portfolio',
        },
      });

      if (res.ok) {
        const repos: any = await res.json();
        if (Array.isArray(repos) && repos.length > 0) {
          return repos.map((r: any) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            owner: r.owner.login,
            isPrivate: r.private,
            htmlUrl: r.html_url,
            description: r.description || '',
            defaultBranch: r.default_branch || 'main',
            starsCount: r.stargazers_count || 0,
            forksCount: r.forks_count || 0,
            language: r.language || '',
            homepage: r.homepage || '',
          }));
        }
      }
    } catch (err) {
      console.warn('[GitHubService] Error querying public API for SumithNetha, using cached dataset:', err);
    }

    // High-fidelity fallback dataset for SumithNetha's verified engineering repositories
    return [
      {
        id: 70001,
        name: 'CCNA',
        fullName: 'SumithNetha/CCNA',
        owner: 'SumithNetha',
        isPrivate: false,
        htmlUrl: 'https://github.com/SumithNetha/CCNA',
        description:
          'A collection of practical networking exercises covering VLANs, switching, routing, OSPF, NAT, ACLs, IPv4, IPv6, and network troubleshooting.',
        defaultBranch: 'main',
        starsCount: 5,
        forksCount: 1,
        language: 'Cisco IOS',
      },
      {
        id: 70002,
        name: 'CarCARE',
        fullName: 'SumithNetha/CarCARE',
        owner: 'SumithNetha',
        isPrivate: false,
        htmlUrl: 'https://github.com/SumithNetha/CarCARE',
        description: 'A web application project focused on car maintenance and related vehicle-care workflows.',
        defaultBranch: 'main',
        starsCount: 12,
        forksCount: 3,
        language: 'JavaScript',
        homepage: 'https://carcare-connect.vercel.app',
      },
      {
        id: 70003,
        name: 'iot-network-intrusion-detection',
        fullName: 'SumithNetha/iot-network-intrusion-detection',
        owner: 'SumithNetha',
        isPrivate: false,
        htmlUrl: 'https://github.com/SumithNetha/iot-network-intrusion-detection',
        description:
          'A machine-learning project exploring intrusion detection in IoT network traffic using convolutional neural network architectures and network datasets.',
        defaultBranch: 'main',
        starsCount: 8,
        forksCount: 2,
        language: 'Python',
      },
      {
        id: 70004,
        name: 'DoodleRush',
        fullName: 'SumithNetha/DoodleRush',
        owner: 'SumithNetha',
        isPrivate: false,
        htmlUrl: 'https://github.com/SumithNetha/DoodleRush',
        description: 'A real-time multiplayer drawing and guessing game.',
        defaultBranch: 'main',
        starsCount: 10,
        forksCount: 2,
        language: 'TypeScript',
      },
      {
        id: 70005,
        name: 'WWE-Trump-Card-Multiplayer-Game',
        fullName: 'SumithNetha/WWE-Trump-Card-Multiplayer-Game',
        owner: 'SumithNetha',
        isPrivate: false,
        htmlUrl: 'https://github.com/SumithNetha/WWE-Trump-Card-Multiplayer-Game',
        description: 'A real-time multiplayer wrestling card game.',
        defaultBranch: 'main',
        starsCount: 15,
        forksCount: 4,
        language: 'JavaScript',
        homepage: 'https://ringside-rumble.onrender.com',
      },
      {
        id: 70006,
        name: 'MECS-Placement-Portal',
        fullName: 'SumithNetha/MECS-Placement-Portal',
        owner: 'SumithNetha',
        isPrivate: false,
        htmlUrl: 'https://github.com/SumithNetha/MECS-Placement-Portal',
        description:
          'A web-based placement management platform developed to organize placement-related information and simplify administrative workflows.',
        defaultBranch: 'main',
        starsCount: 7,
        forksCount: 2,
        language: 'PHP',
        homepage: 'https://mecs-placement-portal.vercel.app',
      },
      {
        id: 70007,
        name: 'Automated-Portfolio',
        fullName: 'SumithNetha/Automated-Portfolio',
        owner: 'SumithNetha',
        isPrivate: false,
        htmlUrl: 'https://github.com/SumithNetha/Automated-Portfolio',
        description:
          'An automated portfolio platform integrating GitHub repository monitoring, content analysis, and controlled portfolio publication.',
        defaultBranch: 'main',
        starsCount: 6,
        forksCount: 1,
        language: 'TypeScript',
      },
    ];
  }

  /**
   * Fetch repository file tree
   */
  async fetchRepoTree(owner: string, repo: string, branch: string = 'main'): Promise<string[]> {
    // Attempt live fetch first
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'AI-GitHub-Portfolio',
      };
      if (this.token && !this.token.startsWith('ghp_your')) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
        headers,
      });
      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data.tree) && data.tree.length > 0) {
          return data.tree.map((node: any) => node.path);
        }
      }
    } catch (err) {
      // Fallback
    }

    const rLower = repo.toLowerCase();

    if (rLower === 'ccna') {
      return [
        'README.md',
        'Week-07/June-15/Dynamic NAT/dynamic_nat_lab.pkt',
        'Week-07/June-15/NAT Overload/pat_configuration.ios',
        'Week-08/June-22/VLANs/vlan_trunking.ios',
        'Week-09/June-29/Inter-VLAN Routing/router_on_stick.ios',
        'Week-10/July-06/STP Convergence/stp_priority_config.ios',
        'Week-11/July-13/EtherChannel/lacp_pagp_bundles.ios',
        'Week-12/July-20/OSPFv2 Single Area/ospf_area0.ios',
        'Week-13/July-27/OSPFv2 Multi Area/abr_asbr_configs.ios',
        'Week-14/August-03/Standard & Extended ACLs/access_lists.ios',
        'Week-15/August-10/IPv6 Addressing/ipv6_slaac_dhcp.ios',
        'Week-16/August-17/WAN & NAT Verification/pat_pool_verification.txt',
        'Week-17/August-24/Network Automation Basics/cisco_python_netmiko.py',
        'resources/network_topologies.pdf',
      ];
    }

    if (rLower.includes('carcare')) {
      return [
        'README.md',
        'client/package.json',
        'client/src/App.jsx',
        'client/src/components/Navbar.jsx',
        'client/src/components/ProviderCard.jsx',
        'client/src/components/BookingModal.jsx',
        'client/src/components/Map.jsx',
        'client/src/pages/Home.jsx',
        'client/src/pages/Services.jsx',
        'client/src/services/api.js',
        'server/package.json',
        'server/server.js',
        'server/controllers/booking.controller.js',
        'server/controllers/provider.controller.js',
        'server/models/Vehicle.js',
        'server/models/Service.js',
        'server/models/Booking.js',
        'package.json',
      ];
    }

    if (rLower.includes('intrusion') || rLower.includes('iot')) {
      return [
        'README.md',
        'app.py',
        'requirements.txt',
        'models/cnn_ids_model.h5',
        'models/scaler.pkl',
        'data/iot_network_traffic.csv',
        'notebook/iot_ids_cnn_training.ipynb',
        'templates/index.html',
        'templates/dashboard.html',
        'static/style.css',
      ];
    }

    if (rLower.includes('aws')) {
      return [
        'README.md',
        'car_fleet.csv',
        'composite-data.py',
        'conditionals.py',
        'for-loop.py',
        'while-loop.py',
        'numeric-data.py',
        'string-data-type.py',
        'categorize-values.py',
        'collections.py',
        'c9/cloud9_environment_notes.md',
      ];
    }

    if (rLower.includes('trump') || rLower.includes('wwe')) {
      return [
        'README.md',
        'server.js',
        'package.json',
        'public/index.html',
        'public/game.js',
        'public/statWheel.js',
        'public/cards.json',
        'public/style.css',
      ];
    }

    if (rLower.includes('doodle')) {
      return [
        'README.md',
        'package.json',
        'server/server.js',
        'server/rooms.js',
        'client/src/App.jsx',
        'client/src/components/Canvas.jsx',
      ];
    }

    if (rLower.includes('placement') || rLower.includes('mecs')) {
      return [
        'README.md',
        'index.php',
        'login.php',
        'register.php',
        'student_dashboard.php',
        'admin_dashboard.php',
        'database/placement_portal.sql',
        'assets/css/style.css',
      ];
    }

    return [
      'README.md',
      'src/main.ts',
      'package.json',
      'tests/unit.test.ts',
    ];
  }

  /**
   * Fetch README content
   */
  async fetchReadme(owner: string, repo: string, branch: string = 'main'): Promise<string> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.raw',
        'User-Agent': 'AI-GitHub-Portfolio',
      };
      if (this.token && !this.token.startsWith('ghp_your')) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme?ref=${branch}`, {
        headers,
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 10) {
          return text;
        }
      }
    } catch (err) {
      // Fallback
    }

    const rLower = repo.toLowerCase();

    if (rLower === 'ccna') {
      return `# Cisco CCNA Practical Networking Labs & Configurations

Hands-on Cisco networking curriculum covering 11 intensive weeks of validated Packet Tracer and CLI configurations.

## Covered Networking Lab Modules
- **Week-07:** Dynamic NAT & Port Address Translation (NAT Overload)
- **Week-08 & Week-09:** VLAN Segmentation (802.1Q Trunks, Router-on-a-Stick Inter-VLAN Routing)
- **Week-10:** Spanning Tree Protocol (STP Priority Hardening & Root Bridge Elections)
- **Week-11:** EtherChannel Bundles (LACP & PAgP Load Balancing)
- **Week-12 & Week-13:** OSPFv2 Routing Protocols (Single-Area & Multi-Area ABR/ASBR Topologies)
- **Week-14:** Standard and Extended Access Control Lists (ACLs)
- **Week-15:** IPv6 Global Unicast, Link-Local & SLAAC Addressing
- **Week-16:** WAN Infrastructure & Egress Traffic NAT Pool Verification
- **Week-17:** Network Automation Basics using Python Netmiko CLI scripts

## Tools & Verification
Cisco IOS, Cisco Packet Tracer 8.2, GNS3, Wireshark, Netmiko.
`;
    }

    if (rLower.includes('carcare')) {
      return `# CarCare Connect

Modern, full-stack, responsive car-service marketplace connecting vehicle owners with nearby service providers for Car Rental, Car Mechanic / Repair, and Car Washing / Detailing.

## Live Demo
[Live Demo](https://carcare-connect.vercel.app)

## Features
- Location-based provider search with Interactive Leaflet Map and distance filtering.
- Direct booking lifecycle with multi-step vehicle selection and status tracking.
- Role-based authorization for Customers, Service Providers, and Administrators.
- 29 complete application pages built with React 18, Vite, Node.js, Express, and MongoDB.
`;
    }

    if (rLower.includes('intrusion') || rLower.includes('iot')) {
      return `# IoT Network Intrusion Detection Using CNN

A web-based Intrusion Detection System (IDS) for IoT environments using Convolutional Neural Networks (CNN).

The project detects malicious and abnormal network traffic patterns and predicts intrusion categories through trained deep learning models.

## Technologies
Python, CNN (Convolutional Neural Networks), Flask, Scikit-Learn, Pandas, NumPy, Jupyter Notebook.
`;
    }

    if (rLower.includes('aws')) {
      return `# AWS Cloud re/Start Practical Laboratories & Scripts

Practical cloud engineering exercises completed as part of the AWS re/Start Cloud program.

## Covered Topics
- Python programming for cloud systems: data types, composite data, conditionals, loops, and CSV parsing (\`car_fleet.csv\`).
- AWS Cloud9 IDE setup and cloud environment management.
- Linux CLI administration and automation scripting.
`;
    }

    if (rLower.includes('trump') || rLower.includes('wwe')) {
      return `# Ringside Rumble - Real-Time Multiplayer Wrestling Card Game

Real-time multiplayer card battle web game built for 2 to 10 players on any phone or laptop. Players privately lock in superstar wrestler stat cards and face off across 10 distinct attributes, decided by an animated, authoritative Stat Wheel.

## Live Demo
[Live Demo](https://ringside-rumble.onrender.com)

Features 80+ iconic superstar cards, custom stat matrix, physics-based canvas Stat Wheel, live room lobbies, sound synthesis engine, and anti-cheat reveal mechanics.
`;
    }

    if (rLower.includes('doodle')) {
      return `# DoodleRush - Real-Time Multiplayer Draw & Guess Game

Built for the Handshake AI Skills Studio Challenge: Create a Multiplayer Game.
A real-time, cross-device multiplayer party game where friends can draw, guess, and compete from any phone, tablet, or laptop without needing an account.

## Live Demo
[Live Demo](https://doodlerush.vercel.app)
`;
    }

    if (rLower.includes('placement') || rLower.includes('mecs')) {
      return `# MECS Placement Portal

A centralized campus placement web portal where students can access placement drives, notices, interview schedules, and company application tracking.
Built with PHP, MySQL, JavaScript, and Bootstrap.

## Live Demo
[Live Demo](https://mecs-placement-portal.vercel.app)
`;
    }

    return `# ${repo}\n\nTechnical engineering repository for ${repo}.`;
  }
}

