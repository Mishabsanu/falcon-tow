const { MongoClient, ObjectId } = require('mongodb');

async function migrateWorkerIds() {
  const uri = 'mongodb+srv://mishabsanu:QZSmWM1tVXWolBzt@cluster0.p0hpb73.mongodb.net/';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('falcon');
    const salariesColl = db.collection('salaries');
    const usersColl = db.collection('users');
    
    const salaries = await salariesColl.find({ $or: [{ workerId: '' }, { workerId: { $exists: false } }] }).toArray();
    console.log(`Found ${salaries.length} records needing workerId migration.`);
    
    for (const sal of salaries) {
      // Find worker by name
      const worker = await usersColl.findOne({ name: sal.worker, role: 'Worker' });
      if (worker) {
        await salariesColl.updateOne({ _id: sal._id }, { $set: { workerId: worker._id } });
        console.log(`Updated salary ${sal.id} for worker ${sal.worker} with workerId ${worker._id}`);
      } else {
        console.warn(`Could not find worker user for name: ${sal.worker}`);
      }
    }
    
    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateWorkerIds();
