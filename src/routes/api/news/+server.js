import { XMLParser } from 'fast-xml-parser';
import { json } from '@sveltejs/kit';

const FEED_URL = 'https://www.espn.com/espn/rss/nfl/news';

export async function GET() {
	try {
		const res = await fetch(FEED_URL);
		const xml = await res.text();

		const parser = new XMLParser({ ignoreAttributes: false });
		const data = parser.parse(xml);

		const rawItems = data?.rss?.channel?.item ?? [];
		const items = Array.isArray(rawItems) ? rawItems : [rawItems];

		const articles = items.slice(0, 15).map((item) => ({
			title: item.title,
			link: item.link,
			description: (item.description ?? '').replace(/<[^>]*>/g, '').trim(),
			pubDate: item.pubDate
		}));

		return json({ source: 'ESPN', articles });
	} catch (err) {
		return json({ source: 'ESPN', articles: [], error: 'Failed to load news' }, { status: 500 });
	}
}
