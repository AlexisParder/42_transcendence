export function getAvatar(image: string | null | undefined) {
	if (image && image?.length > 5)
		return image
	return "https://placehold.co/40x40" // changer par une image avec la 1ere lettre du nom
}