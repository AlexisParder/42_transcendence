import { ZxcvbnFactory } from "@zxcvbn-ts/core"
import * as common from "@zxcvbn-ts/language-common"
import * as en from "@zxcvbn-ts/language-en"
import * as fr from "@zxcvbn-ts/language-fr"

const zxcvbn = new ZxcvbnFactory({
	dictionary: { ...common.dictionary, ...en.dictionary, ...fr.dictionary },
	graphs: common.adjacencyGraphs,
	translations: en.translations
})

const Levels = [
	{ text: "weak", percent: 25, progress: 'progress-error', label: 'text-error' },
	{ text: "medium", percent: 50, progress: 'progress-warning', label: 'text-warning' },
	{ text: "medium", percent: 75, progress: 'progress-warning', label: 'text-warning' },
	{ text: "strong", percent: 100, progress: 'progress-success', label: 'text-success' },
	{ text: "strong", percent: 100, progress: 'progress-success', label: 'text-success' },
] as const

export function PasswordBar({ password }: { password: string }) {
	const { score } = zxcvbn.check(password)
	const level = Levels[score]


	return <div className="flex items-center w-full">
		<progress className={`progress ${level.progress} h-1.5`} value={level.percent} max="100"></progress>
		<span className={`pl-2 font-semibold ${level.label}`}>{level.text.toUpperCase()}</span>
	</div>
}