require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.HIRING_MONGO_URI;

// name of the duplicated database
const TARGET_DB_NAME = "hiring_db_backup"; 

async function duplicateDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // get source DB name from URI
    const url = new URL(uri);
    const sourceDbName = url.pathname.substring(1);

    const sourceDb = client.db(sourceDbName);
    const targetDb = client.db(TARGET_DB_NAME);

    const collections = await sourceDb.listCollections().toArray();

    console.log(`Found ${collections.length} collections`);

    for (const col of collections) {
      const collectionName = col.name;

      console.log(`Copying collection: ${collectionName}`);

      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      const docs = await sourceCollection.find({}).toArray();

      if (docs.length > 0) {
        await targetCollection.insertMany(docs);
        console.log(`Inserted ${docs.length} docs into ${TARGET_DB_NAME}.${collectionName}`);
      } else {
        console.log(`Collection ${collectionName} is empty`);
      }
    }

    console.log("Database duplication completed.");
  } catch (err) {
    console.error("Error duplicating database:", err);
  } finally {
    await client.close();
  }
}

duplicateDatabase();