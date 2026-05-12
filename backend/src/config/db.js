const mongoose = require('mongoose');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {});
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
module.exports = connectDB;
module.exports.BASE_URL = BASE_URL;