import { connectToDatabase, setCors, sendJson } from './_lib/mongodb.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    if (res.status) return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  try {
    const startTime = Date.now();
    const { db } = await connectToDatabase();
    const regCount = await db.collection('registrations').countDocuments();
    const sponsorCount = await db.collection('sponsors').countDocuments();
    const responseTimeMs = Date.now() - startTime;

    return sendJson(res, 200, {
      status: 'ok',
      service: 'GSFCU Got Talent Vercel Serverless API',
      database: 'MongoDB Atlas',
      cluster: 'gsfcu-got-talent',
      timestamp: new Date().toISOString(),
      responseTimeMs,
      counts: {
        registrations: regCount,
        sponsors: sponsorCount
      }
    });
  } catch (err) {
    console.error('[API health] Error:', err);
    return sendJson(res, 503, {
      status: 'error',
      service: 'GSFCU Got Talent Vercel Serverless API',
      database: 'MongoDB Atlas',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
}
