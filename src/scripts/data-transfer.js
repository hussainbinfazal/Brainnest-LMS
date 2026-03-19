import { MongoClient } from "mongodb";

async function copyCollection() {
  const prodClient = await MongoClient.connect(
    "mongodb+srv://hussain:LMS1234@lms.cr9mumu.mongodb.net/test"
  );
  const testClient = await MongoClient.connect("mongodb://localhost:27017");

  const prodDB = prodClient.db("test");
  const testDB = testClient.db("LMS");

  const collections = await prodDB.collections();

  for (let coll of collections) {
    const docs = await coll.find().toArray();
    logger.info(`Collection: ${coll.collectionName}, Docs Found: ${docs.length}`);

    if (docs.length) {
      await testDB.collection(coll.collectionName).insertMany(docs);
      logger.info(`✅ Copied ${docs.length} docs into ${coll.collectionName}`);
    } else {
      logger.warn(`⚠️ Skipped ${coll.collectionName} (no docs)`);
    }
  }

  await prodClient.close();
  await testClient.close();
  logger.info("🎉 Copy complete!");
}

copyCollection();
