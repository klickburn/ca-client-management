const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const Client = require('./models/Client');

const migrateRoles = async () => {
    try {
        await connectDB();
        console.log('Starting role migration...\n');

        // 1. Migrate admin → partner
        const adminResult = await User.updateMany(
            { role: 'admin' },
            { $set: { role: 'partner' } }
        );
        console.log(`Migrated ${adminResult.modifiedCount} admin users → partner`);

        // 2. Migrate user → seniorCA
        const userResult = await User.updateMany(
            { role: 'user' },
            { $set: { role: 'seniorCA' } }
        );
        console.log(`Migrated ${userResult.modifiedCount} regular users → seniorCA`);

        // 3. Set verificationStatus on existing documents
        const clients = await Client.find({ 'documents.0': { $exists: true } });
        let docCount = 0;
        for (const client of clients) {
            let modified = false;
            for (const doc of client.documents) {
                if (!doc.verificationStatus) {
                    doc.verificationStatus = 'verified';
                    docCount++;
                    modified = true;
                }
            }
            if (modified) {
                await client.save();
            }
        }
        console.log(`Set verificationStatus=verified on ${docCount} existing documents`);

        console.log('\nMigration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateRoles();
