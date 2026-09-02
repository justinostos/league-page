<script>
	export let data;
</script>

<h1>Fantasy Football News</h1>

{#if data.error}
	<p>Couldn't load news right now — check back soon.</p>
{:else}
	<ul class="news-feed">
		{#each data.articles as article}
			<li>
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

<style>
	.news-feed { list-style: none; padding: 0; }
	.news-feed li { margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
	.news-feed h3 { margin: 0 0 0.25rem 0; }
	.source { font-size: 0.8rem; color: #888; }
</style>
