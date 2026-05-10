import Vehicle from "@/models/Vehicle";
import Notification from "@/models/Notification";
import { createNotification } from "./createNotification";
import { connectDB } from "@/lib/mongodb";

/**
 * Fleet Scout: Automatically checks for expiring vehicle documents 
 * (Insurance & Registration) and triggers system alerts 2 days before expiry.
 */
export const runFleetScout = async () => {
  try {
    await connectDB();
    const vehicles = await Vehicle.find({});
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 2);
    targetDate.setHours(23, 59, 59, 999);

    for (const v of vehicles) {
      const checks = [
        { key: 'insuranceExpiry', title: 'Insurance Expiring Soon', label: 'Insurance' },
        { key: 'registrationExpiry', title: 'Registration Expiring Soon', label: 'Registration' }
      ];

      for (const check of checks) {
        if (v[check.key]) {
          const expiryDate = new Date(v[check.key]);
          
          // Trigger alert if expiry is within the next 2 days
          if (expiryDate >= today && expiryDate <= targetDate) {
            
            // Avoid duplicate notifications for the same vehicle/event within the same day
            const existingAlert = await Notification.findOne({
              referenceId: v.id,
              title: check.title,
              createdAt: { $gte: today }
            });

            if (!existingAlert) {
              await createNotification({
                title: check.title,
                message: `URGENT: ${check.label} for ${v.name} (${v.plate}) expires on ${expiryDate.toLocaleDateString('en-GB')}. Please renew to maintain compliance.`,
                type: 'alert',
                referenceId: v.id
              });
              console.log(`[FLEET_SCOUT] Alert generated for ${v.id} - ${check.label}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[FLEET_SCOUT_FAILURE]', error);
  }
};
