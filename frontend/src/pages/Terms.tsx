import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { t } from "../lib/translate"

export function Terms() {
	useDocumentTitle(t("terms_title"))
	return <div>
		{t("terms_title")}
	</div>
}