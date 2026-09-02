<script>
	import { onMount } from 'svelte';

	export let teamName;

	let articles = [];
	let loading = true;
	let errored = false;

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

	function playersFor(article) {
		return article.teamMentions?.find((m) => m.team === teamName)?.players ?? [];
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/news');
			const data = await res.json();
			articles = (data.articles ?? []).filter((a) => a.teamMentions?.some((m) => m.team === teamName));
		} catch {
			errored = true;
		} finally {
			loading = false;
		}
	});
</script>

<style>
	.news-section {
		width: 97%;
		max-width: 800px;
		margin: 3em auto;
	}
	h3 {
		text-align: center;
		font-size: 1.5em;
		margin: 1.5em 0 1em;
		font-weight: 200;
	}
	.news-feed {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
		width: 88px;
		height: 88px;
		object-fit: cover;
		border-radius: 8px;
		flex-shrink: 0;
	}
	.card-body {
		min-width: 0;
	}
	.card-body h4 {
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.35;
		margin: 0 0 0.3rem 0;
		color: #1a73c7;
	}
	.card-body p {
		font-size: 0.88rem;
		line-height: 1.4;
		margin: 0 0 0.4rem 0;
		color: var(--g555, #888);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.mentions {
		font-size: 0.78rem;
		font-weight: 600;
		color: #1a8f4c;
		margin: 0 0 0.4rem 0;
	}
	.date {
		font-size: 0.72rem;
		color: var(--g555, #999);
	}
	.empty,
	.loading-text {
		text-align: center;
		color: var(--g555, #888);
		font-size: 0.9em;
	}
	.see-all {
		text-align: center;
		margin-top: 1em;
	}
	.see-all a {
		font-size: 0.85em;
		color: #1a73c7;
		text-decoration: none;
	}
</style>

<div class="news-section">
	<h3>Recent News</h3>
	{#if loading}
		<p class="loading-text">Loading news…</p>
	{:else if errored}
		<p class="empty">Couldn't load news right now.</p>
	{:else if articles.length === 0}
		<p class="empty">No recent news mentioning this roster.</p>
	{:else}
		<ul class="news-feed">
			{#each articles.slice(0, 5) as article (article.link)}
				<li class="news-card">
					<a href={article.link} target="_blank" rel="noopener noreferrer">
						{#if article.image}
							<img class="thumb" src={article.image} alt="" />
						{/if}
						<div class="card-body">
							<h4>{article.title}</h4>
							<p>{article.description}</p>
							<p class="mentions">{playersFor(article).join(', ')}</p>
							<span class="date">{timeAgo(article.pubDate)}</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
		<div class="see-all">
			<a href="/news">See all news →</a>
		</div>
	{/if}
</div>
