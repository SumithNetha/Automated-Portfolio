import { Router, Request, Response } from 'express';
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
        ownerName: 'Portfolio Owner',
        headline: 'Senior Full-Stack Engineer & Network Systems Architect',
        bio: 'Building resilient cloud-native architectures, enterprise web applications, and comprehensive networking laboratories. Automated from verified GitHub engineering work.',
        featuredSkills: [
          'TypeScript',
          'Node.js',
          'React',
          'Python',
          'AWS',
          'Cisco IOS',
          'Docker',
          'MongoDB',
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
        featuredSkills: profile.featuredSkills,
      },
    });
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
