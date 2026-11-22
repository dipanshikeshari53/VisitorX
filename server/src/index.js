import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import authRoutes from './routes/auth.js';
import visitorRoutes from './routes/visitors.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required. Copy server/.env.example to server/.env and configure it.');
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.');
let localMongo;
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  const binaryPath = resolve('.data', 'mongodb-binaries');
  await mkdir(binaryPath, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_DIR ||= binaryPath;
  const { MongoMemoryServer } = await import('mongodb-memory-server-core');
  const dataPath = resolve('.data', 'mongodb');
  await mkdir(dataPath, { recursive: true });
  localMongo = await MongoMemoryServer.create({
    binary: { version: '8.0.38' },
    instance: { dbPath: dataPath, dbName: 'visitorx', storageEngine: 'wiredTiger' },
  });
  mongoUri = localMongo.getUri();
  console.log('Started local MongoDB for development; data is saved in server/.data/mongodb.');
}
await mongoose.connect(mongoUri);

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use((_req, res) => res.status(404).json({ message: 'That page could not be found.' }));
app.use((error, _req, res, _next) => {
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please check the details and try again.' });
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`VisitorX API listening on http://localhost:${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await mongoose.disconnect();
    if (localMongo) await localMongo.stop();
    process.exit(0);
  });
}
