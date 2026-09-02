import { XMLParser } from 'fast-xml-parser';
import { json } from '@sveltejs/kit';

const FEED_URL = 'https://www.espn.com/espn/rss/nfl/news';

function extractImage(item) {
	const thumb = item['media:thumbnail'];
	if (thumb) {
		return Array.isArray(thumb) ? (thumb[0]?.['@_url'] ?? null) : (thumb['@_url'] ?? null);
	}
	if (item.enclosure?.['@_url']) return item.enclosure['@_url'];
	return null;
}

export async function GET() {
	try {
		const res = await fetch(FEED_URL);
		const xml = await res.text();

		const parser = new XMLParser({ ignoreAttributes: false });
		const data = parser.parse(xml);

		const rawItems = data?.rss?.channel?.item ?? [];
		const items = Array.isArray(rawItems) ? rawItems : [rawItems];

		const articles = items.slice(0, 16).map((item) => ({
			title: item.title,
			link: item.link,
			description: (item.description ?? '').replace(/<[^>]*>/g, '').trim(),
			pubDate: item.pubDate,
			image: extractImage(item),
			isFantasy: typeof item.link === 'string' && item.link.includes('/fantasy/')
		}));

		return json({ source: 'ESPN', articles });
	} catch (err) {
		return json({ source: 'ESPN', articles: [], error: 'Failed to load news' }, { status: 500 });
	}
}
