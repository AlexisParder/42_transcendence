import { TbPointFilled } from "react-icons/tb";
import { Avatar } from "../components/Avatar";
import { Sidebar } from "../components/Sidebar";
import { t } from "../lib/translate";
import { FaRegCircle } from "react-icons/fa6";
import { authClient } from "../lib/auth-client";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { truncateText } from "../lib/truncateText";
import { useEffect, useState } from "react";
import type { Match, Rank, Stat, UserInfo } from "../../../backend/src/events";
import { useLocation } from "react-router-dom";

export function Profile() {
	const { data: session, isPending } = authClient.useSession()
	const [rank, setRank] = useState<Rank>()
	const [targetInfo, setTargetInfo] = useState<UserInfo>()
	const [matches, setMatches] = useState<Match[]>([])
	const [stats, setStats] = useState<Stat>()

	const location = useLocation()
	const targetId = (location.state as { targetId?: string } | null)?.targetId

	useEffect(() => {
		async function loadUserInfo() {
			try {
				const res = await fetch("/api/get-user-info", {
					method: "POST",
					headers: { "Content-type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ targetId }),
				})

				if (!res.ok)
					return

				const data = await res.json()
				setRank(data.rank)
				setTargetInfo(data.userInfo)
			} catch (error) {
				console.error("load user info:", error)
			}
		}

		async function loadUserStats() {
			try {
				const res = await fetch("/api/get-user-stats", {
					method: "POST",
					headers: { "Content-type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ targetId }),
				})

				if (!res.ok)
					return

				const data = await res.json()
				setMatches(data.matchs ?? [])
				setStats(data.stats)
			} catch (error) {
				console.error("load user stats:", error)
			}
		}

		loadUserInfo()
		loadUserStats()
	}, [targetId])

	useDocumentTitle(targetInfo?.isMine === true ? t("profile_title") : t("profile_of_title", { username: targetInfo?.username ?? "?" }))

	return <Sidebar>
		{isPending && <p>Loading...</p>}
		{!isPending && session && <div className="p-2">
			{/* Haut */}
			<div className="flex flex-col gap-4 md:flex-row items-center justify-between border-b border-base-300 p-4 pb-6">
				{/* gauche */}
				<div className="flex items-center gap-4">
					<Avatar username={targetInfo?.username} image={targetInfo?.image} size={88} />
					<div className="flex flex-col gap-1 md:gap-0">
						<p className="text-3xl flex items-center gap-2 font-bold">{truncateText(targetInfo?.username, 9)} {rank && <span className="badge badge-info badge-outline badge-sm uppercase">{session?.user.language === "fr" ? rank.fr_label : rank.en_label}</span>}</p>
						<p className="text-sm text-neutral-content/50 first-letter:uppercase">{t("profile_txt_joined")} {targetInfo?.createdAt}</p>
					</div>
				</div>
				{/* droite */}
				<div>
					<p className={`text-4xl ${(targetInfo?.points ?? 0) >= 0 ? "text-info" : "text-error"} font-bold font-mono text-center md:text-right`}>{targetInfo?.points.toLocaleString()}</p>
					<p className="flex items-center text-xs gap-1 text-neutral-content/50">{t("txt_points")} <TbPointFilled className="size-1" /> 14th worldwide</p>
				</div>
			</div>

			{/* Milieu */}
			<div className="grid grid-cols-2 text-center md:text-left md:grid-cols-4 border-b border-base-300">
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
				<div className="flex-1/4 p-4 border-l border-base-300">
					<p className="font-bold text-2xl text-warning font-mono">{stats?.tournamentsWon}</p>
					<p className="text-xs text-neutral-content/50">{t("profile_txt_tournaments_won")}</p>
				</div>
			</div>

			{/* Bas */}
			<div className="flex flex-col lg:flex-row">
				<div className="flex-2/3 p-4">
					<p className="text-xs uppercase py-2 text-neutral-content/50">{t("profile_matches_title")}</p>
					<div className="flex flex-col gap-2">
						{matches.length > 0 && matches.map(m => (
							<MatchesItem key={m.id} {...m} />
						))}

						{matches.length < 1 && <p className="text-xs text-neutral-content/60">{t("txt_no_show_now")}..</p>}
					</div>
				</div>
				<div className="flex-1/3 lg:border-l border-base-300 p-4">
					<p className="text-xs uppercase py-2 text-neutral-content/50">{t("profile_achievements_title")}</p>
					<div className="flex flex-col gap-2">
						<AchievementsItem title="not a scratch" desc="win without losing a ship" difficulty="hard" />
						<AchievementsItem title="sharp ear" desc="10 useful scans in a row" difficulty="medium" />
						<AchievementsItem title="admiral" desc="win 5 tournaments" difficulty="easy" />
						<AchievementsItem title="Duo" desc="win 2 matches in duo" difficulty="medium" />
						<AchievementsItem title="admiral" desc="win 5 tournaments" difficulty="easy" />
					</div>
				</div>
			</div>
		</div>}
	</Sidebar>
}

function MatchesItem({ result, desc, matchType, matchTime, points }: {
	result: "win" | "loss",
	desc: string,
	matchType: "ONE_V_ONE" | "TWO_V_TWO" | "THREE_FFA" | "FOUR_FFA",
	matchTime: string,
	points: number | "unranked"
}) {
	let type = "4p"
	if (matchType === "ONE_V_ONE")
		type = "1 v 1"
	else if (matchType === "TWO_V_TWO")
		type = "2 v 2"
	else if (matchType === "THREE_FFA")
		type = "3p"

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

	return <div className={`grid grid-cols-[3.5rem_1fr_1fr_5rem] items-center gap-2 ${colorBg} p-2.5 rounded-md border-l-3 ${colorBd}`}>
		<p className={`text-sm ${colorTxt} font-bold uppercase`}>{t(`txt_${result}`)}</p>
		<p className="text-xs text-center">{desc}</p>
		<p className="flex items-center justify-center gap-1 text-xs">{type} <TbPointFilled className="size-1" /> {matchTime}</p>
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