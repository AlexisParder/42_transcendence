import { Link } from "react-router-dom"
import { useDocumentTitle } from "../hooks/useDocumentTitle"

const features = [
	{
		title: "Up to 4 fleets",
		desc: "Free-for-all or duo, on a 14x14 grid.",
	},
	{
		title: "Abilities",
		desc: "Area scan, salvo, jamming, repair.",
	},
	{
		title: "Ranked tournaments",
		desc: "Your score climbs - and it falls too.",
	},
	{
		title: "Practice bot",
		desc: "Unranked, and a stand-in when a player leaves.",
	},
]

const radarPeriod = 4.5
const radarEchoes = [
	{ x: 31, y: 26, className: "size-3 bg-primary text-primary" },
	{ x: 66, y: 58, className: "size-3 bg-warning text-warning" },
	{ x: 49, y: 74, className: "size-2 bg-secondary text-secondary" },
]

export function Home() {
	useDocumentTitle("Sonar")

	return (
		<>

			<div className="flex flex-1 w-full justify-center bg-base-100 text-base-content">
				<div
					className="flex w-full max-w-7xl flex-col px-5 sm:px-8 lg:px-12"
				>
					<div className="flex flex-1 flex-col">
					<section className="relative grid flex-1 items-center gap-3 py-3 md:grid-cols-[1.2fr_1fr] md:gap-8 md:py-[clamp(0.75rem,3dvh,2.5rem)]">
						<div className="flex min-w-0 flex-col justify-center">
							<p className="mb-2 sm:mb-3 home-compact:pr-20 font-mono text-xs sm:text-sm font-semibold tracking-label text-primary">
								42 - TRANSCENDENCE
							</p>

							<h1 className="home-compact:pr-20 max-w-3xl text-[clamp(1.75rem,4.5dvh,2.75rem)] md:text-[clamp(2rem,7dvh,4.5rem)] font-bold leading-[1.05] tracking-tight text-base-content">
								Naval combat,
								<br />
								in deep water.
							</h1>

							<p className="home-compact:mt-2 mt-3 max-w-xl text-sm md:text-[clamp(0.875rem,2dvh,1.125rem)] leading-relaxed text-base-content/60">
								Hidden grids, turn by turn, up to four fleets on one chart.
								{" "}
								Abilities that turn a match around, ranked tournaments,
								{" "}
								and a bot that never sleeps.
							</p>

							<div className="home-compact:mt-2 mt-4 flex flex-wrap gap-2">
								<Link
									to="/play"
									className="btn btn-primary h-10 px-4 text-sm"
								>
									Quick match
								</Link>

								<div className="join flex min-w-0 flex-1 sm:flex-none">
									<input
										type="text"
										aria-label="Match code"
										placeholder="CODE - - - - -"
										className="input join-item h-10 min-w-0 flex-1 bg-base-200 px-4 font-mono text-sm uppercase tracking-label placeholder:text-base-content/40 w-28 sm:w-40 sm:flex-none"
									/>
									<button className="btn join-item h-10 bg-base-300 px-5">
										Join
									</button>
								</div>
							</div>

							<div className="home-compact:mt-2 mt-4 grid grid-cols-3 gap-3 border-t border-base-content/10 pt-3">
								<div>
									<p className="font-mono text-xl md:text-[clamp(1.25rem,3.5dvh,1.875rem)] font-bold text-base-content">2,148</p>
									<p className="mt-1 text-xs sm:text-sm text-base-content/50">matches played</p>
								</div>
								<div>
									<p className="font-mono text-xl md:text-[clamp(1.25rem,3.5dvh,1.875rem)] font-bold text-base-content">37</p>
									<p className="mt-1 text-xs sm:text-sm text-base-content/50">in progress</p>
								</div>
								<div>
									<p className="font-mono text-xl md:text-[clamp(1.25rem,3.5dvh,1.875rem)] font-bold text-primary">4</p>
									<p className="mt-1 text-xs sm:text-sm text-base-content/50">open tournaments</p>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-center home-compact:absolute home-compact:right-0 home-compact:top-3">
							<div aria-hidden="true" className="home-compact:size-16 relative aspect-square w-[min(100%,18dvh)] md:w-[min(100%,48dvh)] md:max-w-md overflow-hidden rounded-full border border-primary/20 bg-base-200 bg-radar-glow">
								
								<div className="absolute inset-[13%] rounded-full border border-primary/15" />
								<div className="absolute inset-[26%] rounded-full border border-primary/15" />
								<div className="absolute inset-[39%] rounded-full border border-primary/15" />

								<div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/15" />
								<div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-primary/15" />

								<div className="absolute inset-[37%] rounded-full bg-primary/5 blur-xl" />

								<div className="absolute inset-0 rounded-full bg-radar-sweep animate-sweep motion-reduce:animate-none" style={{ animationDuration: `${radarPeriod}s` }}>
									<div className="absolute bottom-1/2 left-1/2 h-1/2 w-px bg-primary/70" />
								</div>

								{radarEchoes.map((echo) => {
									// Clockwise angle from twelve o'clock, matching the CSS sweep.
									const angle = (Math.atan2(echo.x - 50, 50 - echo.y) + 2 * Math.PI) % (2 * Math.PI)
									const hitTime = angle / (2 * Math.PI) * radarPeriod

									return <div
										key={echo.className}
										className={`absolute -translate-1/2 animate-radar-echo rounded-full motion-reduce:animate-none ${echo.className}`}
										style={{
											left: `${echo.x}%`,
											top: `${echo.y}%`,
											animationDuration: `${radarPeriod}s`,
											animationDelay: `${hitTime - radarPeriod}s`,
										}}
									/>
								})}
							</div>
						</div>
					</section>

					<section
						id="rules"
						className="grid grid-cols-2 border-t border-base-content/10 py-2 home-compact:py-0 lg:grid-cols-4 lg:py-3"
					>
						{features.map((feature) => (
							<div
								key={feature.title}
								className="flex flex-col justify-center px-2 py-2 sm:px-5 sm:odd:border-r sm:odd:border-base-content/10 lg:border-r lg:border-base-content/10 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
							>
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
		</>
	)
}
