import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

// 1. Mongoose Connection (For Structured Schemas)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: dbName,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      waitQueueTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(uri, opts).then(async (mongooseInstance) => {
      console.log('>>> [MONGODB_STATUS] Mongoose connection established');
      try {
        const db = mongooseInstance.connection.db;
        if (db) {
          const result = await db.collection('expenses').updateMany(
            { expenseType: { $exists: false } },
            { $set: { expenseType: 'Operational' } }
          );
          if (result.modifiedCount > 0) {
            console.log(`>>> [MIGRATION] Set default expenseType: 'Operational' for ${result.modifiedCount} expenses.`);
          }
        }
      } catch (err) {
        console.error('>>> [MIGRATION_ERROR] Failed to run expenseType migration:', err);
      }
      return mongooseInstance;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// 2. Raw MongoClient Promise (For legacy compatibility)
let clientPromise;

if (!globalThis.__towAdminMongoClientPromise) {
  const client = new MongoClient(uri);
  globalThis.__towAdminMongoClientPromise = client.connect();
}

clientPromise = globalThis.__towAdminMongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
