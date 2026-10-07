import { IoDiceOutline, IoRefreshOutline } from "react-icons/io5"
import { Avatar } from "../../components/Avatar"
import type { Matchs, Ship, shipName } from "../../types/events"
import { SHIPS } from "./ships"

export function Dock({ match, myId, placedShips, draggingShip, setDraggingShip, onRotate, onRandom, onClear }: {
	match: Matchs,
	myId: string | null | undefined,
	placedShips: shipName[],
	draggingShip: shipName | null,
	setDraggingShip: (ship: shipName | null) => void,
	onRotate: () => void,
	onRandom: () => void,
	onClear: () => void
}) {
	const shipsLeft = SHIPS.length - placedShips.length

	return <div className="bg-base-200 p-4 flex flex-col min-h-0 w-72 xl:w-80 shrink-0 ml-auto max-lg:hidden">
		<div className="flex items-center justify-between">
			<p className="font-mono text-xs text-neutral-content/50 font-medium tracking-brand uppercase">dock</p>
			<p className="font-mono text-xs text-neutral-content/50 font-semibold">{placedShips.length} / {SHIPS.length} placed</p>
		</div>

		<div className="flex flex-col gap-2 py-4 min-h-0 overflow-y-auto">
			{SHIPS.map(ship => (
				<DockItem key={ship.name} ship={ship} isPlaced={placedShips.includes(ship.name)} isDragging={draggingShip === ship.name} setDraggingShip={setDraggingShip} />
			))}
		</div>

		<div className="flex items-center gap-2">
			<button className="w-full flex items-center justify-center gap-1 border bg-neutral/10 border-neutral/50 hover:bg-neutral/50 rounded-lg py-2 text-xs font-semibold cursor-pointer outline-none" onClick={onRotate}><IoRefreshOutline /> Rotate</button>
			<button className="w-full flex items-center justify-center gap-1 border bg-neutral/10 border-neutral/50 hover:bg-neutral/50 rounded-lg py-2 text-xs font-semibold cursor-pointer outline-none" onClick={onRandom}><IoDiceOutline /> Random</button>
			<button className="w-full border bg-neutral/10 border-neutral/50 hover:bg-neutral/50 rounded-lg py-2 text-xs font-semibold cursor-pointer outline-none disabled:opacity-50 disabled:cursor-default disabled:hover:bg-neutral/10" onClick={onClear} disabled={placedShips.length < 1}>Clear</button>
		</div>

		<div className="bg-neutral/10 border border-neutral/50 p-2 rounded-md mt-4">
			<p className="uppercase text-neutral-content/50 text-xs font-medium font-mono pb-2">{match.players.length > 2 ? "opponents" : "opponent"}</p>
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
						{!p.isReady && <p className="text-warning font-mono font-semibold text-xs uppercase flex items-center gap-1"><span className="badge badge-warning badge-xs"></span>placing…</p>}
					</div>
				))}
			</div>
		</div>

		<div className="mt-auto pt-4 flex flex-col gap-2">
			<button className="btn btn-info w-full" disabled={shipsLeft > 0}>{shipsLeft > 0 ? `Ready — ${shipsLeft} ship${shipsLeft > 1 ? "s" : ""} left` : "Ready"}</button>
			<p className="text-neutral-content/50 text-xs text-center">When the timer runs out, remaining ships are placed at random.</p>
		</div>
	</div>
}

function DockItem({ ship, isPlaced, isDragging, setDraggingShip }: {
	ship: Ship,
	isPlaced: boolean,
	isDragging: boolean,
	setDraggingShip: (ship: shipName | null) => void
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

	function onDragStart(e: React.DragEvent<HTMLDivElement>) {
		e.dataTransfer.setData("text/plain", ship.name)
		e.dataTransfer.effectAllowed = "move"
		const img = e.currentTarget.querySelector("img")
		if (img)
			e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2)
		setDraggingShip(ship.name)
	}

	return <div className={`${cardColor} border rounded-lg p-3 flex items-center gap-3 select-none`} draggable={!isPlaced} onDragStart={onDragStart} onDragEnd={() => setDraggingShip(null)}>
		<div className="w-24 shrink-0 flex items-center">
			<img src={ship.image} alt={ship.name} draggable={false} className="h-6 object-contain object-left" style={{ width: `${ship.size / 5 * 100}%` }} />
		</div>
		<div className="flex-1 min-w-0">
			<p className="text-sm font-semibold first-letter:uppercase truncate">{ship.name}</p>
			<p className="text-neutral-content/50 font-mono text-xs">{ship.size} cells</p>
		</div>
		<p className={`${statusColor} font-mono font-semibold text-xs uppercase shrink-0`}>{status}</p>
	</div>
}