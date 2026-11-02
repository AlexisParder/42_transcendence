import type { IconType } from "react-icons";
import { FaRegCircle, FaUserFriends, FaDoorOpen } from "react-icons/fa";
import { GiBombingRun } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { TbSettingsFilled } from "react-icons/tb";
import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import type React from "react";
import { authClient } from "../lib/auth-client";
import { FaBell, FaUser, FaXmark } from "react-icons/fa6";
import { Avatar } from "./Avatar";
import { t } from "../lib/translate";
import { truncateText } from "../lib/truncateText";
import { Dockbar } from "../components/Dockbar"
import { apiPost } from "../lib/api";

interface NavItem {
	to: string,
	icon: IconType,
	label: string,
	end?: boolean
}

const navItems: NavItem[] = [
	{ to: "/play", icon: GiBombingRun, label: t("play_title"), end: true },
	{ to: "/leaderboard", icon: MdLeaderboard, label: t("leaderboard_title") },
	{ to: "/friends", icon: FaUserFriends, label: t("friends_title") },
	{ to: "/notifications", icon: FaBell, label: t("notifications_title") },
	{ to: "/profile", icon: FaUser, label: t("profile_title") },
	{ to: "/settings", icon: TbSettingsFilled, label: t("settings_title") },
	{ to: "/", icon: FaDoorOpen, label: t("quit_title") }
]

export function Sidebar({ children, guest = false }: { children: React.ReactNode, guest?: boolean }) {
	const { data: session, isPending } = authClient.useSession()
	const [open, setOpen] = useState(false)
	const [points, setPoints] = useState(session?.user.points ?? 0)
	const userId = session?.user.id

	useEffect(() => {
		if (!userId)
			return

		async function loadPoints() {
			try {
				const { ok, data } = await apiPost("/api/get-user-points")

				if (!ok)
					return

				setPoints(data.points ?? 0)
			} catch (error) {
				console.error("load points:", error)
			}
		}

		loadPoints()
	}, [userId])

	if (!guest && isPending)
		return <p>{t("sidebar_loading")}</p>

	const username = session?.user.username ? session?.user.username : ""
	return <>
		<div className={`drawer ${guest ? "flex-1 min-h-0" : "md:drawer-open min-h-screen"}`}>
			<input id="sidebarDrawer" type="checkbox" className="drawer-toggle hidden" checked={open} onChange={e => setOpen(e.target.checked)} />
			<div className={`drawer-content ${guest ? "min-h-0" : ""}`}>
				<Dockbar className={guest ? "h-full" : undefined} fixed={guest}>{children}</Dockbar>
			</div>
			<div className="drawer-side z-50">
				<label htmlFor="sidebarDrawer" aria-label={t("sidebar_close")} className="drawer-overlay"></label>
				<ul className="menu bg-base-200 min-h-full w-screen md:w-50 md:max-w-50 p-4 gap-1" onClick={e => (e.target as HTMLElement).closest("a") && setOpen(false)}>
					<label htmlFor="sidebarDrawer" aria-label={t("sidebar_close")} className="btn btn-ghost btn-square absolute top-4 right-4 md:hidden">
						<FaXmark className="size-6" />
					</label>
					<Link to="/" className="btn btn-ghost text-2xl md:text-xl tracking-brand"><FaRegCircle className="text-info mr-1 size-7 md:size-6" />SONAR</Link>
					<div className="flex flex-col flex-1 gap-1 mt-2 md:mt-0">
						{navItems.map(({ to, icon: Icon, label, end }) => (
							<li key={to}>
								<NavLink to={to} end={end} className={({ isActive }) => (isActive ? "font-bold bg-info/15" : "")} >
									{({ isActive }) => (
										<div className="flex items-center gap-3 md:gap-2 text-lg md:text-sm">
											<Icon className={`size-5 md:size-4 ${isActive ? "text-info" : ""}`} /> {label}
										</div>
									)}
								</NavLink>
							</li>
						))}
					</div>

					{session && <div className="flex items-center mb-5 p-2 md:p-1.5 border border-neutral rounded-md">
						<div className="md:hidden"><Avatar username={session.user.username} image={session.user.image} size={52} /></div>
						<div className="hidden md:flex"><Avatar username={session.user.username} image={session.user.image} size={40} /></div>
						<div className="ml-3 text-lg md:text-sm">
							<p className="font-bold md:hidden">{truncateText(username, 20)}</p>
							<p className="font-bold hidden md:block">{truncateText(username, 11)}</p>
							<p className="text-warning">{points.toLocaleString()} {t("txt_pts")}</p>
						</div>
					</div>}
					<div className="flex gap-3 md:gap-2">
						<Link to="/privacy" className="link-primary text-sm md:text-xs">{t("privacy_short_title")}</Link>
						<Link to="/terms" className="link-primary text-sm md:text-xs">{t("terms_short_title")}</Link>
					</div>
				</ul>
			</div>
		</div>
	</>
}
