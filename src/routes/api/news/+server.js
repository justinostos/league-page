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

async function getOgImage(url) {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 4000);
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timer);
		const html = await res.text();
		const match =
			html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
			html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
		return match ? match[1] : null;
	} catch {
		return null;
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
			items.map(async (item) => ({
				title: item.title,
				link: item.link,
				description: (item.description ?? '').replace(/<[^>]*>/g, '').trim(),
				pubDate: toIsoDate(item.pubDate),
				image: await getOgImage(item.link),
				isFantasy: typeof item.link === 'string' && item.link.includes('/fantasy/')
			}))
		);

		return json({ source: 'ESPN', articles });
	} catch (err) {
		return json({ source: 'ESPN', articles: [], error: 'Failed to load news' }, { status: 500 });
	}
}
