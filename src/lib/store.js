import { getDb } from './mongodb';
import { moduleData } from './moduleData';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

function cloneRecord(record) {
  if (!record) return null;
  const rest = { ...record };
  
  // Recursively convert ObjectIds to strings
  Object.keys(rest).forEach(key => {
    if (rest[key] instanceof ObjectId) {
      rest[key] = rest[key].toString();
    }
  });

  if (rest._id && typeof rest._id === 'object') {
    rest._id = rest._id.toString();
  }
  
  return rest;
}

function getConfig(moduleKey) {
  return moduleData[moduleKey] ?? null;
}

function processPayload(payload) {
  const processed = { ...payload };
  Object.keys(processed).forEach(key => {
    // If key ends in 'Id' and is a 24-char hex string, convert to ObjectId
    if (key.endsWith('Id') && typeof processed[key] === 'string' && /^[0-9a-fA-F]{24}$/.test(processed[key])) {
      try {
        processed[key] = new ObjectId(processed[key]);
      } catch (e) {
        // Not a valid ObjectId format, ignore
      }
    }
  });
  return processed;
}

function makeId(moduleKey) {
  const prefix = {
    customers: 'CUS',
    workers: 'W',
    vehicles: 'VEH',
    invoices: 'INV',
    quotations: 'QUO',
    tows: 'TOW',
    expenses: 'EXP',
    salaries: 'SAL',
  }[moduleKey] ?? 'REC';



  return `${prefix}-${Date.now()}`;
}

const initializedCollections = new Set();

async function getCollection(moduleKey) {
  const config = getConfig(moduleKey);

  if (!config) {
    return null;
  }

  const db = await getDb();
  const collection = db.collection(moduleKey);

  if (!initializedCollections.has(moduleKey)) {
    const count = await collection.estimatedDocumentCount();

    if (count === 0 && config.records && config.records.length > 0) {
      const seededRecords = await Promise.all(config.records.map(async (record) => {
        const newRecord = { ...record };
        if (moduleKey === 'users' && newRecord.password) {
          newRecord.password = await bcrypt.hash(newRecord.password, 10);
        }
        return newRecord;
      }));
      await collection.insertMany(seededRecords);
    }

    // Ensure all records have an 'id' before creating the unique index
    const recordsWithoutId = await collection.find({ $or: [{ id: { $exists: false } }, { id: null }] }).toArray();
    if (recordsWithoutId.length > 0) {
      console.log(`[MIGRATION] Fixing ${recordsWithoutId.length} records missing IDs in ${moduleKey}...`);
      for (const doc of recordsWithoutId) {
        const newId = makeId(moduleKey);
        await collection.updateOne({ _id: doc._id }, { $set: { id: newId } });
        // Small delay to ensure unique timestamps if multiple
        await new Promise(r => setTimeout(r, 1));
      }
    }

    try {
      await collection.createIndex({ id: 1 }, { unique: true });
    } catch (indexErr) {
      console.warn(`[INDEX_WARNING] Could not create unique index on ${moduleKey}. Data may have duplicates.`);
    }
    
    // Performance Indexes
    if (moduleKey === 'tows') {
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ date: 1 });
      await collection.createIndex({ driver: 1 });
    } else if (moduleKey === 'invoices') {
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ date: 1 });
    } else if (moduleKey === 'expenses') {
      await collection.createIndex({ date: 1 });
      await collection.createIndex({ worker: 1 });
    }

    initializedCollections.add(moduleKey);
  }

  return collection;
}

async function createAutoNotification(title, message, type = 'status') {
  const db = await getDb();
  const collection = db.collection('notifications');
  const notification = {
    id: `NOT-${Date.now()}`,
    title,
    message,
    time: 'Just now',
    type,
    unread: true
  };
  await collection.insertOne(notification);
}

export async function listRecords(moduleKey, options = {}) {
  const collection = await getCollection(moduleKey);

  if (!collection) {
    return null;
  }

  const { q, page = 1, limit = 10, ...filters } = options;
  const query = {};

  // Handle Search
  if (q) {
    const config = getConfig(moduleKey);
    const searchableFields = config?.fields
      .filter(f => ['text', 'tel', 'email'].includes(f.type))
      .map(f => f.name) || ['id', 'name'];
    
    query.$or = searchableFields.map(field => ({
      [field]: { $regex: q, $options: 'i' }
    }));
  }

  // Handle Filters
  Object.keys(filters).forEach(key => {
    if (filters[key] && filters[key] !== 'All') {
      let val = filters[key];
      // Convert ID strings to ObjectIds for correct database matching
      if (key.endsWith('Id') && typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
        try {
          val = new ObjectId(val);
        } catch (e) {
          // Fallback to original value if conversion fails
        }
      }
      query[key] = val;
    }
  });

  const config = getConfig(moduleKey);
  const pipeline = [];
  
  // 1. Initial Match
  pipeline.push({ $match: query });

  // 2. Add Joins (Lookups)
  if (config?.joins) {
    config.joins.forEach(join => {
      pipeline.push({
        $lookup: {
          from: join.from,
          localField: join.localField,
          foreignField: join.foreignField,
          as: join.as
        }
      });
      pipeline.push({
        $unwind: { path: `$${join.as}`, preserveNullAndEmptyArrays: true }
      });
    });
  }

  // 3. Sort, Skip, Limit
  pipeline.push({ $sort: { id: -1 } });
  
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const total = await collection.countDocuments(query);
  
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limitNum });

  const records = await collection.aggregate(pipeline).toArray();

  return {
    data: records.map(cloneRecord),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
}

export async function aggregateRecords(moduleKey, pipeline) {
  const collection = await getCollection(moduleKey);
  if (!collection) return null;

  return await collection.aggregate(pipeline).toArray();
}

export async function getRecord(moduleKey, id) {
  const collection = await getCollection(moduleKey);

  if (!collection) {
    return null;
  }

  const record = await collection.findOne({ id });
  return record ? cloneRecord(record) : null;
}

export async function createRecord(moduleKey, payload) {
  const collection = await getCollection(moduleKey);

  if (!collection) {
    return null;
  }

  const record = { 
    id: payload.id || makeId(moduleKey), 
    ...processPayload(payload),
    createdAt: new Date().toISOString()
  };

  // Hash password for users
  if (moduleKey === 'users' && record.password) {
    record.password = await bcrypt.hash(record.password, 10);
  }

  // Set default role for workers if not provided
  if (moduleKey === 'workers' && !record.role) {
    record.role = 'User';
  }

  await collection.insertOne(record);

  if (moduleKey !== 'notifications') {
    const title = `New ${moduleKey.slice(0, -1)} Created`;
    const message = `${moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1, -1)} ${record.id} has been added to the system.`;
    const type = moduleKey === 'tows' ? 'tow' : (['invoices', 'salaries', 'expenses'].includes(moduleKey) ? 'payment' : 'status');
    await createAutoNotification(title, message, type);
  }

  return cloneRecord(record);
}


export async function updateRecord(moduleKey, id, payload) {
  const collection = await getCollection(moduleKey);

  if (!collection) {
    return null;
  }

  const { _id, ...safePayload } = payload;

  // Hash password for users if it's being updated
  if (moduleKey === 'users' && safePayload.password) {
    safePayload.password = await bcrypt.hash(safePayload.password, 10);
  }

  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { ...processPayload(safePayload), id } },
    { returnDocument: 'after' }
  );

  if (result && moduleKey !== 'notifications') {
    const title = `${moduleKey.slice(0, -1).charAt(0).toUpperCase() + moduleKey.slice(1, -1)} Updated`;
    const message = `${moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1, -1)} ${id} has been modified.`;
    const type = 'status';
    await createAutoNotification(title, message, type);
  }

  return result ? cloneRecord(result) : null;
}

export async function deleteRecord(moduleKey, id) {
  const collection = await getCollection(moduleKey);

  if (!collection) {
    return false;
  }

  const result = await collection.deleteOne({ id });
  const deleted = result.deletedCount > 0;

  if (deleted && moduleKey !== 'notifications') {
    const title = `${moduleKey.slice(0, -1).charAt(0).toUpperCase() + moduleKey.slice(1, -1)} Deleted`;
    const message = `${moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1, -1)} ${id} was removed from the system.`;
    const type = 'alert';
    await createAutoNotification(title, message, type);
  }

  return deleted;
}


export async function importRecords(moduleKey, rows) {
  const collection = await getCollection(moduleKey);

  if (!collection || !rows.length) {
    return [];
  }

  const operations = rows.map(row => {
    const record = { id: row.id || makeId(moduleKey), ...row };
    return {
      updateOne: {
        filter: { id: record.id },
        update: { $set: record },
        upsert: true
      }
    };
  });

  await collection.bulkWrite(operations);

  // Return the first few for confirmation (don't clone everything if it's huge)
  return rows.slice(0, 50).map(row => ({ ...row, id: row.id || 'IMPORTED' }));
}
