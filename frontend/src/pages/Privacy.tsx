import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { t } from "../lib/translate"

export function Privacy() {
	useDocumentTitle("Privacy policy")
	return <div>
		{t("privacy_title")}
	</div>
}