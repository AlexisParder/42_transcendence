import { Link } from "react-router-dom"
import { RadarEchoes } from "../components/RadarEchoes"
import { Dockbar } from "../components/Dockbar"
import { t } from "../lib/translate"

const features = [
	{
		title: t("home_title_feature1"),
		desc: t("home_desc_feature1"),
	},
	{
		title: t("home_title_feature2"),
		desc: t("home_desc_feature2"),
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

export function Home() {
	return (
		<Dockbar>
			<div className="flex flex-1 w-full justify-center bg-base-100 text-base-content">
				<div className="flex w-full max-w-7xl flex-col px-5 sm:px-8 lg:px-12">
					<div className="flex flex-1 flex-col">
						<section className="relative grid flex-1 items-center gap-3 py-3 md:grid-cols-[1.2fr_1fr] md:gap-8 md:py-[clamp(0.75rem,3dvh,2.5rem)]">
							<div className="flex min-w-0 flex-col justify-center">
								<p className="mb-2 sm:mb-3 home-compact:pr-20 font-mono text-xs sm:text-sm font-semibold tracking-label text-primary">{t("home_project_name")}</p>
								<h1 className="home-compact:pr-20 max-w-3xl text-[clamp(1.75rem,4.5dvh,2.75rem)] md:text-[clamp(2rem,7dvh,4.5rem)] font-bold leading-[1.05] tracking-tight text-base-content">
									{t("home_title_part1")}
									<br/>
									{t("home_title_part2")}
								</h1>
								<p className="home-compact:mt-2 mt-3 max-w-xl text-sm md:text-[clamp(0.875rem,2dvh,1.125rem)] leading-relaxed text-base-content/60">{t("home_description")}</p>
								<div className="home-compact:mt-2 mt-4 flex flex-wrap gap-2">
									<Link
										to="/play"
										className="btn btn-primary h-10 px-4 text-sm">
										{t("home_play_btn")}
									</Link>

									<div className="join flex min-w-0 flex-1 sm:flex-none">
										<input
											type="text"
											placeholder={`${t("home_code_name")} - - - - -`}
											className="input join-item h-10 min-w-0 flex-1 bg-base-200 px-4 font-mono text-sm uppercase tracking-label placeholder:text-base-content/40 w-28 sm:w-40 sm:flex-none outline-none"
										/>
										<button className="btn join-item h-10 bg-base-300 px-5">
											{t("home_join_btn")}
										</button>
									</div>
								</div>
								<div className="home-compact:mt-2 mt-4 grid grid-cols-3 gap-3 border-t border-base-content/10 pt-3">
									<div>
										<p className="font-mono text-xl md:text-[clamp(1.25rem,3.5dvh,1.875rem)] font-bold text-base-content">2,148</p>
										<p className="mt-1 text-xs sm:text-sm text-base-content/50">{t("home_matches_played")}</p>
									</div>
									<div>
										<p className="font-mono text-xl md:text-[clamp(1.25rem,3.5dvh,1.875rem)] font-bold text-base-content">37</p>
										<p className="mt-1 text-xs sm:text-sm text-base-content/50">{t("home_in_progress")}</p>
									</div>
									<div>
										<p className="font-mono text-xl md:text-[clamp(1.25rem,3.5dvh,1.875rem)] font-bold text-primary">4</p>
										<p className="mt-1 text-xs sm:text-sm text-base-content/50">{t("home_open_tournaments")}</p>
									</div>
								</div>
							</div>
							<div className="flex items-center justify-center home-compact:absolute home-compact:right-0 home-compact:top-3">
								<RadarEchoes />
							</div>
						</section>
						<section className="grid grid-cols-2 border-t border-base-content/10 py-2 home-compact:py-0 lg:grid-cols-4 lg:py-3">
							{features.map((feature) => (
								<div
									key={feature.title}
									className="flex flex-col justify-center px-2 py-2 sm:px-5 sm:odd:border-r sm:odd:border-base-content/10 lg:border-r lg:border-base-content/10 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
									<h2 className="text-sm lg:text-base font-bold text-base-content">
										{feature.title}
									</h2>
									<p className="mt-1 text-xs leading-snug lg:text-sm text-base-content/55">
										{feature.desc}
									</p>
								</div>
							))}
						</section>
					</div>
				</div>
			</div>
		</Dockbar>
	)
}
