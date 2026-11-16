import mongoose from 'mongoose';
import { config } from '../config';

let mongoMemoryInstance: any = null;

export async function connectDatabase(): Promise<void> {
  const env = process.env.NODE_ENV || config.env;
  const isProd = env === 'production';
  const uri = (process.env.MONGODB_URI !== undefined ? process.env.MONGODB_URI : config.mongoUri).trim();
  const isMemory = uri === '' || uri === 'memory' || uri.toLowerCase() === 'inmemory';

  // Production Safety Check: Never allow ephemeral in-memory database in production
  if (isProd && isMemory) {
    throw new Error(
      'Fatal Startup Configuration Error: In production (NODE_ENV=production), MONGODB_URI must be configured with a persistent MongoDB database URI and cannot use "memory".'
    );
  }

  if (isMemory) {
    console.log('[Database] Starting in-memory MongoDB server for local development/testing...');
    const memPkg = 'mongodb-memory-server';
    const { MongoMemoryServer } = require(memPkg);
    mongoMemoryInstance = await MongoMemoryServer.create({ binary: { version: '6.0.13' } });
    const memoryUri = mongoMemoryInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log('[Database] Connected to in-memory MongoDB instance:', memoryUri);
  } else {
    console.log(`[Database] Connecting to configured MongoDB at ${uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@')}...`);
    await mongoose.connect(uri);
    console.log('[Database] Successfully connected to external MongoDB');
  }

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection disconnected');
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryInstance) {
    await mongoMemoryInstance.stop();
    mongoMemoryInstance = null;
  }
}
