import { createAsync, query } from "@solidjs/router";
import { For, Suspense, createSignal, createMemo } from "solid-js";
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

  const [rangeType, setRangeType] = createSignal("today");

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
    <main class="mx-auto bg-[#0f0f0f] text-[#d5d5d5] min-h-screen py-4 font-mono flex flex-col items-center">
      {/* Buttons */}
      <div class="flex flex-wrap justify-center w-full max-w-3xl mb-4 gap-2">
        <button
          class="px-3 py-1 hover:bg-[#1f1f1f] rounded-xl"
          onClick={() => setRangeType("today")}
        >
          Tänään
        </button>
        <button
          class="px-3 py-1 hover:bg-[#1f1f1f] rounded-xl"
          onClick={() => setRangeType("this")}
        >
          Tämä viikko
        </button>
        <button
          class="px-3 py-1 hover:bg-[#1f1f1f] rounded-xl"
          onClick={() => setRangeType("next")}
        >
          Seuraava viikko
        </button>
        <button
          class="px-3 py-1 hover:bg-[#1f1f1f] rounded-xl"
          onClick={() => setRangeType("next2")}
        >
          Kolmas viikko
        </button>
        <button
          class="px-3 py-1 hover:bg-[#1f1f1f] rounded-xl"
          onClick={() => setRangeType("next3")}
        >
          Neljäs viikko
        </button>
      </div>

      {/* Menu */}
      <div class="flex justify-center w-full">
        <Suspense fallback={<p>Ootas ny...</p>}>
          <div class="flex flex-col gap-4 justify-center w-full max-w-3xl px-4">
            {filteredMenu().length === 0 && (
              <p class="text-lg text-[#d5d5d5]">
                Ei ruokalistaa saatavilla. Oletettavasti ja toivottavasti
                kavereilla on lomaa, muuten järjestelmän virhe tai kuolette
                nälkään. Oletan jälkimmäistä. Päivitä sivu jos et usko
              </p>
            )}
            <For each={filteredMenu()}>
              {(item) => (
                <div>
                  <p class="font-bold text-xl text-white mb-1 flex items-center gap-2 flex-wrap">
                    {item.dateString}

                    {rangeType() !== "today" &&
                      new Date(item.date).toDateString() ===
                        today.toDateString() && (
                        <div class="inline-block w-2 h-2 bg-green-500 rounded" />
                      )}
                  </p>

                  <div class="flex flex-col gap-2">
                    <For each={item.meals}>
                      {(meal) => (
                        <div>
                          <p class="font-semibold text-lg text-[#d5d5d5]">
                            {meal.name}
                          </p>
                          <div class="flex flex-row gap-x-4 gap-y-2 items-start justify-start flex-wrap w-full">
                            <For each={meal.dishes}>
                              {(dish) => (
                                <div class="flex items-center gap-2 flex-wrap">
                                  <p class="font-medium text-md">{dish.name}</p>
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
    </main>
  );
}
