import { connectToDatabase, setCors, sendJson } from './_lib/mongodb.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    if (res.status) return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const registrations = await db.collection('registrations')
      .find({}, { projection: { checkedIn: 1, participationType: 1 } })
      .toArray();

    const total = registrations.length;
    const checkedIn = registrations.filter(r => r.checkedIn).length;
    const solo = registrations.filter(r => (r.participationType || '').toLowerCase() === 'solo').length;
    const group = total - solo;
    const sponsorsCount = await db.collection('sponsors').countDocuments();

    return sendJson(res, 200, {
      success: true,
      stats: {
        total,
        checkedIn,
        solo,
        group,
        sponsors: sponsorsCount
      }
    });
  } catch (err) {
    console.error('[API stats] Error:', err);
    return sendJson(res, 500, { success: false, error: err.message });
  }
}
