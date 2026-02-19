import { json } from "@solidjs/router";
import { fetchData } from "~/server/menuStore";

export async function GET() {
  const res = await fetchData("1d9b6d8c-6236-4d77-bf8b-91bcd91116e3");
  return json(res);
}
