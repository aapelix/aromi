<script lang="ts">
    import type { PageProps } from './$types';

	import WeekSelector from '$lib/components/WeekSelector.svelte';
	import MenuList from '$lib/components/MenuList.svelte';

    let { data }: PageProps = $props();
</script>

<main class="min-h-screen flex flex-col items-center py-10">
	<WeekSelector />
	{#await data.menu then menu}
		<MenuList data={menu} />
	{/await}

	<p class="fixed bottom-4 flex gap-1">
        aromi by
        <a class="hover:underline" href="https://aapelix.dev">
		    aapelix
	    </a>
    </p>
</main>
