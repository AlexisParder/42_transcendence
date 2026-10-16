import { IoFlagOutline } from "react-icons/io5"
import { Avatar } from "../../components/Avatar"
import { Grid } from "../../components/Grid"
import { t } from "../../lib/translate"
import type { Log, Matchs, matchType, vect2 } from "../../types/events"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import { formatMS } from "../../lib/formatTime"
import { ordinal } from "../../lib/ordinal"

export function MatchHeader({ type, title, description, remaining, isMyTurn, openForfeitModal }: {
	type?: matchType
	title: string
	description: string,
	remaining: number,
	isMyTurn: boolean,
	openForfeitModal: () => void
}) {
	return <div className="flex items-center justify-between bg-base-200 py-4 px-6">
		<div className="flex items-center max-sm:gap-2 gap-4">
			<h2 className="uppercase text-sm font-bold tracking-brand max-sm:hidden">sonar</h2>
			{type && <p className="bg-info rounded-md text-info-content font-semibold text-xs px-2 py-0.5">{t(`txt_${type}`)}</p>}
			<p className="text-xs uppercase tracking-brand font-medium text-neutral-content/50">{title}</p>
		</div>
		<div className="flex items-center max-sm:gap-2 gap-4">
			{isMyTurn && <p className="first-letter:uppercase text-info text-xs font-semibold">{description}</p>}
			<p className="font-mono text-sm text-info font-semibold border border-info rounded-full px-2 py-1 text-center">{formatMS(remaining)}</p>
			<button onClick={openForfeitModal} className="text-xs text-neutral-content/50 hover:text-error first-letter:uppercase cursor-pointer max-sm:hidden outline-none">{t("match_forfeit")}</button>
			<button onClick={openForfeitModal} className="text-xs text-neutral-content/50 hover:text-error first-letter:uppercase cursor-pointer sm:hidden outline-none"><IoFlagOutline /></button>
		</div>
	</div>
}

export function GameStats({ match, myId, selectedTarget, setSelectedTarget }: {
	match: Matchs,
	myId: string | null | undefined,
	selectedTarget: number,
	setSelectedTarget: (team: number) => void
}) {
	return <div className="bg-base-200 p-4 flex flex-col justify-between max-w-60 max-sm:hidden">
		<div className="flex flex-col gap-10">
			<div className="flex flex-col gap-2">
				<p className="uppercase text-neutral-content/50 text-xs font-medium font-mono">{t("match_turn_order")}</p>

				<div className="flex flex-col gap-2">
					{match.type === "TWO_V_TWO" && <p className="uppercase text-neutral-content/50 text-xs font-medium font-mono">{t("match_your_team")}</p>}
					{match.type === "TWO_V_TWO" && match.turns.turnOrder
						.map(id => match.players.find(p => p.userId === id && p.team === 1))
						.filter(Boolean)
						.map(p => (
							<OrderItem key={p?.userId} username={p?.username} image={p?.image} points={p?.points ?? 0} isTurn={p?.userId === match.turns.userTurn} isMine={p?.userId === myId} teamNumber={p?.team ?? 0} isBot={p?.isBot} matchType={match.type} match={match} placement={p?.placement ?? 0} hasLeft={p?.status === "LEFT"} />
						))}

					{match.type === "TWO_V_TWO" && <p className="uppercase text-neutral-content/50 text-xs font-medium font-mono pt-2">{t("match_enemy_team")}</p>}

					{match.type === "TWO_V_TWO" && match.turns.turnOrder
						.map(id => match.players.find(p => p.userId === id && p.team === 2))
						.filter(Boolean)
						.map(p => (
							<OrderItem key={p?.userId} username={p?.username} image={p?.image} points={p?.points ?? 0} isTurn={p?.userId === match.turns.userTurn} isMine={p?.userId === myId} teamNumber={p?.team ?? 0} isBot={p?.isBot} matchType={match.type} match={match} placement={p?.placement ?? 0} hasLeft={p?.status === "LEFT"} />
						))}

					{match.type !== "TWO_V_TWO" && match.turns.turnOrder
						.map(id => match.players.find(p => p.userId === id))
						.filter(Boolean)
						.map(p => (
							<OrderItem key={p?.userId} username={p?.username} image={p?.image} points={p?.points ?? 0} isTurn={p?.userId === match.turns.userTurn} isMine={p?.userId === myId} teamNumber={p?.team ?? 0} isBot={p?.isBot} matchType={match.type} match={match} placement={p?.placement ?? 0} hasLeft={p?.status === "LEFT"} />
						))}
				</div>
			</div>

			{match.type === "FOUR_FFA" && <div className="bg-neutral/10 border border-neutral/50 p-2 rounded-md">
				<p className="uppercase text-neutral-content/50 text-xs font-medium font-mono pb-2">{t("match_target")}</p>
				<div className="flex flex-col gap-2">
					{match.players.filter(p => p.userId !== myId).map(p => (
						<button key={p.userId} className={`${selectedTarget === p.team ? "bg-warning/10 border border-warning/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} rounded-md  p-1 text-xs font-semibold cursor-pointer truncate`} onClick={() => setSelectedTarget(p.team ?? 0)}>{p.username}</button>
					))}
				</div>
				<p className="text-neutral-content/50 text-xs pt-1">{t("match_target_desc")}</p>
			</div>}
		</div>
	</div>
}

function OrderItem({ username, image, points, isTurn, isMine, teamNumber, matchType, maxFleet = 5, isBot = false, match, placement, hasLeft }: {
	username: string | null | undefined,
	image: string | null | undefined,
	points: number,
	isTurn: boolean,
	isMine: boolean,
	teamNumber: number,
	matchType: matchType,
	maxFleet?: number,
	isBot?: boolean,
	match: Matchs,
	placement: number,
	hasLeft: boolean
}) {
	const targetTeamData = match.teams.find(t => t.id === teamNumber)
	const sunkShip = [
		...new Map(
			(targetTeamData?.shots ?? [])
				.filter(s => s.ship !== null)
				.map(s => [s.ship!.name, s.ship!])
		).values()
	]

	const currFleet = maxFleet - sunkShip.length

	if ((isTurn && currFleet < 1) || (isTurn && match.endedAt !== 0))
		isTurn = false

	let fleetColor = "text-neutral-content"
	const fleetPercent = currFleet / maxFleet
	if (fleetPercent < 0.25)
		fleetColor = "text-error"
	else if (fleetPercent < 0.75)
		fleetColor = "text-warning"

	const dividerColor = [
		"divider-primary",
		`${matchType === "TWO_V_TWO" ? "divider-error" : "divider-secondary"}`,
		"divider-accent",
		"divider-warning",
		"divider-error",
	] as const

	return <div className={`${isTurn ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50"} ${(currFleet < 1 || hasLeft) ? "opacity-50" : ""} rounded-lg p-2 flex min-w-0 max-sm:flex-1`}>
		<div className="flex flex-1 items-center gap-1 min-w-0">
			<div className={`divider divider-horizontal ${dividerColor[teamNumber - 1]} m-0`}></div>
			<div className="max-sm:hidden flex items-center">
				<Avatar username={username} image={image} size={32} />
			</div>
			<div className="pl-1 flex-1 min-w-0">
				<div className="flex items-center justify-between gap-2">
					{!isBot && <p className={`text-xs font-semibold truncate ${isMine ? "text-info" : ""}`}>{username} {isMine && <span className="max-sm:hidden">({t("match_you")})</span>}</p>}
					{isBot && <p className="text-xs font-semibold truncate text-warning uppercase">{t("match_bot")}</p>}
					{currFleet > 0 && !hasLeft && <p className={`text-xs font-mono font-semibold max-sm:hidden ${fleetColor}`}>{currFleet}/{maxFleet}</p>}
				</div>
				{currFleet > 0 && <p className={`text-xs font-mono font-semibold sm:hidden ${fleetColor}`}>{currFleet}/{maxFleet}</p>}
				{isTurn && match.endedAt === 0 && <p className="text-info uppercase font-mono text-xs max-sm:hidden">{t("match_taking_aim")}</p>}
				{!isTurn && !isBot && match.endedAt === 0 && !hasLeft && currFleet > 0 && <p className="text-neutral-content/50 font-mono text-xs max-sm:hidden">{t("match_pts_waiting", { pts: points.toLocaleString() })}</p>}
				{!isTurn && currFleet > 0 && hasLeft && <p className="text-warning font-mono text-xs first-letter:uppercase max-sm:hidden">{t("match_player_left")}</p>}
				{currFleet < 1 && <p className="text-neutral-content/50 font-mono text-xs truncate">{t("match_flunk_place", { place: ordinal(placement) })}</p>}
				{currFleet > 0 && match.endedAt !== 0 && <p className="text-neutral-content/50 font-mono text-xs truncate">{t("match_end_place", { place: ordinal(placement) })}</p>}
			</div>
		</div>
	</div>
}

export function Game({ match, myId, selectedTarget, setSelectedTarget, waterView, setWaterView, targetLocked, setTargetLocked, handleFire }: {
	match: Matchs,
	myId: string | null | undefined,
	selectedTarget: number,
	setSelectedTarget: (team: number) => void,
	waterView: "attack" | "my waters",
	setWaterView: (view: "attack" | "my waters") => void,
	targetLocked: vect2,
	setTargetLocked: (coords: vect2) => void,
	handleFire: () => void

}) {
	const isDesktop = useMediaQuery("(min-width: 64rem)")
	const view = isDesktop ? "attack" : waterView
	const target = match.players.find(p => p.team === selectedTarget)
	const targetTeamData = match.teams.find(t => t.id === selectedTarget)
	const myTeam = match.players.find(p => p.userId === myId)?.team
	const myTeamData = match.teams.find(t => t.id === myTeam)
	const rowName = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

	const sunkShip = [
		...new Map(
			(targetTeamData?.shots ?? [])
				.filter(s => s.ship !== null)
				.map(s => [s.ship!.name, s.ship!])
		).values()
	]

	const ships = view === "my waters" ? myTeamData?.ships : sunkShip
	const shots = view === "my waters" ? myTeamData?.shots : targetTeamData?.shots

	return <div className="flex-1 p-4 flex flex-col min-h-0 min-w-0 w-full">
		<div className="shrink-0">
			<div className="flex items-center gap-2 sm:hidden">
				<div className="flex w-full min-w-0 gap-2 items-center justify-center">
					{match.type === "TWO_V_TWO" && match.turns.turnOrder
						.map(id => match.players.find(p => p.userId === id && p.team === 1))
						.filter(Boolean)
						.map(p => (
							<OrderItem key={p?.userId} username={p?.username} image={p?.image} points={p?.points ?? 0} isTurn={p?.userId === match.turns.userTurn} isMine={p?.userId === myId} teamNumber={p?.team ?? 0} isBot={p?.isBot} matchType={match.type} match={match} placement={p?.placement ?? 0} hasLeft={p?.status === "LEFT"} />
						))}

					{match.type === "TWO_V_TWO" && <p className="text-neutral-content/50 font-mono uppercase text-xs font-semibold">{t("match_vs")}</p>}

					{match.type === "TWO_V_TWO" && match.turns.turnOrder
						.map(id => match.players.find(p => p.userId === id && p.team === 2))
						.filter(Boolean)
						.map(p => (
							<OrderItem key={p?.userId} username={p?.username} image={p?.image} points={p?.points ?? 0} isTurn={p?.userId === match.turns.userTurn} isMine={p?.userId === myId} teamNumber={p?.team ?? 0} isBot={p?.isBot} matchType={match.type} match={match} placement={p?.placement ?? 0} hasLeft={p?.status === "LEFT"} />
						))}

					{match.type !== "TWO_V_TWO" && match.turns.turnOrder
						.map(id => match.players.find(p => p.userId === id))
						.filter(Boolean)
						.map(p => (
							<OrderItem key={p?.userId} username={p?.username} image={p?.image} points={p?.points ?? 0} isTurn={p?.userId === match.turns.userTurn} isMine={p?.userId === myId} teamNumber={p?.team ?? 0} isBot={p?.isBot} matchType={match.type} match={match} placement={p?.placement ?? 0} hasLeft={p?.status === "LEFT"} />
						))}
				</div>
			</div>

			{match.type === "FOUR_FFA" && <div className="bg-neutral/10 border border-neutral/50 p-2 mt-1.5 rounded-md sm:hidden">
				<p className="uppercase text-neutral-content/50 text-xs font-medium font-mono pb-1 text-center">{t("match_target")}</p>
				<div className="flex gap-1 items-center">
					{match.players.filter(p => p.userId !== myId).map(p => (
						<button key={p.userId} className={`${selectedTarget === p.team ? "bg-warning/10 border border-warning/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"} rounded-md  p-1 text-xs font-semibold cursor-pointer truncate w-full`} onClick={() => {
							setSelectedTarget(p.team ?? 0)
							setTargetLocked({ x: -1, y: -1 })
						}}>{p.username}</button>
					))}
				</div>
			</div>}

			<div className="flex items-center gap-2 py-2 lg:hidden">
				<button className={`w-full border ${waterView === "attack" ? "bg-info/10 border-info/50" : "bg-neutral/10 border-neutral/50 hover:bg-neutral/50"} rounded-lg py-2 text-xs font-semibold cursor-pointer outline-none`} onClick={() => {
					setWaterView("attack")
					setTargetLocked({ x: -1, y: -1 })
				}}>{t("match_btn_attack")}</button>
				<button className={`w-full border ${waterView === "my waters" ? "bg-info/10 border-info/50" : "bg-neutral/10 border-neutral/50 hover:bg-neutral/50"} rounded-lg py-2 text-xs font-semibold cursor-pointer outline-none`} onClick={() => {
					setWaterView("my waters")
					setTargetLocked({ x: -1, y: -1 })
				}}>{t("match_btn_my_waters")}</button>
			</div>

			{waterView === "attack" && <p className="text-xs uppercase text-info font-medium tracking-brand text-center lg:hidden">{match.type === "TWO_V_TWO" ? t("match_enemy_team_waters") : t("match_player_waters", { name: target?.username ?? "?" })}</p>}

			{waterView === "my waters" && <p className="text-xs uppercase text-info font-medium tracking-brand text-center lg:hidden">{match.type === "TWO_V_TWO" ? t("match_your_team_waters") : t("match_your_waters")}</p>}
		</div>

		<div className="flex-1 min-h-0 flex items-center justify-center @container-size py-2">
			<Grid className="aspect-square w-[min(100cqw,100cqh)]" hoverable={view !== "my waters"} ships={ships} shots={shots} targetLocked={view === "my waters" ? { x: -1, y: -1 } : targetLocked} setTargetLocked={view === "my waters" ? undefined : setTargetLocked} />
		</div>

		<div className="shrink-0 h-28 flex flex-col gap-2 overflow-y-auto lg:hidden outline-none">
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

		<div className="shrink-0 bg-info/10 border border-info/50 rounded-lg p-2 flex items-center justify-between mt-4 max-sm:mt-2">
			{targetLocked.x >= 0 && targetLocked.y >= 0 && <p className="first-letter:uppercase text-neutral-content/60 font-medium text-xs">{t("match_target_locked")} <span className="text-info">{rowName[targetLocked.y]}{targetLocked.x + 1}</span> {match.type === "FOUR_FFA" && <span className="font-bold">({target?.username ?? "?"})</span>}</p>}

			{targetLocked.x < 0 && targetLocked.y < 0 && <p className="first-letter:uppercase text-neutral-content/60 font-medium text-xs">{t("match_no_target")}</p>}

			<button className="btn btn-info px-6 max-sm:px-4 max-sm:btn-sm" disabled={(targetLocked.x < 0 && targetLocked.y < 0) || match.turns.userTurn !== myId || match.endedAt !== 0} onClick={handleFire}>{t("match_btn_fire")}</button>
		</div>
	</div>
}

export function GameInfos({ match, myId }: {
	match: Matchs,
	myId: string | null | undefined,
}) {
	const myTeam = match.players.find(p => p.userId === myId)?.team
	const myTeamData = match.teams.find(t => t.id === myTeam)

	return <div className="bg-base-200 p-4 flex flex-col min-h-0 w-72 xl:w-80 shrink-0 max-lg:hidden">
		<p className="font-mono text-xs text-neutral-content/50 font-medium tracking-brand uppercase">{match.type === "TWO_V_TWO" ? t("match_your_team_waters") : t("match_your_waters")}</p>
		<Grid className="w-full bg-abyss-900 my-2" hoverable={false} ships={myTeamData?.ships} shots={myTeamData?.shots} />
		<div className="flex items-center gap-4 pb-4">
			<FleetColorIndicator title={t("match_intact")} badge="badge-neutral" />
			<FleetColorIndicator title={t("match_hit")} badge="badge-warning" />
			<FleetColorIndicator title={t("match_sunk")} badge="badge-error" />
		</div>


		<div className="flex">
			<button className="btn text-info text-xs font-semibold border-b-info rounded-none outline-none">{t("match_log")}</button>
			{match.type === "TWO_V_TWO" && <button className="btn text-info text-xs font-semibold outline-none">{t("match_team_chat")} <span className="bg-warning rounded-full w-5 h-5 flex items-center justify-center text-info-content font-mono">2</span></button>}
		</div>
		<div className="divider m-0"></div>

		<div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto outline-none">
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