import Notification from "@/models/Notification";

export const createNotification = async ({
  title,
  message,
  type,
  userId = null,
  referenceId = null,
}: any) => {
  await Notification.create({
    title,
    message,
    type,
    userId,
    referenceId,
  });
};
