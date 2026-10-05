import { Link } from "react-router-dom"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { t } from "../../lib/translate"
import type React from "react"
import { RxCross1 } from "react-icons/rx"

export function Terms() {
	useDocumentTitle(t("terms_title"))
	return <div className="p-6">
		<p className="text-primary text-xs tracking-wide pb-2">{t("txt_legal_doc").toUpperCase()}</p>
		<h1 className="text-3xl font-bold pb-2">{t("terms_title")}</h1>
		<p className="text-sm text-neutral-content/40 pb-2">{t("terms_desc")}.</p>

		<div className="divider text-neutral-content/40 m-0 mt-3 mb-3"></div>

		<TermsSection title={`1. ${t("terms_service_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("terms_service_desc")}.</p>
		</TermsSection>
		<TermsSection title={`2. ${t("terms_acc_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("terms_acc_desc")}.</p>
		</TermsSection>
		<TermsSection title={`3. ${t("terms_fair_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("terms_fair_desc")}</p>
			<FairSection text={t("terms_fair_1")} />
			<FairSection text={t("terms_fair_2")} />
			<FairSection text={t("terms_fair_3")} />
			<FairSection text={t("terms_fair_4")} />
		</TermsSection>
		<TermsSection title={`4. ${t("terms_leaving_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("terms_leaving_desc")}.</p>
			<p className="text-sm text-neutral-content/60 pb-2 bg-warning/10 border border-warning/50 rounded-md p-2">{t("terms_leaving_warn")}.</p>
		</TermsSection>
		<TermsSection title={`5. ${t("terms_chat_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("terms_chat_desc")}.</p>
		</TermsSection>
		<TermsSection title={`6. ${t("terms_rank_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("terms_rank_desc")}.</p>
		</TermsSection>
		<TermsSection title={`7. ${t("terms_content_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("terms_content_desc")}.</p>
		</TermsSection>
		<TermsSection title={`8. ${t("terms_contact_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("terms_contact_desc")} <Link className="link-info" to="mailto:ft.sonar42@gmail.com" target="_blank">ft.sonar42@gmail.com</Link>.</p>
		</TermsSection>
	</div>
}

function TermsSection({ title, children }: { title: string, children: React.ReactNode }) {
	return <div className="flex flex-col md:flex-row mt-6">
		<div className="flex-1/3 max-w-100">
			<p className="text-info">{title}</p>
		</div>
		<div className="flex-2/3 max-w-200">
			{children}
		</div>
	</div>
}

function FairSection({ text }: { text: string }) {
	return <div className="bg-neutral/25 border border-neutral/50 rounded-md p-2 mt-2 flex items-center gap-2">
		<RxCross1 className="text-error" />
		<p className="flex-2/3 text-sm text-neutral-content/50">{text}.</p>
	</div>
}