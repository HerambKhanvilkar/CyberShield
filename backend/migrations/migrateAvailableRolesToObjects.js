require('dotenv').config();
const hiringDbConnection = require('../hiringDb');
const Organization = require('../models/Organization');

const migrate = async () => {
    try {
        console.log('Connecting to hiring DB...');
        await new Promise((resolve) => {
            if (hiringDbConnection.readyState === 1) return resolve();
            hiringDbConnection.on('connected', resolve);
        });

        // Optional: pass a single organization code as the first CLI arg to limit the migration
        // Example: `node migrateAvailableRolesToObjects.js TEST4`
        const targetCode = process.argv[2] || process.env.ORG_CODE || null;
        let orgs;
        if (targetCode) {
            const found = await Organization.find({ code: targetCode });
            if (!found || found.length === 0) {
                console.log(`No organization found with code="${targetCode}". Exiting.`);
                process.exit(0);
            }
            orgs = found;
            console.log(`Targeting organization code="${targetCode}" — found ${orgs.length} document(s)`);
        } else {
            orgs = await Organization.find();
            console.log(`Found ${orgs.length} organizations`);
        }

        let updatedCount = 0;

        for (const org of orgs) {
            // DEBUG: show exact stored shape so we can understand why a record is skipped
            console.log(`Inspecting org ${org.code || org._id} — availableRoles (raw):`, JSON.stringify(org.availableRoles, null, 2));
            console.log('availableRoles element types ->', Array.isArray(org.availableRoles) ? org.availableRoles.map(r => typeof r) : typeof org.availableRoles);

            // Per-element inspection (show keys / presence of `name`)
            org.availableRoles.forEach((r, i) => {
                try {
                    console.log(` element[${i}] hasName=${Object.prototype.hasOwnProperty.call(r, 'name')}, keys=${Object.keys(r).join(',')}`);
                } catch (e) {
                    console.log(` element[${i}] cannot inspect keys (type ${typeof r})`);
                }
            });

            // Detect cases that need conversion:
            //  - element is a plain string (easy)
            //  - element is an object but has no `name` and contains numeric keys (Mongoose cast of stored string)
            const needsConversion = org.availableRoles.some(r => {
                if (typeof r === 'string') return true;
                if (r && typeof r === 'object' && !r.name) {
                    const raw = r && r._doc && typeof r._doc === 'object' ? r._doc : r;
                    return Object.keys(raw).some(k => /^\d+$/.test(k));
                }
                return false;
            });

            console.log('needsConversion =', needsConversion);
            if (!needsConversion) continue;

            const normalizeRole = (r) => {
                if (typeof r === 'string') return { name: r, description: '' };
                if (r && typeof r === 'object') {
                    if (r.name && typeof r.name === 'string') return { name: r.name, description: r.description || '' };
                    const raw = r && r._doc && typeof r._doc === 'object' ? r._doc : r;
                    const numericKeys = Object.keys(raw).filter(k => /^\d+$/.test(k)).sort((a,b) => Number(a) - Number(b));
                    if (numericKeys.length) {
                        const name = numericKeys.map(k => raw[k]).join('').trim();
                        return { name, description: raw.description || '' };
                    }
                }
                return null;
            };

            const before = JSON.parse(JSON.stringify(org.availableRoles));
            const converted = org.availableRoles.map(normalizeRole).filter(Boolean).filter(x => x.name);
            org.availableRoles = converted;

            org.markModified('availableRoles');
            await org.save();
            console.log(`Updated org ${org.code || org._id}: converted availableRoles to objects\n before: ${JSON.stringify(before)} \n after: ${JSON.stringify(org.availableRoles)}`);
            updatedCount++;
        }

        console.log(`Migration complete — updated ${updatedCount} organizations.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
