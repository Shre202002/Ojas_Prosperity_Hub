import { MongoClient, type Db, type Collection, type Document } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'ojas_prosperity_hub';

if (!uri && process.env.NODE_ENV === 'production') {
  throw new Error('MONGODB_URI is required in production.');
}

declare global {
  // eslint-disable-next-line no-var
  var __ojasMongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var __ojasMongoDb: Db | undefined;
}

export async function getMongoDb(): Promise<Db> {
  if (!uri) throw new Error('MONGODB_URI is not configured.');
  if (!global.__ojasMongoClient) global.__ojasMongoClient = new MongoClient(uri);
  if (!global.__ojasMongoDb) {
    await global.__ojasMongoClient.connect();
    global.__ojasMongoDb = global.__ojasMongoClient.db(dbName);
  }
  return global.__ojasMongoDb;
}

export async function getMongoClient(): Promise<MongoClient> {
  await getMongoDb();
  return global.__ojasMongoClient!;
}

export async function collection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  return (await getMongoDb()).collection<T>(name);
}
