import dns from 'node:dns';
import { MongoClient } from 'mongodb';

// Ensure DNS fallback for Windows / restricted networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore DNS setServers error if environment restricts it
}

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://radiogsfcu_db_user:tZ4u0clkYCCKLFCP@gsfcu-got-talent.g0rghi5.mongodb.net/?retryWrites=true&w=majority&appName=gsfcu-got-talent';

const dbName = process.env.MONGODB_DB || 'gsfcu_got_talent';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Use global connection caching across serverless invocations
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    global._mongoClientPromise = client.connect();
  }

  cachedClient = await global._mongoClientPromise;
  cachedDb = cachedClient.db(dbName);

  return { client: cachedClient, db: cachedDb };
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

export function sendJson(res, statusCode, data) {
  setCors(res);
  if (typeof res.status === 'function') {
    const s = res.status(statusCode);
    if (s && typeof s.json === 'function') {
      return s.json(data);
    }
    if (typeof res.json === 'function') {
      return res.json(data);
    }
  }
  if (typeof res.json === 'function') {
    res.statusCode = statusCode;
    return res.json(data);
  }
  if (typeof res.writeHead === 'function') {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  } else {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  return res.end(JSON.stringify(data));
}

export async function getRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}
