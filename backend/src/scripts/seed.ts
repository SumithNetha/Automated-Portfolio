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
    console.log('[Seed] Initializing owner profile for Sumith Netha...');
    await Profile.create({
      ownerName: 'Sumith Netha',
      headline: 'Full-Stack Developer, Network Systems Architect & Cloud Engineer',
      bio: 'Engineering high-performance web platforms, enterprise automotive services (CarCARE), IoT network intrusion detection systems, and practical Cisco CCNA routing & switching laboratories.',
      githubUsername: 'SumithNetha',
      location: 'Hyderabad, India',
      email: 'sumithnetha@example.com',
      linkedinUrl: 'https://linkedin.com/in/sumithnetha',
      websiteUrl: 'https://github.com/SumithNetha',
      featuredSkills: [
        'JavaScript / TypeScript',
        'React 18 & Vite',
        'Node.js & Express',
        'Python',
        'Cisco IOS (CCNA)',
        'AWS Cloud (re/Start)',
        'MongoDB & Mongoose',
        'IoT Security / ML',
      ],
      publicationSettings: {
        autoPublishConfident: true,
        requireReviewOnSensitive: true,
        blockPrivateByDefault: true,
      },
    });
    console.log('[Seed] Owner profile initialized for Sumith Netha.');
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
