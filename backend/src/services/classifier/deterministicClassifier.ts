import { PortfolioCategory } from '../../config';

export interface ClassificationResult {
  primaryCategory: PortfolioCategory;
  secondaryCategories: string[];
  entryType: 'project' | 'lab_collection' | 'learning_notes' | 'tool' | 'certification';
  suggestedTitle: string;
  detectedTechnologies: string[];
  confidence: number;
}

export function classifyRepository(
  repoName: string,
  description: string = '',
  filePaths: string[] = [],
  readmeSnippet: string = ''
): ClassificationResult {
  const combinedText = `${repoName} ${description} ${filePaths.join(' ')} ${readmeSnippet}`.toLowerCase();

  const detectedTechnologies = new Set<string>();

  // Technology & tool detectors
  if (/\b(cisco|packet\s*tracer|gns3|wireshark|ios|eve-ng|netmiko)\b/i.test(combinedText)) detectedTechnologies.add('Cisco IOS');
  if (/\b(vlan|ospf|eigrp|bgp|stp|subnetting|ipv6|nat|acl)\b/i.test(combinedText)) detectedTechnologies.add('Networking');
  if (/\b(aws|cloudformation|s3|ec2|lambda|iam|cloud9|restart)\b/i.test(combinedText)) {
    detectedTechnologies.add('AWS');
    detectedTechnologies.add('AWS Cloud');
  }
  if (/\b(azure|bicep)\b/i.test(combinedText)) detectedTechnologies.add('Azure');
  if (/\b(gcp|google\s*cloud)\b/i.test(combinedText)) detectedTechnologies.add('GCP');
  if (/\b(terraform|hcl)\b/i.test(combinedText) || filePaths.some((p) => p.endsWith('.tf'))) detectedTechnologies.add('Terraform');
  if (/\b(docker|dockerfile|container)\b/i.test(combinedText) || filePaths.some((p) => p.includes('Dockerfile'))) detectedTechnologies.add('Docker');
  if (/\b(kubernetes|k8s|helm)\b/i.test(combinedText)) detectedTechnologies.add('Kubernetes');
  if (/\b(react|vite|nextjs|redux)\b/i.test(combinedText) || filePaths.some((p) => p.endsWith('.tsx') || p.endsWith('.jsx'))) {
    detectedTechnologies.add('React');
    detectedTechnologies.add('React 18');
  }
  if (/\b(vue|nuxt)\b/i.test(combinedText) || filePaths.some((p) => p.endsWith('.vue'))) detectedTechnologies.add('Vue.js');
  if (/\b(typescript|ts-node)\b/i.test(combinedText) || filePaths.some((p) => p.endsWith('.ts') || p.endsWith('.tsx'))) detectedTechnologies.add('TypeScript');
  if (/\b(javascript|node|express)\b/i.test(combinedText) || filePaths.some((p) => p.endsWith('.js'))) detectedTechnologies.add('Node.js');
  if (/\b(python|django|fastapi|flask)\b/i.test(combinedText) || filePaths.some((p) => p.endsWith('.py'))) detectedTechnologies.add('Python');
  if (/\b(cnn|deep\s*learning|machine\s*learning|neural|intrusion|ids|scaler|model\.h5)\b/i.test(combinedText)) detectedTechnologies.add('CNN / Deep Learning');
  if (/\b(php)\b/i.test(combinedText) || filePaths.some((p) => p.endsWith('.php'))) detectedTechnologies.add('PHP');
  if (/\b(mysql|sql|database)\b/i.test(combinedText) || filePaths.some((p) => p.endsWith('.sql'))) detectedTechnologies.add('MySQL');
  if (/\b(canvas|statwheel|stat\s*wheel|websocket|socket\.io|multiplayer)\b/i.test(combinedText)) detectedTechnologies.add('HTML5 Canvas / Sockets');
  if (/\b(bash|shell|powershell)\b/i.test(combinedText) || filePaths.some((p) => p.endsWith('.sh') || p.endsWith('.ps1'))) detectedTechnologies.add('Bash / Shell');
  if (/\b(mongodb|mongoose)\b/i.test(combinedText)) detectedTechnologies.add('MongoDB');
  if (/\b(leaflet|map)\b/i.test(combinedText)) detectedTechnologies.add('Leaflet Maps');

  // Classification Rules
  let primaryCategory: PortfolioCategory = 'Software Projects';
  let entryType: 'project' | 'lab_collection' | 'learning_notes' | 'tool' | 'certification' = 'project';
  const secondaryCategories: string[] = [];

  // 1. Networking Labs / CCNA
  if (/\b(ccna|ccnp|cisco|networking|routing|switching|vlan|ospf|bgp|packet tracer|gns3)\b/i.test(combinedText)) {
    primaryCategory = 'Networking Labs';
    entryType = 'lab_collection';
    secondaryCategories.push('Cisco Systems', 'Network Infrastructure');
  }
  // 2. Cybersecurity Projects
  else if (/\b(intrusion|ids|security|cyber|pentest|vulnerability|exploit|ctf|wireshark|nmap|owasp|crypto)\b/i.test(combinedText)) {
    primaryCategory = 'Cybersecurity Projects';
    secondaryCategories.push('Deep Learning', 'IoT Security');
  }
  // 3. Cloud Projects
  else if (/\b(aws|azure|gcp|terraform|cloudformation|kubernetes|serverless|devops|cloud9|restart)\b/i.test(combinedText)) {
    primaryCategory = 'Cloud Projects';
    entryType = 'lab_collection';
    secondaryCategories.push('Cloud Infrastructure', 'AWS re/Start');
  }
  // 4. Automation Tools & Scripts
  else if (/\b(script|automation|bot|scraper|cli-tool|ansible|playbook)\b/i.test(combinedText) || filePaths.every((p) => p.endsWith('.sh') || p.endsWith('.py'))) {
    primaryCategory = 'Automation Tools and Scripts';
    entryType = 'tool';
    secondaryCategories.push('Automation', 'Productivity');
  }
  // 5. Web Development
  else if (
    detectedTechnologies.has('React 18') ||
    detectedTechnologies.has('Node.js') ||
    detectedTechnologies.has('PHP') ||
    detectedTechnologies.has('HTML5 Canvas / Sockets') ||
    /\b(frontend|backend|fullstack|web\s*app|html|css|portal|game)\b/i.test(combinedText)
  ) {
    primaryCategory = 'Web Development';
    secondaryCategories.push('Full Stack');
  }

  // Format a clean, human-readable suggested title
  const cleanName = repoName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

  let suggestedTitle = cleanName;
  const rLower = repoName.toLowerCase();
  if (rLower.includes('ccna')) {
    suggestedTitle = 'CCNA Networking Labs & Practical Configurations';
  } else if (rLower.includes('carcare')) {
    suggestedTitle = 'CarCare Connect - Full-Stack Automotive Service Marketplace';
  } else if (rLower.includes('intrusion') || rLower.includes('iot')) {
    suggestedTitle = 'IoT Network Intrusion Detection Using CNN';
  } else if (rLower.includes('aws')) {
    suggestedTitle = 'AWS Cloud Practical Laboratories & Scripts';
  } else if (rLower.includes('trump') || rLower.includes('wwe')) {
    suggestedTitle = 'Ringside Rumble - Real-Time WWE Trump Card Multiplayer Arena';
  } else if (rLower.includes('doodle')) {
    suggestedTitle = 'DoodleRush - Real-Time Multiplayer Draw & Guess Game';
  } else if (rLower.includes('placement') || rLower.includes('mecs')) {
    suggestedTitle = 'MECS Campus Placement & Training Portal';
  }

  return {
    primaryCategory,
    secondaryCategories,
    entryType,
    suggestedTitle,
    detectedTechnologies: Array.from(detectedTechnologies),
    confidence: 0.95,
  };
}

export interface ChangeSignificance {
  isSignificant: boolean;
  category: 'feature_addition' | 'lab_addition' | 'documentation_only' | 'insignificant_formatting' | 'dependency_bump';
  reason: string;
}

export function evaluateChangeSignificance(
  changedFiles: string[] = [],
  commitMessages: string[] = []
): ChangeSignificance {
  const combinedMessages = commitMessages.join(' ').toLowerCase();

  // If no files and no messages or explicitly trivial
  if (changedFiles.length === 0 && commitMessages.length === 0) {
    return { isSignificant: false, category: 'insignificant_formatting', reason: 'No changed files or messages in push' };
  }

  // Formatting / chore / trivial
  const isAllFormatting = changedFiles.length > 0 && changedFiles.every((f) =>
    /\.(prettierrc|eslintrc|editorconfig|gitignore|gitattributes|lock|min\.js|min\.css)$/i.test(f)
  );
  if (isAllFormatting || /\b(typo|formatting|whitespace|lint|fix whitespace)\b/i.test(combinedMessages)) {
    return {
      isSignificant: false,
      category: 'insignificant_formatting',
      reason: 'Formatting, whitespace, or linter configuration only',
    };
  }

  // Documentation only
  const isAllDoc = changedFiles.every((f) => /\.(md|txt|rst|adoc|png|jpg|svg)$/i.test(f) || f.toLowerCase().includes('doc'));
  if (isAllDoc) {
    return {
      isSignificant: true,
      category: 'documentation_only',
      reason: 'Documentation and explanatory notes improved',
    };
  }

  // Lab additions
  if (changedFiles.some((f) => /(lab|cisco|config|pkt|pktz|net|topology|subnets?)/i.test(f))) {
    return {
      isSignificant: true,
      category: 'lab_addition',
      reason: 'New technical lab exercises or network configurations added',
    };
  }

  return {
    isSignificant: true,
    category: 'feature_addition',
    reason: 'Functional source code changes or feature enhancements detected',
  };
}
