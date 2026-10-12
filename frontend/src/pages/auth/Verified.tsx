import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { SonarTitle } from "../../components/SonarTitle";
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { IoMailUnreadOutline } from "react-icons/io5";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "../../lib/auth-client";
import { t } from "../../lib/translate";
import { formatMS } from "../../lib/formatTime";
import { apiPost } from "../../lib/api";

const COOLDOWN = 60

export function Verified() {
	useDocumentTitle(t("verified_page_title"))

	const navigate = useNavigate()
	const location = useLocation()
	const email = (location.state as { email?: string } | null)?.email

	const [sentAt, setSentAt] = useState<number | null>(null)
	const [now, setNow] = useState(() => Date.now())
	const [sending, setSending] = useState(false)

	const [code, setCode] = useState("")
	const [errors, setErrors] = useState<{ code?: string }>({})
	const [verifying, setVerifying] = useState(false)

	const { data: session, isPending } = authClient.useSession()

	const left = sentAt ? Math.max(0, COOLDOWN - Math.floor((now - sentAt) / 1000)) : 0

	const verify = useCallback(async (otp: string) => {
		if (verifying) return
		setVerifying(true)

		const { error } = await authClient.emailOtp.verifyEmail({ email: email!, otp })

		if (error) {
			if (error.code == "INVALID_OTP" || error.status == 400)
				setErrors({ code: t("verified_err_verify_code") })
			setCode("")
			setVerifying(false)
			return
		}
		navigate("/", { replace: true })
	}, [email, navigate, verifying])

	useEffect(() => {
		if (!email) return
		(async () => {
			const {ok, data} = await apiPost("/api/otp/cooldown", { email })

			if (ok)
				setSentAt(data.left > 0 ? Date.now() - (COOLDOWN - data.left) * 1000 : 0)
		})()
	}, [email])

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(id)
	}, [])

	useEffect(() => {
		if (code.length != 6) return

		const id = setTimeout(() => verify(code), 0)
		return () => clearTimeout(id)
	}, [code, verify])

	async function resend() {
		if (!email || sending || left > 0) return

		setSending(true)
		setErrors({})
		setCode("")

		try {
			const {ok, data} = await apiPost("/api/otp/send", { email })

			if (!ok && data.error) {
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

	if (!email)
		return <Navigate to="/register" replace />

	if (session && !isPending)
		return <Navigate to="/" replace />

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<SonarTitle />

					<div className="flex flex-col text-center items-center justify-center gap-5">
						<div className="bg-info/10 border border-info/50 rounded-full">
							<IoMailUnreadOutline className="text-info size-10 m-6" />
						</div>
						<h2 className="font-bold text-neutral-content text-2xl">{t("verified_title")}</h2>
						<p className="text-neutral-content/50 text-[0.9rem]">{t("verified_desc")}</p>
					</div>
					<div className="w-full mt-3 grid gap-3 pb-2 border-b-2 border-white/10">
						<div className="flex bg-info/10 border border-info/50 rounded-lg p-3 items-center gap-3">
							<IoMailUnreadOutline className="text-info size-5" />
							<div className="flex-1">
								<p className="font-bold text-sm">{email}</p>
							</div>
							<button onClick={() => navigate("/register")} className="text-info hover:link">{t("verified_wrong_address")}</button>
						</div>

						<div className="text-center">
							<p className="text-neutral-content/40 text-xs mt-2">{t("verified_verification_code")}</p>
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
									disabled={verifying}
									type="text"
									autoComplete="one-time-code"
									inputMode="numeric"
									maxLength={6}
									pattern="[0-9]{6}"
								/>
							</label>
							{errors.code && <span className="text-error block">{errors.code}</span>}
						</div>

						<button onClick={resend} disabled={left > 0 || sending} className="btn btn-outline border-neutral text-neutral-content/50 hover:text-neutral-content hover:border-neutral-content/60">{t("verified_resend_email")}</button>
						{left > 0 && <p className="text-center text-white/50">{t("verified_resend_email_cooldown", { left: formatMS(left) })}</p>}
					</div>
					<div className="text-white/50">
						<div className="flex items-center gap-2">
							<span className="flex h-6 shrink-0 items-center">
								<span className="size-1 rounded-full bg-info" />
							</span>
							<p>{t("verified_code_expiration")}</p>
						</div>
						<div className="flex items-center gap-2">
							<span className="flex h-6 shrink-0 items-center">
								<span className="size-1 rounded-full bg-info" />
							</span>
							<p>{t("verified_no_mail")}</p>
						</div>
					</div>
				</fieldset>
			</div>
		</div>
	</div>
}