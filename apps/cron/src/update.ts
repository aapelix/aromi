import { db } from "./db";
import { fetchMenu } from "./menu";

export async function updateMenu() {
    const menu = await fetchMenu();

    await db`
        INSERT INTO menu_cache (id, updated_at, data)
        VALUES (1, NOW(), ${JSON.stringify(menu)}::jsonb)
        ON CONFLICT (id)
        DO UPDATE SET
            updated_at = NOW(),
            data = EXCLUDED.data;
    `;
}
