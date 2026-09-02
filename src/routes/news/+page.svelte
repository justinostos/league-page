<script>
	export let data;

	let searchTerm = '';
	let fantasyOnly = false;

	function timeAgo(dateStr) {
		if (!dateStr) return '';
		const diffMs = Math.max(0, Date.now() - new Date(dateStr).getTime());
		const mins = Math.floor(diffMs / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	$: filtered = (data.articles ?? []).filter((a) => {
		if (fantasyOnly && !a.isFantasy) return false;
		if (searchTerm.trim()) {
			const q = searchTerm.trim().toLowerCase();
			const haystack = `${a.title} ${a.description}`.toLowerCase();
			if (!haystack.includes(q)) return false;
		}
		return true;
	});

	$: hero = filtered[0];
	$: rest = filtered.slice(1);
</script>

<div class="news-page">
	<h1>Fantasy Football News</h1>

	<div class="controls">
		<input
			class="search"
			type="text"
			placeholder="Search news… (e.g. a player or team name)"
			bind:value={searchTerm}
		/>
		<div class="toggle-group">
			<button class:active={!fantasyOnly} on:click={() => (fantasyOnly = false)}>All</button>
			<button class:active={fantasyOnly} on:click={() => (fantasyOnly = true)}>Fantasy Only</button>
		</div>
	</div>

	{#if data.error}
		<p>Couldn't load news right now — check back soon.</p>
	{:else if !data.articles || data.articles.length === 0}
		<p>No news right now — check back soon.</p>
	{:else if filtered.length === 0}
		<p class="empty">No stories match "{searchTerm}"{fantasyOnly ? ' in Fantasy Only' : ''}. Try a different search or switch back to All.</p>
	{:else}
		<a class="hero" href={hero.link} target="_blank" rel="noopener noreferrer">
			{#if hero.image}
				<img class="hero-img" src={hero.image} alt="" />
			{/if}
			<div class="hero-body">
				{#if hero.isFantasy}
					<span class="badge fantasy">FANTASY</span>
				{/if}
				<h2>{hero.title}</h2>
				<p>{hero.description}</p>
				<span class="meta">
					<span class="source">{data.source}</span>
					<span class="date">{timeAgo(hero.pubDate)}</span>
				</span>
			</div>
		</a>

		<ul class="news-feed">
			{#each rest as article, i (article.link)}
				<li class="news-card" style="animation-delay: {i * 60}ms">
					<a href={article.link} target="_blank" rel="noopener noreferrer">
						{#if article.image}
							<img class="thumb" src={article.image} alt="" />
						{/if}
						<div class="card-body">
							{#if article.isFantasy}
								<span class="badge fantasy small">FANTASY</span>
							{/if}
							<h3>{article.title}</h3>
							<p>{article.description}</p>
							<span class="meta">
								<span class="source">{data.source}</span>
								<span class="date">{timeAgo(article.pubDate)}</span>
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.news-page {
		max-width: 780px;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}
	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 1.25rem;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1.75rem;
	}

	.search {
		flex: 1;
		min-width: 200px;
		padding: 0.55rem 0.9rem;
		border-radius: 8px;
		border: 1px solid rgba(0, 49, 107, 0.25);
		background-color: var(--fff);
		color: inherit;
		font-size: 0.9rem;
	}
	.search:focus {
		outline: none;
		border-color: #00316b;
	}

	.toggle-group {
		display: flex;
		border-radius: 999px;
		overflow: hidden;
		border: 1px solid rgba(0, 49, 107, 0.25);
		flex-shrink: 0;
	}
	.toggle-group button {
		border: none;
		background: transparent;
		color: inherit;
		padding: 0.55rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.toggle-group button.active {
		background-color: #00316b;
		color: #fff;
	}

	.empty {
		color: var(--g555, #888);
	}

	.hero {
		display: block;
		text-decoration: none;
		color: inherit;
		background-color: var(--fff);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 16px 0 rgba(0, 49, 107, 0.3);
		margin-bottom: 1.75rem;
		border-left: 4px solid #00316b;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}
	.hero:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 22px 0 rgba(0, 49, 107, 0.4);
	}
	.hero-img {
		width: 100%;
		height: 260px;
		object-fit: cover;
		display: block;
	}
	.hero-body {
		padding: 1.25rem 1.5rem 1.5rem;
	}
	.hero-body h2 {
		font-size: 1.4rem;
		font-weight: 700;
		line-height: 1.3;
		margin: 0.35rem 0 0.5rem;
		color: #1a73c7;
	}
	.hero-body p {
		font-size: 0.95rem;
		line-height: 1.45;
		color: var(--g555, #888);
		margin: 0 0 0.75rem;
	}

	.news-feed {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.news-card {
		opacity: 0;
		animation: fadeInUp 0.4s ease forwards;
	}
	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.news-card a {
		display: flex;
		gap: 1rem;
		text-decoration: none;
		color: inherit;
		background-color: var(--fff);
		border-radius: 10px;
		border-left: 4px solid #00316b;
		box-shadow: 0 2px 8px 0 rgba(0, 49, 107, 0.2);
		padding: 0.9rem 1.2rem;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}
	.news-card a:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 14px 0 rgba(0, 49, 107, 0.35);
	}
	.thumb {
		width: 96px;
		height: 96px;
		object-fit: cover;
		border-radius: 8px;
		flex-shrink: 0;
	}
	.card-body {
		min-width: 0;
	}
	.card-body h3 {
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1.35;
		margin: 0 0 0.35rem 0;
		color: #1a73c7;
	}
	.card-body p {
		font-size: 0.9rem;
		line-height: 1.4;
		margin: 0 0 0.5rem 0;
		color: var(--g555, #888);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		margin-bottom: 0.4rem;
	}
	.badge.fantasy {
		background-color: #e8672c;
		color: #fff;
	}
	.badge.small {
		font-size: 0.62rem;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.source {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		background-color: #00316b;
		color: #fff;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
	}
	.date {
		font-size: 0.75rem;
		color: var(--g555, #999);
	}
</style>
