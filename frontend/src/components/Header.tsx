import { FaRegCircle } from "react-icons/fa6";
import { authClient } from "../lib/auth-client";
import { Link, useNavigate } from "react-router-dom";
import { TbSettingsFilled } from "react-icons/tb";
import { t } from "../lib/translate";

function Links() {
	return <>
		<li><Link to="/play">{t("play_title")}</Link></li>
		<li><Link to="/leaderboard">{t("leaderboard_title")}</Link></li>
		<li><Link to="/tournaments">{t("tournaments_title")}</Link></li>
		<li><Link to="/terms">{t("rules_title")}</Link></li>
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
			<Link className="btn btn-info btn-outline mr-2" to="/settings"><TbSettingsFilled /></Link>
			<button className="btn btn-info mr-2" onClick={handleSignOut}>{t("btn_sign_out")}</button>
		</>

	return <>
		<Link className="btn btn-info btn-outline mr-2" to="/login">{t("btn_sign_in")}</Link>
		<Link className="btn btn-info" to="/register">{t("btn_sign_up")}</Link>
	</>
}

export function Header() {

	return <div className="navbar bg-base-200 shadow-sm">
		<div className="navbar-start">
			<Link className="btn btn-ghost text-xl tracking-brand" to="/"><FaRegCircle className="text-info mr-2 size-6" />SONAR</Link>
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