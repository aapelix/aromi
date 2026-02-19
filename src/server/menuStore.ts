"use server";

export interface Meal {
  name: string;
  dishes: Dish[];
}

export interface Dish {
  name: string;
  details: string;
}

export interface DayMenu {
  dateString: string;
  date: Date;
  meals: Meal[];
}

let menus: DayMenu[] = [];
let lastUpdate: Date | null = null;

export async function fetchData(id: string) {
  // if last update less than 24 hours ago, return cached data
  if (
    lastUpdate &&
    new Date().getTime() - lastUpdate.getTime() < 24 * 60 * 60 * 1000
  ) {
    return menus;
  }

  const today = new Date();
  // to the start of the week
  const start = new Date(
    today.getTime() - today.getDay() * 24 * 60 * 60 * 1000,
  );

  // 4 weeks
  const end = new Date(today.getTime() + 4 * 7 * 24 * 60 * 60 * 1000);

  const fmt = (d: Date) => encodeURIComponent(d.toISOString());

  const menuUrl = `https://aromimenu.cgisaas.fi/TampereAromieMenus/FI/Default/Tampere/TREDUHEPOL/api/GetRestaurantPublicDinerGroups?Id=${id}&StartDate=${fmt(start)}&EndDate=${fmt(new Date())}`;
  console.log("Fetching menu group id from", menuUrl);
  const menuGroupId = await fetch(menuUrl)
    .then((res) => res.json())
    .then((data) => data[0].DinerGroupId);

  const url = `https://aromimenu.cgisaas.fi/TampereAromieMenus/FI/Default/Tampere/Amogus/api/Common/Restaurant/RestaurantMeals?Id=${id}&StartDate=${fmt(start)}&EndDate=${fmt(end)}`;
  const res = await fetch(url, {
    body: JSON.stringify({
      DinerGroupId: menuGroupId,
      DietGroupId: "b94dc776-277a-4837-a440-4fe9172c3f35",
      SuitabilityDietIds: [],
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  const menuData: DayMenu[] = data.map((menu: any) => {
    return {
      date: menu.Date,
      dateString: menu.MenuDate,
      meals: menu.Meals.map((meal: any) => {
        return {
          name: meal.MealName,
          dishes: meal.Dishes.map((dish: any) => {
            return {
              name: dish.DishName,
              details: dish.DietDetails,
            };
          }),
        };
      }),
    };
  });

  menus = menuData;
  lastUpdate = new Date();
  console.log("Menu data updated", menus);
  return menuData;
}
