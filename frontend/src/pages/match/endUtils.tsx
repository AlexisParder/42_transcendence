import { MdArrowRightAlt } from "react-icons/md";
import { formatMS } from "../../lib/formatTime";
import type { Matchs } from "../../types/events";
import { authClient } from "../../lib/auth-client";
import { Link } from "react-router-dom";

export function EndDisplay({ match, myId }: {
	match: Matchs,
	myId: string | null | undefined,
}) {
	const { data: session } = authClient.useSession()
	const player = match.players.find(p => p.userId === myId)
	const isWin = (player?.matchPoints ?? 0) >= 0

	return <div className="flex items-center justify-center flex-1">
		<div className="flex flex-col items-center gap-3 bg-base-200 p-4 rounded-lg border border-neutral max-md:min-w-75 min-w-150">
			<p className={`uppercase text-xs font-medium font-mono tracking-[0.24em] ${isWin ? "text-info" : "text-error"}`}>match over</p>
			<h2 className="font-bold text-5xl max-md:text-4xl first-letter:uppercase">{isWin ? "enemy fleet sunk" : "fleet lost"}</h2>
			<p className="first-letter:uppercase text-neutral-content/50 text-sm font-medium font-mono tracking-[0.06em]">match time - {formatMS((match.endedAt - match.startedAt) / 1000)}</p>

			<div className={`flex items-center gap-2 py-2 px-4 border rounded-lg ${isWin ? "bg-info/10 border-info/50" : "bg-error/10 border-error/50"}`}>
				<p className={`font-mono font-bold text-2xl ${isWin ? "text-info" : "text-error"}`}>{isWin ? "+" : "-"}{player?.matchPoints ?? 0}</p>
				<div className="flex flex-col">
					<p className="text-xs text-neutral-content/50">points</p>
					<p className="inline-flex items-center gap-1 text-xs text-neutral-content/50">{player?.points ?? 0} <MdArrowRightAlt />{session?.user.points}</p>
				</div>
			</div>

			<div className="shrink-0 grid grid-cols-1 text-center md:text-left md:grid-cols-3 border-t border-base-300 w-full">
				<div className="flex-1/3 p-4">
					<p className="text-xs text-neutral-content/50">accuracy</p>
					<p className="font-bold text-2xl font-mono">52 %</p>
					<p className="text-xs text-neutral-content/50">21 shots - 11 hits</p>
				</div>
				<div className="flex-1/3 p-4 md:border-l max-md:border-t border-base-300">
					<p className="text-xs text-neutral-content/50">ships lost</p>
					<p className="font-bold text-2xl font-mono">1 / 4</p>
				</div>
				<div className="flex-1/3 p-4 md:border-l max-md:border-t border-base-300">
					<p className="text-xs text-neutral-content/50">best streak</p>
					<p className="font-bold text-2xl font-mono">4</p>
					<p className="text-xs text-neutral-content/50">hits in a row</p>
				</div>
			</div>

			<Link to="/play" className="btn btn-outline" >Back to lobby</Link>
		</div>
	</div>
}