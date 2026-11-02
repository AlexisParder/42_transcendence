import fr from "../locales/fr.json" with { type: "json" }
import en from "../locales/en.json" with { type: "json" }
import es from "../locales/es.json" with { type: "json" }
import { prisma } from "../db/client.ts"

type Translations = { [key: string]: string | Translations }
const languages: Record<string, Translations> = { fr, en, es }

const defaultLanguage = "en"

export function resolveLanguage(language: string | null | undefined) {
	if (!language)
		return defaultLanguage
	const short = language.slice(0, 2).toLowerCase()
	return short in languages ? short : defaultLanguage
}

export function isSupportedLanguage(language: unknown): language is string {
	return typeof language === "string" && Object.hasOwn(languages, language)
}

export async function getUserLanguage(where: { id: string } | { email: string }) {
	const user = await prisma.user.findUnique({ where, select: { language: true } })
	return user ? resolveLanguage(user.language) : null
}

function lookup(language: string, key: string) {
	return key.split(".").reduce<unknown>(
		(o, k) => (o as Translations | undefined)?.[k],
		languages[language]
	)
}

export function t(language: string | null | undefined, key: string, vars?: Record<string, string | number>) {
	const raw = lookup(resolveLanguage(language), key) ?? lookup(defaultLanguage, key)

	if (typeof raw !== "string")
		return key

	return vars ? raw.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => String(vars[k] ?? `{{${k}}}`)) : raw
}
