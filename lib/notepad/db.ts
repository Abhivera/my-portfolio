import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient;
  mongoDb?: Db;
};

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  return uri;
}

export async function getDb(): Promise<Db> {
  if (globalForMongo.mongoDb) {
    return globalForMongo.mongoDb;
  }

  const client =
    globalForMongo.mongoClient ??
    new MongoClient(getMongoUri(), { maxPoolSize: 10 });

  if (!globalForMongo.mongoClient) {
    await client.connect();
    globalForMongo.mongoClient = client;
  }

  const dbName = process.env.MONGODB_DB_NAME ?? "portfolio";
  const db = client.db(dbName);
  globalForMongo.mongoDb = db;
  return db;
}
