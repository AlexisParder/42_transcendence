import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { t } from "../lib/translate"

export function Terms() {
	useDocumentTitle("Terms of service")
	return <div>
		{t("terms_title")}
	</div>
}