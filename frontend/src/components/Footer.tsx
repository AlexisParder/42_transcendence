import { FaRegCircle } from "react-icons/fa6"

export function Footer() {
	return <footer className="footer md:footer-horizontal bg-base-200 items-center p-4">
		<aside className="grid-flow-col items-center">
			<FaRegCircle className="text-info size-5" />
			<p className="text-neutral-content/40">Sonar - Transcendence project, 42 School - 2026</p>
		</aside>
		<nav className="grid-flow-col gap-4 justify-self-center md:justify-self-end">
			<a href="privacy" className="link-primary">Privacy Policy</a>
			<a href="terms" className="link-primary">Terms of Service</a>
			<a href="mailto:ft.sonar42@gmail.com" target="_blank" className="link-primary">Contact</a>
		</nav>
	</footer>
}