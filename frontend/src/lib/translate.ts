import { authClient } from "./auth-client"
import fr from "../locales/fr.json"
import en from "../locales/en.json"

type Translations = { [key: string]: string | Translations }
const languages: Record<string, Translations> = { fr, en }


const { data: session } = await authClient.getSession()
let language: string = session?.user.language || (navigator.language.startsWith("fr") ? "fr" : "en")

export function setTranslationLanguage(l: string) {
	language = l
}

export function getTranslationLanguage() {
	return language
}

export function t(key: string, vars?: Record<string, string | number>) {
	const raw = key.split(".").reduce<unknown>(
		(o, k) => (o as Translations | undefined)?.[k],
		languages[language]
	)

	if (typeof raw !== "string")
		return key

	return vars ? raw.replace(/\{\{(\w+)\}\}/g, (_m: string, k:string) => String(vars[k] ?? `{{${k}}}`)) : raw
}