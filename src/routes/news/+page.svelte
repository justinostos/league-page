<script>
	export let data;
</script>

<div class="news-page">
	<h1>Fantasy Football News</h1>

	{#if data.error}
		<p>Couldn't load news right now — check back soon.</p>
	{:else}
		<ul class="news-feed">
			{#each data.articles as article}
				<li class="news-card">
					<a href={article.link} target="_blank" rel="noopener noreferrer">
						<h3>{article.title}</h3>
						<p>{article.description}</p>
						<span class="source">{data.source}</span>
						<span class="date">{new Date(article.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.news-page {
		max-width: 760px;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
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
		position: relative;
		background-color: var(--fff);
		border-radius: 10px;
		border-left: 4px solid #00316b;
		box-shadow: 0 2px 8px 0 rgba(0, 49, 107, 0.2);
		padding: 1.1rem 1.4rem;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.news-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 14px 0 rgba(0, 49, 107, 0.35);
	}

	.news-card a {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.news-card h3 {
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1.35;
		margin: 0 0 0.4rem 0;
		color: #1a73c7;
	}

	.news-card p {
		font-size: 0.9rem;
		line-height: 1.4;
		margin: 0 0 0.6rem 0;
		color: var(--g555, #888);
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
		margin-right: 0.5rem;
	}

	.date {
		font-size: 0.75rem;
		color: var(--g555, #999);
	}
</style>
