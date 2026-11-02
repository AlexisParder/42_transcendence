export const AVATAR_MAX_SIZE = 1024 * 1024
export const AVATAR_MAX_SIZE_MB = AVATAR_MAX_SIZE / (1024 * 1024)
export const AVATAR_INPUT_MAX_SIZE = 10 * 1024 * 1024
export const AVATAR_INPUT_MAX_SIZE_MB = AVATAR_INPUT_MAX_SIZE / (1024 * 1024)
const AVATAR_DIMENSION = 512
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"]

export async function resizeAvatar(file: File): Promise<{ error: string } | { blob: Blob }> {
	let bitmap: ImageBitmap
	try {
		bitmap = await createImageBitmap(file)
	} catch {
		return { error: "settings_err_picture_type" }
	}

	const side = Math.min(bitmap.width, bitmap.height)
	const size = Math.min(side, AVATAR_DIMENSION)

	const canvas = document.createElement("canvas")
	canvas.width = size
	canvas.height = size
	const ctx = canvas.getContext("2d")
	if (!ctx) {
		bitmap.close()
		return { error: "settings_err_updt_picture" }
	}

	ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
	bitmap.close()

	const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.8))
	return blob ? { blob } : { error: "settings_err_updt_picture" }
}
