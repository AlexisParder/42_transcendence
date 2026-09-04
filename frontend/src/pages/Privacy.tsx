import type React from "react"
import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { t } from "../lib/translate"
import { Link } from "react-router-dom"

export function Privacy() {
	useDocumentTitle(t("privacy_title"))
	return <div className="p-6">
		<p className="text-primary text-xs tracking-wide pb-2">{t("txt_legal_doc").toUpperCase()}</p>
		<h1 className="text-3xl font-bold pb-2">{t("privacy_title")}</h1>
		<p className="text-sm text-neutral-content/40 pb-2">{t("privacy_desc")}.</p>

		<div className="divider text-neutral-content/40 m-0 mt-3 mb-3"></div>

		<PrivacySection title={`1. ${t("privacy_data_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("privacy_data_desc")}</p>
			<DataSection title={t("privacy_data_acc_title")} desc={t("privacy_data_acc_desc")} />
			<DataSection title={t("privacy_data_sec_title")} desc={t("privacy_data_sec_desc")} />
			<DataSection title={t("privacy_data_game_title")} desc={t("privacy_data_game_desc")} />
			<DataSection title={t("privacy_data_soc_title")} desc={t("privacy_data_soc_desc")} />
			<DataSection title={t("privacy_data_tec_title")} desc={t("privacy_data_tec_desc")} />
		</PrivacySection>
		<PrivacySection title={`2. ${t("privacy_need_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("privacy_need_desc")}.</p>
		</PrivacySection>
		<PrivacySection title={`3. ${t("privacy_others_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("privacy_others_desc")}.</p>
		</PrivacySection>
		<PrivacySection title={`4. ${t("privacy_cookies_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("privacy_cookies_desc")}.</p>
		</PrivacySection>
		<PrivacySection title={`5. ${t("privacy_ret_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("privacy_ret_desc")}.</p>
		</PrivacySection>
		<PrivacySection title={`6. ${t("privacy_rights_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("privacy_rights_desc")}.</p>
			<Link className="btn btn-info btn-outline btn-sm" to="/settings">{t("settings_title")}</Link>
		</PrivacySection>
		<PrivacySection title={`7. ${t("privacy_contact_title")}`}>
			<p className="text-sm text-neutral-content/60 pb-2">{t("privacy_contact_desc")} <Link className="link-info" to="mailto:ft.sonar42@gmail.com" target="_blank">ft.sonar42@gmail.com</Link>.</p>
		</PrivacySection>
	</div>
}

function PrivacySection({ title, children }: { title: string, children: React.ReactNode }) {
	return <div className="flex flex-col md:flex-row mt-6">
		<div className="flex-1/3 max-w-100">
			<p className="text-info">{title}</p>
		</div>
		<div className="flex-2/3 max-w-200">
			{children}
		</div>
	</div>
}

function DataSection({ title, desc }: { title: string, desc: string }) {
	return <div className="bg-neutral/25 border border-neutral/50 rounded-md p-2 mt-2 flex items-center">
		<p className="flex-1/3 text-sm font-semibold text-info">{title.toUpperCase()}</p>
		<p className="flex-2/3 text-sm text-neutral-content/50">{desc}.</p>
	</div>
}