import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

const globalForMongo = globalThis;
const clientPromise =
  uri &&
  (globalForMongo.moraMongoClientPromise ||
    new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    }).connect());

globalForMongo.moraMongoClientPromise = clientPromise;

export default clientPromise;
