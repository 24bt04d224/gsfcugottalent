import { connectToDatabase, setCors, sendJson, getRequestBody } from './_lib/mongodb.js';

function escapeRegex(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    if (res.status) return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  try {
    const payload = await getRequestBody(req);
    const queryId = (payload.id || payload.enrollmentNo || '').trim();

    if (!queryId) {
      return sendJson(res, 400, {
        success: false,
        error: 'Registration ID or Enrollment No required'
      });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('registrations');

    // Case-insensitive regex matching for ID or enrollmentNo
    const safeRegex = new RegExp(`^${escapeRegex(queryId)}$`, 'i');
    const target = await collection.findOne({
      $or: [
        { id: safeRegex },
        { enrollmentNo: safeRegex }
      ]
    });

    if (!target) {
      return sendJson(res, 404, {
        success: false,
        error: 'Participant record not found'
      });
    }

    const now = new Date().toISOString();
    const newStatus = target.status === 'Cancelled' ? 'Cancelled' : 'Auditioned';
    const checkInTime = target.checkInTime || now;

    const result = await collection.findOneAndUpdate(
      { id: target.id },
      {
        $set: {
          checkedIn: true,
          checkInTime,
          status: newStatus,
          updatedAt: now
        }
      },
      { returnDocument: 'after', projection: { _id: 0 } }
    );

    const updatedDoc = result?.value || result;

    return sendJson(res, 200, {
      success: true,
      message: 'Participant checked in successfully',
      data: updatedDoc
    });
  } catch (err) {
    console.error('[API check-in] Error:', err);
    return sendJson(res, 500, { success: false, error: err.message });
  }
}
