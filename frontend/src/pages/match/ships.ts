import carrier from "../../assets/boats/intact/carrier.png"
import cruiser from "../../assets/boats/intact/cruiser.png"
import destroyer from "../../assets/boats/intact/destroyer.png"
import frigate from "../../assets/boats/intact/frigate.png"
import submarine from "../../assets/boats/intact/submarine.png"
import { SIZE } from "../../components/Grid"
import type { Ship, vect2 } from "../../types/events"
import type { shipRotation } from "../../types/types"

export const SHIPS: Ship[] = [
	{ name: "carrier", size: 5, image: carrier, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
	{ name: "cruiser", size: 3, image: cruiser, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
	{ name: "destroyer", size: 2, image: destroyer, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
	{ name: "frigate", size: 4, image: frigate, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
	{ name: "submarine", size: 3, image: submarine, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
]

const DIRECTIONS: Record<shipRotation, vect2> = {
	0: { x: 1, y: 0 },
	90: { x: 0, y: 1 },
	180: { x: -1, y: 0 },
	270: { x: 0, y: -1 },
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max)
}

export function placeShip(ship: Ship, coords: vect2, rotation: shipRotation, grabIndex = 0): Ship {
	const dir = DIRECTIONS[rotation]
	const length = ship.size - 1
	const start = {
		x: clamp(coords.x - dir.x * grabIndex, Math.max(0, -dir.x * length), Math.min(SIZE - 1, SIZE - 1 - dir.x * length)),
		y: clamp(coords.y - dir.y * grabIndex, Math.max(0, -dir.y * length), Math.min(SIZE - 1, SIZE - 1 - dir.y * length))
	}
	return { ...ship, start, end: { x: start.x + dir.x * length, y: start.y + dir.y * length } }
}

export function getShipRotation(ship: Ship): shipRotation {
	if (ship.start.y === ship.end.y)
		return ship.end.x > ship.start.x ? 0 : 180
	return ship.end.y > ship.start.y ? 90 : 270
}

export function getShipCells(ship: Ship): vect2[] {
	const dir = DIRECTIONS[getShipRotation(ship)]
	return Array.from({ length: ship.size }, (_, i) => ({ x: ship.start.x + dir.x * i, y: ship.start.y + dir.y * i }))
}

export function canPlaceShip(ships: Ship[], ship: Ship) {
	const taken = ships.filter(s => s.name !== ship.name).flatMap(getShipCells)
	return getShipCells(ship).every(c => !taken.some(t => t.x === c.x && t.y === c.y))
}

const ROTATIONS: shipRotation[] = [0, 90, 180, 270]

export function randomShips() {
	const ships: Ship[] = []
	for (const ship of SHIPS) {
		let placed: Ship
		do {
			const coords = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) }
			placed = placeShip(ship, coords, ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)])
		} while (!canPlaceShip(ships, placed))
		ships.push(placed)
	}
	return ships
}

export function cellFromPoint(clientX: number, clientY: number): vect2 | null {
	const grid = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-grid]")
	if (!grid)
		return null
	const rect = grid.getBoundingClientRect()
	return {
		x: clamp(Math.floor((clientX - rect.left) / rect.width * SIZE), 0, SIZE - 1),
		y: clamp(Math.floor((clientY - rect.top) / rect.height * SIZE), 0, SIZE - 1)
	}
}
