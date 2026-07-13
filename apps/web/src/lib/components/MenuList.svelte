<script lang="ts">
    import { slide } from 'svelte/transition';
	import { range, rangeType } from '$lib/utils/menu';

    import svg0 from "$lib/assets/0.svg";
    import svg1 from "$lib/assets/1.svg";
    import svg2 from "$lib/assets/2.svg";
	import type { DayMenu } from 'types';

    const svgs = [svg0, svg1, svg2];

	let { data }: { data: DayMenu[] } = $props();

	let openDish: string | null = $state(null);
	let dropdownEl: HTMLElement | null = $state(null);

	let filtered = $derived(data.filter((item: { date: string | number | Date; }) => {
		const d = new Date(item.date);
		return d >= $range.start && d <= $range.end;
	}));

    function clampDropdown() {
		if (!dropdownEl) return;

		const rect = dropdownEl.getBoundingClientRect();
		const padding = 8;

		let shift = 0;

		if (rect.right > window.innerWidth - padding) {
			shift = window.innerWidth - rect.right - padding;
		}

		if (rect.left + shift < padding) {
			shift = padding - rect.left;
		}

		dropdownEl.style.transform = `translateX(${shift}px)`;
	}

    const today = new Date();

    let currentFrame = $state(0);
    $effect(() => {
        const interval = setInterval(() => {
            currentFrame += 1;
        }, 400);

        return () => clearInterval(interval);
    });
</script>

<div class="flex w-full max-w-3xl flex-col gap-6 px-4">
		{#if filtered.length == 0}
			<p class="mt-10 text-center">Ei ruokalistaa saatavilla. Kuolkaatkoon nälkään</p>
            <img class="mx-auto mt-4 w-96 pointer-events-none select-none absolute top-1/2 left-1/2 -translate-1/2" src={svgs[currentFrame % svgs.length]} alt="Kilpikonna" />
		{/if}

		{#each filtered as item, i (i)}
			<div class="border-b border-[#c9c9c9] pb-4 last:border-0 dark:border-[#353535]">
				<p class="mb-2 flex items-center gap-2 text-xl font-bold dark:text-white">
					{item.dateString}

					{#if $rangeType !== 'today' && new Date(item.date).toDateString() === today.toDateString()}
						<span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
					{/if}
				</p>

				{#each item.meals as meal, j (j)}
					<div class="mb-3">
						<p class="text-lg font-semibold">{meal.name}</p>

						<div class="flex flex-wrap gap-x-6 gap-y-2">
							{#each meal.dishes as dish, k (k)}
								<div class="group relative inline-block">
									<button
										class="group cursor-pointer text-[#595959] dark:text-[#cfcfcf]"
										onclick={(e) => {
											e.stopPropagation();
											const key = `${item.dateString}-${meal.name}-${dish.id}`;
											openDish = openDish === key ? null : key;
										}}
									>
										<span class="font-medium">
											{dish.name} <span class="text-xs">{dish.details}</span>
										</span>
									</button>

									<span
										class="absolute -bottom-0.5 left-0 h-0.5 w-full origin-right scale-x-0 bg-[#0f0f0f] transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100 dark:bg-white"
									></span>

									{#if openDish === `${item.dateString}-${meal.name}-${dish.id}`}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<div
											bind:this={dropdownEl}
											transition:slide={{ duration: 250 }}
											class="absolute top-full left-0 z-50 mt-2 w-96 max-w-[calc(100vw-1rem)] rounded-xl bg-black/90 p-3 text-sm text-[#d5d5d5]"
											onintrostart={clampDropdown}
											onclick={(e) => e.stopPropagation()}
										>
											<p>{dish.ingredients}</p>

											{#if dish.nutrients}
											<div class="mt-2">
												<p>Per 100g</p>
												<div class="flex justify-between">
													<p>Energia</p>
													<p>{Math.round(dish.nutrients.energy)} kcal</p>
												</div>
												<div class="flex justify-between">
													<p>Proteiini</p>
													<p>{Math.round(dish.nutrients.protein)} g</p>
												</div>
												<div class="flex justify-between">
													<p>Rasva</p>
													<p>{Math.round(dish.nutrients.fat)} g</p>
												</div>
												<div class="flex justify-between">
													<p>Hiilihydraatit</p>
													<p>{Math.round(dish.nutrients.carbohydrates)} g</p>
												</div>
												<div class="flex justify-between">
													<p>Joista sokereita</p>
													<p>{Math.round(dish.nutrients.carbohydratesSugar)} g</p>
												</div>
											</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
