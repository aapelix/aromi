import { createAsync, query } from "@solidjs/router";
import {
  For,
  Suspense,
  createSignal,
  createMemo,
  createEffect,
} from "solid-js";
import { DayMenu } from "~/server/menuStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getMenu = query(async () => {
  const menus = await fetch(`${API_BASE_URL}/api/update`);
  return (await menus.json()) as DayMenu[];
}, "menu");

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekRange(offset: number) {
  const today = new Date();
  const start = getStartOfWeek(today);
  start.setDate(start.getDate() + offset * 7);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export default function Home() {
  const menu = createAsync(() => getMenu());
  const today = new Date();
  const [rangeType, setRangeType] = createSignal("");

  createEffect(() => {
    if (rangeType() === "") {
      return;
    }

    localStorage.setItem("rangeType", rangeType());
  }, [rangeType]);

  createEffect(() => {
    const savedRangeType = localStorage.getItem("rangeType");
    if (savedRangeType) {
      setRangeType(savedRangeType);
    }
  }, []);

  const range = createMemo(() => {
    switch (rangeType()) {
      case "today":
        return getTodayRange();
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

  const filteredMenu = createMemo(() => {
    const r = range();
    return (menu() ?? []).filter((item) => {
      const d = new Date(item.date);
      return d >= r.start && d <= r.end;
    });
  });

  return (
    <main class="mx-auto bg-[#0f0f0f] text-[#d5d5d5] min-h-screen py-10 font-mono flex flex-col items-center transition-colors duration-300 relative">
      {/* Buttons */}
      <div class="flex flex-wrap justify-center w-full max-w-3xl mb-6 gap-3">
        {["today", "this", "next", "next2", "next3"].map((type, idx) => {
          const labels = [
            "Tänään",
            "Tämä viikko",
            "Seuraava viikko",
            "Kolmas viikko",
            "Neljäs viikko",
          ];
          return (
            <button
              class={`px-4 py-2 rounded-xl transition-colors duration-200 ${
                rangeType() === type
                  ? "bg-[#1f1f1f] text-white"
                  : "hover:bg-[#1a1a1a]"
              }`}
              onClick={() => setRangeType(type)}
              // @ts-ignore no idea why it errors on next line. i don't care, it works
              key={idx}
            >
              {labels[idx]}
            </button>
          );
        })}
      </div>

      {/* Menu */}
      <div class="flex justify-center w-full">
        <Suspense fallback={<p class="text-center mt-8">Ootas ny…</p>}>
          <div class="flex flex-col gap-6 justify-center w-full max-w-3xl px-4 transition-all duration-300">
            {filteredMenu().length === 0 && (
              <p class="text-lg text-[#d5d5d5] text-center leading-relaxed">
                Ei ruokalistaa saatavilla. Toivottavasti kavereilla on lomaa.
                Jos ei, järjestelmän virhe tai kuolette nälkään. Päivitä sivu
                jos et usko.
              </p>
            )}

            <For each={filteredMenu()}>
              {(item, i) => (
                <div
                  class="pb-4"
                  style={{
                    "border-bottom":
                      i() === filteredMenu().length - 1
                        ? "none"
                        : "1px solid #1a1a1a",
                  }}
                >
                  <p class="font-bold text-xl text-white mb-2 flex items-center gap-2 flex-wrap">
                    {item.dateString}
                    {rangeType() !== "today" &&
                      new Date(item.date).toDateString() ===
                        today.toDateString() && (
                        <span class="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                  </p>

                  <div class="flex flex-col gap-3">
                    <For each={item.meals}>
                      {(meal) => (
                        <div>
                          <p class="font-semibold text-lg">{meal.name}</p>
                          <div class="flex flex-row gap-x-6 gap-y-2 items-start justify-start flex-wrap w-full">
                            <For each={meal.dishes}>
                              {(dish) => (
                                <div class="flex items-center gap-2 flex-wrap text-[#cfcfcf]">
                                  <p class="font-medium">{dish.name}</p>
                                  <p class="text-sm">{dish.details}</p>
                                </div>
                              )}
                            </For>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Suspense>
      </div>

      {/* little footer link */}
      <a
        href="https://aapelix.dev"
        class="text-[#5a5a5a] hover:text-gray-200 absolute bottom-4"
      >
        aapelix.dev
      </a>
    </main>
  );
}
