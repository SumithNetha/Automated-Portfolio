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
    console.log('[Seed] Initializing owner profile for Sumith Mittapelli...');
    await Profile.create({
      ownerName: 'Sumith Mittapelli',
      headline: 'Software Engineer | Cloud & Networking',
      bio: 'Computer Science graduate with professional experience as an Associate Software Engineer at Tech Mahindra. Interested in building software applications, working with AWS cloud infrastructure, exploring computer networking, and developing practical cybersecurity skills.',
      githubUsername: 'SumithNetha',
      location: 'Hyderabad, India',
      email: 'm.sumith231@gmail.com',
      linkedinUrl: 'https://www.linkedin.com/in/sumith-mittapelli-6aa6a0200',
      websiteUrl: 'https://github.com/SumithNetha',
      resumeUrl: '/resume.html',
      featuredSkills: [
        'Java & Python',
        'TypeScript & JavaScript',
        'React & Node.js',
        'AWS Cloud (EC2, VPC, S3, Lambda)',
        'Cisco IOS (Practical Labs)',
        'Linux & Bash',
        'Docker & CI/CD',
        'Selenium & Test Automation',
        'Network Security Fundamentals',
      ],
      publicationSettings: {
        autoPublishConfident: true,
        requireReviewOnSensitive: true,
        blockPrivateByDefault: true,
      },
    });
    console.log('[Seed] Owner profile initialized for Sumith Mittapelli.');
  } else {
    // Synchronize latest profile identity for existing profile
    const existingProfile = await Profile.findOne();
    if (existingProfile) {
      existingProfile.ownerName = 'Sumith Mittapelli';
      existingProfile.email = 'm.sumith231@gmail.com';
      existingProfile.headline = 'Software Engineer | Cloud & Networking';
      existingProfile.bio =
        'Computer Science graduate with professional experience as an Associate Software Engineer at Tech Mahindra. Interested in building software applications, working with AWS cloud infrastructure, exploring computer networking, and developing practical cybersecurity skills.';
      existingProfile.linkedinUrl = 'https://www.linkedin.com/in/sumith-mittapelli-6aa6a0200';
      existingProfile.resumeUrl = '/resume.html';
      existingProfile.featuredSkills = [
        'Java & Python',
        'TypeScript & JavaScript',
        'React & Node.js',
        'AWS Cloud (EC2, VPC, S3, Lambda)',
        'Cisco IOS (Practical Labs)',
        'Linux & Bash',
        'Docker & CI/CD',
        'Selenium & Test Automation',
        'Network Security Fundamentals',
      ];
      await existingProfile.save();
      console.log('[Seed] Synchronized profile for Sumith Mittapelli.');
    }
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
