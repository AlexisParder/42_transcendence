import { Avatar } from "../../components/Avatar"
import { Grid } from "../../components/Grid"
import type { Log } from "../../types/events"

export function MatchHeader({mode, title, description}: {
	mode?: string
	title: string
	description: string
}) {
	return <div className="flex items-center justify-between bg-base-200 py-4 px-6">
		<div className="flex items-center gap-4">
			<h2 className="uppercase text-sm font-bold tracking-brand">sonar</h2>
			{mode && <p className="bg-info rounded-md text-info-content font-semibold text-xs px-2 py-0.5">{mode}</p>}
			<p className="text-xs uppercase tracking-brand font-medium text-neutral-content/50">{title}</p>
		</div>
		<div className="flex items-center gap-4">
			<p className="first-letter:uppercase text-info text-xs font-semibold">{description}</p>
			<p className="font-mono text-sm text-info font-semibold border brder-info rounded-full px-2 py-1 text-center">0:03</p>
			<button className="text-xs text-neutral-content/50 hover:text-error first-letter:uppercase cursor-pointer">forfeit</button>
		</div>
	</div>
}

// Left Side
export function LeftSide() {
	return <div className="bg-base-200 p-4 flex flex-col justify-between">
		<div className="flex flex-col gap-2">
			<p className="uppercase text-neutral-content/50 text-xs font-medium font-mono">turn order</p>
			<OrderItem username={"alexis"} image={``} points={1284} isTurn={true} isMine={true} colorTeam="primary" currFleet={4} />
			<OrderItem username={"tom"} image={``} points={1402} isTurn={false} isMine={false} colorTeam="secondary" currFleet={2} />
			<OrderItem username={"gael"} image={``} points={1054} isTurn={false} isMine={false} colorTeam="accent" currFleet={3} />
			<OrderItem username={"bob"} image={``} points={-78} isTurn={false} isMine={false} colorTeam="warning" currFleet={1} />
		</div>
		<div className="bg-neutral/10 border border-neutral/50 p-2 rounded-md">
			<p className="uppercase text-neutral-content/50 text-xs font-medium font-mono">your fleet</p>
			<FleetStatItem title="carrier" leftBox={5} totalBox={5} />
			<FleetStatItem title="cruiser" leftBox={2} totalBox={4} />
			<FleetStatItem title="destroyer" leftBox={3} totalBox={3} />
			<FleetStatItem title="frigate" leftBox={3} totalBox={3} />
			<FleetStatItem title="submarine" leftBox={0} totalBox={2} />
		</div>
	</div>
}

function FleetStatItem({ title, leftBox, totalBox }: {
	title: string
	leftBox: number,
	totalBox: number
}) {
	let fleetColor = "text-info"
	const fleetPercent = leftBox / totalBox
	if (fleetPercent < 0.25)
		fleetColor = "text-error"
	else if (fleetPercent < 0.75)
		fleetColor = "text-warning"

	return <div className={`flex justify-between items-center p-0.5 ${leftBox < 1 ? "opacity-50" : ""}`}>
		<p className="text-xs font-medium first-letter:uppercase">{title}</p>
		{leftBox > 0 && <p className={`text-xs font-mono font-medium ${fleetColor}`}>{leftBox}/{totalBox}</p>}
		{leftBox < 1 && <p className="text-xs font-mono font-medium text-error uppercase">sunk</p>}
	</div>
}

function OrderItem({ username, image, points, isTurn, isMine, colorTeam, currFleet, maxFleet = 5 }: {
	username: string | null | undefined,
	image: string | null | undefined,
	points: number,
	isTurn: boolean,
	isMine: boolean,
	colorTeam: "primary" | "secondary" | "accent" | "warning",
	currFleet: number
	maxFleet?: number
}) {
	let fleetColor = "text-neutral-content"
	const fleetPercent = currFleet / maxFleet
	if (fleetPercent < 0.25)
		fleetColor = "text-error"
	else if (fleetPercent < 0.75)
		fleetColor = "text-warning"

	let dividerColor = "divider-primary"
	if (colorTeam == "secondary") {
		dividerColor = "divider-secondary"
	} else if (colorTeam == "accent") {
		dividerColor = "divider-accent"
	} else if (colorTeam == "warning") {
		dividerColor = "divider-warning"
	}

	return <div className={`${isTurn ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50"} rounded-lg p-2 flex`}>
		<div className="flex flex-1 items-center gap-1 min-w-0">
			<div className={`divider divider-horizontal ${dividerColor} m-0`}></div>
			<Avatar username={username} image={image} size={32} />
			<div className="pl-1 flex-1 min-w-0">
				<div className="flex items-center justify-between">
					<p className="text-xs font-semibold">{username} {isMine && <span>(you)</span>}</p>
					<p className={`text-xs font-mono font-semibold ${fleetColor}`}>{currFleet}/{maxFleet}</p>
				</div>
				{isTurn && <p className="text-info uppercase font-mono text-xs">taking aim</p>}
				{!isTurn && <p className="text-neutral-content/50 font-mono text-xs">{points.toLocaleString()} pts, waiting</p>}
			</div>
		</div>
	</div>
}

// Center Side
export function CenterSide() {
	return <div className="flex-1 py-4 px-6">
		<div className="flex items-center justify-between">
			<p className="text-xs uppercase text-info font-medium tracking-brand">tom's waters, fire</p>
			<p className="text-xs uppercase text-neutral-content/50">wrecks revealed when a ship sinks</p>
		</div>

		<div className="px-6 py-2">
			<Grid />
		</div>

		<div className="flex items-center justify-between">

		</div>
	</div>
}

// Right Side
export function RightSide() {
	return <div className="bg-base-200 p-4 flex flex-col min-h-0">
		<p className="font-mono text-xs text-neutral-content/50 font-medium tracking-brand uppercase">your water</p>
		<Grid />
		<div className="flex items-center gap-4 pb-4">
			<FleetColorIndicator title="intact" badge="badge-neutral" />
			<FleetColorIndicator title="hit" badge="badge-warning" />
			<FleetColorIndicator title="sunk" badge="badge-error" />
		</div>

		<p className="text-info first-letter:uppercase text-xs font-semibold">log</p>
		<div className="divider m-0"></div>

		<div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
			<LogItem log={{ text: "you sink bob's destroyer", type: "info" }} />
			<LogItem log={{ text: "tom fires at gael on H11, miss", type: "neutral" }} />
			<LogItem log={{ text: "bob left, bot took over", type: "warning" }} />
			<LogItem log={{ text: "you sink bob's destroyer", type: "info" }} />
			<LogItem log={{ text: "tom fires at gael on H11, miss", type: "neutral" }} />
			<LogItem log={{ text: "bob left, bot took over", type: "warning" }} />
			<LogItem log={{ text: "you sink bob's destroyer", type: "info" }} />
			<LogItem log={{ text: "tom fires at gael on H11, miss", type: "neutral" }} />
			<LogItem log={{ text: "bob left, bot took over", type: "warning" }} />
			<LogItem log={{ text: "you sink bob's destroyer", type: "info" }} />
			<LogItem log={{ text: "tom fires at gael on H11, miss", type: "neutral" }} />
			<LogItem log={{ text: "bob left, bot took over", type: "warning" }} />
			<LogItem log={{ text: "you sink bob's destroyer", type: "info" }} />
			<LogItem log={{ text: "tom fires at gael on H11, miss", type: "neutral" }} />
			<LogItem log={{ text: "bob left, bot took over", type: "warning" }} />
			<LogItem log={{ text: "you sink bob's destroyer", type: "info" }} />
			<LogItem log={{ text: "tom fires at gael on H11, miss", type: "neutral" }} />
			<LogItem log={{ text: "bob left, bot took over", type: "warning" }} />
			<LogItem log={{ text: "you sink bob's destroyer", type: "info" }} />
			<LogItem log={{ text: "tom fires at gael on H11, miss", type: "neutral" }} />
			<LogItem log={{ text: "bob left, bot took over", type: "warning" }} />
			<LogItem log={{ text: "you sink bob's destroyer", type: "info" }} />
			<LogItem log={{ text: "tom fires at gael on H11, miss", type: "neutral" }} />
			<LogItem log={{ text: "bob left, bot took over", type: "warning" }} />
			<LogItem log={{ text: "you sink bob's destroyer", type: "info" }} />
			<LogItem log={{ text: "tom fires at gael on H11, miss", type: "neutral" }} />
			<LogItem log={{ text: "bob left, bot took over", type: "warning" }} />
		</div>
	</div>
}

function FleetColorIndicator({ title, badge }: {
	title: string,
	badge: "badge-neutral" | "badge-warning" | "badge-error"
}) {
	return <div className="flex items-center gap-1">
		<span
			className={`indicator-item indicator-middle indicator-start badge ${badge} badge-xs`}
		></span>
		<div className="uppercase text-xs text-neutral-content/50 font-medium">{title}</div>
	</div>
}

function LogItem({ log }: { log: Log }) {
	let textColor = "text-info"
	let bgColor = "bg-info/10"

	if (log.type === "warning") {
		textColor = "text-warning"
		bgColor = "bg-warning/10"
	} else if (log.type === "neutral") {
		textColor = "text-neutral-content/50"
		bgColor = "bg-neutral/10"
	}

	return <div className={`p-2 ${bgColor} rounded-md`}>
		<p className={`text-xs font-mono first-letter:uppercase ${textColor}`}>{log.text}</p>
	</div>
}