const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/database');

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Check if admin user already exists
        const adminExists = await User.findOne({ username: 'KlickBurn' });

        if (adminExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('ilovekomal', salt);

        // Create admin user
        const admin = new User({
            username: 'KlickBurn',
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
