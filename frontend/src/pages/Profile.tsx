import { TbPointFilled } from "react-icons/tb";
import { Avatar } from "../components/Avatar";
import { Sidebar } from "../components/Sidebar";
import { t } from "../lib/translate";
import { FaRegCircle } from "react-icons/fa6";
import { authClient } from "../lib/auth-client";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { truncateText } from "../lib/truncateText";

export function Profile() {
	useDocumentTitle(t("profile_title"))
	const { data: session, isPending } = authClient.useSession()

	return <Sidebar>
		{isPending && <p>Loading...</p>}
		{!isPending && session && <div className="p-2">
			{/* Haut */}
			<div className="flex flex-col gap-4 md:flex-row items-center justify-between border-b border-base-300 p-4 pb-6">
				{/* gauche */}
				<div className="flex items-center gap-2">
					<Avatar username={"alexis"} image={session?.user.image} size={88} />
					<div className="flex flex-col gap-1 md:gap-0">
						<p className="text-3xl flex items-center gap-2 font-bold">{truncateText(session?.user.username, 9)} <span className="badge badge-info badge-outline badge-sm">CAPTAIN</span></p>
						<p className="text-sm text-neutral-content/50 first-letter:uppercase">{t("profile_txt_joined")} {session!.user.createdAt.toDateString()}</p>
					</div>
				</div>
				{/* droite */}
				<div>
					<p className="text-4xl text-info font-bold font-mono text-center md:text-right">1,254</p>
					<p className="flex items-center text-xs gap-1 text-neutral-content/50">{t("txt_points")} <TbPointFilled className="size-1" /> 14th worldwide</p>
				</div>
			</div>

			{/* Milieu */}
			<div className="grid grid-cols-2 text-center md:text-left md:grid-cols-4 border-b border-base-300">
				<div className="flex-1/4 p-4">
					<p className="font-bold text-2xl font-mono">128</p>
					<p className="text-xs text-neutral-content/50">{t("profiles_txt_matches")}</p>
				</div>
				<div className="flex-1/4 p-4 border-l border-base-300">
					<p className="font-bold text-2xl text-info font-mono">61 %</p>
					<p className="text-xs text-neutral-content/50">{t("profile_txt_win_rate")}</p>
				</div>
				<div className="flex-1/4 p-4 md:border-l border-base-300">
					<p className="font-bold text-2xl font-mono">44 %</p>
					<p className="text-xs text-neutral-content/50">{t("profile_txt_shot_accuracy")}</p>
				</div>
				<div className="flex-1/4 p-4 border-l border-base-300">
					<p className="font-bold text-2xl text-warning font-mono">3</p>
					<p className="text-xs text-neutral-content/50">{t("profile_txt_tournaments_won")}</p>
				</div>
			</div>

			{/* Bas */}
			<div className="flex flex-col lg:flex-row">
				<div className="flex-2/3 p-4">
					<p className="text-xs uppercase py-2 text-neutral-content/50">{t("profile_matches_title")}</p>
					<div className="flex flex-col gap-2">
						<MatchesItem result="win" desc="vs tom" matchType="1 v 1" matchTime="8 min" points={24} />
						<MatchesItem result="loss" desc="FFA - 3rd place" matchType="4p" matchTime="21 min" points={11} />
						<MatchesItem result="win" desc="Duo wih gael" matchType="2 v 2" matchTime="17 min" points={18} />
						<MatchesItem result="win" desc="vs Bot - hard" matchType="1 v 1" matchTime="6 min" points={"unranked"} />
						<MatchesItem result="win" desc="vs Bot - hard" matchType="1 v 1" matchTime="6 min" points={"unranked"} />
						<MatchesItem result="loss" desc="vs Bob" matchType="1 v 1" matchTime="6 min" points={13} />
						<MatchesItem result="win" desc="vs Bot - hard" matchType="1 v 1" matchTime="6 min" points={"unranked"} />
					</div>
				</div>
				<div className="flex-1/3 lg:border-l border-base-300 p-4">
					<p className="text-xs uppercase py-2 text-neutral-content/50">{t("profile_achievements_title")}</p>
					<div className="flex flex-col gap-2">
						<AchivementsItem title="not a scratch" desc="win without losing a ship" difficulty="hard" />
						<AchivementsItem title="sharp ear" desc="10 useful scans in a row" difficulty="medium" />
						<AchivementsItem title="admiral" desc="win 5 tournaments" difficulty="easy" />
						<AchivementsItem title="Duo" desc="win 2 matches in duo" difficulty="medium" />
						<AchivementsItem title="admiral" desc="win 5 tournaments" difficulty="easy" />
					</div>
				</div>
			</div>
		</div>}
	</Sidebar>
}

function MatchesItem({ result, desc, matchType, matchTime, points }: {
	result: "win" | "loss",
	desc: string,
	matchType: "1 v 1" | "4p" | "3p" | "2 v 2",
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

	return <div className={`grid grid-cols-[3.5rem_1fr_1fr_5rem] items-center gap-2 ${colorBg} p-2.5 rounded-md border-l-3 ${colorBd}`}>
		<p className={`text-sm ${colorTxt} font-bold uppercase`}>{t(`txt_${result}`)}</p>
		<p className="text-xs text-center">{desc}</p>
		<p className="flex items-center justify-center gap-1 text-xs">{matchType} <TbPointFilled className="size-1" /> {matchTime}</p>
		<p className={`text-xs ${colorTxt} font-bold text-right`}>{pointsTxt === "unranked" ? t("txt_unranked") : pointsTxt}</p>
	</div>
}

function AchivementsItem({ title, desc, difficulty }: {
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