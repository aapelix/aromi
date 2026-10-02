package menu

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type DayMenu struct {
	Date       time.Time `json:"date"`
	DateString string    `json:"dateString"`
	Meals      []Meal    `json:"meals"`
}
type Meal struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	Dishes []Dish `json:"dishes"`
}
type Dish struct {
	Id          string     `json:"id"`
	Name        string     `json:"name"`
	Details     string     `json:"details"`
	Ingredients string     `json:"ingredients"`
	Nutrients   *Nutrients `json:"nutrients,omitempty"`
}
type Nutrients struct {
	Energy             float64 `json:"energy"`
	Fat                float64 `json:"fat"`
	FatSaturated       float64 `json:"fatSaturated"`
	Carbohydrates      float64 `json:"carbohydrates"`
	CarbohydratesSugar float64 `json:"carbohydratesSugar"`
	Protein            float64 `json:"protein"`
	Salt               float64 `json:"salt"`
}

const (
	restaurantId = "1d9b6d8c-6236-4d77-bf8b-91bcd91116e3"

	dietGroupId     = "b94dc776-277a-4837-a440-4fe9172c3f35"
	nutrientGroupId = "8d835066-3834-44c2-abf0-7a83ce375f04"
	orgCultureId    = "4286d1a6-3f4d-469a-8219-a72d3e84b9f1"

	baseURL = "https://aromimenu.cgisaas.fi/TampereAromieMenus/FI/Default/Tampere"
)

type dinerGroup struct {
	DinerGroupId string
}
type rawMenu struct {
	Date     string
	MenuDate string
	Meals    []struct {
		MealId   string
		MealName string
		Dishes   []struct {
			DishId      string
			DishName    string
			DietDetails string
		}
	}
}
type nutrientResponse struct {
	Dish           string
	DishId         string
	NutrientName   string
	Nutrients      []nutrient
	IngredientName string
}
type nutrient struct {
	NutrientWithPad string
	NutrientValue   float64
}

type restaurantMealsRequest struct {
	DinerGroupId       string   `json:"DinerGroupId"`
	DietGroupId        string   `json:"DietGroupId"`
	SuitabilityDietIds []string `json:"SuitabilityDietIds"`
}
type nutrientsRequest struct {
	DinerGroupId       string   `json:"DinerGroupId"`
	NutrientGroupId    string   `json:"NutrientGroupId"`
	SuitabilityDietIds []string `json:"SuitabilityDietIds"`
}

func FetchMenu() ([]DayMenu, error) {
	client := &http.Client{Timeout: 15 * time.Second}

	now := time.Now()
	start := startOfWeek(now)
	end := now.AddDate(0, 0, 28)

	startStr := start.Format(time.RFC3339Nano)
	endStr := end.Format(time.RFC3339Nano)

	groupURL := fmt.Sprintf(
		"%s/TREDUHEPOL/api/GetRestaurantPublicDinerGroups?Id=%s&StartDate=%s&EndDate=%s",
		baseURL,
		restaurantId,
		url.QueryEscape(startStr),
		url.QueryEscape(endStr),
	)

	var groups []dinerGroup
	if err := getJSON(client, groupURL, &groups); err != nil {
		return nil, fmt.Errorf("fetch diner groups: %w", err)
	}

	if len(groups) == 0 {
		return nil, fmt.Errorf("no diner groups returned")
	}

	menuGroupId := groups[0].DinerGroupId

	menuURL := fmt.Sprintf(
		"%s/Amogus/api/Common/Restaurant/RestaurantMeals?Id=%s&StartDate=%s&EndDate=%s",
		baseURL,
		restaurantId,
		url.QueryEscape(startStr),
		url.QueryEscape(endStr),
	)

	var rawMenus []rawMenu

	body := restaurantMealsRequest{
		DinerGroupId:       menuGroupId,
		DietGroupId:        dietGroupId,
		SuitabilityDietIds: []string{},
	}

	if err := postJSON(client, menuURL, body, &rawMenus); err != nil {
		return nil, fmt.Errorf("fetch menus: %w", err)
	}

	menus := make([]DayMenu, 0, len(rawMenus))

	for _, raw := range rawMenus {
		date, err := time.ParseInLocation("2006-01-02T15:04:05", raw.Date, time.Local)
		if err != nil {
			return nil, fmt.Errorf("parse menu date %q: %w", raw.Date, err)
		}

		day := DayMenu{
			Date:       date,
			DateString: raw.MenuDate,
			Meals:      make([]Meal, 0, len(raw.Meals)),
		}

		for _, rawMeal := range raw.Meals {
			meal := Meal{
				Id:     rawMeal.MealId,
				Name:   rawMeal.MealName,
				Dishes: make([]Dish, 0, len(rawMeal.Dishes)),
			}

			for _, rawDish := range rawMeal.Dishes {
				meal.Dishes = append(meal.Dishes, Dish{
					Id:      rawDish.DishId,
					Name:    rawDish.DishName,
					Details: rawDish.DietDetails,
				})
			}

			day.Meals = append(day.Meals, meal)
		}

		menus = append(menus, day)
	}

	type mealRef struct {
		mealIndex int
		dayIndex  int
	}

	var activeMeals []mealRef

	for dayIndex, day := range menus {
		for mealIndex, meal := range day.Meals {
			if len(meal.Dishes) > 0 {
				activeMeals = append(activeMeals, mealRef{
					dayIndex:  dayIndex,
					mealIndex: mealIndex,
				})
			}
		}
	}

	type result struct {
		ref   mealRef
		items []nutrientResponse
		err   error
	}

	results := make(chan result, len(activeMeals))

	for _, ref := range activeMeals {
		go func(ref mealRef) {
			meal := menus[ref.dayIndex].Meals[ref.mealIndex]

			items, err := fetchNutrients(
				client,
				meal.Id,
				menus[ref.dayIndex].Date,
				menuGroupId,
			)

			results <- result{
				ref:   ref,
				items: items,
				err:   err,
			}
		}(ref)
	}

	nutrientMap := make(map[string]nutrientResponse)

	for range activeMeals {
		result := <-results

		if result.err != nil {
			return nil, fmt.Errorf("fetch nutrients: %w", result.err)
		}

		for _, item := range result.items {
			nutrientMap[item.Dish] = item
		}
	}

	for dayIndex := range menus {
		for mealIndex := range menus[dayIndex].Meals {
			for dishIndex := range menus[dayIndex].Meals[mealIndex].Dishes {
				dish := &menus[dayIndex].Meals[mealIndex].Dishes[dishIndex]

				item, ok := nutrientMap[dish.Name]
				if !ok {
					continue
				}

				dish.Nutrients = parseNutrients(item.Nutrients)
				dish.Ingredients = item.IngredientName
			}
		}
	}

	return menus, nil
}
func fetchNutrients(
	client *http.Client,
	mealId string,
	date time.Time,
	menuGroupId string,
) ([]nutrientResponse, error) {
	ts := weirdDate(date)

	params := url.Values{
		"Id":              {restaurantId},
		"StartDateOffset": {ts},
		"EndDateOffset":   {ts},
		"orgCultureId":    {orgCultureId},
		"showNutritional": {"true"},
		"mealId":          {mealId},
	}

	u := fmt.Sprintf(
		"%s/Amogus/api/Common/Restaurant/GetRestaurentMealNutrients?%s",
		baseURL,
		params.Encode(),
	)

	body := nutrientsRequest{
		DinerGroupId:       menuGroupId,
		NutrientGroupId:    nutrientGroupId,
		SuitabilityDietIds: []string{},
	}

	var result []nutrientResponse

	if err := postJSON(client, u, body, &result); err != nil {
		return nil, err
	}

	return result, nil
}
func parseNutrients(data []nutrient) *Nutrients {
	get := func(key string) float64 {
		for _, item := range data {
			if strings.Contains(item.NutrientWithPad, key) {
				return item.NutrientValue
			}
		}

		return 0
	}

	return &Nutrients{
		Energy:             get("Energia, kcal"),
		Fat:                get("Rasva"),
		FatSaturated:       get("tyydyttynyttä"),
		Carbohydrates:      get("Hiilihydraatit"),
		CarbohydratesSugar: get("sokereita"),
		Protein:            get("Proteiini"),
		Salt:               get("Suola"),
	}
}

func startOfWeek(t time.Time) time.Time {
	daysSinceSunday := int(t.Weekday())

	t = t.AddDate(0, 0, -daysSinceSunday)

	return time.Date(
		t.Year(),
		t.Month(),
		t.Day(),
		t.Hour(),
		t.Minute(),
		t.Second(),
		t.Nanosecond(),
		t.Location(),
	)
}
func weirdDate(d time.Time) string {
	local := time.Date(
		d.Year(),
		d.Month(),
		d.Day(),
		0, 0, 0, 0,
		d.Location(),
	)

	return local.UTC().Format(time.RFC3339Nano)
}

func getJSON(client *http.Client, u string, dst any) error {
	resp, err := client.Get(u)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("HTTP %s", resp.Status)
	}

	return json.NewDecoder(resp.Body).Decode(dst)
}
func postJSON(client *http.Client, u string, body any, dst any) error {
	data, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, u, strings.NewReader(string(data)))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("HTTP %s", resp.Status)
	}

	return json.NewDecoder(resp.Body).Decode(dst)
}
