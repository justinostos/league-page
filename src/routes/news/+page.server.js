export async function load({ fetch }) {
	const res = await fetch('/api/news');
	const data = await res.json();
	return data;
}
