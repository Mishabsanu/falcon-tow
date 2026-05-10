import Notification from "@/models/Notification";
import { connectDB } from "@/lib/mongodb";

export const createNotification = async ({
  title,
  message,
  type,
  userId = null,
  referenceId = null,
}: any) => {
  try {
    await connectDB();
    await Notification.create({
      title,
      message,
      type,
      userId,
      referenceId,
    });
    console.log(`[NOTIFICATION_SENT] ${title}`);
  } catch (error) {
    console.error('[NOTIFICATION_FAILURE]', error);
  }
};
