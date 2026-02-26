require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/database');

const seedPartner = async () => {
    try {
        await connectDB();

        // Check if partner user already exists
        const partnerExists = await User.findOne({ username: 'KlickBurn' });

        if (partnerExists) {
            console.log('Partner user already exists');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('ilovekomal', salt);

        const partner = new User({
            username: 'KlickBurn',
            password: hashedPassword,
            role: 'partner'
        });

        await partner.save();
        console.log('Partner user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating partner user:', error);
        process.exit(1);
    }
};

seedPartner();
