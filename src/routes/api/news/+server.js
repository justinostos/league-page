import { XMLParser } from 'fast-xml-parser';
import { json } from '@sveltejs/kit';
import { leagueID, managers } from '$lib/utils/leagueInfo';

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

// --- Per-team roster cache (refreshes every 12 hours) ---
let teamsCache = null;
let teamsCacheTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

async function getLeagueTeams() {
	const now = Date.now();
	if (teamsCache && now - teamsCacheTime < CACHE_TTL_MS) {
		return teamsCache;
	}
	try {
		const [rostersRes, usersRes, playersRes] = await Promise.all([
			fetch(`https://api.sleeper.app/v1/league/${leagueID}/rosters`),
			fetch(`https://api.sleeper.app/v1/league/${leagueID}/users`),
			fetch('https://api.sleeper.app/v1/players/nfl')
		]);
				const rosters = await rostersRes.json();
		const users = await usersRes.json();
		const players = await playersRes.json();

		const managerNameMap = {};
		for (const m of managers ?? []) {
			if (m.managerID) managerNameMap[m.managerID] = m.name;
		}

		const userMap = {};
		for (const u of users ?? []) {
			userMap[u.user_id] = managerNameMap[u.user_id] || u.metadata?.team_name || u.display_name || 'Unnamed Team';
		}

		const teams = (rosters ?? []).map((roster) => {
			const names = [];
			for (const id of roster.players ?? []) {
				const p = players?.[String(id)];
				if (p?.position !== 'DEF' && p?.full_name) names.push(p.full_name);
			}
			return {
				name: userMap[roster.owner_id] || `Team ${roster.roster_id}`,
				players: names
			};
		});

		teamsCache = teams;
		teamsCacheTime = now;
		return teams;
	} catch {
		return teamsCache ?? [];
	}
}

function findTeamMentions(text, teams) {
	const lower = text.toLowerCase();
	const matches = [];
	for (const team of teams) {
		const hitPlayers = team.players.filter((name) => name.length >= 6 && lower.includes(name.toLowerCase()));
		if (hitPlayers.length > 0) {
			matches.push({ team: team.name, players: hitPlayers });
		}
	}
	return matches;
}

export async function GET() {
	try {
		const [res, teams] = await Promise.all([fetch(FEED_URL), getLeagueTeams()]);
		const xml = await res.text();

		const parser = new XMLParser({ ignoreAttributes: false });
		const data = parser.parse(xml);

		const rawItems = data?.rss?.channel?.item ?? [];
		const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 12);

		const articles = await Promise.all(
			items.map(async (item) => {
				const meta = await getArticleMeta(item.link);
				const description = (item.description ?? '').replace(/<[^>]*>/g, '').trim();
				const teamMentions = findTeamMentions(`${item.title} ${description}`, teams);
				const rosteredMentions = [...new Set(teamMentions.flatMap((m) => m.players))];
				return {
					title: item.title,
					link: item.link,
					description,
					pubDate: meta.publishedAt ?? toIsoDate(item.pubDate),
					image: meta.image,
					isFantasy: typeof item.link === 'string' && item.link.includes('/fantasy/'),
					rosteredMentions,
					teamMentions
				};
			})
		);

		articles.sort((a, b) => new Date(b.pubDate ?? 0) - new Date(a.pubDate ?? 0));

		return json({ source: 'ESPN', articles, teams: teams.map((t) => t.name) });
	} catch (err) {
		return json({ source: 'ESPN', articles: [], teams: [], error: 'Failed to load news' }, { status: 500 });
	}
}
