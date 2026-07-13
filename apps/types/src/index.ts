export interface Meal {
    name: string;
    dishes: Dish[];
    id: string;
}

export interface Dish {
    name: string;
    details: string;
    nutrients?: Nutrients;
    ingredients: string;
    id: string;
}

export interface Nutrients {
    energy: number;
    fat: number;
    fatSaturated: number;
    carbohydrates: number;
    carbohydratesSugar: number;
    protein: number;
    salt: number;
}

export interface DayMenu {
    dateString: string;
    date: Date;
    meals: Meal[];
}
