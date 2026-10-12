import { useEffect, useState } from "react"
import { IoDiceOutline } from "react-icons/io5"
import { IoMdRefresh } from "react-icons/io"
import { Avatar } from "../../components/Avatar"
import { Grid } from "../../components/Grid"
import { t } from "../../lib/translate"
import type { Matchs, Ship, ShipName, vect2 } from "../../types/events"
import { canPlaceShip, cellFromPoint, getShipCells, getShipRotation, placeShip, randomShips, SHIPS } from "./ships"
import type { shipRotation } from "../../types/types"

export function DeploymentInfos({ match, myId }: {
	match: Matchs,
	myId: string | null | undefined
}) {
	return <div className="bg-base-200 p-4 flex flex-col gap-4 min-h-0 w-72 xl:w-80 shrink-0 overflow-y-auto max-lg:hidden">
		<div className="flex flex-col gap-1">
			<h1 className="text-2xl font-bold">Deploy your fleet</h1>
			<p className="text-sm text-neutral-content/60">Drag each ship onto the grid. Ships can sit side by side. The match starts once both captains are ready.</p>
		</div>

		<div className="bg-neutral/10 border border-neutral/50 p-3 rounded-lg">
			<p className="uppercase text-neutral-content/50 text-xs font-medium font-mono tracking-brand pb-2">{match.players.length > 2 ? "opponents" : "opponent"}</p>
			<div className="flex flex-col gap-2">
				{match.players.filter(p => p.userId !== myId).map(p => (
					<div key={p.userId} className="flex items-center gap-2 min-w-0">
						<Avatar username={p.username} image={p.image} size={32} />
						<div className="flex-1 min-w-0">
							{!p.isBot && <p className="text-xs font-semibold truncate">{p.username}</p>}
							{p.isBot && <p className="text-xs font-semibold truncate text-warning uppercase">bot</p>}
							<p className="text-neutral-content/50 font-mono text-xs">{p.points.toLocaleString()} pts</p>
						</div>
						{p.isReady && <p className="text-info font-mono font-semibold text-xs uppercase">ready</p>}
						{!p.isReady && <p className="text-warning font-mono font-semibold text-xs uppercase flex items-center gap-1"><span className="loading loading-ring loading-xs"></span>placing…</p>}
					</div>
				))}
			</div>
		</div>

		<div className="bg-neutral/10 border border-neutral/50 p-3 rounded-lg flex flex-col gap-2">
			<p className="uppercase text-neutral-content/50 text-xs font-medium font-mono tracking-brand">match</p>
			<MatchInfoItem title="mode" value={t(`txt_${match.type}`)} />
			<MatchInfoItem title="ranked" value={match.isRanked ? t("txt_yes") : t("txt_no")} valueColor={match.isRanked ? "text-info" : ""} />
			<MatchInfoItem title="turn timer" value={`${match.settings.time_turn} s`} />
		</div>
	</div>
}

function MatchInfoItem({ title, value, valueColor = "" }: {
	title: string,
	value: string,
	valueColor?: string
}) {
	return <div className="flex items-center justify-between">
		<p className="text-sm text-neutral-content/60 first-letter:uppercase">{title}</p>
		<p className={`font-mono text-sm font-semibold uppercase ${valueColor}`}>{value}</p>
	</div>
}

export function Deployment({ placedShips, setPlacedShips, draggingShip, setDraggingShip, rotation, setRotation }: {
	placedShips: Ship[],
	setPlacedShips: (ships: Ship[]) => void,
	draggingShip: ShipName | null,
	setDraggingShip: (ship: ShipName | null) => void,
	rotation: shipRotation,
	setRotation: (rotation: shipRotation) => void
}) {
	const [hoverCell, setHoverCell] = useState<vect2 | null>(null)
	const [grabIndex, setGrabIndex] = useState(0)
	const ship = SHIPS.find(s => s.name === draggingShip)
	const previewShip = ship && hoverCell ? placeShip(ship, hoverCell, rotation, grabIndex) : undefined
	const isValid = previewShip ? canPlaceShip(placedShips, previewShip) : false

	useEffect(() => {
		if (!ship)
			return

		function endDrag() {
			setDraggingShip(null)
			setHoverCell(null)
			setGrabIndex(0)
		}

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "r" || e.key === "R")
				setRotation((rotation + 90) % 360 as shipRotation)
		}

		function onPointerMove(e: PointerEvent) {
			setHoverCell(cellFromPoint(e.clientX, e.clientY))
		}

		function onPointerUp(e: PointerEvent) {
			const cell = cellFromPoint(e.clientX, e.clientY)
			if (ship && cell) {
				const placed = placeShip(ship, cell, rotation, grabIndex)
				if (canPlaceShip(placedShips, placed))
					setPlacedShips([...placedShips.filter(s => s.name !== placed.name), placed])
			}
			endDrag()
		}

		window.addEventListener("keydown", onKeyDown)
		window.addEventListener("pointermove", onPointerMove)
		window.addEventListener("pointerup", onPointerUp)
		window.addEventListener("pointercancel", endDrag)
		return () => {
			window.removeEventListener("keydown", onKeyDown)
			window.removeEventListener("pointermove", onPointerMove)
			window.removeEventListener("pointerup", onPointerUp)
			window.removeEventListener("pointercancel", endDrag)
		}
	}, [ship, rotation, grabIndex, placedShips, setPlacedShips, setRotation, setDraggingShip])

	function onPickCell(coords: vect2) {
		const picked = placedShips.find(s => getShipCells(s).some(c => c.x === coords.x && c.y === coords.y))
		if (!picked)
			return
		setRotation(getShipRotation(picked))
		setGrabIndex(getShipCells(picked).findIndex(c => c.x === coords.x && c.y === coords.y))
		setHoverCell(coords)
		setDraggingShip(picked.name)
	}

	return <div className="flex-1 p-6 max-sm:p-4 flex flex-col gap-4 max-lg:gap-3 min-h-0 min-w-0">
		<div className="flex flex-col gap-1 lg:hidden">
			<h1 className="text-xl font-bold">Deploy your fleet</h1>
			<p className="text-sm text-neutral-content/60">Drag ships onto the grid. Ships can sit side by side.</p>
		</div>

		<div className="flex-1 min-h-0 @container-size">
			<div className="w-[min(100cqw,calc(100cqh-2rem))] mx-auto flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<p className="font-mono text-xs uppercase text-info font-semibold tracking-brand">your waters</p>
					<div className="flex items-center gap-2 max-lg:hidden">
						<span className="w-3 h-3 rounded-sm border border-dashed border-info/50 bg-info/10"></span>
						<p className="font-mono text-xs uppercase text-neutral-content/50 font-medium tracking-brand">drop zone</p>
					</div>
					<p className="font-mono text-xs text-neutral-content/50 font-semibold lg:hidden">{placedShips.length} / {SHIPS.length} placed</p>
				</div>
				<Grid className="w-full" hoverable={false} ships={placedShips.filter(s => s.name !== draggingShip)} previewShip={isValid ? previewShip : undefined} dropZone={previewShip ? getShipCells(previewShip) : []} dropValid={isValid} onPickCell={onPickCell} />
			</div>
		</div>

		<div className="flex items-center justify-center flex-wrap gap-2 text-sm text-neutral-content/60 max-lg:hidden">
			<kbd className="kbd kbd-sm">R</kbd>
			<p>rotate while dragging</p>
			<kbd className="kbd kbd-sm">Click</kbd>
			<p>a placed ship to pick it up again</p>
		</div>

		<div className="flex flex-col gap-2 lg:hidden">
			<div className="flex items-center justify-between">
				<p className="font-mono text-xs text-neutral-content/50 font-medium tracking-brand uppercase">dock</p>
				<p className="font-mono text-xs text-neutral-content/50">swipe →</p>
			</div>
			<div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none">
				{SHIPS.map(ship => (
					<DockItem key={ship.name} ship={ship} isPlaced={placedShips.some(s => s.name === ship.name)} isDragging={draggingShip === ship.name} setDraggingShip={setDraggingShip} compact={true} />
				))}
			</div>
		</div>

		<DockActions placedShips={placedShips} setPlacedShips={setPlacedShips} rotation={rotation} setRotation={setRotation} className="lg:hidden" />
	</div>
}

export function DeploymentFooter({ placedShips }: { placedShips: Ship[] }) {
	return <div className="bg-base-200 border-t border-neutral/50 p-4 lg:hidden">
		<ReadyButton placedShips={placedShips} />
	</div>
}

function ReadyButton({ placedShips, className = "" }: {
	placedShips: Ship[],
	className?: string
}) {
	const shipsLeft = SHIPS.length - placedShips.length

	return <div className={`flex flex-col gap-2 ${className}`}>
		<button className="btn btn-info w-full disabled:bg-info/10 disabled:border-info/30 disabled:text-info/60" disabled={shipsLeft > 0}>{shipsLeft > 0 ? `Ready - ${shipsLeft} ship${shipsLeft > 1 ? "s" : ""} left` : "Ready"}</button>
		<p className="text-neutral-content/50 text-xs text-center">Unplaced ships are set at random when time runs out.</p>
	</div>
}

function DockActions({ placedShips, setPlacedShips, rotation, setRotation, className = "" }: {
	placedShips: Ship[],
	setPlacedShips: (ships: Ship[]) => void,
	rotation: shipRotation,
	setRotation: (rotation: shipRotation) => void,
	className?: string
}) {
	return <div className={`flex items-center gap-2 ${className}`}>
		<button className="w-full flex items-center justify-center gap-1 border bg-neutral/10 border-neutral/50 hover:bg-neutral/50 rounded-lg py-2 max-lg:py-3 text-xs font-semibold cursor-pointer outline-none" onClick={() => setRotation((rotation + 90) % 360 as shipRotation)}><IoMdRefresh/>Rotate</button>
		<button className="w-full flex items-center justify-center gap-1 border bg-neutral/10 border-neutral/50 hover:bg-neutral/50 rounded-lg py-2 max-lg:py-3 text-xs font-semibold cursor-pointer outline-none" onClick={() => setPlacedShips(randomShips())}><IoDiceOutline /> Random</button>
		<button className="w-full border bg-neutral/10 border-neutral/50 hover:bg-neutral/50 rounded-lg py-2 max-lg:py-3 text-xs font-semibold cursor-pointer outline-none disabled:opacity-50 disabled:cursor-default disabled:hover:bg-neutral/10" onClick={() => setPlacedShips([])} disabled={placedShips.length < 1}>Clear</button>
	</div>
}

export function Dock({ placedShips, setPlacedShips, draggingShip, setDraggingShip, rotation, setRotation }: {
	placedShips: Ship[],
	setPlacedShips: (ships: Ship[]) => void,
	draggingShip: ShipName | null,
	setDraggingShip: (ship: ShipName | null) => void,
	rotation: shipRotation,
	setRotation: (rotation: shipRotation) => void
}) {
	return <div className="bg-base-200 p-4 flex flex-col min-h-0 w-72 xl:w-80 shrink-0 max-lg:hidden">
		<div className="flex items-center justify-between">
			<p className="font-mono text-xs text-neutral-content/50 font-medium tracking-brand uppercase">dock</p>
			<p className="font-mono text-xs text-neutral-content/50 font-semibold">{placedShips.length} / {SHIPS.length} placed</p>
		</div>

		<div className="flex flex-col gap-2 py-4 min-h-0 overflow-y-auto">
			{SHIPS.map(ship => (
				<DockItem key={ship.name} ship={ship} isPlaced={placedShips.some(s => s.name === ship.name)} isDragging={draggingShip === ship.name} setDraggingShip={setDraggingShip} />
			))}
		</div>

		<DockActions placedShips={placedShips} setPlacedShips={setPlacedShips} rotation={rotation} setRotation={setRotation} />
		<ReadyButton placedShips={placedShips} className="mt-auto pt-4" />
	</div>
}

function DockItem({ ship, isPlaced, isDragging, setDraggingShip, compact = false }: {
	ship: Ship,
	isPlaced: boolean,
	isDragging: boolean,
	setDraggingShip: (ship: ShipName | null) => void,
	compact?: boolean
}) {
	let status = "in dock"
	let statusColor = "text-neutral-content/50"
	let cardColor = "bg-neutral/10 border-neutral/50 hover:bg-neutral/30 cursor-grab"

	if (isDragging) {
		status = "dragging"
		statusColor = "text-info"
		cardColor = "bg-info/10 border-info/50 cursor-grabbing"
	} else if (isPlaced) {
		status = "✓ placed"
		statusColor = "text-info/60"
		cardColor = "bg-neutral/10 border-neutral/50 opacity-50"
	}

	function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
		if (isPlaced)
			return
		e.preventDefault()
		setDraggingShip(ship.name)
	}

	if (compact)
		return <div className={`${cardColor} border rounded-lg p-3 flex flex-col items-center gap-2 shrink-0 w-[calc((100%-1rem)/3)] snap-start select-none touch-pan-x`} onPointerDown={onPointerDown}>
			<div className="h-8 w-full flex items-center justify-center">
				<img src={ship.image} alt={ship.name} draggable={false} className="h-4 max-w-full object-contain" />
			</div>
			<div className="flex flex-col items-center min-w-0 w-full">
				<p className="text-sm font-semibold first-letter:uppercase truncate">{ship.name}</p>
				<p className={`${isDragging || isPlaced ? statusColor : "text-neutral-content/50"} font-mono text-xs uppercase truncate`}>{isDragging || isPlaced ? status : `${ship.size} cells`}</p>
			</div>
		</div>

	return <div className={`${cardColor} border rounded-lg p-3 flex items-center gap-3 select-none touch-none`} onPointerDown={onPointerDown}>
		<div className="w-24 shrink-0 flex items-center">
			<img src={ship.image} alt={ship.name} draggable={false} className="h-6 object-contain object-left w-full" />
		</div>
		<div className="flex-1 min-w-0">
			<p className="text-sm font-semibold first-letter:uppercase truncate">{ship.name}</p>
			<p className="text-neutral-content/50 font-mono text-xs">{ship.size} cells</p>
		</div>
		<p className={`${statusColor} font-mono font-semibold text-xs uppercase shrink-0`}>{status}</p>
	</div>
}