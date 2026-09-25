const radarPeriod = 4.5
const radarEchoes = [
	{ x: 31, y: 26, className: "size-3 bg-primary text-primary" },
	{ x: 66, y: 58, className: "size-3 bg-warning text-warning" },
	{ x: 49, y: 74, className: "size-2 bg-secondary text-secondary" },
]

export function RadarEchoes() {
	return <div className="relative flex items-center justify-center size-48 md:size-80 overflow-hidden rounded-full border border-primary/20 bg-base-200 bg-radar-glow">
		<div className="absolute w-3/4 h-3/4 rounded-full border border-primary/15" />
		<div className="absolute w-1/2 h-1/2 rounded-full border border-primary/15" />
		<div className="absolute w-1/4 h-1/4 rounded-full border border-primary/15" />

		<div className="absolute h-full w-px bg-primary/15" />
		<div className="absolute w-full h-px bg-primary/15" />

		<div className="absolute w-1/4 h-1/4 rounded-full bg-primary/5 blur-xl" />

		<div className="absolute inset-0 flex justify-center rounded-full bg-radar-sweep animate-sweep motion-reduce:animate-none">
			<div className="h-1/2 w-px bg-primary/70" />
		</div>

		{radarEchoes.map((echo) => {
			const angle = (Math.atan2(echo.x - 50, 50 - echo.y) + 2 * Math.PI) % (2 * Math.PI)
			const hitTime = angle / (2 * Math.PI) * radarPeriod

			return <div
				key={echo.className}
				className={`absolute -translate-x-1/2 -translate-y-1/2 animate-radar-echo rounded-full motion-reduce:animate-none ${echo.className}`}
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