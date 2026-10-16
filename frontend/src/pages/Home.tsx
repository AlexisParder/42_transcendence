import { Link, useNavigate } from "react-router-dom"
import { RadarEchoes } from "../components/RadarEchoes"
import { Sidebar } from "../components/Sidebar"
import { t } from "../lib/translate"
import { useState } from "react"
import { apiPost } from "../lib/api"

const features = [
	{
		title: t("home_title_feature1"),
		desc: t("home_desc_feature1"),
	},
	{
		title: t("home_title_feature3"),
		desc: t("home_desc_feature3"),
	},
	{
		title: t("home_title_feature4"),
		desc: t("home_desc_feature4"),
	},
]

const stats = [
	{ value: "2,148", label: t("home_matches_played") },
	{ value: "37", label: t("home_in_progress") },
	{ value: "4", label: t("home_open_matches") },
]

export function Home() {
	const [code, setCode] = useState("")
	const navigate = useNavigate()

	async function handleJoinWithCode() {
		try {
			const { ok } = await apiPost("/api/join-code-match", { code })
			if (!ok)
				return

			setCode("")
			navigate("/play")
		} catch (error) {
			console.error("join code match:", error)
		}
	}

	return (
		<Sidebar guest>
			<div className="flex flex-col flex-1 w-full max-w-6xl 2xl:max-w-7xl mx-auto p-4 md:p-8 gap-6 xl:gap-10">
				<section className="flex flex-col md:flex-row items-center gap-8 xl:gap-16 flex-1">
					<div className="flex flex-col flex-1 gap-4 xl:gap-6">
						<p className="font-mono text-sm xl:text-base font-semibold tracking-wide text-primary">{t("home_project_name")}</p>
						<h1 className="text-3xl md:text-5xl xl:text-6xl 2xl:text-7xl font-bold">
							{t("home_title_part1")}
							<br />
							{t("home_title_part2")}
						</h1>
						<p className="max-w-xl text-sm md:text-base xl:text-lg text-base-content/60">{t("home_description")}</p>
						<div className="flex flex-wrap gap-2">
							<Link to="/play" className="btn btn-primary xl:btn-lg">
								{t("home_play_btn")}
							</Link>
							<div className="join">
								<input
									type="text"
									placeholder={`${t("home_code_name")} - - - - -`}
									className="input xl:input-lg join-item w-40 xl:w-48 bg-base-200 font-mono uppercase outline-none" value={code} onChange={(e) => setCode(e.target.value.trim())}
								/>
								<button className="btn xl:btn-lg join-item bg-base-300" onClick={handleJoinWithCode}>
									{t("home_join_btn")}
								</button>
							</div>
						</div>
						<div className="grid grid-cols-3 gap-4 border-t border-base-content/10 pt-4">
							{stats.map((stat) => (
								<div key={stat.label}>
									<p className="font-mono text-2xl xl:text-3xl font-bold">{stat.value}</p>
									<p className="text-sm xl:text-base text-base-content/50">{stat.label}</p>
								</div>
							))}
						</div>
					</div>
					<div className="flex flex-1 justify-center">
						<RadarEchoes />
					</div>
				</section>
				<section className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-base-content/10 pt-4">
					{features.map((feature) => (
						<div key={feature.title}>
							<h2 className="font-bold xl:text-lg">{feature.title}</h2>
							<p className="mt-1 text-sm xl:text-base text-base-content/60">{feature.desc}</p>
						</div>
					))}
				</section>
			</div>
		</Sidebar>
	)
}
