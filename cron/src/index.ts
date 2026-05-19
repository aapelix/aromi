import { fetchMenu } from './menu.ts';

async function updateMenu(env: Env): Promise<void> {
	const menu = await fetchMenu();
	await env.AROMI_KV.put('menu', JSON.stringify(menu));
}

export default {
	scheduled: (_event, env, ctx) => {
		ctx.waitUntil(updateMenu(env));
	},
} satisfies ExportedHandler<Env>;
