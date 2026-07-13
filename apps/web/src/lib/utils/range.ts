import { startOfWeek } from "./date.ts";

export function getWeekRange(offset: number) {
  const start = startOfWeek(new Date());
  start.setDate(start.getDate() + offset * 7);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
