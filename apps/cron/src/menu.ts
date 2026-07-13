import type { DayMenu, Nutrients } from "types";

export async function fetchMenu(): Promise<DayMenu[]> {
	const id = '1d9b6d8c-6236-4d77-bf8b-91bcd91116e3';

	const today = new Date();
	const start = new Date(today);
	start.setDate(today.getDate() - today.getDay());

	const end = new Date(today);
	end.setDate(today.getDate() + 28);

	const fmt = (d: Date) => encodeURIComponent(d.toISOString());

	const menuUrl =
		`https://aromimenu.cgisaas.fi/TampereAromieMenus/FI/Default/Tampere/TREDUHEPOL/api/GetRestaurantPublicDinerGroups` +
		`?Id=${id}&StartDate=${fmt(start)}&EndDate=${fmt(end)}`;

	const groupData = await fetch(menuUrl).then((r) => r.json()) as { DinerGroupId: string }[];
	const menuGroupId = groupData[0]!.DinerGroupId;

	const rawMenus = await fetch(
		`https://aromimenu.cgisaas.fi/TampereAromieMenus/FI/Default/Tampere/Amogus/api/Common/Restaurant/RestaurantMeals?Id=${id}&StartDate=${fmt(start)}&EndDate=${fmt(end)}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				DinerGroupId: menuGroupId,
				DietGroupId: 'b94dc776-277a-4837-a440-4fe9172c3f35',
				SuitabilityDietIds: [],
			}),
		},
	).then((r) => r.json()) as {
		Date: string;
		MenuDate: string;
		Meals: {
			MealId: string;
			MealName: string;
			Dishes: {
				DishId: string;
				DishName: string;
				DietDetails: string;
			}[];
		}[];
	}[];

	const menuData: DayMenu[] = rawMenus.map((m) => ({
		date: new Date(m.Date),
		dateString: m.MenuDate,
		meals: m.Meals.map((meal) => ({
			id: meal.MealId,
			name: meal.MealName,
			dishes: meal.Dishes.map((dish) => ({
				id: dish.DishId,
				name: dish.DishName,
				details: dish.DietDetails,
				ingredients: '',
				nutrients: undefined,
			})),
		})),
	}));

	const fetchNutrients = async (mealId: string, date: Date) => {
		const ts = toAnnoyingAndPrettyWeirdThatSomehowWorksDate(date);

		const url =
			`https://aromimenu.cgisaas.fi/TampereAromieMenus/FI/Default/Tampere/Amogus/api/Common/Restaurant/GetRestaurentMealNutrients` +
			`?Id=${id}&StartDateOffset=${encodeURIComponent(ts)}&EndDateOffset=${encodeURIComponent(ts)}` +
			`&orgCultureId=4286d1a6-3f4d-469a-8219-a72d3e84b9f1&showNutritional=true&mealId=${mealId}`;

		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				DinerGroupId: menuGroupId,
				NutrientGroupId: '8d835066-3834-44c2-abf0-7a83ce375f04',
				SuitabilityDietIds: [],
			}),
		});

		const json = await res.json() as {
			Dish: string;
			DishId: string;
			NutrientName: string;
			Nutrients: {
				NutrientWithPad: string;
				NutrientValue: number;
			}[];
			IngredientName: string;
		}[];

		return json;
	};

	const activeMeals = menuData.flatMap((d) => d.meals.filter((m) => m.dishes.length));

	const nutrientResponses = await Promise.all(
		activeMeals.map((m) => {
			const day = menuData.find((d) => d.meals.includes(m))!;
			return fetchNutrients(m.id, day.date);
		}),
	);

	const nutrientMap = new Map<string, { Nutrients: { NutrientWithPad: string; NutrientValue: number }[]; IngredientName: string }>();

	for (const res of nutrientResponses) {
		for (const item of res) {
			nutrientMap.set(item.Dish, item);
		}
	}

	for (const day of menuData) {
		for (const meal of day.meals) {
			for (const dish of meal.dishes) {
				const item = nutrientMap.get(dish.name);
				if (!item) continue;

				dish.nutrients = parseNutrients(item.Nutrients);
				dish.ingredients = item.IngredientName;
			}
		}
	}

	return menuData;
}

function parseNutrients(
	data: {
		NutrientValue: number;
		NutrientWithPad: string;
	}[],
): Nutrients {
	const get = (key: string) => data.find((x) => x.NutrientWithPad.includes(key))?.NutrientValue ?? 0;

	return {
		energy: get('Energia, kcal'),
		fat: get('Rasva'),
		fatSaturated: get('tyydyttynyttä'),
		carbohydrates: get('Hiilihydraatit'),
		carbohydratesSugar: get('sokereita'),
		protein: get('Proteiini'),
		salt: get('Suola'),
	};
}

function toAnnoyingAndPrettyWeirdThatSomehowWorksDate(d: Date) {
	const local = new Date(d);
	local.setHours(0, 0, 0, 0);

	return new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
}
