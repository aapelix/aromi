import { derived, writable } from "svelte/store";
import { getTodayRange, getWeekRange } from "$lib/utils/range";

export type RangeType = "today" | "this" | "next" | "next2" | "next3";

export const rangeType = writable<RangeType>("today");

export const range = derived(rangeType, ($t) => {
  switch ($t) {
    case "this":
      return getWeekRange(0);
    case "next":
      return getWeekRange(1);
    case "next2":
      return getWeekRange(2);
    case "next3":
      return getWeekRange(3);
    default:
      return getTodayRange();
  }
});
