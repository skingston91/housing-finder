import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Sanity check for serverless deployment. Local: `vercel dev` (see docs/development.md).
 */
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.status(200).json({ ok: true, service: 'housing-finder-api' });
}
