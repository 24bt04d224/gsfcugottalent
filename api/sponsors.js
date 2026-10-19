import { connectToDatabase, setCors, sendJson, getRequestBody } from './_lib/mongodb.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    if (res.status) return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('sponsors');

    // GET /api/sponsors
    if (req.method === 'GET') {
      const records = await collection
        .find({}, { projection: { _id: 0 } })
        .sort({ displayOrder: 1, createdAt: -1 })
        .toArray();

      return sendJson(res, 200, {
        success: true,
        data: records,
        count: records.length
      });
    }

    // POST /api/sponsors
    if (req.method === 'POST') {
      const body = await getRequestBody(req);

      const newSponsor = {
        id: body.id || `SP-${Date.now()}`,
        name: body.name || 'Anonymous Sponsor',
        tier: body.tier || body.category || 'Silver',
        category: body.category || body.tier || 'Silver',
        logoUrl: body.logoUrl || '',
        website: body.website || body.websiteUrl || '',
        websiteUrl: body.websiteUrl || body.website || '',
        contactPerson: body.contactPerson || '',
        contactEmail: body.contactEmail || '',
        description: body.description || '',
        status: body.status || 'Active',
        displayOrder: Number(body.displayOrder) || 1,
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      delete newSponsor._id;

      await collection.updateOne(
        { id: newSponsor.id },
        { $set: newSponsor },
        { upsert: true }
      );

      return sendJson(res, 201, {
        success: true,
        message: 'Sponsor saved successfully',
        data: newSponsor
      });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[API sponsors] Error:', err);
    return sendJson(res, 500, { success: false, error: err.message });
  }
}
