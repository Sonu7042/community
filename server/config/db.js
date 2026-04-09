const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = "mongodb+srv://admin:cummunity@cluster0.4mp9gvh.mongodb.net"

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing in environment variables');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Db Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
