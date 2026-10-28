import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/AdminUser';
import { Profile } from '../models/Profile';
import { MonitoredRepository } from '../models/MonitoredRepository';
import { PortfolioEntry } from '../models/PortfolioEntry';
import { config } from '../config';
import { GitHubService } from '../services/github/githubService';
import { jobQueue } from '../services/queue/jobQueue';

export async function seedInitialData(): Promise<void> {
  console.log('[Seed] Checking initial application data...');

  // 1. Ensure Admin User exists
  const adminCount = await AdminUser.countDocuments();
  if (adminCount === 0) {
    console.log(`[Seed] Creating initial administrator account (${config.adminEmail})...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(config.adminInitialPassword, salt);

    await AdminUser.create({
      email: config.adminEmail,
      passwordHash,
      role: 'owner',
    });
    console.log('[Seed] Admin account created successfully.');
  }

  // 2. Ensure Profile exists
  const profileCount = await Profile.countDocuments();
  if (profileCount === 0) {
    console.log('[Seed] Initializing owner profile...');
    await Profile.create({
      ownerName: 'Alex Mercer',
      headline: 'Senior Full-Stack Engineer & Network Infrastructure Specialist',
      bio: 'Crafting resilient distributed systems, enterprise web applications, and validated networking labs. Every portfolio item is dynamically maintained and evidence-grounded directly from verified GitHub repositories.',
      githubUsername: 'portfolio-owner',
      location: 'San Francisco, CA & Remote',
      email: 'alex.mercer.dev@example.com',
      linkedinUrl: 'https://linkedin.com/in/portfolio-owner',
      websiteUrl: 'https://github.com/portfolio-owner',
      featuredSkills: [
        'TypeScript',
        'Node.js / Express',
        'React / Vite',
        'Python',
        'AWS Cloud',
        'Cisco IOS / CCNA',
        'Docker & K8s',
        'Terraform',
        'MongoDB',
      ],
      publicationSettings: {
        autoPublishConfident: true,
        requireReviewOnSensitive: true,
        blockPrivateByDefault: true,
      },
    });
    console.log('[Seed] Owner profile initialized.');
  }

  // 3. Seed initial monitored repositories if none exist
  const repoCount = await MonitoredRepository.countDocuments();
  if (repoCount === 0) {
    console.log('[Seed] Populating initial monitored repositories from verified engineering projects...');
    const githubService = new GitHubService();
    const initialRepos = await githubService.listUserRepositories();

    for (const r of initialRepos) {
      const monitored = await MonitoredRepository.create({
        githubRepoId: r.id,
        fullName: r.fullName,
        name: r.name,
        owner: r.owner,
        isPrivate: r.isPrivate,
        htmlUrl: r.htmlUrl,
        description: r.description,
        defaultBranch: r.defaultBranch,
        monitoredBranch: r.defaultBranch,
        isMonitored: true,
        primaryCategory: r.name.includes('ccna')
          ? 'Networking Labs'
          : r.name.includes('carcare')
          ? 'Web Development'
          : r.name.includes('cloud')
          ? 'Cloud Projects'
          : 'Cybersecurity Projects',
        lastAnalysisStatus: 'idle',
        starsCount: r.starsCount,
        forksCount: r.forksCount,
        language: r.language,
      });

      // Automatically enqueue initial analysis for these monitored repositories
      await jobQueue.enqueueJob({
        triggerType: 'manual_initial',
        repoId: monitored._id,
        repoFullName: monitored.fullName,
        commitSha: 'seed_init_sha',
        branch: monitored.defaultBranch,
      });
    }

    console.log('[Seed] Initial monitored repositories created and analysis enqueued.');
  }
}
