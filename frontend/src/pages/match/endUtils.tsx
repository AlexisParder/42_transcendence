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
	const isWin = player?.status !== "LEFT" && player?.placement === 1
	const matchPoints = player?.matchPoints ?? 0

	const sunkShip = [
		...new Map(
			(playerTeamData?.shots ?? [])
				.filter(s => s.ship !== null)
				.map(s => [s.ship!.name, s.ship!])
		).values()
	]

	return <div className="flex items-center justify-center flex-1">
		<div className="flex flex-col items-center gap-3 bg-base-200 p-4 rounded-lg border border-neutral max-md:min-w-75 min-w-150">
			<p className={`uppercase text-xs font-medium font-mono tracking-[0.24em] ${isWin ? "text-info" : "text-error"}`}>{t("end_match_over")}</p>
			<h2 className="font-bold text-5xl max-md:text-4xl first-letter:uppercase text-center">{isWin ? t("end_enemy_fleet_sunk") : t("end_fleet_lost")}</h2>
			<p className="first-letter:uppercase text-neutral-content/50 text-sm font-medium font-mono tracking-[0.06em]">{t("end_match_time", { time: formatMS((match.endedAt - match.startedAt) / 1000) })}</p>

			{match.isRanked && <div className={`flex items-center gap-2 py-2 px-4 border rounded-lg ${matchPoints >= 0 ? "bg-info/10 border-info/50" : "bg-error/10 border-error/50"}`}>
				<p className={`font-mono font-bold text-2xl ${matchPoints >= 0 ? "text-info" : "text-error"}`}>{matchPoints >= 0 ? "+" : ""}{matchPoints}</p>
				<div className="flex flex-col">
					<p className="text-xs text-neutral-content/50">{t("txt_points")}</p>
					<p className="inline-flex items-center gap-1 text-xs text-neutral-content/50">{player?.points ?? 0} <MdArrowRightAlt />{(player?.points ?? 0) + (player?.matchPoints ?? 0)}</p>
				</div>
			</div>}

			<div className="shrink-0 grid grid-cols-1 text-center md:text-left md:grid-cols-3 border-t border-base-300 w-full">
				<div className="flex-1/3 p-4">
					<p className="text-xs text-neutral-content/50 first-letter:uppercase">{t("txt_accuracy")}</p>
					<p className="font-bold text-2xl font-mono">{player!.shotsTotal > 0 ? Math.floor(player!.shotsHit / (player!.shotsTotal) * 100) : 0} %</p>
					<p className="text-xs text-neutral-content/50">{t("end_shots_hits", { shots: player!.shotsTotal, hits: player!.shotsHit })}</p>
				</div>
				<div className="flex-1/3 p-4 md:border-l max-md:border-t border-base-300">
					<p className="text-xs text-neutral-content/50 first-letter:uppercase">{t("end_ships_lost")}</p>
					<p className="font-bold text-2xl font-mono">{sunkShip.length} / 5</p>
				</div>
				<div className="flex-1/3 p-4 md:border-l max-md:border-t border-base-300">
					<p className="text-xs text-neutral-content/50 first-letter:uppercase">{t("select_mode")}</p>
					<p className="font-bold text-2xl font-mono">{t(`txt_${match.type}`)}</p>
					<p className="text-xs text-neutral-content/50">{t(match.isRanked ? "txt_ranked" : "txt_unranked")} - {t(`play_${match.visibility}`)}</p>
				</div>
			</div>

			<Link to="/play" className="btn btn-outline" >{t("end_btn_back_lobby")}</Link>
		</div>
	</div>
}

export function EndSpecDisplay({ match }: {
	match: Matchs,
}) {
	return <div className="flex items-center justify-center flex-1">
		<div className="flex flex-col items-center gap-3 bg-base-200 p-4 rounded-lg border border-neutral max-md:min-w-75 min-w-150">
			<p className="uppercase text-xs font-medium font-mono tracking-[0.24em] text-info">{t("end_match_over")}</p>
			<p className="first-letter:uppercase text-neutral-content/50 text-sm font-medium font-mono tracking-[0.06em]">{t("end_match_time", { time: formatMS((match.endedAt - match.startedAt) / 1000) })}</p>

			<Link to="/play" className="btn btn-outline" >{t("end_btn_back_lobby")}</Link>
		</div>
	</div>
}