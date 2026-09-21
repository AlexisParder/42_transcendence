import { FaRegCircle } from "react-icons/fa6"
import { t } from "../lib/translate"
import { Link } from "react-router-dom"

export function Footer() {
	return <footer className="footer md:footer-horizontal bg-base-200 items-center p-4 hidden md:grid">
		<aside className="grid-flow-col items-center">
			<FaRegCircle className="text-info size-5" />
			<p className="text-neutral-content/40">Sonar - {t("txt_footer")} - 2026</p>
		</aside>
		<nav className="grid-flow-col gap-4 justify-self-center md:justify-self-end">
			<Link to="/privacy" className="link-primary">{t("privacy_title")}</Link>
			<Link to="/terms" className="link-primary">{t("terms_title")}</Link>
			<Link to="mailto:ft.sonar42@gmail.com" target="_blank" className="link-primary">{t("contact_title")}</Link>
		</nav>
	</footer>
}