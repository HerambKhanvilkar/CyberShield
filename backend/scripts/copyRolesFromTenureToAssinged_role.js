const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const hiringDbConnection = require('../hiringDb');
const FellowshipProfile = require('../models/FellowshipProfile');

async function run(){
    try{
        await hiringDbConnection.asPromise();

        const docs = await FellowshipProfile.find({}).lean();

        const updates = docs.map(doc =>{
            const lastTenure = doc.tenures[doc.tenures.length - 1];
            const lastRole = lastTenure && lastTenure.role ? lastTenure.role.trim() : '';
            if(!lastRole) return null;
            if(doc.assigned_role === lastRole) return null;
            return {
                updateOne: {
                    filter: {_id : doc._id},
                    update: {$set : { assigned_role : lastRole }}
                }
            };
        }).filter(Boolean);

        if(updates.length === 0){
            console.log('No documents to update.')
        } else {
            const result = await FellowshipProfile.bulkWrite(updates);
            console.log('Updated documents:', result.modifiedCount || result.nModified || result);
        }
    }catch(err){
        console.log(err);
    }finally{
        await hiringDbConnection.close();
        process.exit(0);
    }
}

run().catch(console.error);