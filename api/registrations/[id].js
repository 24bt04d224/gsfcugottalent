import { connectToDatabase, setCors, sendJson, getRequestBody } from '../_lib/mongodb.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    if (res.status) return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  // Extract ID from query parameter or URL path
  let targetId = req.query?.id;
  if (!targetId && req.url) {
    const urlParts = req.url.split('?')[0].split('/');
    targetId = decodeURIComponent(urlParts[urlParts.length - 1]);
  }

  if (!targetId) {
    return sendJson(res, 400, { success: false, error: 'Registration ID required' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('registrations');

    // GET /api/registrations/:id
    if (req.method === 'GET') {
      const record = await collection.findOne({ id: targetId }, { projection: { _id: 0 } });
      if (!record) {
        return sendJson(res, 404, { success: false, error: 'Registration not found' });
      }
      return sendJson(res, 200, { success: true, data: record });
    }

    // PATCH or PUT /api/registrations/:id
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const updates = await getRequestBody(req);

      // Protect primary identifiers from being overwritten
      delete updates._id;
      delete updates.id;

      updates.updatedAt = new Date().toISOString();

      const result = await collection.findOneAndUpdate(
        { id: targetId },
        { $set: updates },
        { returnDocument: 'after', projection: { _id: 0 } }
      );

      const updatedDoc = result?.value || result;
      if (!updatedDoc) {
        return sendJson(res, 404, { success: false, error: 'Registration not found' });
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Registration updated successfully',
        data: updatedDoc
      });
    }

    // DELETE /api/registrations/:id
    if (req.method === 'DELETE') {
      const result = await collection.deleteOne({ id: targetId });

      if (result.deletedCount === 0) {
        return sendJson(res, 404, { success: false, error: 'Registration not found' });
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Registration deleted successfully',
        id: targetId
      });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error(`[API registrations/${targetId}] Error:`, err);
    return sendJson(res, 500, { success: false, error: err.message });
  }
}
