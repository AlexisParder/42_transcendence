import type { Ship, vect2 } from "../types/events"

export function isOnShip(ship: Ship, c: vect2): boolean {
	const minX = Math.min(ship.start.x, ship.end.x)
	const maxX = Math.max(ship.start.x, ship.end.x)
	const minY = Math.min(ship.start.y, ship.end.y)
	const maxY = Math.max(ship.start.y, ship.end.y)

	return c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY
}