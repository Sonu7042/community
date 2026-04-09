const mongoose = require('mongoose');

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  try {
    if (isConnected) {
      return mongoose.connection;
    }

    if (connectionPromise) {
      return connectionPromise;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing in environment variables');
    }

    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    await connectionPromise;
    isConnected = true;
    console.log('Db Connected');
    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    console.error(`Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
