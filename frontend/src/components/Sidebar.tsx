import type { IconType } from "react-icons";
import { FaHistory, FaRegCircle, FaUserFriends, FaDoorOpen } from "react-icons/fa";
import { GiBombingRun } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { TbSettingsFilled, TbTournament } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type React from "react";
import { authClient } from "../lib/auth-client";
import { getAvatar } from "../lib/getAvatar";
import { FaBars } from "react-icons/fa6";

interface NavItem {
	to: string,
	icon: IconType,
	label: string,
	end?: boolean
}

const navItems: NavItem[] = [
	{ to: "/play", icon: GiBombingRun, label: "Play", end: true },
	{ to: "/tournaments", icon: TbTournament, label: "Tournaments" },
	{ to: "/leaderboard", icon: MdLeaderboard, label: "Leaderboard" },
	{ to: "/friends", icon: FaUserFriends, label: "Friends" },
	{ to: "/history", icon: FaHistory, label: "History" },
	{ to: "/account_settings", icon: TbSettingsFilled, label: "Settings" },
	{ to: "/", icon: FaDoorOpen, label: "Quit" }
]

export function Sidebar({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = authClient.useSession()
	useDocumentTitle("Settings")

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
										<>
											<Icon className={isActive ? "text-info" : ""} /> {label}
										</>
									)}
								</NavLink>
							</li>
						))}
					</div>

					<div className="flex items-end mb-5 p-1.5 border border-neutral rounded-md">
						<img src={getAvatar(session?.user.image)} alt="" className="rounded-md w-10 h-10 object-cover shrink-0" />
						<div className="ml-3">
							<p className="font-bold">{truncateUsername(username)}</p>
							<p className="text-warning">1,254 pts</p>
						</div>
					</div>
					<div className="flex gap-2">
						<a href="privacy" className="link-primary text-xs">Privacy</a>
						<a href="terms" className="link-primary text-xs">Terms</a>
					</div>
				</ul>
			</div>
		</div>}
	</>
}

function truncateUsername(username: string): string {
	return username.length > 11 ? (username.slice(0, 11) + "..") : username
}