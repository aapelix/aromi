import { db } from '$lib/server/db';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const [row] = await db`
      SELECT data
      FROM menu_cache
      WHERE id = 1
  `;

	const menu =
		typeof row.data === 'string'
			? JSON.parse(row.data)
			: row.data;

  return Response.json(menu, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
    }
  });
};
