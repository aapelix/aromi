import type { PageServerLoad } from "./$types.d.ts";

export const load: PageServerLoad = async ({ platform }) => {
  if (!platform) return { data: null };

  const menu = await platform.env.AROMI_KV.get("menu");

  if (!menu) return { data: null };

  return { data: JSON.parse(menu) };
};
