const radarPeriod = 4.5
const radarEchoes = [
	{ x: 31, y: 26, className: "size-3 bg-primary text-primary" },
	{ x: 66, y: 58, className: "size-3 bg-warning text-warning" },
	{ x: 49, y: 74, className: "size-2 bg-secondary text-secondary" },
]

export function RadarEchoes() {
	return <div className="home-compact:size-16 relative aspect-square w-[min(100%,18dvh)] md:w-[min(100%,48dvh)] md:max-w-md overflow-hidden rounded-full border border-primary/20 bg-base-200 bg-radar-glow">
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
}