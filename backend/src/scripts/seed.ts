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

  // 3. Clean up any stale placeholder entries from test fixtures
  await MonitoredRepository.deleteMany({ fullName: { $regex: /portfolio-owner/i } });
  await PortfolioEntry.deleteMany({ sourceRepoFullName: { $regex: /portfolio-owner/i } });

  // 4. Seed and sync verified repositories for SumithNetha
  console.log('[Seed] Syncing verified repositories for SumithNetha...');
  const githubService = new GitHubService();
  const initialRepos = await githubService.listUserRepositories();

  for (const r of initialRepos) {
    const primaryCat = /ccna/i.test(r.name)
      ? 'Networking Labs'
      : /carcare/i.test(r.name)
      ? 'Web Development'
      : /intrusion|iot/i.test(r.name)
      ? 'Cybersecurity Projects'
      : /aws/i.test(r.name)
      ? 'Cloud Projects'
      : 'Web Development';

    let monitored = await MonitoredRepository.findOne({ githubRepoId: r.id });

    if (!monitored) {
      monitored = await MonitoredRepository.create({
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
        primaryCategory: primaryCat,
        lastAnalysisStatus: 'idle',
        starsCount: r.starsCount,
        forksCount: r.forksCount || 0,
        language: r.language,
        homepage: r.homepage || '',
      });

      // Enqueue initial analysis
      await jobQueue.enqueueJob({
        triggerType: 'manual_initial',
        repoId: monitored._id,
        repoFullName: monitored.fullName,
        commitSha: 'seed_init_sha',
        branch: monitored.defaultBranch,
      });
    } else {
      // Ensure category and homepage match
      let updated = false;
      if (monitored.primaryCategory !== primaryCat) {
        monitored.primaryCategory = primaryCat;
        updated = true;
      }
      if (r.homepage && monitored.homepage !== r.homepage) {
        monitored.homepage = r.homepage;
        updated = true;
      }
      if (updated) {
        await monitored.save();
      }
    }

    // Populate demoUrl for existing entry if present and not manually overridden
    if (r.homepage) {
      const existingEntry = await PortfolioEntry.findOne({ repoId: monitored._id });
      if (existingEntry && !existingEntry.demoUrl && !existingEntry.manualOverrides?.demoUrl) {
        existingEntry.demoUrl = r.homepage;
        await existingEntry.save();
      }
    }
  }

  console.log('[Seed] Verified repositories synced successfully for SumithNetha.');
}
