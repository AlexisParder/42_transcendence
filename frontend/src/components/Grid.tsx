export function Grid({ className = "" }: { className?: string }) {
	return <>
		<div className={`grid grid-cols-14 gap-1 p-1 aspect-square rounded-md ${className}`}>
			{Array.from({ length: 14 * 14 }, (_, i) => {
				const row = Math.floor(i / 14)
				const col = i % 14
				return (
					<button key={`${row}-${col}`} className="bg-base-200 border border-neutral/30 rounded-sm outline-none hover:border-info/50 hover:bg-info/10" />
				)
			})}
		</div>
	</>
}