import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Profile } from '../models/Profile';
import { PortfolioEntry } from '../models/PortfolioEntry';
import { PORTFOLIO_CATEGORIES } from '../config';

const router = Router();

/**
 * GET /api/public/profile
 * Public developer profile and biography
 */
router.get('/profile', async (_req: Request, res: Response) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({
        ownerName: 'Sumith Mittapelli',
        headline: 'Associate Software Engineer • AWS Certified Cloud Practitioner • Cisco Networking & Security',
        bio: 'Software Engineer with experience at Tech Mahindra in test automation and hands-on expertise in AWS Cloud and practical Cisco CCNA routing, switching, and cybersecurity systems.',
        email: 'm.sumith231@gmail.com',
        location: 'Hyderabad, India',
        linkedinUrl: 'https://www.linkedin.com/in/sumith-mittapelli-6aa6a0200',
        resumeUrl: '/resume.html',
        featuredSkills: [
          'Vibe Coding (AI-Driven Engineering)',
          'AWS Certified Cloud Practitioner',
          'Java & Python',
          'Cisco IOS (CCNA)',
          'AWS (EC2, VPC, Lambda, S3)',
          'Selenium & TestNG',
          'JavaScript / TypeScript',
          'Linux Security & Bash',
        ],
      });
    }

    res.json({
      success: true,
      data: {
        ownerName: profile.ownerName,
        headline: profile.headline,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        location: profile.location,
        email: profile.email,
        githubUsername: profile.githubUsername,
        linkedinUrl: profile.linkedinUrl,
        twitterUrl: profile.twitterUrl,
        websiteUrl: profile.websiteUrl,
        resumeUrl: profile.resumeUrl || '/resume.html',
        resumeDownloadUrl: profile.resumeDownloadUrl || '/resume.pdf',
        resumeFileName: profile.resumeFileName || 'Sumith_Mittapelli_Resume.pdf',
        resumeUpdatedAt: profile.resumeUpdatedAt,
        resumeFileSize: profile.resumeFileSize,
        featuredSkills: profile.featuredSkills,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/public/resume/download
 * Triggers direct download of the latest active resume PDF
 */
router.get('/resume/download', async (_req: Request, res: Response): Promise<void> => {
  try {
    const candidatePaths = [
      path.resolve(__dirname, '../../../frontend/public/resume.pdf'),
      path.resolve(process.cwd(), 'frontend/public/resume.pdf'),
      path.resolve(process.cwd(), '../frontend/public/resume.pdf'),
      path.resolve(__dirname, '../../uploads/resume.pdf'),
    ];

    let targetPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        targetPath = p;
        break;
      }
    }

    if (!targetPath) {
      res.status(404).json({ success: false, error: 'Resume file not found' });
      return;
    }

    const profile = await Profile.findOne();
    const downloadFileName = profile?.resumeFileName || 'Sumith_Mittapelli_Resume.pdf';

    res.download(targetPath, downloadFileName);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/public/entries
 * Query published portfolio entries with search, filter, and pagination
 */
router.get('/entries', async (req: Request, res: Response) => {
  try {
    const { category, technology, search, type, featured } = req.query;

    const query: any = {
      publicationStatus: 'published',
      sensitiveContentBlocked: { $ne: true },
    };

    if (category && category !== 'All') {
      query.primaryCategory = category;
    }

    if (technology) {
      query.technologies = { $in: [new RegExp(`^${technology}$`, 'i')] };
    }

    if (type) {
      query.entryType = type;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { overview: regex },
        { technologies: regex },
        { technicalConcepts: regex },
      ];
    }

    const entries = await PortfolioEntry.find(query)
      .sort({ isFeatured: -1, lastPublishedAt: -1, updatedAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/public/entries/:slug
 * Retrieve detailed project entry by slug
 */
router.get('/entries/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await PortfolioEntry.findOne({
      slug: req.params.slug,
      publicationStatus: 'published',
      sensitiveContentBlocked: { $ne: true },
    });

    if (!entry) {
      res.status(404).json({ success: false, error: 'Project entry not found or not published' });
      return;
    }

    res.json({
      success: true,
      data: entry,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/public/categories
 * Dynamically list active categories with published projects (only categories with count > 0)
 */
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const counts = await PortfolioEntry.aggregate([
      { $match: { publicationStatus: 'published', sensitiveContentBlocked: { $ne: true } } },
      { $group: { _id: '$primaryCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Only return categories that actually have published projects
    const result = counts.map((c) => ({
      name: c._id,
      count: c.count,
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/public/stats
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const publishedEntries = await PortfolioEntry.find({
      publicationStatus: 'published',
      sensitiveContentBlocked: { $ne: true },
    });

    const allTech = new Set<string>();
    let totalLabs = 0;

    publishedEntries.forEach((e) => {
      e.technologies.forEach((t) => allTech.add(t));
      totalLabs += e.practicalLabs.length;
    });

    res.json({
      success: true,
      data: {
        totalProjects: publishedEntries.length,
        totalTechnologies: allTech.size,
        totalPracticalLabs: totalLabs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
