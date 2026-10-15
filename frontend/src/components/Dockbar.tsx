import { GiBombingRun } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { TbTournament } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import type React from "react";
import { FaBars } from "react-icons/fa6";
import { t } from "../lib/translate";

const navItems = [
	{ to: "/play", icon: GiBombingRun, label: t("play_title") },
	{ to: "/tournaments", icon: TbTournament, label: t("tournaments_title") },
	{ to: "/leaderboard", icon: MdLeaderboard, label: t("leaderboard_title") },
]

export function Dockbar({ children, className = "h-dvh", fixed = false }: { children: React.ReactNode, className?: string, fixed?: boolean }) {
	return (
		<div className={`flex flex-col ${className}`}>
			<main className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${fixed ? "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0" : ""}`}>
				{children}
			</main>

			<nav className={`dock md:hidden ${fixed ? "fixed z-40" : "static"}`}>
				{navItems.map(({ to, icon: Icon, label }) => (
					<NavLink key={to} to={to} className={({ isActive }) => (isActive ? "dock-active" : "")}>
						<Icon className="size-[1.2em]" />
						<span className="dock-label">{label}</span>
					</NavLink>
				))}
				<label htmlFor="sidebarDrawer">
					<FaBars className="size-[1.2em]" />
					<span className="dock-label">{t("menu_title")}</span>
				</label>
			</nav>
		</div>
	)
}
