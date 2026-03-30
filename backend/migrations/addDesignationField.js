require('dotenv').config();
const mongoose = require('mongoose');
const projectDBconnection = require('../models/connectiondb/projectsDB');
const FellowProjectProfile = require('../models/Project/FellowProjectprofile');

const migrate = async () => {
    try {
        console.log("Connecting to Projects DB...");
        // Ensure connection is ready
        await new Promise((resolve) => {
            if (projectDBconnection.readyState === 1) resolve();
            else projectDBconnection.on('connected', resolve);
        });

        console.log("Starting migration: Adding 'designation' field to all FellowProjectProfile documents...");

        // Update all documents where designation is missing or undefined
        const result = await FellowProjectProfile.updateMany(
            { designation: { $exists: false } },
            { $set: { designation: "Individual Member" } }
        );

        console.log(`Migration completed successfully!`);
        console.log(`Matched documents: ${result.matchedCount}`);
        console.log(`Modified documents: ${result.modifiedCount}`);

        // Verify the update
        const totalDocs = await FellowProjectProfile.countDocuments();
        const docsWithDesignation = await FellowProjectProfile.countDocuments({ designation: { $exists: true } });
        
        console.log(`\nVerification:`);
        console.log(`Total documents in collection: ${totalDocs}`);
        console.log(`Documents with designation field: ${docsWithDesignation}`);

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
