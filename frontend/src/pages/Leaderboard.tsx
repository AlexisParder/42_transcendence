import { TbPointFilled } from "react-icons/tb";
import { Sidebar } from "../components/Sidebar";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { t } from "../lib/translate";
import { Avatar } from "../components/Avatar";
import { truncateText } from "../lib/truncateText";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LeaderboardInfo } from "../../../backend/src/events";
import { useNavigate } from "react-router-dom";

type LdbFilterType = "global" | "friends"
export function Leaderboard() {
	useDocumentTitle(t("leaderboard_title"))
	const [ldbInfos, setLdbInfos] = useState<LeaderboardInfo[]>([])
	const [reqError, setReqError] = useState("")
	const [ldbFilter, setLdbFilter] = useState<LdbFilterType>('global')
	const [hasMore, setHasMore] = useState(true)
	const loadingMoreRef = useRef(false)
	const scrollRef = useRef<HTMLDivElement>(null)
	const loadedRef = useRef(0)
	const navigate = useNavigate()

	useEffect(() => {
		let cancelled = false
		loadingMoreRef.current = false
		loadedRef.current = 0

		async function loadFirst() {
			try {
				const res = await fetch("/api/get-leaderboard-infos", {
					method: "POST",
					headers: { "Content-type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ offset: 0, filter: ldbFilter })
				})
				const data = await res.json()
				if (cancelled)
					return
				if (!res.ok)
					return setReqError(data.error)

				setReqError("")

				const first: LeaderboardInfo[] = data.ldbInfos ?? []

				setHasMore(first.length >= 20)
				loadedRef.current = first.length
				setLdbInfos(first)
			} catch (error) {
				if (!cancelled)
					console.error("load leaderboard info:", error)
			}
		}
		loadFirst()

		return () => {
			cancelled = true
		}
	}, [ldbFilter])

	const loadMore = useCallback(async () => {
		if (!hasMore || loadingMoreRef.current)
			return

		loadingMoreRef.current = true

		try {
			const res = await fetch("/api/get-leaderboard-infos", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ offset: loadedRef.current, filter: ldbFilter })
			})

			const data = await res.json()
			if (!res.ok)
				return setReqError(data.error)
			setReqError("")

			const next: LeaderboardInfo[] = data.ldbInfos ?? []
			if (next.length < 20)
				setHasMore(false)
			if (next.length > 0) {
				loadedRef.current += next.length
				setLdbInfos(prev => [...prev, ...next])
			}
		} catch (error) {
			console.error("load more leaderboard:", error)
		} finally {
			loadingMoreRef.current = false
		}
	}, [hasMore, ldbFilter])

	useEffect(() => {
		const el = scrollRef.current
		if (!el)
			return

		function onScroll() {
			if (el!.scrollHeight - el!.scrollTop - el!.clientHeight < 150)
				loadMore()
		}

		el.addEventListener("scroll", onScroll)
		if (ldbInfos.length > 0)
			onScroll()

		return () => {
			el.removeEventListener("scroll", onScroll)
		}
	}, [loadMore, ldbInfos.length])

	function handleProfile(id: string) {
		navigate('/profile', { state: { targetId: id } })
	}

	return <Sidebar>
		<div className="p-4 flex flex-col h-screen">
			<div className="flex items-center justify-between shrink-0">
				<h1 className="text-xl font-bold">{t("leaderboard_title")}</h1>
				<div className="join">
					<input className="join-item btn" type="radio" defaultChecked={ldbFilter === "global"} name="options" onClick={() => {
						if (ldbFilter !== "global")
							setLdbFilter("global")
					}} aria-label={t("leaderboard_global_title")} />
					<input className="join-item btn" type="radio" defaultChecked={ldbFilter === "friends"} name="options" onClick={() => {
						if (ldbFilter !== "friends")
							setLdbFilter("friends")
					}} aria-label={t("friends_title")} />
				</div>
			</div>
			<p className="flex items-center gap-1 text-xs text-neutral-content/50 shrink-0">Season 2.</p>
			{reqError && <p className="text-error text-sm">{t(reqError)}.</p>}
			<LeaderboardTable ldbInfos={ldbInfos} onProfile={handleProfile} scrollRef={scrollRef} />
		</div>
	</Sidebar>
}

function LeaderboardTable({ ldbInfos, onProfile, scrollRef }: { ldbInfos: LeaderboardInfo[], onProfile: (id: string) => void, scrollRef: React.RefObject<HTMLDivElement | null> }) {
	return <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto rounded-box border border-base-content/5 bg-base-100 my-2">
		<table className="table">
			<thead className="sticky top-0 bg-base-100 z-10">
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