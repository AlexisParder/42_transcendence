import type { IconType } from "react-icons";
import { FaHistory, FaRegCircle, FaUserFriends, FaDoorOpen } from "react-icons/fa";
import { GiBombingRun } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { TbSettingsFilled, TbTournament } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import type React from "react";
import { authClient } from "../lib/auth-client";
import { FaBars } from "react-icons/fa6";
import { Avatar } from "./Avatar";
import { t } from "../lib/translate";

interface NavItem {
	to: string,
	icon: IconType,
	label: string,
	end?: boolean
}

const navItems: NavItem[] = [
	{ to: "/play", icon: GiBombingRun, label: t("play_title"), end: true },
	{ to: "/tournaments", icon: TbTournament, label: t("tournaments_title") },
	{ to: "/leaderboard", icon: MdLeaderboard, label: t("leaderboard_title") },
	{ to: "/friends", icon: FaUserFriends, label: t("friends_title") },
	{ to: "/history", icon: FaHistory, label: t("history_title") },
	{ to: "/settings", icon: TbSettingsFilled, label: t("settings_title") },
	{ to: "/", icon: FaDoorOpen, label: t("quit_title") }
]

export function Sidebar({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = authClient.useSession()

	if (!session && !isPending)
		return <p>Pas connecté</p>

	const username = session?.user.username ? session?.user.username : ""
	return <>
		{isPending && <p>Loading...</p>}
		{!isPending && <div className="drawer md:drawer-open min-h-screen">
			<input id="sidebarDrawer" type="checkbox" className="drawer-toggle hidden" />
			<div className="drawer-content">
				<label htmlFor="sidebarDrawer" className="btn btn-ghost drawer-button md:hidden">
					<FaBars className="size-5" />
				</label>
				{children}
			</div>
			<div className="drawer-side">
				<label htmlFor="sidebarDrawer" aria-label="close sidebar" className="drawer-overlay"></label>
				<ul className="menu bg-base-200 min-h-full w-50 max-w-50 p-4 gap-1">
					<p className="btn btn-ghost text-xl tracking-brand"><FaRegCircle className="text-info mr-1 size-6" />SONAR</p>
					<div className="flex flex-col flex-1 gap-1">
						{navItems.map(({ to, icon: Icon, label, end }) => (
							<li key={to}>
								<NavLink to={to} end={end} className={({ isActive }) => (isActive ? "font-bold bg-info/15" : "")} >
									{({ isActive }) => (
										<div className="flex items-center gap-2">
											<Icon className={isActive ? "text-info" : ""} /> {label}
											{to === "/friends" && <span className="badge badge-soft badge-warning badge-sm">+99999</span>}
										</div>
									)}
								</NavLink>
							</li>
						))}
					</div>

					<div className="flex items-end mb-5 p-1.5 border border-neutral rounded-md">
						<Avatar username={session?.user.username} image={session?.user.image} size={40} />
						<div className="ml-3">
							<p className="font-bold">{truncateUsername(username)}</p>
							<p className="text-warning">1,254 {t("txt_pts")}</p>
						</div>
					</div>
					<div className="flex gap-2">
						<a href="privacy" className="link-primary text-xs">{t("privacy_short_title")}</a>
						<a href="terms" className="link-primary text-xs">{t("terms_short_title")}</a>
					</div>
				</ul>
			</div>
		</div>}
	</>
}

function truncateUsername(username: string): string {
	return username.length > 11 ? (username.slice(0, 11) + "..") : username
}