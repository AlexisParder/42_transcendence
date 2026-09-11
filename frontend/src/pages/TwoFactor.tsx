import { useState } from "react";
import { SonarTitle } from "../components/SonarTitle";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { t } from "../lib/translate";
import { authClient } from "../lib/auth-client";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Input } from "../components/Input";

type Errors = {
	code?: string
	form?: string
}

type OTPType = "app" | "recovery"
export function TwoFactor() {
	useDocumentTitle(t("otp_title"))
	const { data: session, isPending } = authClient.useSession()
	const [step, setStep] = useState<OTPType>('app')
	const [errors, setErrors] = useState<Errors>({})
	const [codeTotp, setCodeTotp] = useState("")
	const location = useLocation()
	const navigate = useNavigate()

	if (session && !isPending)
		return <Navigate to="/" state={{ from: location }} replace />

	const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = e.currentTarget
		const trustDevice = new FormData(form).get('trust') ? true : false

		if (codeTotp.length <= 0) {
			setErrors({ code: t("txt_err_2fa_empty") })
			return
		} else if (codeTotp.length !== 6) {
			setErrors({ code: t("txt_err_2fa_size") })
			return
		}

		const { error } = await authClient.twoFactor.verifyTotp({
			code: codeTotp,
			trustDevice
		})

		if (error) {
			setErrors({ form: t("txt_err_2fa_invalid") })
			return
		}
		navigate("/")
	}

	const handleSubmitRecovery: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = e.currentTarget
		const code = new FormData(form).get("code")?.toString().trim() as string
		const trustDevice = new FormData(form).get('trust') ? true : false

		if (code.length <= 0) {
			setErrors({ code: t("txt_err_2fa_empty") })
			return
		}

		const { error } = await authClient.twoFactor.verifyBackupCode({
			code,
			trustDevice
		})

		if (error) {
			setErrors({ form: t("txt_err_2fa_invalid") })
			return
		}
		navigate("/")
	}

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<SonarTitle />

					<h2 className="card-title text-neutral-content text-xl mt-2">{t("otp_title")}</h2>
					<p className="text-neutral-content/40 mb-2">{t("otp_desc")}.</p>

					{step === "app" && <form onSubmit={handleSubmit} className="min-w-full">
						<label className="otp otp-xl mt-2">
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<input type="text" value={codeTotp} onChange={(e) => setCodeTotp(e.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" />
						</label>
						{errors.code && <span className="text-error block pl-2">{errors.code}</span>}

						<label className="label mt-4">
							<input type="checkbox" name="trust" className="checkbox checkbox-sm checked:checkbox-info" />
							<span className="text-neutral-content/40 select-none">{t("otp_trust_device")}</span>
						</label>

						<button className="btn btn-soft btn-info border-neutral hover:border-info w-full mt-2">{t("btn_verify")}</button>
						{errors.form && <span className="text-error block pl-2">{errors.form}</span>}
					</form>}

					{step === "recovery" && <form onSubmit={handleSubmitRecovery} className="min-w-full">
						<Input type="text" name="code" label={t("otp_recovery_code_label")} errorMsg={errors.code} />

						<label className="label mt-2">
							<input type="checkbox" name="trust" className="checkbox checkbox-sm checked:checkbox-info" />
							<span className="text-neutral-content/40 select-none">{t("otp_trust_device")}</span>
						</label>

						<button className="btn btn-soft btn-info border-neutral hover:border-info w-full mt-2">{t("btn_verify")}</button>
						{errors.form && <span className="text-error block pl-2">{errors.form}</span>}
					</form>}

					<div className="divider text-neutral-content/40 m-0 mt-3 mb-1"></div>

					{step === "app" && <button onClick={() => {
						setStep("recovery")
						setErrors({})
					}} className="link-primary">{t("otp_use_recovery_code")}</button>}
					{step === "recovery" && <button onClick={() => {
						setStep("app")
						setErrors({})
					}} className="link-primary">{t("otp_use_app_code")}</button>}
					<p className="text-neutral-content/40 mt-1 text-center">{t("otp_lost_device")} <Link to="mailto:ft.sonar42@gmail.com" className="link-primary" target="_blank">ft.sonar42@gmail.com</Link></p>
				</fieldset>
			</div>
		</div>
	</div>
}