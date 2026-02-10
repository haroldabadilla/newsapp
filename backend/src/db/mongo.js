import mongoose from "mongoose";

export async function connectMongo(mongoUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    autoIndex: true,
    maxPoolSize: 10,
  });
  return mongoose.connection;
}
