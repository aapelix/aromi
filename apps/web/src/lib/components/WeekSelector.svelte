<script lang="ts">
	import { rangeType, type RangeType } from '$lib/utils/menu';

	const labels = ['Tänään', 'Tämä viikko', 'Seuraava viikko', 'Kolmas viikko', 'Neljäs viikko'];
	const types = ['today', 'this', 'next', 'next2', 'next3'];

	let container: HTMLElement | null = null;
	let indicator = $state({ left: 0, width: 0 });

	function updateIndicator(el: HTMLElement) {
		const parent = container!.getBoundingClientRect();
		const rect = el.getBoundingClientRect();

		indicator = {
			left: rect.left - parent.left,
			width: rect.width
		};
	}

	$effect(() => {
        if (!container) return;

		const index = types.indexOf($rangeType);
		const buttons = container?.querySelectorAll('button');
		if (buttons && buttons[index]) {
			updateIndicator(buttons[index] as HTMLElement);
		}
	});

</script>

<div bind:this={container} class="relative mb-6 flex justify-center px-1 md:gap-3 md:px-0">
		<div
			class="absolute top-0 h-full rounded-xl bg-[#1f1f1f] transition-all duration-300"
			style="left: {indicator.left}px; width: {indicator.width}px;"
		></div>

		{#each types as type, i (i)}
			<button
				class="relative z-10 cursor-pointer rounded-xl px-2 py-1 text-xs transition-colors duration-400 md:px-4 md:py-2 md:text-base {$rangeType ===
				type
					? 'text-white'
					: 'text-[#5a5a5a] dark:text-[#a7a7a7]'}"
				onclick={(e) => {
					$rangeType = type as RangeType;
					updateIndicator(e.currentTarget);
				}}
			>
				{labels[i]}
			</button>
		{/each}
	</div>
