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
					</a>
					<p>{article.description}</p>
					<span class="source">
						via {data.source} &middot; {new Date(article.pubDate).toLocaleDateString()}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.news-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}

	h1 {
		margin-bottom: 1.5rem;
	}

	.news-feed {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.news-card {
		background-color: var(--fff);
		border-radius: 8px;
		box-shadow: 0 0 6px 0 rgba(0, 49, 107, 0.25);
		padding: 1.25rem 1.5rem;
		margin-bottom: 1.25rem;
	}

	.news-card a {
		text-decoration: none;
		color: inherit;
	}

	.news-card h3 {
		margin: 0 0 0.5rem 0;
		color: #00316b;
	}

	.news-card a:hover h3 {
		text-decoration: underline;
	}

	.news-card p {
		margin: 0 0 0.5rem 0;
		color: var(--g555, #555);
	}

	.source {
		font-size: 0.8em;
		color: var(--g555, #999);
	}
</style>
