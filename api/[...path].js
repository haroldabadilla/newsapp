// Serverless function to handle all API routes
import { connectMongo } from '../backend/src/db/mongo.js';
import { buildApp } from '../backend/src/app.js';

let app;
let isConnected = false;

async function getApp() {
  if (!app) {
    if (!isConnected) {
      await connectMongo(process.env.MONGODB_URI);
      isConnected = true;
    }
    app = buildApp();
    app.set('trust proxy', 1);
  }
  return app;
}

export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
