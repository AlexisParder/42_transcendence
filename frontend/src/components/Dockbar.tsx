// import type { IconType } from "react-icons";
// import { FaRegCircle, FaUserFriends, FaDoorOpen } from "react-icons/fa";
import { GiBombingRun } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { TbSettingsFilled, TbTournament } from "react-icons/tb";
// import { Link, Navigate, NavLink, useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import type React from "react";
// import { authClient } from "../lib/auth-client";
// import { FaBars, FaBell, FaUser } from "react-icons/fa6";
// import { Avatar } from "./Avatar";
import { t } from "../lib/translate";
// import { truncateText } from "../lib/truncateText";

// import { IoTrophy } from "react-icons/io5"
// import { IoLogoGameControllerB, IoIosStats } from "react-icons/io"
// import { FaUserGroup } from "react-icons/fa6"
// import { RiMenuFill } from "react-icons/ri"

const navItems = [
	{ to: "/play", icon: GiBombingRun, label: t("play_title") },
	{ to: "/tournaments", icon: TbTournament, label: t("tournaments_title") },
	{ to: "/leaderboard", icon: MdLeaderboard, label: t("leaderboard_title") },
	{ to: "/settings", icon: TbSettingsFilled, label: t("settings_title") },
]

// const menuItems = [
// 	{ to: "/play", icon: GiBombingRun, label: t("play_title") },
// 	{ to: "/tournaments", icon: TbTournament, label: t("tournaments_title") },
// 	{ to: "/leaderboard", icon: MdLeaderboard, label: t("leaderboard_title") },
// 	{ to: "/friends", icon: FaUserFriends, label: t("friends_title") },
// 	{ to: "/notifications", icon: FaBell, label: "Notifications" },
// 	{ to: "/profile", icon: FaUser, label: t("profile_title") },
// 	{ to: "/settings", icon: TbSettingsFilled, label: t("settings_title") },
// 	{ to: "/", icon: FaDoorOpen, label: t("quit_title") }
// ]

export function Dockbar({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex h-dvh flex-col">
			<main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
				{children}
			</main>

			<nav className="dock static md:hidden">
				{navItems.map(({ to, icon: Icon, label }) => (
					<NavLink key={to} to={to} className={({ isActive }) => (isActive ? "dock-active" : "")}>
						<Icon className="size-[1.2em]" />
						<span className="dock-label">{label}</span>
					</NavLink>
				))}
			</nav>
		</div>
	)
}