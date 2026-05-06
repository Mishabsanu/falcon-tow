import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

export const getDateRange = (rangeType, customStart, customEnd) => {
  const now = new Date();
  let start, end;

  switch (rangeType) {
    case 'today':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case 'weekly':
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'monthly':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'yearly':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    case 'custom':
      start = customStart ? new Date(customStart) : startOfDay(now);
      end = customEnd ? new Date(customEnd) : endOfDay(now);
      break;
    default:
      start = startOfMonth(now);
      end = endOfMonth(now);
  }

  return { start, end };
};
