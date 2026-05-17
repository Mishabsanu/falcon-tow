import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => `NOT-${Date.now()}-${Math.floor(Math.random() * 1000)}` },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['tow', 'payment', 'alert', 'status'], 
    default: 'status' 
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  referenceId: { type: String, required: false }, // ID of the related object (e.g. TOW-001)
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
