import { useEffect, useState } from "react"
import { getPasswordScore, isPasswordCheckerReady, loadPasswordChecker } from "../lib/password"
import { t } from "../lib/translate"

const Levels = [
	{ text: t("txt_pwd_weak"), percent: 25, progress: 'progress-error', label: 'text-error' },
	{ text: t("txt_pwd_medium"), percent: 50, progress: 'progress-warning', label: 'text-warning' },
	{ text: t("txt_pwd_medium"), percent: 75, progress: 'progress-warning', label: 'text-warning' },
	{ text: t("txt_pwd_strong"), percent: 100, progress: 'progress-success', label: 'text-success' },
	{ text: t("txt_pwd_strong"), percent: 100, progress: 'progress-success', label: 'text-success' },
] as const

export function PasswordBar({ password }: { password: string }) {
	const [ready, setReady] = useState(isPasswordCheckerReady())

	useEffect(() => {
		loadPasswordChecker().then(() => setReady(true))
	}, [])

	const level = Levels[ready ? getPasswordScore(password) : 0]


	return <div className="flex items-center w-full">
		<progress className={`progress ${level.progress} h-1.5`} value={level.percent} max="100"></progress>
		<span className={`pl-2 font-semibold ${level.label}`}>{level.text.toUpperCase()}</span>
	</div>
}