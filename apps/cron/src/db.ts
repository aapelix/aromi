import { SQL } from "bun";

export const db = new SQL(process.env.DATABASE_URL!);
