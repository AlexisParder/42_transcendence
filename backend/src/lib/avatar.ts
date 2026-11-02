import sharp from "sharp"

const AVATAR_MAX_SIZE = 1024 * 1024
const AVATAR_DIMENSION = 512
const AVATAR_MAX_PIXELS = 4096 * 4096
const AVATAR_FORMATS = ["png", "jpeg", "gif", "webp"]

async function resizeAvatar(buf: Buffer): Promise<string | null> {
	try {
		const img = sharp(buf, { limitInputPixels: AVATAR_MAX_PIXELS })
		const { format } = await img.metadata()
		if (!format || !AVATAR_FORMATS.includes(format))
			return null

		const out = await img
			.resize(AVATAR_DIMENSION, AVATAR_DIMENSION, { fit: "cover", withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer()
		return `data:image/webp;base64,${out.toString("base64")}`
	} catch {
		return null
	}
}

export async function processAvatar(image: string): Promise<{ error: string } | { image: string }> {
	if (image.length > Math.ceil(AVATAR_MAX_SIZE / 3) * 4 + 64)
		return { error: "settings_err_picture_too_big" }

	const match = /^data:image\/[a-z]+;base64,([A-Za-z0-9+/]+={0,2})$/.exec(image)
	if (!match)
		return { error: "settings_err_picture_type" }

	const buf = Buffer.from(match[1], "base64")
	if (buf.length > AVATAR_MAX_SIZE)
		return { error: "settings_err_picture_too_big" }

	const resized = await resizeAvatar(buf)
	return resized ? { image: resized } : { error: "settings_err_picture_type" }
}

export async function importAvatar(url: string | null | undefined): Promise<string | null> {
	if (!url)
		return null

	try {
		const { protocol } = new URL(url)
		if (protocol !== "https:")
			return null

		const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5000) })
		if (!res.ok || Number(res.headers.get("content-length") ?? 0) > AVATAR_MAX_SIZE)
			return null

		const buf = Buffer.from(await res.arrayBuffer())
		if (buf.length > AVATAR_MAX_SIZE)
			return null

		return await resizeAvatar(buf)
	} catch {
		return null
	}
}
