import type { PageLoad } from './$types';
import type { DayMenu } from 'types';

export const prerender = false;

async function loadMenu(fetch: typeof globalThis.fetch): Promise<DayMenu[]> {
	const res = await fetch('/api/menu');
	if (!res.ok) {
		throw new Error(`Failed to load the menu (${res.status})`);
	}
	const menu = (await res.json()) as DayMenu[];
  return menu;
}

export const load: PageLoad = ({ fetch }) => {
	return {
		menu: loadMenu(fetch)
	};
};
