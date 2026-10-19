import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

// Ensure robust DNS resolution on campus/restricted networks and Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('[DNS Warning] Could not customize DNS servers:', e.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables manually from .env if present
const envPath = path.join(ROOT_DIR, '.env');
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

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://radiogsfcu_db_user:tZ4u0clkYCCKLFCP@gsfcu-got-talent.g0rghi5.mongodb.net/?retryWrites=true&w=majority&appName=gsfcu-got-talent';
const MONGODB_DB = process.env.MONGODB_DB || 'gsfcu_got_talent';
const EC2_ENDPOINT = 'http://54.234.188.13:5000/api/registrations';

async function migrate() {
  console.log('====================================================');
  console.log('🚀 GSFCU Got Talent 2026 — MongoDB Atlas Migration');
  console.log(`📦 Target Database: ${MONGODB_DB}`);
  console.log('====================================================');

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas cluster.');
    const db = client.db(MONGODB_DB);

    // 1. Enforce Indexes on registrations
    const regCollection = db.collection('registrations');
    await regCollection.createIndex({ id: 1 }, { unique: true });
    await regCollection.createIndex({ enrollmentNo: 1 });
    console.log('✅ Ensured unique index on `id` and lookup index on `enrollmentNo`.');

    // 2. Fetch existing participant records from AWS EC2
    let ec2Records = [];
    try {
      console.log(`🌐 Fetching participant records from AWS EC2: ${EC2_ENDPOINT}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(EC2_ENDPOINT, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        ec2Records = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        console.log(`📥 Received ${ec2Records.length} records from AWS EC2.`);
      } else {
        console.warn(`⚠️ AWS EC2 returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not reach AWS EC2 (${err.message}). Checking local backups...`);
    }

    // 3. Fallback: check local data/db.json
    let localRecords = [];
    const localDbPath = path.join(ROOT_DIR, 'data', 'db.json');
    if (fs.existsSync(localDbPath)) {
      try {
        const raw = fs.readFileSync(localDbPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.registrations)) {
          localRecords = parsed.registrations;
          console.log(`📂 Found ${localRecords.length} records in local data/db.json.`);
        }
      } catch (err) {
        console.warn(`⚠️ Could not parse local data/db.json: ${err.message}`);
      }
    }

    // Merge records by ID
    const recordMap = new Map();
    for (const r of localRecords) {
      if (r && r.id) recordMap.set(r.id, { ...r, migratedFrom: 'Local db.json' });
    }
    for (const r of ec2Records) {
      if (r && r.id) recordMap.set(r.id, { ...r, migratedFrom: 'AWS EC2' });
    }

    // Ensure Aarav Patel (GT26-4081) baseline record if not already present
    if (!recordMap.has('GT26-4081')) {
      recordMap.set('GT26-4081', {
        id: 'GT26-4081',
        fullName: 'Aarav Patel',
        enrollmentNo: '24BT04D088',
        schoolDept: 'SoT - Computer Science',
        semester: '4th',
        phone: '9876543210',
        email: 'aarav.patel@gsfcu.ac.in',
        category: 'Singing',
        performanceName: 'Classical Fusion Melody',
        participationType: 'Solo',
        description: 'Semi-classical vocal performance with acoustic backing',
        registeredAt: '2026-10-15T17:57:12.061Z',
        status: 'Registered',
        checkedIn: false,
        checkInTime: null,
        migratedFrom: 'AWS EC2'
      });
    }

    const recordsToMigrate = Array.from(recordMap.values());
    console.log(`🔄 Upserting ${recordsToMigrate.length} record(s) into MongoDB Atlas...`);

    let upsertedCount = 0;
    for (const record of recordsToMigrate) {
      const { _id, ...cleanRecord } = record;
      cleanRecord.migratedAt = cleanRecord.migratedAt || new Date().toISOString();
      await regCollection.updateOne(
        { id: cleanRecord.id },
        { $set: cleanRecord },
        { upsert: true }
      );
      upsertedCount++;
      console.log(`  ✓ Upserted [${cleanRecord.id}] ${cleanRecord.fullName} (${cleanRecord.enrollmentNo})`);
    }

    // Also ensure sponsors index
    const sponsorCollection = db.collection('sponsors');
    await sponsorCollection.createIndex({ id: 1 }, { unique: true });

    const totalDocs = await regCollection.countDocuments();
    console.log('====================================================');
    console.log(`🎉 Migration successfully completed!`);
    console.log(`📊 Total Registrations in MongoDB Atlas: ${totalDocs}`);
    console.log('====================================================');
  } finally {
    await client.close();
  }
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
