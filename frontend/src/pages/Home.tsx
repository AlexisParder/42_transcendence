import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
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

export function Home() {
	useDocumentTitle("Sonar")
	const [scale, setScale] = useState(1)

	useEffect(() => {
		const updateScale = () => {
			const DESIGN_WIDTH = 1440
			const DESIGN_HEIGHT = 900
			setScale(Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT) * 0.9)
		}

		updateScale()
		window.addEventListener("resize", updateScale)
		return () => window.removeEventListener("resize", updateScale)
	}, [])

	return (
		<>
			<style>{`
				
				@keyframes radarSweep {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}

				@keyframes echoHit {
					0% {
						opacity: .42;
						box-shadow: 0 0 5px currentColor;
						transform: translate(-50%, -50%) scale(1);
					}
					2% {
						opacity: 1;
						box-shadow:
							0 0 14px currentColor,
							0 0 0 5px rgba(77, 208, 207, .10);
						transform: translate(-50%, -50%) scale(1.28);
					}
					10% {
						opacity: .95;
						box-shadow: 0 0 13px currentColor;
						transform: translate(-50%, -50%) scale(1.08);
					}
					24% {
						opacity: .78;
						box-shadow: 0 0 10px currentColor;
						transform: translate(-50%, -50%) scale(1);
					}
					40% {
						opacity: .56;
						box-shadow: 0 0 7px currentColor;
						transform: translate(-50%, -50%) scale(1);
					}
					58%, 100% {
						opacity: .42;
						box-shadow: 0 0 5px currentColor;
						transform: translate(-50%, -50%) scale(1);
					}
				}

				.home-title {
					font-size: 78px;
				}

				.radar {
					width: 500px;
				}

				.radar-sweep {
					animation: radarSweep 6s linear infinite;
					transform-origin: 50% 50%;
					will-change: transform;
				}

				.radar-echo {
					position: absolute;
					transform: translate(-50%, -50%);
					animation: echoHit 6s linear infinite;
					will-change: transform, opacity, box-shadow;
				}

				.echo-a { animation-delay: 5.36s; }

				.echo-b { animation-delay: 1.94s; }

				.echo-c { animation-delay: 3.04s; }

				@media (prefers-reduced-motion: reduce) {
					.radar-sweep,
					.radar-echo {
						animation: none;
					}
				}

			`}</style>

			<div className="flex h-[100dvh] w-full items-start justify-center overflow-hidden bg-[#071014] text-[#d8e3e8]">
				<div
					className="h-[900px] w-[1440px] shrink-0 overflow-hidden"
					style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
				>
					<main className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_120px]">
					<section className="grid min-h-0 grid-cols-[57%_43%]">
						<div className="home-copy flex min-h-0 flex-col justify-center px-[72px] py-[38px]">
							<p className="mb-5 font-mono text-[15px] font-semibold tracking-[0.25em] text-[#4dd0cf]">
								42 - TRANSCENDANCE
							</p>

							<h1 className="home-title max-w-3xl font-black leading-[1.04] tracking-[-0.045em] text-[#dce6ea]">
								Naval combat,
								<br />
								in deep water.
							</h1>

							<p className="home-description mt-6 max-w-[710px] text-[21px] leading-[1.55] text-[#7f8d94]">
								Hidden grids, turn by turn, up to four fleets on one chart.
								<br className="hidden sm:block" />
								Abilities that turn a match around, ranked tournaments,
								<br className="hidden sm:block" />
								and a bot that never sleeps.
							</p>

							<div className="home-actions mt-6 flex gap-3">
								<Link
									to="/play"
									className="btn btn-info h-14 min-h-14 border-0 bg-[#4dd0cf] px-8 text-[18px] font-bold text-[#071014] shadow-none hover:bg-[#61dcda]"
								>
									Quick match
								</Link>

								<div className="flex h-14 overflow-hidden rounded-xl border border-[#29404a] bg-[#081216]">
									<input
										type="text"
										placeholder="CODE - - - - -"
										className="w-48 bg-transparent px-5 font-mono text-[16px] uppercase tracking-[0.18em] text-[#dce6ea] outline-none placeholder:text-[#536169]"
									/>
									<button className="m-2 rounded-lg bg-[#1a2a32] px-5 text-[16px] font-semibold text-[#cbd6db] transition hover:bg-[#22343d]">
										Join
									</button>
								</div>
							</div>

							<div className="home-stats mt-7 grid max-w-[710px] grid-cols-3 border-t border-[#1e2c33] pt-5">
								<div>
									<p className="font-mono text-[34px] font-black text-[#dce6ea]">2,148</p>
									<p className="mt-1 text-[15px] text-[#607078]">matches played</p>
								</div>
								<div>
									<p className="font-mono text-[34px] font-black text-[#dce6ea]">37</p>
									<p className="mt-1 text-[15px] text-[#607078]">in progress</p>
								</div>
								<div>
									<p className="font-mono text-[34px] font-black text-[#4dd0cf]">4</p>
									<p className="mt-1 text-[15px] text-[#607078]">open tournaments</p>
								</div>
							</div>
						</div>

						<div className="flex min-h-0 items-center justify-center overflow-hidden px-8">
							<div className="radar relative aspect-square shrink-0 overflow-hidden rounded-full border border-[#29414a] bg-[#09151a]">
								
								<div className="absolute inset-[13%] rounded-full border border-[#243b44]" />
								<div className="absolute inset-[26%] rounded-full border border-[#243b44]" />
								<div className="absolute inset-[39%] rounded-full border border-[#243b44]" />

								<div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#223840]" />
								<div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#223840]" />

								<div className="absolute inset-[37%] rounded-full bg-[#4dd0cf]/[0.025] blur-xl" />

								<div className="radar-sweep absolute inset-0 rounded-full">
									<div
										className="absolute inset-0 rounded-full"
										style={{
											background:
												"conic-gradient(from 0deg, rgba(77,208,207,0) 0deg, rgba(77,208,207,0) 300deg, rgba(77,208,207,0.025) 316deg, rgba(77,208,207,0.10) 336deg, rgba(77,208,207,0.26) 354deg, rgba(77,208,207,0.38) 360deg)",
										}}
									/>
									<div className="absolute left-1/2 top-0 h-1/2 w-px -translate-x-1/2 bg-[#65d8d7]/60 shadow-[0_0_8px_rgba(101,216,215,0.45)]" />
								</div>

								<div
									className="radar-echo echo-a size-3 rounded-full bg-[#47c8c8] text-[#47c8c8]"
									style={{ left: "31%", top: "26%" }}
								/>
								<div
									className="radar-echo echo-b size-3 rounded-full bg-[#d2a746] text-[#d2a746]"
									style={{ left: "66%", top: "58%" }}
								/>
								<div
									className="radar-echo echo-c size-2 rounded-full bg-[#b563a5] text-[#b563a5]"
									style={{ left: "49%", top: "74%" }}
								/>
							</div>
						</div>
					</section>

					<section
						id="rules"
						className="grid h-[120px] shrink-0 grid-cols-4 border-t border-[#203038]"
					>
						{features.map((feature, index) => (
							<div
								key={feature.title}
								className={`feature-card flex flex-col justify-center px-8 ${
									index > 0 ? "border-l border-[#203038]" : ""
								}`}
							>
								<h2 className="text-[18px] font-bold text-[#dce6ea]">
									{feature.title}
								</h2>
								<p className="mt-1.5 text-[15px] leading-5 text-[#6f7d84]">
									{feature.desc}
								</p>
							</div>
						))}
					</section>
					</main>
				</div>
			</div>
		</>
	)
}
