const { MongoClient } = require('mongodb');

async function fixSalaries() {
  const uri = 'mongodb+srv://mishabsanu:QZSmWM1tVXWolBzt@cluster0.p0hpb73.mongodb.net/';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('falcon');
    const collection = db.collection('salaries');
    
    const records = await collection.find({ $or: [{ id: '' }, { id: { $exists: false } }, { id: null }] }).toArray();
    console.log(`Found ${records.length} records needing ID fixes.`);
    
    for (const doc of records) {
      const newId = `SAL-${Date.now()}`;
      await collection.updateOne({ _id: doc._id }, { $set: { id: newId } });
      console.log(`Updated record ${doc._id} with ID ${newId}`);
      await new Promise(r => setTimeout(r, 5));
    }
    
    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

fixSalaries();
