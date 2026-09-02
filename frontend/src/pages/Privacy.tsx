import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { t } from "../lib/translate"

export function Privacy() {
	useDocumentTitle(t("privacy_title"))
	return <div>
		{t("privacy_title")}
	</div>
}