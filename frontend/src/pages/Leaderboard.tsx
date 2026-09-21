import { TbPointFilled } from "react-icons/tb";
import { Sidebar } from "../components/Sidebar";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { t } from "../lib/translate";
import { Avatar } from "../components/Avatar";
import { truncateText } from "../lib/truncateText";
import { useEffect, useState } from "react";
import type { LeaderboardInfo } from "../../../backend/src/events";
import { useNavigate } from "react-router-dom";

export function Leaderboard() {
	useDocumentTitle(t("leaderboard_title"))
	const [ldbInfos, setLdbInfos] = useState<LeaderboardInfo[]>([])
	const [reqError, setReqError] = useState("")
	const navigate = useNavigate()

	useEffect(() => {
		async function loadLdbInfos() {
			try {
				const res = await fetch("/api/get-leaderboard-infos", {
					method: "GET",
					headers: { "Content-type": "application/json" },
					credentials: "include",
				})
				const data = await res.json()
				if (!res.ok)
					return setReqError(data.error)

				setLdbInfos(data.ldbInfos ?? [])
			} catch (error) {
				console.error("load leaderboard info:", error)
			}
		}

		loadLdbInfos()
	}, [])

	function handleProfile(id: string) {
		navigate('/profile', { state: { targetId: id } })
	}

	return <Sidebar>
		<div className="p-4">
			<h1 className="text-xl font-bold">{t("leaderboard_title")}</h1>
			<p className="flex items-center gap-1 text-xs text-neutral-content/50">Season 2.</p>
			{reqError && <p className="text-error text-sm">{t(reqError)}.</p>}
			<LeaderboardTable ldbInfos={ldbInfos} onProfile={handleProfile} />
		</div>
	</Sidebar>
}

function LeaderboardTable({ ldbInfos, onProfile }: { ldbInfos: LeaderboardInfo[], onProfile: (id: string) => void }) {
	return <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 my-2">
		<table className="table">
			<thead>
				<tr>
					<th className="uppercase font-medium">#</th>
					<th className="uppercase font-medium">player</th>
					<th className="uppercase font-medium hidden md:table-cell">matches</th>
					<th className="uppercase font-medium hidden lg:table-cell">w / l</th>
					<th className="uppercase font-medium hidden md:table-cell">accuracy</th>
					<th className="uppercase font-medium text-right">points</th>
				</tr>
			</thead>
			<tbody>
				{ldbInfos.length > 0 && ldbInfos.map(l => (
					<LeaderboarItem key={l.pos} {...l} onProfile={onProfile} />
				))}
			</tbody>
		</table>
	</div>
}

function LeaderboarItem({ id, pos, username, image, matches, win, lose, accuracy, points, isMine, onProfile }: { onProfile: (id: string) => void } & LeaderboardInfo) {
	const posString = pos < 10 ? `0${pos}` : pos

	let pointsColor = "text-neutral-content"
	if (points < 0)
		pointsColor = "text-error"
	else if (isMine)
		pointsColor = "text-info"

	return <tr className={`${isMine ? 'bg-info/10' : ''} cursor-pointer hover:bg-neutral/50`} onClick={() => onProfile(id)}>
		<td>
			<p className={`font-semibold font-mono text-sm ${pos <= 3 ? 'text-warning' : 'text-neutral-content/50'}`}>{posString}</p>
		</td>
		<td className="flex items-center gap-2">
			<Avatar username={username} image={image} size={28} />
			<div>
				<p className="text-xs">{truncateText(username, 11)}</p>
				<p className="md:hidden text-xs text-neutral-content/50 flex gap-1 items-center">{matches} matches <TbPointFilled className="size-1" /> {accuracy}%</p>
			</div>
		</td>
		<td className="hidden md:table-cell">
			<p className={`font-mono text-xs text-neutral-content/60`}>{matches.toLocaleString()}</p>
		</td>
		<td className="hidden lg:table-cell">
			<p className={`font-mono text-xs text-neutral-content/60`}>{win.toLocaleString()} / {lose.toLocaleString()}</p>
		</td>
		<td className="hidden md:table-cell">
			<p className={`font-mono text-xs text-neutral-content/60`}>{accuracy} %</p>
		</td>
		<td className="text-right">
			<p className={`font-mono font-semibold text-sm ${pointsColor}`}>{points.toLocaleString()}</p>
		</td>
	</tr>
}