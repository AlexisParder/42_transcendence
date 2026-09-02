import { FaRegCircle } from "react-icons/fa6";
import { authClient } from "../lib/auth-client";
import { useNavigate } from "react-router-dom";
import { TbSettingsFilled } from "react-icons/tb";
import { t } from "../lib/translate";

function Links() {
	return <>
		<li><a href="/play">{t("play_title")}</a></li>
		<li><a href="/leaderboard">{t("leaderboard_title")}</a></li>
		<li><a href="/tournaments">{t("tournaments_title")}</a></li>
		<li><a href="/rules">{t("rules_title")}</a></li>
	</>
}

function SignLinks() {
	const navigate = useNavigate()
	const { data: currentSession } = authClient.useSession()

	async function handleSignOut() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					navigate("/");
				}
			}
		})
	}

	if (currentSession)
		return <>
			<a className="btn btn-info btn-outline mr-2" href="/settings"><TbSettingsFilled /></a>
			<button className="btn btn-info mr-2" onClick={handleSignOut}>{t("btn_sign_out")}</button>
		</>

	return <>
		<a className="btn btn-info btn-outline mr-2" href="/login">{t("btn_sign_in")}</a>
		<a className="btn btn-info" href="/register">{t("btn_sign_up")}</a>
	</>
}

export function Header() {

	return <div className="navbar bg-base-200 shadow-sm">
		<div className="navbar-start">
			<div className="dropdown">
				<div tabIndex={0} role="button" className="btn btn-ghost md:hidden">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
				</div>
				<ul
					tabIndex={-1}
					className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
					<Links />
				</ul>
			</div>
			<a className="btn btn-ghost text-xl tracking-brand" href="/"><FaRegCircle className="text-info mr-2 size-6" />SONAR</a>
		</div>
		<div className="navbar-center hidden md:flex">
			<ul className="menu menu-horizontal px-1">
				<Links />
			</ul>
		</div>
		<div className="navbar-end mr-2">
			<SignLinks />
		</div>
	</div>
}