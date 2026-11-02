import { randomInt } from "node:crypto"
import type { Shot, vect2 } from "../../../events.ts"
import { GRID_SIZE } from "../shipValidation.ts"

const HORIZONTAL: vect2[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }]
const VERTICAL: vect2[] = [{ x: 0, y: 1 }, { x: 0, y: -1 }]
const AXES = [HORIZONTAL, VERTICAL]

function move(cell: vect2, direction: vect2): vect2 {
	return { x: cell.x + direction.x, y: cell.y + direction.y }
}

function isInGrid(cell: vect2): boolean {
	return cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE
}

function findShot(shots: Shot[], cell: vect2): Shot | undefined {
	return shots.find(s => s.coords.x === cell.x && s.coords.y === cell.y)
}

function isFree(shots: Shot[], cell: vect2): boolean {
	return isInGrid(cell) && !findShot(shots, cell)
}

function isHit(shots: Shot[], cell: vect2): boolean {
	return findShot(shots, cell)?.status === "hit"
}

function randomFreeCell(shots: Shot[]): vect2 {
	const freeCells: vect2[] = []

	for (let x = 0; x < GRID_SIZE; x++)
		for (let y = 0; y < GRID_SIZE; y++)
			if (isFree(shots, { x, y }))
				freeCells.push({ x, y })

	return freeCells[randomInt(freeCells.length)]
}

function nextFreeCellAfterHits(shots: Shot[], from: vect2, direction: vect2): vect2 | null {
	let cell = move(from, direction)

	while (isHit(shots, cell))
		cell = move(cell, direction)

	return isFree(shots, cell) ? cell : null
}

function findCellAlongLine(shots: Shot[], hit: vect2): vect2 | null {
	for (const [forward, backward] of AXES) {
		const isLine = isHit(shots, move(hit, forward)) || isHit(shots, move(hit, backward))
		if (!isLine)
			continue

		const ahead = isHit(shots, move(hit, forward)) ? backward : forward
		const behind = ahead === forward ? backward : forward

		const cell = nextFreeCellAfterHits(shots, hit, ahead) ?? nextFreeCellAfterHits(shots, hit, behind)
		if (cell)
			return cell
	}

	return null
}

function findCellAround(shots: Shot[], hit: vect2): vect2 | null {
	const neighbours = [...HORIZONTAL, ...VERTICAL]
		.map(direction => move(hit, direction))
		.filter(cell => isFree(shots, cell))

	return neighbours.length > 0 ? neighbours[randomInt(neighbours.length)] : null
}

export function chooseBotTarget(shots: Shot[]): vect2 {
	const hits = shots.filter(s => s.status === "hit").reverse()

	for (const hit of hits) {
		const cell = findCellAlongLine(shots, hit.coords)
		if (cell)
			return cell
	}

	for (const hit of hits) {
		const cell = findCellAround(shots, hit.coords)
		if (cell)
			return cell
	}

	return randomFreeCell(shots)
}
