import { connectToDatabase, setCors, sendJson, getRequestBody, formatMongoError } from './_lib/mongodb.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    if (res.status) return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('registrations');

    // GET /api/registrations
    if (req.method === 'GET') {
      const records = await collection
        .find({}, { projection: { _id: 0 } })
        .sort({ registeredAt: -1 })
        .toArray();

      return sendJson(res, 200, {
        success: true,
        data: records,
        count: records.length
      });
    }

    // POST /api/registrations
    if (req.method === 'POST') {
      const payload = await getRequestBody(req);

      if (!payload.fullName || !payload.enrollmentNo || !payload.category) {
        return sendJson(res, 400, {
          success: false,
          error: 'Required fields missing: fullName, enrollmentNo, category'
        });
      }

      const id = payload.id || `GT26-${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanTeamMembers = Array.isArray(payload.teamMembers) ? payload.teamMembers : [];
      const participationType = payload.participationType || 'Solo';
      const participationFormat = payload.participationFormat || (participationType === 'Solo' ? 'solo' : participationType === 'Duo' ? 'duo' : 'team');
      const numParticipants = payload.numParticipants || (participationFormat === 'solo' ? 1 : participationFormat === 'duo' ? 2 : (1 + cleanTeamMembers.length));

      const registration = {
        ...payload,
        id,
        participationType,
        participationFormat,
        teamMembers: cleanTeamMembers,
        numParticipants,
        registeredAt: payload.registeredAt || new Date().toISOString(),
        status: payload.status || 'Registered',
        checkedIn: Boolean(payload.checkedIn),
        checkInTime: payload.checkInTime || null,
        updatedAt: new Date().toISOString()
      };

      // Remove MongoDB _id from payload if sent by client
      delete registration._id;

      await collection.updateOne(
        { id },
        { $set: registration },
        { upsert: true }
      );

      return sendJson(res, 201, {
        success: true,
        message: 'Registration saved successfully',
        data: registration
      });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[API registrations] Error:', err);
    return sendJson(res, 500, { success: false, error: formatMongoError(err) });
  }
}
