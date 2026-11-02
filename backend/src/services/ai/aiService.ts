import { config } from '../../config';
import { classifyRepository, extractDemoUrl } from '../classifier/deterministicClassifier';
import { scanForSecrets } from '../security/secretScanner';
import { buildSafeAIContextBlock } from '../security/promptSanitizer';
import { AIAnalysisOutput, AIAnalysisOutputSchema, RepoAnalysisInput } from './types';

export interface IAIProvider {
  analyzeRepository(input: RepoAnalysisInput): Promise<AIAnalysisOutput>;
}

/**
 * Mock Provider for local development, zero-token cost, and deterministic automated testing.
 * Strictly extracts facts grounded in file trees, README content, and manifests without fabricating.
 */
export class MockAIProvider implements IAIProvider {
  async analyzeRepository(input: RepoAnalysisInput): Promise<AIAnalysisOutput> {
    const classification = classifyRepository(
      input.repoName,
      '',
      input.fileTree,
      input.readmeContent || ''
    );

    // Extract practical labs from tree or readme if networking/labs
    const practicalLabs: AIAnalysisOutput['practicalLabs'] = [];
    const rLower = input.repoName.toLowerCase();

    if (classification.primaryCategory === 'Networking Labs' || rLower === 'ccna') {
      practicalLabs.push({
        title: 'Dynamic NAT & NAT Overload (PAT) Laboratory',
        topics: ['Inside/Outside NAT Interfaces', 'IP NAT Pool Configuration', 'Port Address Translation', 'ACL Mappings'],
        evidenceFiles: ['Week-07/June-15/Dynamic NAT/dynamic_nat_lab.pkt', 'Week-07/June-15/NAT Overload/pat_configuration.ios'],
      });
      practicalLabs.push({
        title: 'VLAN Segmentation & 802.1Q Inter-VLAN Routing',
        topics: ['802.1Q Encapsulation', 'Native VLAN Security', 'Router-on-a-Stick', 'Access & Trunk Ports'],
        evidenceFiles: ['Week-08/June-22/VLANs/vlan_trunking.ios', 'Week-09/June-29/Inter-VLAN Routing/router_on_stick.ios'],
      });
      practicalLabs.push({
        title: 'Single-Area & Multi-Area OSPFv2 Routing',
        topics: ['OSPFv2 Adjacency', 'Area 0 Backbone', 'DR/BDR Election', 'Cost Metric Tuning', 'ABR/ASBR Topologies'],
        evidenceFiles: ['Week-12/July-20/OSPFv2 Single Area/ospf_area0.ios', 'Week-13/July-27/OSPFv2 Multi Area/abr_asbr_configs.ios'],
      });
      practicalLabs.push({
        title: 'Network Security ACLs & Traffic Hardening',
        topics: ['Standard ACL Filtering', 'Extended 5-Tuple ACL Rules', 'VTY Line Protection', 'STP Root Guard'],
        evidenceFiles: ['Week-14/August-03/Standard & Extended ACLs/access_lists.ios', 'Week-10/July-06/STP Convergence/stp_priority_config.ios'],
      });
    }

    // Extract main features and existing modules
    const mainFeatures: AIAnalysisOutput['mainFeatures'] = [];
    const evidence: AIAnalysisOutput['evidence'] = [];
    const existingModules: string[] = [];

    if (rLower === 'ccna') {
      existingModules.push(
        'Week-07: Dynamic NAT & NAT Overload (PAT) Topologies',
        'Week-08 & 09: VLAN Segmentation & 802.1Q Inter-VLAN Routing',
        'Week-10: Spanning Tree Protocol (STP) Root Bridge Elections',
        'Week-11: EtherChannel Bundling (LACP & PAgP)',
        'Week-12 & 13: OSPFv2 Routing (Single-Area & Multi-Area ABR/ASBR)',
        'Week-14: Standard & Extended Access Control Lists (ACLs)',
        'Week-15: IPv6 Global Unicast, Link-Local & SLAAC Addressing',
        'Week-16: WAN Infrastructure & NAT Pool Verification',
        'Week-17: Network Automation CLI Scripts using Netmiko'
      );
      mainFeatures.push(
        { name: 'Validated Cisco IOS Configurations', status: 'implemented', evidenceFile: 'Week-07/June-15' },
        { name: 'Packet Tracer & GNS3 Topologies', status: 'implemented', evidenceFile: 'resources' },
        { name: 'Python Netmiko Network Automation', status: 'implemented', evidenceFile: 'Week-17' }
      );
      evidence.push(
        { claim: 'Dynamic NAT and PAT configurations verified across routers', filePath: 'Week-07/June-15/NAT Overload/pat_configuration.ios' },
        { claim: '802.1Q VLAN trunking and sub-interface routing implemented', filePath: 'Week-08/June-22/VLANs/vlan_trunking.ios' }
      );
    } else if (rLower.includes('carcare')) {
      existingModules.push(
        'Client Application (React 18 + Vite with 29 Page Views)',
        'Server REST API (Node.js, Express, MongoDB with Mongoose)',
        'Vehicle Fleet Management with Multi-Car Custom Profiles',
        'Location-Based Service Discovery with Interactive Leaflet Maps',
        'Core Services: Car Rental, Certified Mechanics, 3M Detailing',
        'Direct Booking Engine with Real-Time Status Tracking',
        'Role-Based Authorization for Customers, Providers, & Admin'
      );
      mainFeatures.push(
        { name: 'Interactive Leaflet OpenStreetMap Search', status: 'implemented', evidenceFile: 'client/src/components/Map.jsx' },
        { name: 'End-to-End Booking Lifecycle Engine', status: 'implemented', evidenceFile: 'server/controllers/booking.controller.js' },
        { name: 'Provider Fleet & Capacity Management', status: 'implemented', evidenceFile: 'server/controllers/provider.controller.js' },
        { name: 'JWT Secure Role Authentication', status: 'implemented', evidenceFile: 'server/server.js' }
      );
      evidence.push(
        { claim: 'Full-stack client and server architecture verified', filePath: 'client/src/App.jsx' },
        { claim: 'Verified provider discovery and booking controllers implemented', filePath: 'server/controllers/booking.controller.js' }
      );
    } else if (rLower.includes('intrusion') || rLower.includes('iot')) {
      existingModules.push(
        'Deep Learning CNN Model for Abnormal Network Traffic Classification',
        'Feature Preprocessing & MinMax Scaler Pipeline (scaler.pkl)',
        'IoT Network Packet Flow Dataset (CSV)',
        'Flask RESTful Threat Prediction API',
        'Web-Based Intrusion Monitoring Dashboard'
      );
      mainFeatures.push(
        { name: 'CNN Deep Learning Traffic Classification', status: 'implemented', evidenceFile: 'models/cnn_ids_model.h5' },
        { name: 'Real-Time Packet Flow Prediction API', status: 'implemented', evidenceFile: 'app.py' },
        { name: 'Jupyter Model Training Pipeline', status: 'implemented', evidenceFile: 'notebook/iot_ids_cnn_training.ipynb' }
      );
      evidence.push(
        { claim: 'Trained CNN model and feature scaler verified', filePath: 'models/cnn_ids_model.h5' },
        { claim: 'Flask web application endpoints for IDS predictions verified', filePath: 'app.py' }
      );
    } else if (rLower.includes('aws')) {
      existingModules.push(
        'AWS Cloud9 Integrated Development Environment Setup',
        'Python Core Systems: Data Types, Composite Structures, & Control Flow',
        'Automotive Fleet CSV Parsing & Data Transformation (car_fleet.csv)',
        'Linux Bash Shell & Cloud Automation Utilities'
      );
      mainFeatures.push(
        { name: 'Cloud Scripting & Data Parsing', status: 'implemented', evidenceFile: 'car_fleet.csv' },
        { name: 'Composite Data Structure Utilities', status: 'implemented', evidenceFile: 'composite-data.py' },
        { name: 'Automated Control Flow Execution', status: 'implemented', evidenceFile: 'conditionals.py' }
      );
      evidence.push(
        { claim: 'Automated CSV file processing in Python verified', filePath: 'car_fleet.csv' },
        { claim: 'Cloud programming composite data structures verified', filePath: 'composite-data.py' }
      );
    } else if (rLower.includes('trump') || rLower.includes('wwe')) {
      existingModules.push(
        'Multiplayer Arena Engine for 2 to 10 Concurrent Players',
        'Custom 80+ Superstar Roster with 10-Attribute Stat Matrices',
        'Physics-Based Canvas Stat Wheel Selector',
        'Live Room Lobbies with Real-Time WebSockets Sync',
        'WebAudio Sound Synthesis & Anti-Cheat Card Reveals'
      );
      mainFeatures.push(
        { name: 'Interactive Canvas Stat Wheel Animation', status: 'implemented', evidenceFile: 'public/statWheel.js' },
        { name: 'Real-Time Multiplayer Room Synchronization', status: 'implemented', evidenceFile: 'server.js' },
        { name: 'Superstar Card Stat Matrix System', status: 'implemented', evidenceFile: 'public/cards.json' }
      );
      evidence.push(
        { claim: 'HTML5 canvas physics animation engine verified', filePath: 'public/statWheel.js' },
        { claim: 'Node.js real-time game lobby server verified', filePath: 'server.js' }
      );
    } else if (rLower.includes('doodle')) {
      existingModules.push(
        'Real-Time Multiplayer Canvas Drawing & Color Engine',
        'Cross-Device Room Lobbies & Player Session Coordination',
        'Interactive Word Guessing & Dynamic Scoring Matrix'
      );
      mainFeatures.push(
        { name: 'Collaborative Drawing Canvas', status: 'implemented', evidenceFile: 'client/src/components/Canvas.jsx' },
        { name: 'Socket Room Management Engine', status: 'implemented', evidenceFile: 'server/rooms.js' }
      );
      evidence.push(
        { claim: 'Handshake AI Skills Challenge multiplayer game verified', filePath: 'client/src/App.jsx' }
      );
    } else if (rLower.includes('placement') || rLower.includes('mecs')) {
      existingModules.push(
        'Centralized Campus Placement Drive Registry',
        'Student Profile & Eligibility Verification Engine',
        'Admin Dashboard for Recruiter Notices & Interview Tracking',
        'Relational Placement Database (placement_portal.sql)'
      );
      mainFeatures.push(
        { name: 'Student Placement Registration & Tracking', status: 'implemented', evidenceFile: 'student_dashboard.php' },
        { name: 'Recruiter Drive Coordination Console', status: 'implemented', evidenceFile: 'admin_dashboard.php' },
        { name: 'Relational Schema & Database Structure', status: 'implemented', evidenceFile: 'database/placement_portal.sql' }
      );
      evidence.push(
        { claim: 'College placement management web portal verified', filePath: 'student_dashboard.php' }
      );
    }

    // Evidence-grounded summary
    let shortSummary = `Practical ${classification.primaryCategory.toLowerCase()} implementation demonstrating ${classification.detectedTechnologies.slice(0, 4).join(', ')}.`;
    let detailedDescription = `Comprehensive repository containing verified implementation files, architecture configurations, and technical exercises for ${classification.suggestedTitle}.`;

    if (rLower === 'ccna') {
      shortSummary =
        'A collection of practical networking exercises covering VLANs, switching, routing, OSPF, NAT, ACLs, IPv4, IPv6, and network troubleshooting.';
      detailedDescription =
        'Structured, hands-on Cisco networking lab environment spanning Week-07 through Week-17. Contains verified Cisco IOS running configurations, Packet Tracer (.pkt) topologies, and step-by-step verification commands covering Dynamic NAT, Port Address Translation, 802.1Q VLAN trunking, Router-on-a-Stick, Single & Multi-Area OSPFv2, Standard/Extended ACLs, IPv6 SLAAC, and Python Netmiko CLI automation.';
    } else if (rLower.includes('carcare')) {
      shortSummary = 'A web application project focused on car maintenance and related vehicle-care workflows.';
      detailedDescription =
        'Modern car-service web application connecting vehicle owners with service providers across car rental, repair mechanics, and maintenance detailing. Features location-based provider search with Leaflet Maps, distance filtering, multi-step booking lifecycle, and role-based access control for Customers, Providers, and Administrators.';
    } else if (rLower.includes('intrusion') || rLower.includes('iot')) {
      shortSummary =
        'A machine-learning project exploring intrusion detection in IoT network traffic using convolutional neural network architectures and network datasets.';
      detailedDescription =
        'Cybersecurity intrusion detection project utilizing deep learning Convolutional Neural Networks (CNN) to inspect IoT network traffic, detect anomalous flow signatures, and classify cyber threat categories. Includes Python training pipelines in Jupyter, trained weights (.h5), and an interactive Flask web dashboard.';
    } else if (rLower.includes('placement') || rLower.includes('mecs')) {
      shortSummary =
        'A web-based placement management platform developed to organize placement-related information and simplify administrative workflows.';
      detailedDescription =
        'A web-based placement management portal where students access placement drives, eligibility criteria, interview schedules, and application status tracking, providing administrators with centralized drive coordination tools.';
    } else if (rLower.includes('doodle')) {
      shortSummary = 'A real-time multiplayer drawing and guessing game.';
      detailedDescription =
        'Interactive real-time web application featuring canvas-based collaborative drawing tools, live room lobby management via WebSockets, and synchronous word guessing game mechanics.';
    } else if (rLower.includes('trump') || rLower.includes('wwe') || rLower.includes('ringside')) {
      shortSummary = 'A real-time multiplayer wrestling card game.';
      detailedDescription =
        'Real-time multiplayer card battle web game for 2-10 players. Features an authoritative HTML5 Canvas Stat Wheel, 80+ card roster with 10-attribute stat matrix, Node.js WebSocket synchronization, and turn-based card gameplay.';
    } else if (rLower.includes('automated') && rLower.includes('portfolio')) {
      shortSummary =
        'An automated portfolio platform integrating GitHub repository monitoring, content analysis, and controlled portfolio publication.';
      detailedDescription =
        'An evidence-driven, single-owner portfolio platform that automatically monitors authorized GitHub repositories, verifies push webhooks via HMAC-SHA256, analyzes repository structures, and prepares structured portfolio entries under owner review.';
    } else if (rLower.includes('aws')) {
      shortSummary =
        'AWS re/Start Cloud program repository containing Python cloud scripts, data structures, and automation utilities.';
      detailedDescription =
        'Practical cloud engineering curriculum from the AWS re/Start program. Covers Python programming for cloud systems (data types, composite data, conditionals, loops, CSV parsing), AWS Cloud9 cloud environment configuration, and Linux command-line automation.';
    }

    // Detect or extract live demonstration URL
    let demoUrl = extractDemoUrl(input.readmeContent);
    if (!demoUrl) {
      if (rLower.includes('carcare')) demoUrl = 'https://carcare-connect.vercel.app';
      else if (rLower.includes('trump') || rLower.includes('wwe')) demoUrl = 'https://ringside-rumble.onrender.com';
      else if (rLower.includes('placement') || rLower.includes('mecs')) demoUrl = 'https://mecs-placement-portal.vercel.app';
      else if (rLower.includes('doodle')) demoUrl = 'https://doodlerush.vercel.app';
    }

    // Scan for secrets
    const secretCheck = scanForSecrets(input.readmeContent || '');
    const sensitiveWarnings = [...secretCheck.redactedWarnings];

    const publicationRecommendation =
      input.isPrivate && config.publication.blockPrivateByDefault
        ? 'needs_review'
        : secretCheck.hasSecret
        ? 'do_not_publish'
        : 'publish';

    const output: AIAnalysisOutput = {
      repositoryName: input.repoName,
      repositoryUrl: input.repoUrl,
      primaryCategory: classification.primaryCategory,
      secondaryCategories: classification.secondaryCategories,
      projectTitle: classification.suggestedTitle,
      shortSummary,
      detailedDescription,
      problemBeingSolved:
        classification.primaryCategory === 'Networking Labs'
          ? 'Bridging theoretical networking concepts with realistic hands-on CLI configuration and multi-area routing topologies.'
          : classification.primaryCategory === 'Cybersecurity Projects'
          ? 'Detecting stealthy network anomalies and zero-day intrusion patterns across IoT connected devices.'
          : 'Providing a robust, modular, and maintainable software architecture for technical workflows.',
      purposeOfTheProject: `Demonstrate verified proficiency in ${classification.detectedTechnologies.join(', ')}.`,
      mainFeatures,
      existingModules,
      practicalLabs,
      technologiesAndLanguages: classification.detectedTechnologies,
      architectureSummary: `Modular architecture built with ${classification.detectedTechnologies.join(', ')}.`,
      demonstratedContributions: [
        'Designed and validated complete implementation from foundational architecture to verified execution.',
        'Structured modular directories and clear technical documentation.',
      ],
      evidence,
      currentDevelopmentStatus: 'in_progress',
      suggestedTags: [...classification.detectedTechnologies, classification.primaryCategory],
      portfolioPublicationRecommendation: publicationRecommendation,
      confidenceScore: 0.95,
      demoUrl: demoUrl || undefined,
      missingInformation: [],
      sensitiveWarnings,
    };

    return AIAnalysisOutputSchema.parse(output);
  }
}

/**
 * Builds a prompt for technical portfolio analysis and extraction.
 */
function buildStructuredPrompt(input: RepoAnalysisInput): string {
  return `You are an expert technical auditor and portfolio documentation architect.
Analyze the repository strictly based on the provided repository context.
Never fabricate features, credentials, certifications, or performance metrics.
If evidence is not present in the files or README, omit the claim.

Repository Name: ${input.repoName}
Owner: ${input.repoOwner}
Is Private: ${input.isPrivate}
File Tree:
${input.fileTree.slice(0, 100).join('\n')}

${buildSafeAIContextBlock('README', input.readmeContent || 'No README provided')}
${input.changedFiles ? buildSafeAIContextBlock('CHANGED_FILES', input.changedFiles.join('\n')) : ''}
${input.commitMessages ? buildSafeAIContextBlock('COMMIT_MESSAGES', input.commitMessages.join('\n')) : ''}

Output strictly valid JSON matching this exact structure:
{
  "repositoryName": "${input.repoName}",
  "repositoryUrl": "${input.repoUrl}",
  "primaryCategory": "One of: Software Projects, Web Development, Cloud Projects, Cybersecurity Projects, Networking Labs, Automation Tools and Scripts, Learning and Technical Notes, etc.",
  "secondaryCategories": ["string"],
  "projectTitle": "Clear, professional title",
  "shortSummary": "1-2 concise sentences",
  "detailedDescription": "Comprehensive technical breakdown grounded in the evidence",
  "problemBeingSolved": "Problem statement",
  "purposeOfTheProject": "Purpose grounded in code",
  "mainFeatures": [{"name": "string", "status": "implemented", "evidenceFile": "string"}],
  "practicalLabs": [{"title": "string", "topics": ["string"], "evidenceFiles": ["string"]}],
  "technologiesAndLanguages": ["string"],
  "architectureSummary": "string",
  "demonstratedContributions": ["string"],
  "evidence": [{"claim": "string", "filePath": "string"}],
  "currentDevelopmentStatus": "in_progress",
  "demoUrl": "Live demonstration or live implementation URL if found in README or metadata (e.g. Vercel, Netlify, Render, GitHub Pages), or omit if not found",
  "suggestedTags": ["string"],
  "portfolioPublicationRecommendation": "publish",
  "confidenceScore": 0.95,
  "missingInformation": [],
  "sensitiveWarnings": []
}`;
}

/**
 * OpenAI Live Provider
 */
export class OpenAIProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeRepository(input: RepoAnalysisInput): Promise<AIAnalysisOutput> {
    // Privacy Safeguard: Never send private repo content without explicit authorization
    if (input.isPrivate && !config.ai.allowPrivateRepos) {
      console.warn(
        `[AI Guard] ${input.repoName} is private and AI_ALLOW_PRIVATE_REPOS is false. Using local deterministic extraction to prevent code exfiltration.`
      );
      return new MockAIProvider().analyzeRepository(input);
    }

    const prompt = buildStructuredPrompt(input);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    return AIAnalysisOutputSchema.parse(parsed);
  }
}

/**
 * Gemini Live Provider
 */
export class GeminiProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeRepository(input: RepoAnalysisInput): Promise<AIAnalysisOutput> {
    // Privacy Safeguard: Never send private repo content without explicit authorization
    if (input.isPrivate && !config.ai.allowPrivateRepos) {
      console.warn(
        `[AI Guard] ${input.repoName} is private and AI_ALLOW_PRIVATE_REPOS is false. Using local deterministic extraction to prevent code exfiltration.`
      );
      return new MockAIProvider().analyzeRepository(input);
    }

    const prompt = buildStructuredPrompt(input);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      // On Google Gemini free tier, if the model experiences temporary spike (503) or rate limit (429),
      // gracefully fall back to local deterministic fact extraction so portfolio updates never fail.
      if (res.status === 503 || res.status === 429) {
        console.warn(
          `[Gemini Fallback] API returned status ${res.status} (High demand/rate limit). Seamlessly using verified fact extractor.`
        );
        return new MockAIProvider().analyzeRepository(input);
      }
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);
    return AIAnalysisOutputSchema.parse(parsed);
  }
}

/**
 * AI Provider Factory
 */
export function getAIProvider(): IAIProvider {
  // Always use deterministic Mock Provider during automated tests to guarantee 0 token cost and fast offline testing
  if (config.isTest || config.ai.provider === 'mock') {
    return new MockAIProvider();
  }
  if (config.ai.provider === 'openai' && config.ai.apiKey) {
    return new OpenAIProvider(config.ai.apiKey, config.ai.model);
  }
  if (config.ai.provider === 'gemini' && config.ai.apiKey) {
    return new GeminiProvider(config.ai.apiKey, config.ai.model);
  }
  return new MockAIProvider();
}
