const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use environment variable for MongoDB URI or fall back to a local development DB
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-client-db';
        
        console.log('Attempting to connect to MongoDB...');
        
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed. Details:', error);
        // Don't exit the process so the app can still run for demo purposes
        console.log('Continuing without MongoDB connection for testing purposes.');
    }
};

module.exports = connectDB;