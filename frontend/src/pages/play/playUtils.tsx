import { BiCheck } from "react-icons/bi"
import { IoWarning, IoInformation } from "react-icons/io5"
import { RxCross1 } from "react-icons/rx"
import { TbPointFilled } from "react-icons/tb"
import { Avatar } from "../../components/Avatar"
import { t } from "../../lib/translate"
import type { Matchs, Friend, PresenceStatus, Rules, matchType } from "../../types/events"

export function MatchTypeBtn({ selected, title, subtitle, onClick }: {
	selected: boolean,
	title: string,
	subtitle: string,
	onClick: () => void
}) {
	return <button className={`cursor-pointer rounded-md p-4 text-left ${selected ? "bg-info/10 border border-info/50" : "bg-neutral/10 border border-neutral/50 hover:bg-neutral/50"}`} onClick={onClick}>
		<p className="text-sm font-semibold first-letter:uppercase">{title}</p>
		<p className="text-xs text-neutral-content/50">{subtitle}</p>
	</button>
}

export function WaitingRoom({ isHost, myId, joinedMatch, friends, presence, MatchErr, handleDeleteMatch, handleLeaveMatch, handleStatus, handleStart, handleKick, handleInvite }: {
	isHost: boolean,
	myId: string | undefined,
	joinedMatch: Matchs | undefined,
	friends: Friend[],
	presence: Record<string, PresenceStatus>,
	MatchErr?: string,
	handleDeleteMatch: () => void,
	handleLeaveMatch: () => void,
	handleStatus: () => void,
	handleStart: () => void,
	handleKick: (id: string) => void,
	handleInvite: (targetId: string) => void
}) {
	if (!joinedMatch)
		return

	const hostname = joinedMatch.players.find(p => p.isHost)?.username
	const missing = joinedMatch.maxPlayers - joinedMatch.players.length
	const allReady = missing === 0 && joinedMatch.players.every(p => p.isReady)
	const me = joinedMatch.players.find(p => p.userId === myId)
	const rules: Rules = {
		format: joinedMatch.type,
		timeTurn: joinedMatch.settings.time_turn,
		replace: joinedMatch.settings.replace,
		spectators: joinedMatch.settings.spectators,
		ranked: joinedMatch.isRanked
	}

	return <div className="flex flex-col h-full min-h-0">
		<div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 flex flex-col gap-4">
			<div className="flex items-start justify-between gap-4">
				<div className="min-h-0">
					<p className="flex items-center gap-1 uppercase text-info font-mono text-xs tracking-brand">{t("play_waiting_room")} <TbPointFilled className="size-1" /> {t(`play_${joinedMatch.visibility}`)}</p>
					<h1 className="text-2xl font-bold truncate">{t("play_room_name", { name: hostname ?? "?" })}</h1>
					<p className="text-xs text-neutral-content/50 max-lg:hidden first-letter:uppercase">
						{isHost ? `${t("play_room_host_desc")}.` : `${t("play_room_guest_desc")}.`}
					</p>
				</div>
				<div className="text-right shrink-0">
					<p className={`font-mono text-2xl font-bold ${missing === 0 ? "text-info" : ""}`}>{joinedMatch.players.length} / {joinedMatch.maxPlayers}</p>
					<p className="text-xs text-neutral-content/50 max-lg:hidden">{t("play_players")}</p>
				</div>
			</div>

			<div className="lg:hidden">
				<CodeBox code={joinedMatch.code} />
			</div>

			<div className="flex flex-col gap-2">
				<p className="lg:hidden uppercase text-xs text-neutral-content/50 font-mono">{t("play_players")}</p>
				<div className="flex flex-col gap-2 lg:grid lg:grid-cols-4 lg:gap-3">
					{joinedMatch.players.map(p => (
						<PlayerItem key={p.userId} username={p.username} image={p.image} points={p.points} isReady={p.isReady} isMine={p.userId === myId} isHost={p.isHost} canKick={isHost && !p.isHost && !p.isBot} team={p.team} isDuo={joinedMatch.type === "TWO_V_TWO"} handleKick={handleKick} userId={p.userId ?? ""} />
					))}
					{Array.from({ length: missing }).map((_, i) => <WaitingPlayerItem key={`empty_${i}`} />)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				<RulesPanel rules={rules} />
				<div className="max-lg:hidden">
					<InvitePanel code={joinedMatch.code} friends={friends} presence={presence} handleInvite={handleInvite} invitedPlayers={joinedMatch.invitedPlayers} />
				</div>
			</div>
		</div>

		<WaitingRoomFooter isHost={isHost} allReady={allReady} missing={missing} total={joinedMatch.maxPlayers} isReady={me?.isReady ?? false} handleDeleteMatch={handleDeleteMatch} handleLeaveMatch={handleLeaveMatch} handleStatus={handleStatus} handleStart={handleStart} MatchErr={MatchErr} />
	</div>
}

function RadarWaiting({ className = "size-16" }: { className?: string }) {
	return <div className={`relative flex items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-base-200 bg-radar-glow ${className}`}>
		<div className="absolute w-3/4 h-3/4 rounded-full border border-primary/15" />
		<div className="absolute w-1/2 h-1/2 rounded-full border border-primary/15" />
		<div className="absolute w-1/4 h-1/4 rounded-full border border-primary/15" />

		<div className="absolute h-full w-px bg-primary/15" />
		<div className="absolute w-full h-px bg-primary/15" />

		<div className="absolute w-1/4 h-1/4 rounded-full bg-primary/5 blur-xl" />

		<div className="absolute inset-0 flex justify-center rounded-full bg-radar-sweep animate-sweep motion-reduce:animate-none">
			<div className="h-1/2 w-px bg-primary/70" />
		</div>
	</div>
}

function WaitingPlayerItem() {
	return <div className="flex items-center gap-3 p-3 border border-dashed border-neutral/50 rounded-lg lg:flex-col lg:justify-center lg:gap-2 lg:h-52">
		<RadarWaiting className="size-12 lg:size-16" />
		<p className="uppercase text-neutral-content/50 font-mono text-xs">
			<span className="lg:hidden">{t("play_waiting")}...</span>
			<span className="max-lg:hidden">{t("play_waiting_player")}</span>
		</p>
	</div>
}

function PlayerItem({ userId, username, image, points, isReady, isMine, isHost, canKick, team, isDuo, handleKick }: {
	userId: string,
	username: string | null | undefined,
	image: string | null | undefined,
	points: number,
	isReady: boolean,
	isMine: boolean,
	isHost: boolean,
	canKick: boolean,
	team: number,
	isDuo: boolean,
	handleKick: (id: string) => void
}) {
	return <div className={`flex items-center gap-3 p-3	border rounded-lg lg:flex-col lg:justify-between lg:gap-1 lg:h-52 lg:p-2.5 ${isMine ? "bg-info/10 border-info/50" : "bg-neutral/10 border-neutral/50"}`}>
		<div className="max-lg:hidden flex justify-end items-center h-4 w-full">
			{isHost && <HostBadge />}
			{!isHost && canKick && <KickButton handleKick={handleKick} targetId={userId} />}
		</div>

		<div className="flex items-center gap-3 flex-1 min-w-0 lg:flex-none lg:flex-col lg:gap-1">
			<Avatar username={username} image={image} size={48} />
			<div className="min-w-0 lg:text-center">
				<p className="text-sm font-semibold flex items-center gap-2 lg:justify-center">
					<span className="truncate">{username}</span>
					{isMine && <span className="text-xs text-neutral-content/50 font-medium">({t("play_you")})</span>}
					{isHost && <span className="lg:hidden"><HostBadge /></span>}
				</p>
				<p className="text-xs text-neutral-content/50 font-mono">{points.toLocaleString()} {t("txt_pts")}</p>
				{isDuo && <p className={`text-xs ${team === 1 ? "text-info/75" : "text-error/75"} font-mono`}>{team === 1 ? t("txt_team_blue") : t("txt_team_red")}</p>}
			</div>
		</div>

		<div className="flex items-center gap-2 shrink-0">
			<ReadyBadge isReady={isReady} />
			{!isHost && canKick && <span className="lg:hidden"><KickButton handleKick={handleKick} targetId={userId} /></span>}
		</div>
	</div>
}

function HostBadge() {
	return <span className="badge badge-warning badge-xs badge-outline uppercase">{t("play_host")}</span>
}

function KickButton({ targetId, handleKick }: {
	targetId: string,
	handleKick: (id: string) => void
}) {
	return <button className="cursor-pointer text-neutral-content/50 hover:text-error" onClick={() => handleKick(targetId)}><RxCross1 className="size-4" /></button>
}

function ReadyBadge({ isReady }: { isReady: boolean }) {
	return isReady
		? <p className="flex gap-1 items-center uppercase bg-info/10 border border-info/50 rounded-xl py-0.5 px-2 text-xs text-info"><BiCheck /> {t("play_ready")}</p>
		: <p className="flex gap-1 items-center uppercase bg-neutral/10 border border-neutral/50 rounded-xl py-0.5 px-2 text-xs text-neutral-content/50">{t("play_not_ready")}</p>
}

function CodeBox({ code }: { code: string }) {
	return <div className="flex items-center justify-between gap-2 bg-info/10 border border-dashed border-info/50 rounded-md px-4 py-3">
		<p className="text-info font-mono text-xl font-semibold tracking-brand uppercase">{code}</p>
		<button className="btn btn-xs btn-ghost text-neutral-content/50" onClick={() => navigator.clipboard.writeText(code.toUpperCase())}>{t("btn_copy_code")}</button>
	</div>
}

function RulesPanel({ rules }: { rules: Rules }) {
	const summary = [
		t(`txt_${rules.format}`),
		t("play_s_turns", { time: rules.timeTurn }),
		rules.replace ? t("play_bot_replace") : null,
		rules.ranked ? t("txt_ranked") : t("txt_unranked"),
	].filter(Boolean).join(" - ")

	return <div className="rounded-lg border border-neutral/50 bg-neutral/10 p-4">
		<div className="flex items-center justify-between pb-2">
			<p className="uppercase text-xs text-neutral-content/50 font-mono">{t("rules_title")}</p>
		</div>

		<p className="lg:hidden text-sm text-neutral-content/80">{summary}</p>

		<div className="max-lg:hidden flex flex-col gap-2 text-xs">
			<RuleRow label={t("play_format")} value={t(`txt_${rules.format}`)} />
			<RuleRow label={t("play_time_turn")} value={`${rules.timeTurn} s`} highlight />
			<RuleRow label={t("play_replace")} value={rules.replace ? t("txt_on") : t("txt_off")} highlight={rules.replace} />
			<RuleRow label={t("play_spectators")} value={rules.spectators ? t("txt_on") : t("txt_off")} highlight={rules.spectators} />
			<RuleRow label={t("txt_ranked")} value={rules.ranked ? t("txt_yes") : t("txt_no")} />
		</div>
	</div>
}

function RuleRow({ label, value, highlight }: {
	label: string,
	value: string,
	highlight?: boolean
}) {
	return <div className="flex items-center justify-between">
		<p className="text-neutral-content/80 first-letter:uppercase">{label}</p>
		<p className={`font-mono ${highlight ? "text-info" : ""}`}>{value}</p>
	</div>
}

function InvitePanel({ code, friends, presence, invitedPlayers, handleInvite }: {
	code: string,
	friends: Friend[],
	presence: Record<string, PresenceStatus>,
	invitedPlayers: string[],
	handleInvite: (targetId: string) => void
}) {
	const available = friends.filter(f => (presence[f.id] ?? f.status) !== "offline")

	return <div className="rounded-lg border border-neutral/50 bg-neutral/10 p-4 flex flex-col gap-3 h-full">
		<p className="uppercase text-xs text-neutral-content/50 font-mono">{t("btn_invite")}</p>
		<CodeBox code={code} />
		<div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
			{available.map(f => (
				<div key={f.id} className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						<Avatar username={f.username} image={f.image} size={24} />
						<p className="text-xs font-semibold truncate">{f.username}</p>
					</div>
					<button disabled={invitedPlayers.some(p => p === f.id)} onClick={() => handleInvite(f.id)} className="btn btn-xs btn-info">{t("btn_invite")}</button>
				</div>
			))}
		</div>
	</div >
}

function WaitingRoomFooter({ isHost, allReady, missing, total, isReady, MatchErr, handleDeleteMatch, handleLeaveMatch, handleStatus, handleStart }: {
	isHost: boolean,
	allReady: boolean,
	missing: number,
	total: number,
	isReady: boolean,
	MatchErr?: string,
	handleDeleteMatch: () => void,
	handleLeaveMatch: () => void,
	handleStatus: () => void,
	handleStart: () => void
}) {
	let title: string
	let detail = ""
	if (allReady) {
		title = t("play_all_players_ready", { nb: total })
		detail = isHost ? t("play_everyone_waiting") : t("play_waiting_host")
	} else if (missing > 0) {
		title = t("play_waiting_more_players", { missing })
		detail = isHost ? "" : t("play_only_host_start")
	} else
		title = t("play_waiting_everyone")

	return <div className="shrink-0 p-4 lg:px-6 lg:pb-6 max-lg:border-t max-lg:border-neutral/50">
		<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:bg-neutral/10 lg:border lg:border-neutral/50 lg:rounded-lg lg:p-4">
			<p className="text-xs flex items-center gap-2">
				<span className={`size-2 shrink-0 rounded-full ${allReady ? "bg-info" : "bg-warning"}`} />
				<span className="font-semibold first-letter:uppercase">{title}</span>
				{detail && <span className="text-neutral-content/50 max-lg:hidden">{detail}</span>}
			</p>

			<div className="flex flex-col-reverse gap-2 lg:flex-row lg:items-center">
				{isHost
					? <>
						<button className="btn btn-ghost max-lg:text-error lg:btn-outline lg:btn-error" onClick={handleDeleteMatch}>{t("play_btn_close_room")}</button>
						<button className="btn btn-info max-lg:btn-lg" disabled={!allReady} onClick={handleStart}>{t("play_btn_start_match")}</button>
					</>
					: <>
						<button className="btn btn-ghost max-lg:text-error lg:btn-outline lg:btn-error" onClick={handleLeaveMatch}>{t("play_btn_leave_room")}</button>
						<button className={`btn max-lg:btn-lg ${isReady ? "btn-outline" : "btn-info btn-outline"}`} onClick={handleStatus}>{isReady ? t("play_cancel_ready") : <><BiCheck /> {t("play_ready")}</>}</button>
					</>}
				{MatchErr && <span className="text-error block pt-0.5 pb-2 pl-2 text-xs text-center">{MatchErr}</span>}

			</div>
		</div>
	</div>
}

export function MatchItem({ username, image, type, players, maxPlayers, canJoin, canSpec, match, joinMatchErr, handleJoinedPublicMatch, handleJoinedSpecMatch }: {
	username: string | null | undefined,
	image: string | null | undefined,
	type: matchType,
	players: number,
	maxPlayers: number,
	canJoin?: boolean,
	canSpec?: boolean,
	match: Matchs,
	joinMatchErr?: string,
	handleJoinedPublicMatch: (match: Matchs) => void,
	handleJoinedSpecMatch: (match: Matchs) => void,
}) {
	let typeTxt = ""
	if (type === "ONE_V_ONE")
		typeTxt = t("txt_ONE_V_ONE")
	else if (type === "TWO_V_TWO")
		typeTxt = t("txt_TWO_V_TWO")
	else if (type === "FFA")
		typeTxt = `3-4 ${t("play_players")}`

	return <div className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_6rem_4rem_6rem] gap-4 items-center bg-neutral/10 border border-neutral/50 rounded-md p-4">
		<div className={`flex gap-2 items-center ${canSpec ? "opacity-50" : ""}`}>
			<Avatar username={username} image={image} size={32} />
			<p className="text-sm font-semibold max-lg:hidden">{t("play_room_name", { name: username ?? "?" })}</p>
			<div className="flex flex-col lg:hidden">
				<p className="text-xs font-semibold lg:hidden">{t("play_room_name", { name: username ?? "?" })}</p>
				<p className="text-xs text-neutral-content/50 flex items-center gap-1">{typeTxt} <TbPointFilled className="size-1" /> {players} / {maxPlayers}</p>
			</div>
		</div>
		<p className="text-xs text-neutral-content/50 max-lg:hidden">{typeTxt}</p>
		<p className="text-xs text-neutral-content/50 max-lg:hidden">{players} / {maxPlayers}</p>
		<div className="flex items-center justify-center gap-2">
			{joinMatchErr && <span className="text-error block pt-0.5 pb-2 pl-2 text-xs text-center">{joinMatchErr}</span>}
			{canJoin && <button className="btn btn-outline btn-info btn-sm" onClick={() => handleJoinedPublicMatch(match)} >{t("btn_join")}</button>}
			{!canJoin && canSpec && <button className="btn btn-neutral btn-outline btn-sm" onClick={() => handleJoinedSpecMatch(match)}>{t("btn_spectate")}</button>}
		</div>
	</div>
}

export function SidebarRight({ children, format, replace, visibility }: {
	children: React.ReactNode,
	format: matchType,
	replace: boolean,
	visibility: "public" | "private"
}) {
	let players = "3-4"
	if (format === "ONE_V_ONE")
		players = "2"
	else if (format === "BOT")
		players = "1"
	else if (format === "TWO_V_TWO")
		players = "4"

	let ranked = "ON"
	if (format === "BOT" || replace || visibility === "private")
		ranked = "OFF"

	return <>
		<div className="flex w-full h-full min-h-0">
			<div className={`flex-1 min-w-0 min-h-0`}>
				{children}
			</div>
			<div className={`max-lg:hidden lg:shrink-0 min-h-0`}>
				<ul className="menu flex-nowrap bg-base-200 h-full w-full p-4 gap-1">
					<div className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-1 max-w-75">
						<p className="text-xs uppercase text-neutral-content/50 font-mono">{t("play_selected_format")}</p>
						<h2 className="font-bold text-xl">{t(`txt_${format}`)}</h2>

						<SidebarRightItem label={t("txt_player")} value={players} />
						<SidebarRightItem label={t("txt_grid")} value="14x14" />
						<SidebarRightItem label={t("play_ships_per_fleet")} value="5" />
						<SidebarRightItem label={t("txt_ranked")} value={ranked} />

						{ranked !== "ON" && format !== "BOT" && replace && <div className="bg-base-100 rounded-md m-1">
							<p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4 text-neutral-content/60 text-xs"><IoWarning className="text-warning size-7" /> {t("play_ranked_off")}.</p>
						</div>}
						{ranked !== "ON" && format !== "BOT" && visibility === "private" && <div className="bg-base-100 rounded-md m-1">
							<p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4 text-neutral-content/60 text-xs"><IoWarning className="text-warning size-7" /> {t("play_ranked_off_private")}.</p>
						</div>}

						<div className="bg-base-100 rounded-md m-1">
							<p className="border border-neutral/50 bg-neutral/10 rounded-md p-4 flex items-center gap-4 text-neutral-content/60 text-xs"><IoInformation className="text-neutral size-7" /> {t("play_match_info")}.</p>
						</div>
					</div>
				</ul>
			</div>
		</div>
	</>
}

function SidebarRightItem({ label, value }: { label: string, value: string }) {
	return <>
		<div className="flex items-center justify-between p-1">
			<p className="first-letter:uppercase text-xs text-neutral-content/60">{label}</p>
			<p className={`font-mono text-xs font-medium ${value === "OFF" ? "text-warning" : ""}`}>{value}</p>
		</div>
		<div className="divider p-0 m-0"></div>
	</>
}