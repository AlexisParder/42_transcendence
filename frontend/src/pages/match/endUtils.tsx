import { MdArrowRightAlt } from "react-icons/md";
import { formatMS } from "../../lib/formatTime";
import type { Matchs } from "../../types/events";
import { authClient } from "../../lib/auth-client";
import { Link } from "react-router-dom";
import { t } from "../../lib/translate";

export function EndDisplay({ match }: {
	match: Matchs,
}) {
	const { data: session } = authClient.useSession()
	const player = match.players.find(p => p.userId === session?.user.id)
	const playerTeamData = match.teams.find(t => t.id === player?.team)
	const isWin = (player?.matchPoints ?? 0) >= 0

	const sunkShip = [
		...new Map(
			(playerTeamData?.shots ?? [])
				.filter(s => s.ship !== null)
				.map(s => [s.ship!.name, s.ship!])
		).values()
	]

	return <div className="flex items-center justify-center flex-1">
		<div className="flex flex-col items-center gap-3 bg-base-200 p-4 rounded-lg border border-neutral max-md:min-w-75 min-w-150">
			<p className={`uppercase text-xs font-medium font-mono tracking-[0.24em] ${isWin ? "text-info" : "text-error"}`}>match over</p>
			<h2 className="font-bold text-5xl max-md:text-4xl first-letter:uppercase">{isWin ? "enemy fleet sunk" : "fleet lost"}</h2>
			<p className="first-letter:uppercase text-neutral-content/50 text-sm font-medium font-mono tracking-[0.06em]">match time - {formatMS((match.endedAt - match.startedAt) / 1000)}</p>

			{match.isRanked && <div className={`flex items-center gap-2 py-2 px-4 border rounded-lg ${isWin ? "bg-info/10 border-info/50" : "bg-error/10 border-error/50"}`}>
				<p className={`font-mono font-bold text-2xl ${isWin ? "text-info" : "text-error"}`}>{isWin ? "+" : "-"}{player?.matchPoints ?? 0}</p>
				<div className="flex flex-col">
					<p className="text-xs text-neutral-content/50">points</p>
					<p className="inline-flex items-center gap-1 text-xs text-neutral-content/50">{player?.points ?? 0} <MdArrowRightAlt />{session?.user.points}</p>
				</div>
			</div>}

			<div className="shrink-0 grid grid-cols-1 text-center md:text-left md:grid-cols-3 border-t border-base-300 w-full">
				<div className="flex-1/3 p-4">
					<p className="text-xs text-neutral-content/50 first-letter:uppercase">accuracy</p>
					<p className="font-bold text-2xl font-mono">{Math.floor(player!.shotsHit / (player!.shotsTotal) * 100)} %</p>
					<p className="text-xs text-neutral-content/50">{player!.shotsTotal} shots - {player!.shotsHit} hits</p>
				</div>
				<div className="flex-1/3 p-4 md:border-l max-md:border-t border-base-300">
					<p className="text-xs text-neutral-content/50 first-letter:uppercase">ships lost</p>
					<p className="font-bold text-2xl font-mono">{sunkShip.length} / 5</p>
				</div>
				<div className="flex-1/3 p-4 md:border-l max-md:border-t border-base-300">
					<p className="text-xs text-neutral-content/50 first-letter:uppercase">Mode</p>
					<p className="font-bold text-2xl font-mono">{t(`txt_${match.type}`)}</p>
					<p className="text-xs text-neutral-content/50">{t(match.isRanked ? "txt_ranked" : "txt_unranked") } - {t(`play_${match.visibility}`)}</p>
				</div>
			</div>

			<Link to="/play" className="btn btn-outline" >Back to lobby</Link>
		</div>
	</div>
}