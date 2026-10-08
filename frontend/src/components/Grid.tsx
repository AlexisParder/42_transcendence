import type { Ship, ShipName, vect2 } from "../types/events"
import carrier from "../assets/boats/intact/carrier.png"
import cruiser from "../assets/boats/intact/cruiser.png"
import destroyer from "../assets/boats/intact/destroyer.png"
import frigate from "../assets/boats/intact/frigate.png"
import submarine from "../assets/boats/intact/submarine.png"

export const SIZE = 14

const IMG_SHIP: Record<ShipName, string> = {
	carrier,
	cruiser,
	destroyer,
	frigate,
	submarine,
}

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

export function Grid({ ships = [], className = "", hoverable = true, targetLocked, setTargetLocked, previewShip, dropZone = [], dropValid = true, setHoverCell, onDropCell, onPickCell }: {
	ships?: Ship[],
	className?: string,
	hoverable?: boolean,
	targetLocked?: vect2,
	setTargetLocked?: (coords: vect2) => void,
	previewShip?: Ship,
	dropZone?: vect2[],
	dropValid?: boolean,
	setHoverCell?: (coords: vect2 | null) => void,
	onDropCell?: (coords: vect2) => void,
	onPickCell?: (coords: vect2) => void
}) {
	function cellColor(x: number, y: number) {
		if (dropZone.some(c => c.x === x && c.y === y))
			return dropValid ? "border-dashed border-info/50 bg-info/10" : "border-dashed border-error/50 bg-error/10"
		if (targetLocked?.x === x && targetLocked?.y === y)
			return "border-info/50 bg-info/10"
		return `bg-base-200 border-neutral/30 ${hoverable ? "hover:border-info/50 hover:bg-info/10" : ""}`
	}

	return <>
		<div className={`grid grid-cols-14 grid-rows-14 gap-1 p-1 aspect-square rounded-md ${className}`} onPointerLeave={() => setHoverCell?.(null)}>
			{Array.from({ length: SIZE * SIZE }, (_, i) => {
				const x = Math.floor(i / SIZE)
				const y = i % SIZE
				return (
					<button key={`${x}-${y}`} onClick={() => {
						if (setTargetLocked)
							setTargetLocked({ x, y })
					}} onPointerEnter={() => setHoverCell?.({ x, y })} onPointerDown={e => { if (onPickCell) { e.preventDefault(); onPickCell({ x, y }) } }} onPointerUp={() => onDropCell?.({ x, y })} style={{ gridRow: y + 1, gridColumn: x + 1 }} className={`${cellColor(x, y)} border rounded-sm outline-none`} />
				)
			})}

			{[...ships, ...(previewShip ? [previewShip] : [])].map(ship => {
				const { vertical, angle, style } = shipPlacement(ship)
				const isPreview = ship === previewShip

				return (
					<div key={isPreview ? "preview" : ship.name} className={`relative z-10 pointer-events-none overflow-hidden @container-size ${isPreview ? "opacity-60" : ""}`} style={style}>
						<img src={IMG_SHIP[ship.name]} alt={ship.name} draggable={false} className="absolute top-1/2 left-1/2 max-w-none object-fill" style={{
							width: vertical ? "100cqh" : "100cqw",
							height: vertical ? "100cqw" : "100cqh",
							transform: `translate(-50%, -50%) rotate(${angle}deg)`
						}} />
					</div>
				)
			})}
		</div >
	</>
}