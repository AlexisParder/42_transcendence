export function Avatar({username, image, size}: {username: string | null | undefined, image: string | null | undefined, size: number}) {
	if (size < 4)
		size = 4

	if (image && image?.length > 5)
		return <img src={image} alt="Profile picture" className={`rounded-md w-${size/4} h-${size/4} object-cover shrink-0`} />
	return <div className={`flex rounded-md w-${size/4} h-${size/4} shrink-0 bg-info/15 border border-info/50`}>
		<p className={`flex flex-1 justify-center items-center font-bold text-lg`}>{username && username.length > 0 ? username.charAt(0).toUpperCase() : '-'}</p>
	</div>
}