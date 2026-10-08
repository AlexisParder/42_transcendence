import type { Ship } from "../types/events"

const SIZE = 14

function shipPlacement(ship: Ship) {
	const vertical = ship.start.x === ship.end.x
	const col = Math.min(ship.start.x, ship.end.x)
	const row = Math.min(ship.start.y, ship.end.y)

	const angle = vertical ? (ship.end.y > ship.start.y ? 90 : -90) : (ship.end.x > ship.start.x ? 0 : 180)

	return {
		vertical,
		angle,
		style: {
			gridColumn: vertical ? col + 1 : `${col + 1} / span ${ship.size}`,
			gridRow: vertical ? `${row + 1} / span ${ship.size}` : row + 1
		}
	}
}

export function Grid({ ships = [], className = "" }: { ships?: Ship[], className?: string }) {
	return <>
		<div className={`grid grid-cols-14 grid-rows-14 gap-1 p-1 aspect-square rounded-md ${className}`}>
			{Array.from({ length: SIZE * SIZE }, (_, i) => {
				const x = Math.floor(i / SIZE)
				const y = i % SIZE
				return (
					<button key={`${x}-${y}`} style={{ gridRow: y + 1, gridColumn: x + 1 }} className="bg-base-200 border border-neutral/30 rounded-sm outline-none hover:border-info/50 hover:bg-info/10" />
				)
			})}

			{ships.map(ship => {
				const { vertical, angle, style } = shipPlacement(ship)

				return <>
					<div key={ship.name} className="relative z-10 pointer-events-none overflow-hidden" style={{ ...style, containerType: "size" }}>
						<img src={ship.image} alt={ship.name} draggable={false} className="absolute top-1/2 left-1/2 max-w-none object-fill" style={{
							width: vertical ? "100cqh" : "100cqw",
							height: vertical ? "100cqw" : "100cqh",
							transform: `translate(-50%, -50%) rotate(${angle}deg)`
						}} />
					</div>
				</>
			})}
		</div >
	</>
}