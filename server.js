/**
 * GSFCU Got Talent 2026 - Production Backend Server
 * Compatible with Vercel Serverless, AWS EC2, Render, and Localhost
 * Connects natively to MongoDB Atlas with automatic fallback to local data/db.json
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

// Ensure DNS fallback for Windows / restricted networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore DNS setServers error if environment restricts it
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DIST_DIR = path.join(__dirname, 'dist');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'gsfcu_got_talent';

// Ensure database directory & storage file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_DB = {
  registrations: [],
  sponsors: [],
  stats: {
    views: 0,
    lastUpdated: new Date().toISOString()
  }
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Database Error] Failed to read db.json:', err.message);
    return DEFAULT_DB;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Database Error] Failed to write db.json:', err.message);
    return false;
  }
}

// MongoDB Atlas connection state
let _mongoClient = null;
let mongoDb = null;

async function initMongo() {
  if (!MONGODB_URI) {
    console.log('ℹ️ MONGODB_URI not found. Running with local db.json storage.');
    return null;
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    await client.connect();
    _mongoClient = client;
    mongoDb = client.db(MONGODB_DB);

    // Enforce indexes
    const regCollection = mongoDb.collection('registrations');
    await regCollection.createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await regCollection.createIndex({ enrollmentNo: 1 }).catch(() => {});

    console.log(`🍃 Connected to MongoDB Atlas Cluster (${MONGODB_DB})`);
    return mongoDb;
  } catch (err) {
    console.warn(`⚠️ MongoDB Atlas connection error (${err.message}). Falling back to local db.json.`);
    return null;
  }
}

// Initialize MongoDB on server start
const mongoPromise = initMongo();

// CORS & JSON helpers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function escapeRegex(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

// MIME types for static frontend serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

  // Await mongo connection initialization if still pending
  if (MONGODB_URI && !mongoDb) {
    try {
      await mongoPromise;
    } catch {
      // ignore, fallback to db.json
    }
  }

  // API ROUTING
  // 1. Health check
  if (pathname === '/health' || pathname === '/api/health') {
    try {
      if (mongoDb) {
        const regCount = await mongoDb.collection('registrations').countDocuments();
        const sponsorCount = await mongoDb.collection('sponsors').countDocuments();
        return sendJson(res, 200, {
          status: 'ok',
          service: 'GSFCU Got Talent Backend Server',
          database: 'MongoDB Atlas',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          counts: {
            registrations: regCount,
            sponsors: sponsorCount
          }
        });
      }
    } catch (err) {
      console.warn('[Health Check Mongo Notice]', err.message);
    }

    const db = readDb();
    return sendJson(res, 200, {
      status: 'ok',
      service: 'GSFCU Got Talent Backend Server',
      database: 'Local db.json fallback',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      counts: {
        registrations: db.registrations.length,
        sponsors: db.sponsors.length
      }
    });
  }

  // 2. Registrations: GET all
  if (pathname === '/api/registrations' && method === 'GET') {
    try {
      if (mongoDb) {
        const docs = await mongoDb.collection('registrations')
          .find({}, { projection: { _id: 0 } })
          .sort({ registeredAt: -1 })
          .toArray();
        return sendJson(res, 200, {
          success: true,
          data: docs,
          count: docs.length
        });
      }
    } catch (err) {
      console.warn('[Mongo GET registrations Notice]', err.message);
    }

    const db = readDb();
    return sendJson(res, 200, {
      success: true,
      data: db.registrations,
      count: db.registrations.length
    });
  }

  // 3. Registrations: POST new registration
  if ((pathname === '/api/registrations' || pathname === '/api/register') && method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      if (!payload.fullName || !payload.enrollmentNo || !payload.category) {
        return sendJson(res, 400, {
          success: false,
          error: 'Required fields missing: fullName, enrollmentNo, category'
        });
      }

      const newId = payload.id || `GT26-${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanTeamMembers = Array.isArray(payload.teamMembers) ? payload.teamMembers : [];
      const pType = payload.participationType || 'Solo';
      const pFormat = payload.participationFormat || (pType === 'Solo' ? 'solo' : pType === 'Duo' ? 'duo' : 'team');
      const numParticipants = payload.numParticipants || (pFormat === 'solo' ? 1 : pFormat === 'duo' ? 2 : (1 + cleanTeamMembers.length));

      const registration = {
        ...payload,
        id: newId,
        participationType: pType,
        participationFormat: pFormat,
        teamMembers: cleanTeamMembers,
        numParticipants,
        registeredAt: payload.registeredAt || new Date().toISOString(),
        status: payload.status || 'Registered',
        checkedIn: Boolean(payload.checkedIn),
        checkInTime: payload.checkInTime || null,
        updatedAt: new Date().toISOString()
      };
      delete registration._id;

      if (mongoDb) {
        try {
          await mongoDb.collection('registrations').updateOne(
            { id: newId },
            { $set: registration },
            { upsert: true }
          );
        } catch (mErr) {
          console.warn('[Mongo POST registrations Notice]', mErr.message);
        }
      }

      // Also backup to local db.json
      const db = readDb();
      const existingIdx = db.registrations.findIndex(r => r.id === newId);
      if (existingIdx >= 0) {
        db.registrations[existingIdx] = registration;
      } else {
        db.registrations.unshift(registration);
      }
      writeDb(db);

      return sendJson(res, 201, {
        success: true,
        message: 'Registration saved successfully',
        data: registration
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 4. Registrations: Check-in endpoint POST /api/check-in or /api/registrations/check-in
  if ((pathname === '/api/check-in' || pathname === '/api/registrations/check-in') && method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const queryId = (payload.id || payload.enrollmentNo || '').trim();

      if (!queryId) {
        return sendJson(res, 400, { success: false, error: 'Registration ID or Enrollment No required' });
      }

      const now = new Date().toISOString();

      if (mongoDb) {
        try {
          const safeRegex = new RegExp(`^${escapeRegex(queryId)}$`, 'i');
          const target = await mongoDb.collection('registrations').findOne({
            $or: [{ id: safeRegex }, { enrollmentNo: safeRegex }]
          });

          if (target) {
            const checkInTime = target.checkInTime || now;
            const status = target.status === 'Cancelled' ? 'Cancelled' : 'Auditioned';
            const result = await mongoDb.collection('registrations').findOneAndUpdate(
              { id: target.id },
              {
                $set: {
                  checkedIn: true,
                  checkInTime,
                  status,
                  updatedAt: now
                }
              },
              { returnDocument: 'after', projection: { _id: 0 } }
            );

            const updatedDoc = result?.value || result;

            // Sync with local db.json if present
            const db = readDb();
            const localIdx = db.registrations.findIndex(r => r.id === target.id);
            if (localIdx >= 0) {
              db.registrations[localIdx] = { ...db.registrations[localIdx], ...updatedDoc };
              writeDb(db);
            }

            return sendJson(res, 200, {
              success: true,
              message: 'Participant checked in successfully',
              data: updatedDoc
            });
          }
        } catch (mErr) {
          console.warn('[Mongo CheckIn Notice]', mErr.message);
        }
      }

      // Fallback check against db.json
      const db = readDb();
      const target = db.registrations.find(r =>
        (r.id && r.id.toUpperCase() === queryId.toUpperCase()) ||
        (r.enrollmentNo && r.enrollmentNo.toUpperCase() === queryId.toUpperCase())
      );

      if (!target) {
        return sendJson(res, 404, { success: false, error: 'Participant record not found' });
      }

      target.checkedIn = true;
      target.checkInTime = target.checkInTime || now;
      target.status = target.status === 'Cancelled' ? 'Cancelled' : 'Auditioned';

      writeDb(db);
      return sendJson(res, 200, {
        success: true,
        message: 'Participant checked in successfully',
        data: target
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 5. Registrations: PUT / PATCH update by ID (/api/registrations/:id)
  const regIdMatch = pathname.match(/^\/api\/registrations\/([^/]+)$/);
  if (regIdMatch && (method === 'PUT' || method === 'PATCH')) {
    try {
      const targetId = decodeURIComponent(regIdMatch[1]);
      const updates = await parseJsonBody(req);
      delete updates._id;
      delete updates.id;
      updates.updatedAt = new Date().toISOString();

      if (mongoDb) {
        try {
          const result = await mongoDb.collection('registrations').findOneAndUpdate(
            { id: targetId },
            { $set: updates },
            { returnDocument: 'after', projection: { _id: 0 } }
          );
          const updatedDoc = result?.value || result;
          if (updatedDoc) {
            // Backup local
            const db = readDb();
            const index = db.registrations.findIndex(r => r.id === targetId);
            if (index >= 0) {
              db.registrations[index] = { ...db.registrations[index], ...updatedDoc };
              writeDb(db);
            }
            return sendJson(res, 200, {
              success: true,
              message: 'Registration updated',
              data: updatedDoc
            });
          }
        } catch (mErr) {
          console.warn('[Mongo PATCH Notice]', mErr.message);
        }
      }

      const db = readDb();
      const index = db.registrations.findIndex(r => r.id === targetId);
      if (index === -1) {
        return sendJson(res, 404, { success: false, error: 'Registration not found' });
      }

      db.registrations[index] = {
        ...db.registrations[index],
        ...updates,
        id: targetId
      };
      writeDb(db);
      return sendJson(res, 200, {
        success: true,
        message: 'Registration updated',
        data: db.registrations[index]
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 5b. Registrations: DELETE by ID (/api/registrations/:id)
  if (regIdMatch && method === 'DELETE') {
    try {
      const targetId = decodeURIComponent(regIdMatch[1]);

      if (mongoDb) {
        try {
          await mongoDb.collection('registrations').deleteOne({ id: targetId });
        } catch (mErr) {
          console.warn('[Mongo DELETE Notice]', mErr.message);
        }
      }

      const db = readDb();
      const initialLength = db.registrations.length;
      db.registrations = db.registrations.filter(r => r.id !== targetId);

      if (db.registrations.length === initialLength && !mongoDb) {
        return sendJson(res, 404, { success: false, error: 'Registration not found' });
      }

      writeDb(db);
      return sendJson(res, 200, {
        success: true,
        message: 'Registration deleted successfully',
        id: targetId
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 6. Sponsors: GET & POST
  if (pathname === '/api/sponsors') {
    if (method === 'GET') {
      if (mongoDb) {
        try {
          const records = await mongoDb.collection('sponsors')
            .find({}, { projection: { _id: 0 } })
            .sort({ displayOrder: 1, createdAt: -1 })
            .toArray();
          return sendJson(res, 200, { success: true, data: records, count: records.length });
        } catch (mErr) {
          console.warn('[Mongo GET sponsors Notice]', mErr.message);
        }
      }
      const db = readDb();
      return sendJson(res, 200, { success: true, data: db.sponsors || [] });
    }

    if (method === 'POST') {
      try {
        const body = await parseJsonBody(req);
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

        if (mongoDb) {
          try {
            await mongoDb.collection('sponsors').updateOne(
              { id: newSponsor.id },
              { $set: newSponsor },
              { upsert: true }
            );
          } catch (mErr) {
            console.warn('[Mongo POST sponsor Notice]', mErr.message);
          }
        }

        const db = readDb();
        db.sponsors = db.sponsors || [];
        db.sponsors.push(newSponsor);
        writeDb(db);
        return sendJson(res, 201, { success: true, data: newSponsor });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }
  }

  // 7. Stats: GET /api/stats
  if (pathname === '/api/stats' && method === 'GET') {
    if (mongoDb) {
      try {
        const regs = await mongoDb.collection('registrations')
          .find({}, { projection: { checkedIn: 1, participationType: 1 } })
          .toArray();
        const total = regs.length;
        const checkedIn = regs.filter(r => r.checkedIn).length;
        const solo = regs.filter(r => (r.participationType || '').toLowerCase() === 'solo').length;
        const group = total - solo;
        const sponsorCount = await mongoDb.collection('sponsors').countDocuments();

        return sendJson(res, 200, {
          success: true,
          stats: {
            total,
            checkedIn,
            solo,
            group,
            sponsors: sponsorCount
          }
        });
      } catch (mErr) {
        console.warn('[Mongo GET stats Notice]', mErr.message);
      }
    }

    const db = readDb();
    const regs = db.registrations;
    const total = regs.length;
    const checkedIn = regs.filter(r => r.checkedIn).length;
    const solo = regs.filter(r => (r.participationType || '').toLowerCase() === 'solo').length;
    const group = total - solo;

    return sendJson(res, 200, {
      success: true,
      stats: {
        total,
        checkedIn,
        solo,
        group,
        sponsors: (db.sponsors || []).length
      }
    });
  }

  // 8. Serve static frontend files if dist/ exists (Fullstack Render/EC2 Deployment)
  if (fs.existsSync(DIST_DIR)) {
    let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
  }

  // Not found fallback
  return sendJson(res, 404, {
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET  /health',
      'GET  /api/health',
      'GET  /api/registrations',
      'POST /api/registrations',
      'POST /api/check-in',
      'PUT  /api/registrations/:id',
      'DELETE /api/registrations/:id',
      'GET  /api/stats',
      'GET  /api/sponsors',
      'POST /api/sponsors'
    ]
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🎭 GSFCU Got Talent Backend Server running!`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🌐 Health URL: http://0.0.0.0:${PORT}/health`);
  console.log(`📁 Database: ${MONGODB_URI ? 'MongoDB Atlas (' + MONGODB_DB + ')' : DB_FILE}`);
  console.log(`===============================================`);
});
