import { XMLParser } from 'fast-xml-parser';
import { json } from '@sveltejs/kit';
import { leagueID } from '$lib/utils/leagueInfo';

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

// --- League roster cache (refreshes every 12 hours) ---
let rosterCache = null;
let rosterCacheTime = 0;
const ROSTER_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

async function getRosteredPlayerNames() {
	const now = Date.now();
	if (rosterCache && now - rosterCacheTime < ROSTER_CACHE_TTL_MS) {
		return rosterCache;
	}
	try {
		const [rostersRes, playersRes] = await Promise.all([
			fetch(`https://api.sleeper.app/v1/league/${leagueID}/rosters`),
			fetch('https://api.sleeper.app/v1/players/nfl')
		]);
		const rosters = await rostersRes.json();
		const players = await playersRes.json();

		const rosteredIds = new Set();
		for (const roster of rosters ?? []) {
			for (const id of roster.players ?? []) {
				rosteredIds.add(String(id));
			}
		}

		const names = [];
		for (const id of rosteredIds) {
			const p = players?.[id];
			if (p?.position !== 'DEF' && p?.full_name) {
				names.push(p.full_name);
			}
		}

		rosterCache = names;
		rosterCacheTime = now;
		return names;
	} catch {
		return rosterCache ?? [];
	}
}

function findRosteredMentions(text, rosteredNames) {
	const lower = text.toLowerCase();
	const matches = [];
	for (const name of rosteredNames) {
		if (name.length < 6) continue;
		if (lower.includes(name.toLowerCase())) matches.push(name);
	}
	return matches;
}

export async function GET() {
	try {
		const [res, rosteredNames] = await Promise.all([fetch(FEED_URL), getRosteredPlayerNames()]);
		const xml = await res.text();

		const parser = new XMLParser({ ignoreAttributes: false });
		const data = parser.parse(xml);

		const rawItems = data?.rss?.channel?.item ?? [];
		const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 12);

		const articles = await Promise.all(
			items.map(async (item) => {
				const meta = await getArticleMeta(item.link);
				const description = (item.description ?? '').replace(/<[^>]*>/g, '').trim();
				const rosteredMentions = findRosteredMentions(`${item.title} ${description}`, rosteredNames);
				return {
					title: item.title,
					link: item.link,
					description,
					pubDate: meta.publishedAt ?? toIsoDate(item.pubDate),
					image: meta.image,
					isFantasy: typeof item.link === 'string' && item.link.includes('/fantasy/'),
					rosteredMentions
				};
			})
		);

		articles.sort((a, b) => new Date(b.pubDate ?? 0) - new Date(a.pubDate ?? 0));

		return json({ source: 'ESPN', articles });
	} catch (err) {
		return json({ source: 'ESPN', articles: [], error: 'Failed to load news' }, { status: 500 });
	}
}
