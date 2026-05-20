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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getConfig(moduleKey) {
  return moduleData[moduleKey] ?? null;
}

function processPayload(payload, moduleKey) {
  const processed = { ...payload };
  const config = moduleData[moduleKey];

  Object.keys(processed).forEach(key => {
    // 1. Resolve ObjectIds
    if (key.endsWith('Id') && typeof processed[key] === 'string' && /^[0-9a-fA-F]{24}$/.test(processed[key])) {
      try {
        processed[key] = new ObjectId(processed[key]);
      } catch (e) {}
    }

    // 2. Resolve Numeric Fields from Module Data
    if (config) {
      const field = config.fields.find(f => f.name === key);
      if (field?.type === 'number' && typeof processed[key] === 'string') {
        const num = parseFloat(processed[key]);
        if (!isNaN(num)) processed[key] = num;
      }
    }
  });
  return processed;
}

import { generateNextId } from './idGenerator';

async function makeId(moduleKey) {
  return await generateNextId(moduleKey);
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
        const newId = await makeId(moduleKey);
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
    id: payload.id || await makeId(moduleKey), 
    ...processPayload(payload, moduleKey),
    createdAt: new Date().toISOString()
  };

  // Apply default values from config if missing or empty
  const config = getConfig(moduleKey);
  if (config?.fields) {
    config.fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        if (record[f.name] === undefined || record[f.name] === null || record[f.name] === '') {
          record[f.name] = f.defaultValue;
        }
      }
    });
  }

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
    { $set: { ...processPayload(safePayload, moduleKey), id } },
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

  // Dynamically map labels to field names from moduleData
  const config = getConfig(moduleKey);
  const dynamicMap = {};
  if (config?.fields) {
    config.fields.forEach(f => {
      dynamicMap[f.label.toLowerCase().trim()] = f.name;
    });
  }

  // Fallback / Common Mapping dictionary
  const fallbackMap = {
    'id': 'id',
    'full name': 'name',
    'contact number': 'phone',
    'mobile': 'phone',
    'email address': 'email',
    'street address': 'address',
    'plate number': 'plate',
    'operational truck': 'vehicle',
    'charges (qar)': 'amount'
  };

  const finalMap = { ...fallbackMap, ...dynamicMap };

  const operations = await Promise.all(rows.map(async (row) => {
    // Normalize keys
    const normalizedRow = {};
    Object.entries(row).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase().trim();
      const targetKey = finalMap[lowerKey] || key;
      normalizedRow[targetKey] = value;
    });

    let existingId = normalizedRow.id;
    
    // Deduplication Logic: If ID is missing, try to find by secondary identifiers
    if (!existingId) {
      const db = await getDb();
      if (moduleKey === 'customers' && normalizedRow.phone) {
        const existing = await db.collection('customers').findOne({ phone: normalizedRow.phone });
        if (existing) existingId = existing.id;
      } else if (moduleKey === 'vehicles' && normalizedRow.plate) {
        const existing = await db.collection('vehicles').findOne({ plate: normalizedRow.plate });
        if (existing) existingId = existing.id;
      } else if (moduleKey === 'users' && (normalizedRow.email || normalizedRow.phone)) {
        const existing = await db.collection('users').findOne({ 
          $or: [{ email: normalizedRow.email }, { phone: normalizedRow.phone }] 
        });
        if (existing) existingId = existing.id;
      }
    }

    const record = { 
      id: existingId || await makeId(moduleKey), 
      ...processPayload(normalizedRow, moduleKey),
      createdAt: new Date().toISOString()
    };

    // Apply default values from config if missing or empty
    if (config?.fields) {
      config.fields.forEach(f => {
        if (f.defaultValue !== undefined) {
          if (record[f.name] === undefined || record[f.name] === null || record[f.name] === '') {
            record[f.name] = f.defaultValue;
          }
        }
      });
    }

    // Relation Resolution Logic (Resolve Names or IDs to Mongo IDs)
    if (['tows', 'invoices', 'salaries', 'expenses', 'quotations'].includes(moduleKey)) {
      const db = await getDb();
      
      // Helper to find document by name, plate, phone or logical system ID
      const findDoc = async (collection, value) => {
        if (!value) return null;
        const cleanVal = String(value).trim();
        
        // Build a robust OR query to find the record
        const orQuery = [
          { name: cleanVal },
          { id: cleanVal }
        ];

        // Add module-specific searchable fields
        if (collection === 'vehicles') orQuery.push({ plate: cleanVal });
        if (collection === 'customers') orQuery.push({ phone: cleanVal });
        if (collection === 'users') orQuery.push({ username: cleanVal });

        // If value is a 24-char hex, try matching native _id
        if (/^[0-9a-fA-F]{24}$/.test(cleanVal)) {
          try { orQuery.push({ _id: new ObjectId(cleanVal) }); } catch(e) {}
        }

        let doc = await db.collection(collection).findOne({ $or: orQuery });

        // Try fallback split match for "Name - ID" or "Name - Plate" format
        if (!doc && cleanVal.includes(' - ')) {
          const parts = cleanVal.split(' - ').map(p => p.trim());
          const first = parts[0];
          const last = parts[parts.length - 1];

          doc = await db.collection(collection).findOne({ 
            $or: [
              { id: first }, { id: last },
              { name: first }, { plate: last }
            ] 
          });
        }
        return doc;
      };

      // 1. Resolve Driver/Worker
      const workerVal = normalizedRow.driverId || normalizedRow.workerId || normalizedRow.driver || normalizedRow.worker;
      if (workerVal) {
        const workerDoc = await findDoc('users', workerVal);
        if (workerDoc) {
          if (moduleKey === 'tows' || moduleKey === 'quotations') {
            record.driverId = workerDoc._id;
            record.driver = workerDoc.name;
          } else {
            record.workerId = workerDoc._id;
            record.worker = workerDoc.name;
          }
        }
      }

      // 2. Resolve Vehicle
      const vehicleVal = normalizedRow.vehicleId || normalizedRow.vehicle;
      if (vehicleVal) {
        const vehicleDoc = await findDoc('vehicles', vehicleVal);
        if (vehicleDoc) {
          record.vehicleId = vehicleDoc._id;
          record.vehicle = vehicleDoc.name;
          record.vehicleName = vehicleDoc.name;
          record.vehiclePlate = vehicleDoc.plate;
          // For Tows, ensure customer vehicle info is filled if not provided
          if (moduleKey === 'tows') {
            if (!record.customerVehicle) record.customerVehicle = vehicleDoc.name;
            if (!record.customerPlate) record.customerPlate = vehicleDoc.plate;
          }
        }
      }

      // 3. Resolve Customer
      const customerVal = normalizedRow.customerId || normalizedRow.customer;
      if (customerVal) {
        let customerDoc = await findDoc('customers', customerVal);

        if (!customerDoc && moduleKey === 'tows' && normalizedRow.customer) {
          const customerName = String(normalizedRow.customer).trim();
          const customerPhone = normalizedRow.customerPhone ? String(normalizedRow.customerPhone).trim() : '';

          if (customerName) {
            customerDoc = customerPhone
              ? await db.collection('customers').findOne({ phone: customerPhone })
              : null;

            if (!customerDoc) {
              customerDoc = await db.collection('customers').findOne({
                name: { $regex: `^${escapeRegExp(customerName)}$`, $options: 'i' }
              });
            }

            if (!customerDoc) {
              const newCustomer = {
                id: await makeId('customers'),
                name: customerName,
                ...(customerPhone ? { phone: customerPhone } : {}),
                status: 'Active',
                createdAt: new Date()
              };
              const inserted = await db.collection('customers').insertOne(newCustomer);
              customerDoc = { ...newCustomer, _id: inserted.insertedId };
            }
          }
        }

        if (customerDoc) {
          record.customerId = customerDoc._id;
          record.customer = customerDoc.name;
          record.customerPhone = customerDoc.phone;
          if (moduleKey === 'customers') {
            // Ensure phone fields are synced
            record.phone = record.phone || customerDoc.phone;
          }
        }
      }

      // 4. Resolve Tow Job & Detailed Sync (for Invoices)
      if (moduleKey === 'invoices') {
        const towVal = normalizedRow.towId || normalizedRow.jobId;
        if (towVal) {
          const towDoc = await findDoc('tows', towVal);
          if (towDoc) {
            record.towId = towDoc._id;
            record.jobId = towDoc.id;
            // Generate towDetails for professional invoice rendering
            record.towDetails = [{
              towId: towDoc._id,
              jobId: towDoc.id,
              date: towDoc.date,
              vehicleName: towDoc.customerVehicle || towDoc.vehicle,
              vehiclePlate: towDoc.customerPlate || towDoc.vehiclePlate,
              route: towDoc.route || `${towDoc.pickup} to ${towDoc.dropoff}`,
              amount: Number(towDoc.amount || 0),
              serviceCommission: Number(towDoc.serviceCommission || 0)
            }];
            // Sync billing info from tow if missing
            if (!record.customer) record.customer = towDoc.customer;
            if (!record.customerId) record.customerId = towDoc.customerId;
            if (!record.total) record.total = Number(towDoc.amount || 0);
          }
        }
      }

      // 5. Global Date Casting (Ensure all date strings are BSON Date objects)
      ['date', 'createdAt', 'updatedAt'].forEach(field => {
        if (record[field] && typeof record[field] === 'string') {
          const parsed = new Date(record[field]);
          if (!isNaN(parsed.getTime())) record[field] = parsed;
        }
      });

      // 6. Business Logic: Auto-calculate Tow Shares
      if (moduleKey === 'tows' && record.amount) {
        const amt = Number(record.amount || 0);
        const commission = Number(record.serviceCommission || 0);
        const actualPrice = Math.max(0, amt - commission);
        record.driverShare = Math.round(actualPrice * 0.1 * 100) / 100;
        record.companyShare = Math.round(actualPrice * 0.9 * 100) / 100;
      }
    }
    
    return {
      updateOne: {
        filter: { id: record.id },
        update: { $set: record },
        upsert: true
      }
    };
  }));

  await collection.bulkWrite(operations);

  // Return the first few for confirmation
  return rows.slice(0, 50).map((row, idx) => ({ ...row, id: operations[idx].updateOne.update.$set.id }));
}
