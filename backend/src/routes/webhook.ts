import { Router, Request, Response } from 'express';
import { verifyWebhookSignature, WebhookPushPayload } from '../services/github/githubService';
import { WebhookDelivery } from '../models/WebhookDelivery';
import { MonitoredRepository } from '../models/MonitoredRepository';
import { PortfolioEntry } from '../models/PortfolioEntry';
import { jobQueue } from '../services/queue/jobQueue';
import { config } from '../config';

const router = Router();

export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

/**
 * POST /api/webhook/github
 * GitHub Webhooks Endpoint for push events
 */
router.post('/github', async (req: RawBodyRequest, res: Response): Promise<void> => {
  const event = req.headers['x-github-event'] as string;
  const deliveryId = (req.headers['x-github-delivery'] as string) || `del_${Date.now()}`;
  const signature = req.headers['x-hub-signature-256'] as string | undefined;

  // 1. Verify Webhook Signature if secret configured
  if (config.github.webhookSecret) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const isValid = verifyWebhookSignature(rawBody, signature, config.github.webhookSecret);
    if (!isValid) {
      console.warn(`[Webhook] Rejected GitHub webhook delivery ${deliveryId} due to invalid HMAC signature.`);
      res.status(401).json({ success: false, error: 'Invalid webhook signature' });
      return;
    }
  }

  // Handle repository lifecycle events: deletion, archiving, privatization, creation
  if (event === 'repository') {
    const action = req.body?.action;
    const repoData = req.body?.repository;
    if (!repoData) {
      res.status(400).json({ success: false, error: 'Malformed repository event payload' });
      return;
    }

    const repoFullName = repoData.full_name;

    // A. Repository Deleted on GitHub -> Automatically remove from portfolio!
    if (action === 'deleted') {
      console.log(`[Webhook] Repository ${repoFullName} was deleted on GitHub. Automatically removing from portfolio...`);
      const repo = await MonitoredRepository.findOne({
        $or: [{ githubRepoId: repoData.id }, { fullName: repoFullName.toLowerCase() }],
      });

      if (repo) {
        await PortfolioEntry.deleteMany({ repoId: repo._id });
        await MonitoredRepository.findByIdAndDelete(repo._id);
        console.log(`[Webhook] Successfully removed deleted repository ${repoFullName} and portfolio entry.`);
      }

      await WebhookDelivery.create({
        deliveryId,
        eventType: 'repository_deleted',
        repoFullName,
        status: 'completed',
        summary: `Repository ${repoFullName} deleted on GitHub; automatically removed from portfolio.`,
      });

      res.json({
        success: true,
        action: 'deleted',
        message: `Repository ${repoFullName} automatically removed from portfolio.`,
      });
      return;
    }

    // B. Repository Archived on GitHub -> Mark publication status as archived
    if (action === 'archived') {
      const repo = await MonitoredRepository.findOne({
        $or: [{ githubRepoId: repoData.id }, { fullName: repoFullName.toLowerCase() }],
      });
      if (repo) {
        await PortfolioEntry.updateMany({ repoId: repo._id }, { $set: { publicationStatus: 'archived' } });
      }
      res.json({ success: true, action: 'archived' });
      return;
    }

    // C. Repository Created or Made Public on GitHub -> Automatically discover and queue analysis
    if (action === 'created' || action === 'publicized') {
      console.log(`[Webhook] New repository ${repoFullName} created on GitHub. Automatically adding to portfolio pipeline...`);
      let repo = await MonitoredRepository.findOne({ githubRepoId: repoData.id });
      if (!repo) {
        repo = await MonitoredRepository.create({
          githubRepoId: repoData.id,
          fullName: repoData.full_name,
          name: repoData.name,
          owner: repoData.owner?.login || repoFullName.split('/')[0],
          isPrivate: Boolean(repoData.private),
          htmlUrl: repoData.html_url,
          description: repoData.description || '',
          defaultBranch: repoData.default_branch || 'main',
          monitoredBranch: repoData.default_branch || 'main',
          isMonitored: true,
          primaryCategory: 'Software Projects',
          lastAnalysisStatus: 'idle',
        });
      }

      await jobQueue.enqueueJob({
        triggerType: 'webhook_push',
        repoId: repo._id,
        repoFullName: repo.fullName,
        commitSha: 'initial_webhook_sha',
        branch: repo.defaultBranch,
      });

      res.json({
        success: true,
        action,
        message: `Repository ${repoFullName} enqueued for automatic AI portfolio generation.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Ignored repository action '${action}'.`,
    });
    return;
  }

  // Handle non-push events gracefully
  if (event !== 'push') {
    res.status(200).json({
      success: true,
      message: `Ignored event type '${event}'.`,
    });
    return;
  }

  const payload = req.body as WebhookPushPayload;
  if (!payload || !payload.repository) {
    res.status(400).json({ success: false, error: 'Malformed push payload' });
    return;
  }

  const repoFullName = payload.repository.full_name;
  const commitSha = payload.after || payload.head_commit?.id || 'unknown_sha';

  // 2. Delivery Idempotency Check
  const existingDelivery = await WebhookDelivery.findOne({ deliveryId });
  if (existingDelivery) {
    console.log(`[Webhook] Duplicate delivery ${deliveryId} detected. Ignoring to prevent duplicate processing.`);
    res.status(200).json({
      success: true,
      status: 'duplicate_ignored',
      message: 'Delivery already processed',
    });
    return;
  }

  // 3. Monitored Repository Authorization Check
  const monitoredRepo = await MonitoredRepository.findOne({
    $or: [{ githubRepoId: payload.repository.id }, { fullName: repoFullName.toLowerCase() }],
  });

  if (!monitoredRepo || !monitoredRepo.isMonitored) {
    console.log(`[Webhook] Push received for unmonitored repository ${repoFullName}. Ignored.`);
    await WebhookDelivery.create({
      deliveryId,
      eventType: event,
      repoFullName,
      commitSha,
      status: 'unmonitored_ignored',
      summary: 'Repository is not authorized or monitored by portfolio owner',
    });

    res.status(200).json({
      success: true,
      status: 'unmonitored_ignored',
      message: `Repository '${repoFullName}' is not currently authorized for monitoring.`,
    });
    return;
  }

  // 4. Record Webhook Delivery
  await WebhookDelivery.create({
    deliveryId,
    eventType: event,
    repoFullName,
    commitSha,
    status: 'accepted',
    summary: `Accepted push to ${payload.ref} with head commit ${commitSha.substring(0, 7)}`,
  });

  // 5. Enqueue Asynchronous Processing Job
  const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'main';
  const job = await jobQueue.enqueueJob({
    triggerType: 'webhook_push',
    repoId: monitoredRepo._id,
    repoFullName: monitoredRepo.fullName,
    commitSha,
    previousCommitSha: payload.before,
    branch,
  });

  // Update repository activity timestamp
  monitoredRepo.lastPushDetectedAt = new Date();
  monitoredRepo.lastAnalysisStatus = 'pending';
  await monitoredRepo.save();

  // 6. Return Fast Successful Acknowledgement to GitHub
  res.status(202).json({
    success: true,
    message: 'Push event accepted and scheduled for portfolio analysis',
    jobId: job.jobId,
    repository: repoFullName,
    commitSha,
  });
});

export default router;
