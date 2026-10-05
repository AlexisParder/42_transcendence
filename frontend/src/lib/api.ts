export async function apiPost(url: string, body?: unknown) {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-type": "application/json" },
		credentials: "include",
		body: body ? JSON.stringify(body) : undefined,
	})

	const data = await res.json().catch(() => ({}))
	return { ok: res.ok, data }
}

export async function apiGet(url: string) {
	const res = await fetch(url, {
		method: "GET",
		headers: { "Content-type": "application/json" },
		credentials: "include",
	})

	const data = await res.json().catch(() => ({}))
	return { ok: res.ok, data }
}