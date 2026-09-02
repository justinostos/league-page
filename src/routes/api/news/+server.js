import { XMLParser } from 'fast-xml-parser';
import { json } from '@sveltejs/kit';

const FEED_URL = 'https://www.espn.com/espn/rss/nfl/news';

const TZ_OFFSETS = {
	EST: '-0500', EDT: '-0400',
	CST: '-0600', CDT: '-0500',
	MST: '-0700', MDT: '-0600',
	PST: '-0800', PDT: '-0700',
	UTC: '+0000', GMT: '+0000'
};

function toIsoDate(pubDate) {
	if (!pubDate) return null;
	const fixed = pubDate.replace(/\s([A-Z]{2,4})$/, (m, tz) => (TZ_OFFSETS[tz] ? ' ' + TZ_OFFSETS[tz] : m));
	const d = new Date(fixed);
	return isNaN(d.getTime()) ? null : d.toISOString();
}

async function getArticleMeta(url) {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 4000);
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timer);
		const html = await res.text();

		const imageMatch =
			html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
			html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

		const dateMatch =
			html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i) ||
			html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i) ||
			html.match(/"datePublished"\s*:\s*"([^"]+)"/i);

		const publishedAt =
			dateMatch && !isNaN(new Date(dateMatch[1]).getTime()) ? new Date(dateMatch[1]).toISOString() : null;

		return {
			image: imageMatch ? imageMatch[1] : null,
			publishedAt
		};
	} catch {
		return { image: null, publishedAt: null };
	}
}

export async function GET() {
	try {
		const res = await fetch(FEED_URL);
		const xml = await res.text();

		const parser = new XMLParser({ ignoreAttributes: false });
		const data = parser.parse(xml);

		const rawItems = data?.rss?.channel?.item ?? [];
		const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 12);

		const articles = await Promise.all(
			items.map(async (item) => {
				const meta = await getArticleMeta(item.link);
				return {
					title: item.title,
					link: item.link,
					description: (item.description ?? '').replace(/<[^>]*>/g, '').trim(),
					pubDate: meta.publishedAt ?? toIsoDate(item.pubDate),
					image: meta.image,
					isFantasy: typeof item.link === 'string' && item.link.includes('/fantasy/')
				};
			})
		);

		articles.sort((a, b) => new Date(b.pubDate ?? 0) - new Date(a.pubDate ?? 0));

		return json({ source: 'ESPN', articles });
	} catch (err) {
		return json({ source: 'ESPN', articles: [], error: 'Failed to load news' }, { status: 500 });
	}
}
