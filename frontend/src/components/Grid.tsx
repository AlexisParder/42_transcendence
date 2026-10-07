export function Grid() {
	return <div className="grid grid-cols-14">
		{Array.from({ length: 14 }, (_, row) =>
			Array.from({ length: 14 }, (_, col) => (
				<p key={`${row}-${col}`}><button className="aspect-square w-auto h-full bg-neutral/10 border border-neutral/50 outline-none"></button></p>
			))
		)}
	</div>
}