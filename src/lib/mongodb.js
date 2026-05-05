import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB || 'tow_admin';

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
