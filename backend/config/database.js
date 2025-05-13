const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use environment variable for MongoDB URI or fall back to a local development DB
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-client-db';
        
        console.log('Attempting to connect to MongoDB with URI:', uri);
        
        // Add required options to prevent deprecation warnings
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        };
        
        // Conditionally add deprecated options for older MongoDB versions if not in production
        if (process.env.NODE_ENV !== 'production') {
            options.useCreateIndex = true;
            options.useFindAndModify = false;
        }
        
        await mongoose.connect(uri, options);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed. Details:', error);
        // Don't exit the process so the app can still run for demo purposes
        console.log('Continuing without MongoDB connection for testing purposes.');
    }
};

module.exports = connectDB;