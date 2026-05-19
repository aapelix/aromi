<script lang="ts">
    import type { PageProps } from './$types';

	import RangeSelector from '$lib/components/RangeSelector.svelte';
	import MenuList from '$lib/components/MenuList.svelte';

    let { data }: PageProps = $props();
</script>

<main class="min-h-screen flex flex-col items-center py-10">
	<RangeSelector />
	<MenuList data={data.data} />

	<p class="fixed bottom-4 flex gap-1">
        aromi by
        <a class="hover:underline" href="https://aapelix.dev">
		    aapelix
	    </a>
    </p>
</main>