import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

async function getCollection() {
  const db = await getDb();
  return db.collection('notifications');
}

export async function GET(request) {
  try {
    const collection = await getCollection();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const notifications = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Normalize: map 'unread' field to 'isRead' for UI compatibility
    const normalized = notifications.map(n => ({
      ...n,
      _id: n._id.toString(),
      isRead: n.isRead !== undefined ? n.isRead : !(n.unread ?? true),
      createdAt: n.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error('Notifications GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const collection = await getCollection();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isRead: true, unread: false } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const collection = await getCollection();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    await collection.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
