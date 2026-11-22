import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Admin from './models/Admin.js';

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before seeding.');
if (process.env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
let localMongo;
let mongoUri = process.env.MONGODB_URI;
const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!mongoUri) {
  const binaryPath = resolve(serverRoot, '.data', 'mongodb-binaries');
  await mkdir(binaryPath, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_DIR ||= binaryPath;
  const { MongoMemoryServer } = await import('mongodb-memory-server-core');
  const dataPath = resolve(serverRoot, '.data', 'mongodb');
  await mkdir(dataPath, { recursive: true });
  localMongo = await MongoMemoryServer.create({ binary: { version: '8.0.38' }, instance: { dbPath: dataPath, dbName: 'visitorx', storageEngine: 'wiredTiger' } });
  mongoUri = localMongo.getUri('visitorx');
}
await mongoose.connect(mongoUri);
const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
await Admin.findOneAndUpdate({ email }, { name: process.env.ADMIN_NAME || 'Campus Administrator', email, passwordHash }, { upsert: true, new: true, setDefaultsOnInsert: true });
const savedAdmin = await Admin.findOne({ email }).select('email passwordHash');
if (!savedAdmin || !(await bcrypt.compare(process.env.ADMIN_PASSWORD, savedAdmin.passwordHash))) throw new Error('Staff account could not be verified after saving.');
console.log(`Staff account ready for ${email} in database ${mongoose.connection.db.databaseName}`);
await mongoose.disconnect();
if (localMongo) await localMongo.stop({ doCleanup: false });
