import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Resume } from '../models/Resume';
import { Profile } from '../models/Profile';

const router = Router();

/**
 * Helper to retrieve resume buffer either from MongoDB or disk fallback
 */
async function getResumeData(): Promise<{ buffer: Buffer; filename: string; contentType: string } | null> {
  // 1. Check MongoDB first (primary cloud-resilient source)
  const resume = await Resume.findOne().sort({ updatedAt: -1 });
  if (resume && resume.data && resume.data.length > 0) {
    return {
      buffer: resume.data,
      filename: resume.filename || 'Sumith_Mittapelli_Resume.pdf',
      contentType: resume.contentType || 'application/pdf',
    };
  }

  // 2. Disk fallback (useful for initial local files or seed fallback)
  const candidatePaths = [
    path.resolve(__dirname, '../../../frontend/public/resume.pdf'),
    path.resolve(process.cwd(), 'frontend/public/resume.pdf'),
    path.resolve(process.cwd(), '../frontend/public/resume.pdf'),
    path.resolve(__dirname, '../../uploads/resume.pdf'),
    path.resolve(process.cwd(), 'uploads/resume.pdf'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      const buffer = fs.readFileSync(candidate);
      const profile = await Profile.findOne();
      const filename = profile?.resumeFileName || 'Sumith_Mittapelli_Resume.pdf';

      // Automatically back up to MongoDB so subsequent calls hit DB directly
      try {
        await Resume.findOneAndUpdate(
          {},
          {
            filename,
            contentType: 'application/pdf',
            data: buffer,
            size: buffer.length,
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.warn('[Resume] Auto-cache to MongoDB failed:', e);
      }

      return {
        buffer,
        filename,
        contentType: 'application/pdf',
      };
    }
  }

  return null;
}

/**
 * GET /api/resume/download
 * Downloads the resume as an attachment
 */
router.get('/download', async (_req: Request, res: Response): Promise<void> => {
  try {
    const resume = await getResumeData();
    if (!resume) {
      res.status(404).json({ success: false, error: 'Resume file not found' });
      return;
    }

    res.setHeader('Content-Type', resume.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resume.filename)}"`);
    res.setHeader('Content-Length', resume.buffer.length);
    res.send(resume.buffer);
  } catch (err: any) {
    console.error('[Resume Download Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to download resume' });
  }
});

/**
 * GET /api/resume/view
 * Displays the resume inline in the browser (for iframe preview)
 */
router.get('/view', async (_req: Request, res: Response): Promise<void> => {
  try {
    const resume = await getResumeData();
    if (!resume) {
      res.status(404).json({ success: false, error: 'Resume file not found' });
      return;
    }

    res.setHeader('Content-Type', resume.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resume.filename)}"`);
    res.setHeader('Content-Length', resume.buffer.length);
    res.send(resume.buffer);
  } catch (err: any) {
    console.error('[Resume View Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to view resume' });
  }
});

export default router;

