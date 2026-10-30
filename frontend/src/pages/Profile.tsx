import { TbPointFilled } from "react-icons/tb";
import { Avatar } from "../components/Avatar";
import { Sidebar } from "../components/Sidebar";
import { getTranslationLanguage, t } from "../lib/translate";
import { FaRegCircle } from "react-icons/fa6";
import { authClient } from "../lib/auth-client";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { truncateText } from "../lib/truncateText";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Match, matchType, Rank, Stat, UserInfo } from "../types/events";
import { useLocation } from "react-router-dom";
import { formatTimeProfile } from "../lib/formatTime";
import { apiPost } from "../lib/api";
import { ordinal } from "../lib/ordinal";

type categoryType = "matches" | "achievements"
export function Profile() {
	const { data: session, isPending } = authClient.useSession()
	const [rank, setRank] = useState<Rank>()
	const [targetInfo, setTargetInfo] = useState<UserInfo>()
	const [matches, setMatches] = useState<Match[]>([])
	const [stats, setStats] = useState<Stat>()
	const [category, setCategory] = useState<categoryType>('matches')
	const [hasMore, setHasMore] = useState(true)
	const loadingMoreRef = useRef(false)
	const scrollRef = useRef<HTMLDivElement>(null)
	const loadedRef = useRef(0)

	const location = useLocation()
	const targetId = (location.state as { targetId?: string } | null)?.targetId

	useEffect(() => {
		let cancelled = false
		loadingMoreRef.current = false
		loadedRef.current = 0

		async function loadUserInfo() {
			try {
				const { ok, data } = await apiPost("/api/get-user-info", { targetId })

				if (!ok)
					return

				setRank(data.rank)
				setTargetInfo(data.userInfo)
			} catch (error) {
				console.error("load user info:", error)
			}
		}

		async function loadFirstUserStats() {
			try {
				const { ok, data } = await apiPost("/api/get-user-stats", { targetId, offset: 0 })

				if (!ok || cancelled)
					return

				const first: Match[] = data.matchs ?? []

				setHasMore(first.length >= 20)
				loadedRef.current = first.length
				setMatches(first)
				setStats(data.stats)
			} catch (error) {
				if (!cancelled)
					console.error("load user stats:", error)
			}
		}

		loadUserInfo()
		loadFirstUserStats()

		return () => {
			cancelled = true
		}
	}, [targetId])

	const loadMore = useCallback(async () => {
		if (!hasMore || loadingMoreRef.current)
			return

		loadingMoreRef.current = true

		try {
			const { ok, data } = await apiPost("/api/get-user-stats", { targetId, offset: loadedRef.current })

			if (!ok)
				return

			const next: Match[] = data.matchs ?? []
			if (next.length < 20)
				setHasMore(false)
			if (next.length > 0) {
				loadedRef.current += next.length
				setMatches(prev => [...prev, ...next])
			}
		} catch (error) {
			console.error("load more matches:", error)
		} finally {
			loadingMoreRef.current = false
		}
	}, [hasMore, targetId])

	useEffect(() => {
		const el = scrollRef.current
		if (!el)
			return

		function onScroll() {
			if (el!.clientHeight === 0)
				return

			if (el!.scrollHeight - el!.scrollTop - el!.clientHeight < 150)
				loadMore()
		}

		el.addEventListener("scroll", onScroll)
		if (matches.length > 0)
			onScroll()

		return () => {
			el.removeEventListener("scroll", onScroll)
		}
	}, [loadMore, matches.length, category])

	useDocumentTitle(targetInfo?.isMine === true ? t("profile_title") : t("profile_of_title", { username: targetInfo?.username ?? "?" }))

	return <Sidebar>
		{isPending && <p>{t("sidebar_loading")}</p>}
		{!isPending && session && <div className="p-2 h-full min-h-0 flex flex-col">
			<div className="shrink-0 flex flex-col gap-4 md:flex-row items-center justify-between border-b border-base-300 p-4 pb-6">
				<div className="flex items-center gap-4">
					<Avatar username={targetInfo?.username} image={targetInfo?.image} size={88} />
					<div className="flex flex-col gap-1 md:gap-0">
						<p className="text-3xl flex items-center gap-2 font-bold">{truncateText(targetInfo?.username, 9)} {rank && <span className="badge badge-info badge-outline badge-sm uppercase">{getTranslationLanguage() === "fr" ? rank.fr_label : rank.en_label}</span>}</p>
						<p className="text-sm text-neutral-content/50 first-letter:uppercase">{t("profile_txt_joined")} {targetInfo && new Date(targetInfo.createdAt).toLocaleDateString(getTranslationLanguage(), { day: "numeric", month: "long", year: "numeric" })}</p>
					</div>
				</div>

				<div>
					<p className={`text-4xl ${(targetInfo?.points ?? 0) >= 0 ? "text-info" : "text-error"} font-bold font-mono text-center md:text-right`}>{targetInfo?.points.toLocaleString()}</p>
					<p className="flex items-center text-xs gap-1 text-neutral-content/50">{t("txt_points")} <TbPointFilled className="size-1" /> {t("txt_worldwide", { pos: targetInfo?.leaderboardPos ? ordinal(targetInfo?.leaderboardPos) : "-" })}</p>
				</div>
			</div>

			<div className="shrink-0 grid grid-cols-2 text-center md:text-left md:grid-cols-4 border-b border-base-300">
				<div className="flex-1/4 p-4">
					<p className="font-bold text-2xl font-mono">{stats?.total}</p>
					<p className="text-xs text-neutral-content/50">{t("profiles_txt_matches")}</p>
				</div>
				<div className="flex-1/4 p-4 border-l border-base-300">
					<p className="font-bold text-2xl text-info font-mono">{stats?.winRate} %</p>
					<p className="text-xs text-neutral-content/50">{t("profile_txt_win_rate")}</p>
				</div>
				<div className="flex-1/4 p-4 md:border-l border-base-300">
					<p className="font-bold text-2xl font-mono">{stats?.shotAccuracy} %</p>
					<p className="text-xs text-neutral-content/50">{t("profile_txt_shot_accuracy")}</p>
				</div>
				{/* TODO: Remplacer par le nombre d'achievement debloqués */}
				{/* <div className="flex-1/4 p-4 border-l border-base-300">
					<p className="font-bold text-2xl text-warning font-mono">{stats?.tournamentsWon}</p>
					<p className="text-xs text-neutral-content/50">{t("profile_txt_tournaments_won")}</p>
				</div> */}
			</div>

			<div className="shrink-0 join lg:hidden pt-4 px-4">
				<input className="join-item btn btn-sm" type="radio" defaultChecked={category === "matches"} name="options" onClick={() => {
					if (category !== "matches")
						setCategory("matches")
				}} aria-label={t("profiles_txt_matches")} />
				<input className="join-item btn btn-sm" type="radio" defaultChecked={category === "achievements"} name="options" onClick={() => {
					if (category !== "achievements")
						setCategory("achievements")
				}} aria-label={t("profile_achievements_title")} />
			</div>
			<div className="flex-1 min-h-0 flex flex-col lg:flex-row">
				<div className={`flex-1 min-h-0 flex flex-col lg:flex-none lg:w-2/3 pt-2 px-4 pb-4 ${category !== "matches" ? "max-lg:hidden" : ""}`}>
					<p className="shrink-0 text-xs uppercase py-2 text-neutral-content/50 max-lg:hidden">{t("profile_matches_title")}</p>
					<div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1">
						{matches.length > 0 && matches.map(m => (
							<MatchesItem key={m.id} type={m.matchType} {...m} />
						))}

						{matches.length < 1 && <p className="text-xs text-neutral-content/60">{t("txt_no_show_now")}..</p>}
					</div>
				</div>
				<div className={`flex-1 min-h-0 flex flex-col lg:flex-none lg:w-1/3 lg:border-l border-base-300 pt-2 px-4 pb-4 ${category !== "achievements" ? "max-lg:hidden" : ""}`}>
					<p className="shrink-0 text-xs uppercase py-2 text-neutral-content/50 max-lg:hidden">{t("profile_achievements_title")}</p>
					<div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1">
						<AchievementsItem title={t("profile_ach_no_scratch")} desc={t("profile_ach_no_scratch_desc")} difficulty="hard" />
						<AchievementsItem title={t("profile_ach_sharp_ear")} desc={t("profile_ach_sharp_ear_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_duo")} desc={t("profile_ach_duo_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_no_scratch")} desc={t("profile_ach_no_scratch_desc")} difficulty="hard" />
						<AchievementsItem title={t("profile_ach_sharp_ear")} desc={t("profile_ach_sharp_ear_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_duo")} desc={t("profile_ach_duo_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_no_scratch")} desc={t("profile_ach_no_scratch_desc")} difficulty="hard" />
						<AchievementsItem title={t("profile_ach_sharp_ear")} desc={t("profile_ach_sharp_ear_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_duo")} desc={t("profile_ach_duo_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_no_scratch")} desc={t("profile_ach_no_scratch_desc")} difficulty="hard" />
						<AchievementsItem title={t("profile_ach_sharp_ear")} desc={t("profile_ach_sharp_ear_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_duo")} desc={t("profile_ach_duo_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_no_scratch")} desc={t("profile_ach_no_scratch_desc")} difficulty="hard" />
						<AchievementsItem title={t("profile_ach_sharp_ear")} desc={t("profile_ach_sharp_ear_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_duo")} desc={t("profile_ach_duo_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_no_scratch")} desc={t("profile_ach_no_scratch_desc")} difficulty="hard" />
						<AchievementsItem title={t("profile_ach_sharp_ear")} desc={t("profile_ach_sharp_ear_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_duo")} desc={t("profile_ach_duo_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_no_scratch")} desc={t("profile_ach_no_scratch_desc")} difficulty="hard" />
						<AchievementsItem title={t("profile_ach_sharp_ear")} desc={t("profile_ach_sharp_ear_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
						<AchievementsItem title={t("profile_ach_duo")} desc={t("profile_ach_duo_desc")} difficulty="medium" />
						<AchievementsItem title={t("profile_ach_admiral")} desc={t("profile_ach_admiral_desc")} difficulty="easy" />
					</div>
				</div>
			</div>
		</div>}
	</Sidebar>
}

function matchDesc(type: Match["matchType"], otherPlayer: string | null, otherDeleted: boolean, placement: number | null) {
	const name = otherDeleted ? t("deleted_user") : (otherPlayer ?? "Bot")
	if (type === "ONE_V_ONE")
		return t("profile_match_vs", { name })
	if (type === "TWO_V_TWO")
		return t("profile_match_duo_with", { name })
	return placement ? t(`profile_match_place_${placement}`) : t("txt_FFA")
}

function MatchesItem({ result, otherPlayer, otherDeleted, placement, type, matchTime, points }: {
	result: "win" | "loss",
	otherPlayer: string | null,
	otherDeleted: boolean,
	placement: number | null,
	type: matchType,
	matchTime: string,
	points: number | "unranked"
}) {
	let pointsTxt = points.toString()
	let colorTxt = "text-neutral-content/50"
	let colorBg = "bg-neutral/20"
	let colorBd = "border-neutral"
	if (points !== "unranked") {
		if (result === "win") {
			pointsTxt = `+${points}`
			colorTxt = "text-info"
			colorBg = "bg-info/10"
			colorBd = "border-info"
		}
		else {
			pointsTxt = `-${points}`
			colorTxt = "text-error"
			colorBg = "bg-error/10"
			colorBd = "border-error"
		}
	}
	const timeFormat = formatTimeProfile(matchTime)
	return <div className={`grid grid-cols-[4rem_1fr_1fr_5rem] items-center gap-2 ${colorBg} p-2.5 rounded-md border-l-3 ${colorBd}`}>
		<p className={`text-sm ${colorTxt} font-bold uppercase`}>{t(`txt_${result}`)}</p>
		<p className="text-xs text-center">{matchDesc(type, otherPlayer, otherDeleted, placement)}</p>
		<p className="flex items-center justify-center gap-1 text-xs">{t(`txt_${type}`)} {timeFormat && <TbPointFilled className="size-1" />} {timeFormat}</p>
		<p className={`text-xs ${colorTxt} font-bold text-right`}>{pointsTxt === "unranked" ? t("txt_unranked") : pointsTxt}</p>
	</div>
}

function AchievementsItem({ title, desc, difficulty }: {
	title: string,
	desc: string,
	difficulty: "easy" | "medium" | "hard",
}) {
	let colorTxt = "text-neutral-content/50"
	let colorBd = "border-neutral"

	if (difficulty === "medium") {
		colorTxt = "text-info"
		colorBd = "border-info/50"
	}
	else if (difficulty === "hard") {
		colorTxt = "text-warning"
		colorBd = "border-warning/50"
	}

	return <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${colorBd}`}>
		<FaRegCircle className={`${colorTxt} size-6`} />
		<div>
			<p className={`text-sm first-letter:uppercase`}>{title}</p>
			<p className="text-xs text-neutral-content/50 first-letter:uppercase">{desc}</p>
		</div>
	</div>
}