import type { IconType } from "react-icons";
import { FaHistory, FaRegCircle, FaUserFriends } from "react-icons/fa";
import { GiBombingRun } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { TbSettingsFilled, TbTournament } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

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
	{ to: "/account_settings", icon: TbSettingsFilled, label: "Settings" }
]

export function Sidebar() {
	useDocumentTitle("Settings")
	return <div className="drawer drawer-open">
		<input id="my-drawer-3" type="checkbox" className="drawer-toggle hidden" />
		<div className="drawer-side">
			<ul className="menu bg-base-200 min-h-full max-w-50 p-4 gap-1">
				<p className="btn btn-ghost text-xl tracking-brand"><FaRegCircle className="text-info mr-1 size-6" />SONAR</p>
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

				<div className="flex flex-1 items-end mb-5">
					<img src="https://placehold.co/40x40" alt="" />
					<div className="ml-3">
						<p className="font-bold">alexis</p>
						<p className="text-warning">1,254 pts</p>
					</div>
				</div>
				<div className="flex gap-2">
					<a href="privacy" className="link-primary text-xs">Privacy</a>
					<a href="terms" className="link-primary text-xs">Terms</a>
				</div>
			</ul>
		</div>
	</div>
}