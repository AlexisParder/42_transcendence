import type { Ship, ShipName, Shot, vect2 } from "../types/events"
import carrier from "../assets/boats/intact/carrier.png"
import cruiser from "../assets/boats/intact/cruiser.png"
import destroyer from "../assets/boats/intact/destroyer.png"
import frigate from "../assets/boats/intact/frigate.png"
import submarine from "../assets/boats/intact/submarine.png"
import carrierHit from "../assets/boats/hit/carrier.png"
import cruiserHit from "../assets/boats/hit/cruiser.png"
import destroyerHit from "../assets/boats/hit/destroyer.png"
import frigateHit from "../assets/boats/hit/frigate.png"
import submarineHit from "../assets/boats/hit/submarine.png"
import carrierSunk from "../assets/boats/sunk/carrier.png"
import cruiserSunk from "../assets/boats/sunk/cruiser.png"
import destroyerSunk from "../assets/boats/sunk/destroyer.png"
import frigateSunk from "../assets/boats/sunk/frigate.png"
import submarineSunk from "../assets/boats/sunk/submarine.png"
import type { ShipStatus } from "../types/types"
import { isOnShip } from "../lib/ship"

export const SIZE = 14

const IMG_SHIP: Record<ShipStatus, Record<ShipName, string>> = {
	intact: {
		carrier,
		cruiser,
		destroyer,
		frigate,
		submarine
	},
	hit: {
		carrier: carrierHit,
		cruiser: cruiserHit,
		destroyer: destroyerHit,
		frigate: frigateHit,
		submarine: submarineHit
	},
	sunk: {
		carrier: carrierSunk,
		cruiser: cruiserSunk,
		destroyer: destroyerSunk,
		frigate: frigateSunk,
		submarine: submarineSunk
	}
}

function getShipStatus(ship: Ship, shots: Shot[]): ShipStatus {
	const hits = shots.filter(s => s.status !== "miss" && isOnShip(ship, s.coords)).length

	if (hits === 0)
		return "intact"
	return hits >= ship.size ? "sunk" : "hit"
}

const SHOT_STYLE: Record<Shot["status"], string> = {
	miss: "bg-neutral/40 border-neutral/60",
	hit: "bg-warning/30 border-warning/70",
	sunk: "bg-error/30 border-error/70",
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

export function Grid({ ships = [], shots = [], className = "", hoverable = true, targetLocked, setTargetLocked, previewShip, dropZone = [], dropValid = true, onPickCell }: {
	ships?: Ship[],
	shots?: Shot[],
	className?: string,
	hoverable?: boolean,
	targetLocked?: vect2,
	setTargetLocked?: (coords: vect2) => void,
	previewShip?: Ship,
	dropZone?: vect2[],
	dropValid?: boolean,
	onPickCell?: (coords: vect2) => void
}) {
	const shipStatus = new Map(ships.map(s => [s.name, getShipStatus(s, shots)]))
	const sunkShips = ships.filter(s => shipStatus.get(s.name) === "sunk")
	const isShot = (x: number, y: number) => shots.some(s => s.coords.x === x && s.coords.y === y)

	function cellShotStatus(shot: Shot): Shot["status"] {
		if (shot.status === "hit" && sunkShips.some(s => isOnShip(s, shot.coords)))
			return "sunk"
		return shot.status
	}

	function cellColor(x: number, y: number) {
		if (dropZone.some(c => c.x === x && c.y === y))
			return dropValid ? "border-dashed border-info/50 bg-info/10" : "border-dashed border-error/50 bg-error/10"
		if (targetLocked?.x === x && targetLocked?.y === y)
			return "border-info/50 bg-info/10"
		return `bg-base-200 border-neutral/30 ${hoverable && !isShot(x, y) ? "hover:border-info/50 hover:bg-info/10" : ""}`
	}

	return <>
		<div data-grid="" className={`grid grid-cols-14 grid-rows-14 gap-1 p-1 aspect-square rounded-md ${onPickCell ? "touch-none" : ""} ${className}`}>
			{Array.from({ length: SIZE * SIZE }, (_, i) => {
				const x = Math.floor(i / SIZE)
				const y = i % SIZE
				return (
					<button
						key={`${x}-${y}`}
						onClick={() => {
							if (setTargetLocked)
								setTargetLocked({ x, y })
						}}
						onPointerDown={e => {
							if (onPickCell) {
								e.preventDefault()
								onPickCell({ x, y })
							}
						}}
						style={{ gridRow: y + 1, gridColumn: x + 1 }}
						className={`${cellColor(x, y)} border rounded-sm outline-none`} />
				)
			})}

			{[...ships, ...(previewShip ? [previewShip] : [])].map(ship => {
				const { vertical, angle, style } = shipPlacement(ship)
				const isPreview = ship === previewShip
				const status = isPreview ? "intact" : shipStatus.get(ship.name) ?? "intact"

				return (
					<div key={isPreview ? "preview" : ship.name} className={`relative z-10 pointer-events-none overflow-hidden @container-size ${isPreview ? "opacity-60" : ""}`} style={style}>
						<img src={IMG_SHIP[status][ship.name]} alt={ship.name} draggable={false} className="absolute top-1/2 left-1/2 max-w-none object-fill" style={{
							width: vertical ? "100cqh" : "100cqw",
							height: vertical ? "100cqw" : "100cqh",
							transform: `translate(-50%, -50%) rotate(${angle}deg)`
						}} />
					</div>
				)
			})}

			{shots.map(shot => (
				<div
					key={`shot-${shot.coords.x}-${shot.coords.y}`}
					className={`${SHOT_STYLE[cellShotStatus(shot)]} z-20 border rounded-sm pointer-events-none`}
					style={{
						gridRow: shot.coords.y + 1,
						gridColumn: shot.coords.x + 1
					}}>
				</div>
			))}
		</div >
	</>
}