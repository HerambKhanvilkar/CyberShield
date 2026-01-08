require('dotenv').config();
const mongoose = require('mongoose');
const hiringDbConnection = require('../hiringDb'); // Uses separate connection
const FellowshipProfile = require('../models/FellowshipProfile');

const migrate = async () => {
    try {
        console.log("Connecting to Hiring DB...");
        // Ensure connection is ready
        await new Promise((resolve) => {
            if (hiringDbConnection.readyState === 1) resolve();
            else hiringDbConnection.on('connected', resolve);
        });

        const fellows = await FellowshipProfile.find({ status: { $ne: 'PENDING' } });
        console.log(`Found ${fellows.length} active/completed fellows to migrate.`);

        for (const fellow of fellows) {
            let modified = false;

            for (let i = 0; i < fellow.tenures.length; i++) {
                const tenure = fellow.tenures[i];

                // Initialize document structure if missing
                if (!tenure.signedDocuments) {
                    tenure.signedDocuments = {
                        nda: { signedAt: "", signedBy: "", documentHash: "", signatureData: "", signatureType: 'TYPED' },
                        offerLetter: { signedAt: "", signedBy: "", documentHash: "", signatureData: "", signatureType: 'TYPED' },
                        completionLetter: { signedAt: "", signedBy: "", documentHash: "", signatureData: "", signatureType: 'TYPED' }
                    };
                    modified = true;
                }

                // If this is the FIRST tenure and global NDA was signed, migrate it
                // Logic: Old system had root-level NDA. New system embeds it.
                // We assume the root NDA applies to the first tenure.
                if (i === 0 && fellow.nda && fellow.nda.dateTimeUser !== "0") {
                    if (!tenure.signedDocuments.nda.signedAt) {
                        console.log(`Migrating NDA for ${fellow.email}...`);
                        tenure.signedDocuments.nda = {
                            signedAt: fellow.nda.dateTimeUser,
                            signedBy: fellow.nda.signedName,
                            documentHash: fellow.nda.pdfHash || "",
                            signatureData: "", // Not available in old system
                            signatureType: "TYPED"
                        };
                        modified = true;
                    }
                }
            }

            if (modified) {
                // Mongoose might not detect deep object changes in mixed/subdoc arrays easily
                fellow.markModified('tenures');
                await fellow.save();
                console.log(`Migrated ${fellow.email}`);
            }
        }

        console.log("Migration Completed!");
        process.exit(0);

    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
};

migrate();
