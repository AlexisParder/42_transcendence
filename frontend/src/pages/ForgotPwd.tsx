import { Link, Navigate, useNavigate } from "react-router-dom";
import { SonarTitle } from "../components/SonarTitle";
import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";
import { t } from "../lib/translate";
import { Input } from "../components/Input";
import { PasswordBar } from "../components/PasswordBar";
import { isValidEmail } from "../lib/isValideEmail";

const COOLDOWN = 60

function formatMS(total: number) {
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

type stepType = "email" | "emailOtp" | "pwd"
export function ForgotPwd() {
	useDocumentTitle(t("forgot_title"))

	const navigate = useNavigate()
	const [email, setEmail] = useState("")
	const [sentAt, setSentAt] = useState<number | null>(null)
	const [now, setNow] = useState(() => Date.now())
	const [sending, setSending] = useState(false)
	const [code, setCode] = useState("")
	const [errors, setErrors] = useState<{ email?: string, form?: string, code?: string, password?: string, password2?: string }>({})
	const [step, setStep] = useState<stepType>('email')
	const [isFocused, setIsFocused] = useState(false)
	const [password, setPassword] = useState('')
	const { data: session, isPending } = authClient.useSession()

	const left = sentAt ? Math.max(0, COOLDOWN - Math.floor((now - sentAt) / 1000)) : 0

	useEffect(() => {
		if (!email) return
		(async () => {
			const res = await fetch(`/api/opt/cooldown`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email })
			})
			const data = await res.json()
			if (data.ok)
				setSentAt(data.left > 0 ? Date.now() - (COOLDOWN - data.left) * 1000 : 0)
		})()
	}, [email])

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(id)
	}, [])

	async function resend() {
		if (!email || sending || left > 0) return

		setSending(true)
		setErrors({})
		setCode("")

		try {
			const res = await fetch(`/api/opt/send`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email })
			})
			const data = await res.json()
			if (!data.ok) {
				if (data.error == "cooldown")
					setErrors({ code: t("verified_err_resend_cooldown") })
				else
					setErrors({ code: t("verified_err_resend_email") })
				return
			}
			setSentAt(Date.now())
		} catch {
			setErrors({ code: t("verified_err_resend_email") })
		}
	}

	if (session && !isPending)
		return <Navigate to="/" replace />

	const handleEmailStep: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
		setErrors({})

		const form = e.currentTarget

		if (email.length <= 0) {
			setErrors({ email: t("txt_err_email_empty") })
			return
		}
		else if (!isValidEmail(email)) {
			setErrors({ email: t("txt_err_email_invalid") })
			return
		}

		await authClient.emailOtp.requestPasswordReset({
			email,
		})
		form.reset()
		setStep("emailOtp")
	}

	const handleEmailOtpStep: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
		setErrors({})

		if (email.length <= 0 || !isValidEmail(email) || code.length < 6) {
			setStep("email")
			return
		}

		const { error } = await authClient.emailOtp.checkVerificationOtp({
			email,
			otp: code,
			type: "forget-password"
		})

		if (error) {
			setErrors({ code: t("verified_err_verify_code") })
			return
		}

		setStep("pwd")
	}

	const handlePwdStep: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
		setErrors({})

		if (email.length <= 0 || !isValidEmail(email)) {
			setStep("email")
			return
		}

		const formElem = e.currentTarget

		const password2 = new FormData(formElem).get("password2")?.toString() ?? ''

		if (password.length <= 0) {
			setErrors({ password: t("txt_err_pwd_empty") })
			return
		}

		if (password2.length <= 0) {
			setErrors({ password2: t("txt_err_pwd_empty") })
			return
		}

		if (password.length > 0 && password2.length > 0 && password !== password2) {
			setErrors({ password: t("txt_err_pwd_not_match"), password2: t("txt_err_pwd_not_match") })
			return
		}

		const { error } = await authClient.emailOtp.resetPassword({
			email,
			otp: code,
			password
		})

		if (error) {
			setErrors({ code: t("verified_err_verify_code") })
			return
		}

		setStep("email")
		setCode('')
		formElem.reset()
		navigate("/login")
	}

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<div className="flex items-center justify-between">
						<SonarTitle />
						<div>
							{step === "email" && <p className="uppercase text-xs text-neutral-content/60">{t("forgot_step", { current: 1, max: 3 })}</p>}
							{step === "emailOtp" && <p className="uppercase text-xs text-neutral-content/60">{t("forgot_step", { current: 2, max: 3 })}</p>}
							{step === "pwd" && <p className="uppercase text-xs text-neutral-content/60">{t("forgot_step", { current: 3, max: 3 })}</p>}
						</div>
					</div>

					{step === "email" && <h2 className="card-title text-neutral-content text-xl mt-2">{t("forgot_email_title")}</h2>}
					{step === "email" && <p className="text-neutral-content/40 mb-2">{t("forgot_email_desc")}.</p>}
					{step === "email" && <form onSubmit={handleEmailStep} className="min-w-full">
						<Input type="email" label={t("txt_email")} name="email" errorMsg={errors.email} value={email} onChange={e => setEmail(e.target.value)} />

						<button className="btn btn-info w-full">{t("forgot_btn_send_code")}</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</form>}

					{step === "emailOtp" && <h2 className="card-title text-neutral-content text-xl mt-2">{t("forgot_emailotp_title")}</h2>}
					{step === "emailOtp" && <p className="text-neutral-content/40 mb-2">{t("forgot_emailotp_desc", { email })}.</p>}
					{step === "emailOtp" && <form onSubmit={handleEmailOtpStep} className="min-w-full">
						<label className="otp otp-info otp-lg m-2">
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
							<input
								value={code}
								onChange={(e) => {
									setErrors({})
									setCode(e.target.value.replace(/\D/g, ""))
								}}
								type="text"
								autoComplete="one-time-code"
								inputMode="numeric"
								maxLength={6}
								pattern="[0-9]{6}"
							/>
						</label>
						{errors.code && <span className="text-error block">{errors.code}</span>}

						<button className="btn btn-info w-full">{t("btn_verify")}</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</form>}

					{step === "emailOtp" && <button onClick={resend} disabled={left > 0 || sending} className="btn btn-outline border-neutral text-neutral-content/50 hover:text-neutral-content hover:border-neutral-content/60">{t("verified_resend_email")}</button>}

					{step === "emailOtp" && left > 0 && <p className="text-center text-white/50">{t("verified_resend_email_cooldown", { left: formatMS(left) })}</p>}

					{step === "emailOtp" && <div className="text-neutral-content/50">
						<div className="flex items-center gap-2">
							<span className="flex h-6 shrink-0 items-center">
								<span className="size-1 rounded-full bg-info" />
							</span>
							<p>{t("verified_code_expiration")}</p>
						</div>
					</div>}

					{step === "emailOtp" && <p className="text-neutral-content/40 mt-3 text-center">{t("forgot_no_mail_1")} <button className="link-primary cursor-pointer" onClick={() => setStep("email")}>{t("forgot_no_mail_2")}</button>.</p>}

					{step !== "pwd" && <p className="text-neutral-content/40 mt-3 text-center">{t("forgot_remember_1")} <Link to="/login" className="link-primary">{t("forgot_remember_2")}</Link></p>}

					{step === "pwd" && <h2 className="card-title text-neutral-content text-xl mt-2">{t("forgot_pwd_title")}</h2>}
					{step === "pwd" && <p className="text-neutral-content/40 mb-2">{t("forgot_pwd_desc")}.</p>}
					{step === "pwd" && <form onSubmit={handlePwdStep} className="min-w-full">
						<Input type="password" label={t("txt_password")} name="password" errorMsg={errors.password} value={password} onFocus={() => { setIsFocused(true) }} onBlur={() => { setIsFocused(false) }} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
						{isFocused && <PasswordBar password={password} />}

						<Input type="password" label={t("txt_password_confirm")} name="password2" errorMsg={errors.password2} autoComplete="new-password" />

						<button className="btn btn-info w-full">{t("forgot_btn_reset_pwd")}</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</form>}

					{step === "pwd" && <p className="text-neutral-content/40 mt-3 text-center">{t("forgot_signed_out")}.</p>}
				</fieldset>
			</div>
		</div>
	</div>
}