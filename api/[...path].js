// Serverless function to handle all API routes
import { connectMongo } from '../backend/src/db/mongo.js';
import { buildApp } from '../backend/src/app.js';

let app;
let isConnected = false;

async function getApp() {
  if (!app) {
    try {
      if (!isConnected) {
        await connectMongo(process.env.MONGODB_URI);
        isConnected = true;
      }
      app = buildApp();
      app.set('trust proxy', 1);
    } catch (error) {
      console.error('Error initializing app:', error);
      throw error;
    }
  }
  return app;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
