import type { Ship, ShipName, vect2 } from "../../events.ts"

const GRID_SIZE = 14

const SHIP_SIZES: Record<ShipName, number> = {
	carrier: 5,
	frigate: 4,
	cruiser: 3,
	submarine: 3,
	destroyer: 2,
}

function isValidCell(c: any): c is vect2 {
	return c && Number.isInteger(c.x) && Number.isInteger(c.y) && c.x >= 0 && c.x < GRID_SIZE && c.y >= 0 && c.y < GRID_SIZE
}

function getCells(start: vect2, end: vect2): vect2[] {
	const dx = Math.sign(end.x - start.x)
	const dy = Math.sign(end.y - start.y)
	const length = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) + 1

	return Array.from({ length }, (_, i) => ({ x: start.x + dx * i, y: start.y + dy * i }))
}

export function validateShips(ships: any): Ship[] | null {
	const names = Object.keys(SHIP_SIZES) as ShipName[]

	if (!Array.isArray(ships) || ships.length !== names.length)
		return null

	const result: Ship[] = []
	const taken = new Set<string>()

	for (const s of ships) {
		if (!s || !names.includes(s.name) || result.some(r => r.name === s.name))
			return null

		if (!isValidCell(s.start) || !isValidCell(s.end))
			return null

		if (s.start.x !== s.end.x && s.start.y !== s.end.y)
			return null

		const size = SHIP_SIZES[s.name as ShipName]
		const cells = getCells(s.start, s.end)
		if (cells.length !== size)
			return null

		for (const c of cells) {
			const key = `${c.x},${c.y}`
			if (taken.has(key))
				return null
			taken.add(key)
		}

		result.push({ name: s.name, start: { x: s.start.x, y: s.start.y }, end: { x: s.end.x, y: s.end.y }, size })
	}

	return result
}
