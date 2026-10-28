/**
 * Developer Utility: Simulate a GitHub Push Webhook Event
 * Generates an HMAC SHA-256 signed webhook and sends it to the running backend.
 *
 * Usage:
 * npx tsx src/scripts/simulatePush.ts [repoFullName] [commitMessage]
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const port = process.env.PORT || '5000';
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'dev-webhook-secret';
const repoFullName = process.argv[2] || 'portfolio-owner/ccna-networking-labs';
const commitMessage = process.argv[3] || 'feat: add OSPF multi-area topology and router-on-a-stick configs';

async function simulate() {
  const commitSha = crypto.randomBytes(20).toString('hex');
  const deliveryId = `sim_del_${Date.now()}`;

  const payload = {
    ref: 'refs/heads/main',
    before: crypto.randomBytes(20).toString('hex'),
    after: commitSha,
    repository: {
      id: 10101,
      name: repoFullName.split('/')[1] || 'ccna-networking-labs',
      full_name: repoFullName,
      owner: {
        login: repoFullName.split('/')[0] || 'portfolio-owner',
      },
      html_url: `https://github.com/${repoFullName}`,
      default_branch: 'main',
      private: false,
      description: 'Hands-on Cisco networking labs and configurations',
    },
    commits: [
      {
        id: commitSha,
        message: commitMessage,
        added: ['labs/04-ospf-multiarea/configs/r1.ios', 'labs/04-ospf-multiarea/configs/r2.ios'],
        removed: [],
        modified: ['README.md'],
      },
    ],
    head_commit: {
      id: commitSha,
      message: commitMessage,
      added: ['labs/04-ospf-multiarea/configs/r1.ios', 'labs/04-ospf-multiarea/configs/r2.ios'],
      removed: [],
      modified: ['README.md'],
    },
  };

  const payloadString = JSON.stringify(payload);
  const signature = 'sha256=' + crypto.createHmac('sha256', webhookSecret).update(payloadString).digest('hex');

  console.log(`📡 Simulating push to ${repoFullName}...`);
  console.log(`🔑 Delivery ID: ${deliveryId}`);
  console.log(`📝 Commit: ${commitSha.substring(0, 7)} - "${commitMessage}"`);

  try {
    const res = await fetch(`http://localhost:${port}/api/webhook/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'push',
        'X-GitHub-Delivery': deliveryId,
        'X-Hub-Signature-256': signature,
      },
      body: payloadString,
    });

    const data = await res.json();
    console.log(`\n📬 Response (${res.status}):`, JSON.stringify(data, null, 2));
    if (res.ok) {
      console.log('\n✅ Push event accepted! The background pipeline is analyzing the commit.');
    }
  } catch (err: any) {
    console.error('\n❌ Failed to deliver webhook:', err.message);
    console.log('Ensure the backend server is running on http://localhost:' + port);
  }
}

simulate();
