import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from '../config';

let mongoMemoryInstance: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  const uri = config.mongoUri.trim();

  if (uri === '' || uri === 'memory' || uri.toLowerCase() === 'inmemory') {
    console.log('[Database] Starting in-memory MongoDB server for local development/testing...');
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
