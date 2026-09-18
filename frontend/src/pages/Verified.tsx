import { useLocation, useNavigate } from "react-router-dom";
import { SonarTitle } from "../components/SonarTitle";
import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { IoMailUnreadOutline } from "react-icons/io5";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";
import { t } from "../lib/translate";

const COOLDOWN = 60

function formatMS(total: number) {
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

export function Verified() {
	useDocumentTitle(t("verified_page_title"))

	const navigate = useNavigate()
	const location = useLocation()
	const email = (location.state as { email?: string } | null)?.email

	const [left, setLeft] = useState(COOLDOWN)
	const [sentTime, setSentTime] = useState(1)
	const [sending, setSending] = useState(false)

	const [code, setCode] = useState("")
	const [errors, setErrors] = useState<{ code?: string }>({})
	const [verifying, setVerifying] = useState(false)

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
		if (code.length != 6) return
	
		const id = setTimeout(() => verify(code), 0)
		return () => clearTimeout(id)
	}, [code, verify])

	useEffect(() => {
		if (left <= 0) return
		const id = setTimeout(() => setLeft(left - 1), 1000)
		return () => clearTimeout(id)
	}, [left])

	useEffect(() => {
		if (sentTime <= 0) return
		const id = setTimeout(() => setSentTime(sentTime + 1), 1000)
		return () => clearTimeout(id)
	}, [sentTime])

	async function resend() {
		if (!email || sending || left > 0) return
		
		setSending(true)
		setErrors({})
		setCode("")

		const {error} = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "email-verification"
		})

		setSending(false)

		if (error) {
			setErrors({code: t("verified_err_resend_email")})
			return
		}
		
		setLeft(COOLDOWN)
	}

	if (!email)
	{
		navigate("/register", { replace: true })
		return
	}

	const { data: session, isPending } = authClient.useSession()
	if (session && !isPending)
	{
		navigate("/", { replace: true })
		return
	}

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
								<p className="text-white/50 text-[0.8rem]">{t("verified_sent_cooldown", { sentTime })}</p>
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
						<div className="flex items-center gap-2">
							<span className="flex h-6 shrink-0 items-center">
								<span className="size-1 rounded-full bg-info" />
							</span>
							<p>{t("verified_email_change")}</p>
						</div>
					</div>
				</fieldset>
			</div>
		</div>
	</div>
}