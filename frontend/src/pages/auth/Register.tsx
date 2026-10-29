import type React from "react";
import { SonarTitle } from "../../components/SonarTitle";
import { useState } from "react";
import { FaDiscord, FaGoogle } from "react-icons/fa6";
import { Input } from "../../components/Input";
import { authClient } from "../../lib/auth-client";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { isValidEmail } from "../../lib/isValideEmail";
import { PasswordBar } from "../../components/PasswordBar";
import { SignGoogle } from "../../lib/SignGoogle";
import { SignDiscord } from "../../lib/SignDiscord";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { t } from "../../lib/translate";
import { PASSWORD_MESSAGES, validatePassword } from "../../lib/password";

type Errors = {
	username?: string
	email?: string
	password?: string
	password2?: string
	agree?: string
	form?: string
}

async function validateRegister(username: string, email: string, password: string, password2: string, agree: boolean): Promise<Errors> {
	const errors: Errors = {}

	if (username.length <= 0)
		errors.username = "Username is empty!"
	else {
		const { data, error } = await authClient.isUsernameAvailable({
			username: username
		})

		if (!data?.available) {
			if (error?.code === "USERNAME_TOO_SHORT")
				errors.username = t("txt_err_user_short")
			else if (error?.code === "INVALID_USERNAME")
				errors.username = t("txt_err_user_invalid")
			else
				errors.username = t("txt_err_user_exist")
		}
	}

	if (email.length <= 0)
		errors.email = t("txt_err_email_empty")
	else if (!isValidEmail(email))
		errors.email = t("txt_err_email_invalid")

	if (password.length <= 0) {
		errors.password = t("txt_err_pwd_empty")
	} else {
		const pwdErr = validatePassword(password, [email])
		if (pwdErr)
			errors.password = PASSWORD_MESSAGES[pwdErr]
	}

	if (password2.length <= 0)
		errors.password2 = t("txt_err_pwd_empty")

	if (password.length > 0 && password2.length > 0 && password !== password2) {
		errors.password = t("txt_err_pwd_not_match")
		errors.password2 = errors.password
	}

	if (!agree)
		errors.agree = t("txt_err_agree_terms")

	return errors
}

export function Register() {
	useDocumentTitle(t("btn_sign_up"))
	const { data: session, isPending } = authClient.useSession()
	const [errors, setErrors] = useState<Errors>({})
	const [isFocused, setIsFocused] = useState(false)
	const [password, setPassword] = useState('')
	const location = useLocation()
	const navigate = useNavigate()

	if (session && !isPending)
		return <Navigate to="/" state={{ from: location }} replace />

	const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = e.currentTarget
		const formElem = new FormData(form)
		const name = formElem.get('username')?.toString().trim() ?? ''
		const email = formElem.get('email')?.toString().trim().toLowerCase() ?? ''
		const password2 = formElem.get('password2')?.toString() ?? ''
		const agree = formElem.get('agree') ? true : false

		const newErrors = await validateRegister(name, email, password, password2, agree)
		setErrors(newErrors)

		if (Object.keys(newErrors).length > 0)
			return

		// BACK
		const { error } = await authClient.signUp.email({
			email,
			password,
			name,
			username: name,
			language: "en",
			points: 0
		})

		if (error) {
			if (error.status === 422)
				setErrors({ email: t("txt_err_email_exist") })
			else
				setErrors({ form: t("sign_up_failed") })
		} else {
			await authClient.emailOtp.sendVerificationOtp({
				email,
				type: "email-verification",
			})
			navigate('/verified', { state: { email } })
		}
	}

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<SonarTitle />

					<h2 className="card-title text-neutral-content text-xl mt-2">{t("sign_up_title")}</h2>
					<p className="text-neutral-content/40 mb-2">{t("sign_up_desc")}.</p>

					<button onClick={SignGoogle} className="btn btn-info"><FaGoogle /> {t("sign_up_google")}</button>
					<button onClick={SignDiscord} className="btn btn-info"><FaDiscord /> {t("sign_up_discord")}</button>

					<div className="divider text-neutral-content/40 m-0 mt-3 mb-1">{t("txt_or").toUpperCase()}</div>

					<form onSubmit={handleSubmit} className="min-w-full">

						<Input type="text" label={t("txt_username")} name="username" errorMsg={errors.username} autoComplete="off" />
						<Input type="email" label={t("txt_email")} name="email" errorMsg={errors.email} />
						<Input type="password" label={t("txt_password")} name="password" errorMsg={errors.password} value={password} onFocus={() => { setIsFocused(true) }} onBlur={() => { setIsFocused(false) }} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
						{isFocused && <PasswordBar password={password} />}

						<Input type="password" label={t("txt_password_confirm")} name="password2" errorMsg={errors.password2} autoComplete="new-password" />

						<div className="mt-3 mb-5">
							<label className="label">
								<input type="checkbox" name="agree" className="checkbox checkbox-sm checked:checkbox-info" />
								<span className="text-neutral-content/40 select-none">{t("sign_up_agree_1")} <Link to="/terms" className="link-primary">{t("terms_title")}</Link> {t("sign_up_agree_2")} <Link to="/privacy" className="link-primary">{t("privacy_title")}</Link>.</span>
							</label>
							{errors.agree && <span className="text-error block pb-2 pl-2">{errors.agree}</span>}
						</div>

						<button className="btn btn-soft btn-info border-neutral hover:border-info w-full">{t("btn_sign_up")}</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</form>

					<p className="text-neutral-content/40 mt-3 text-center">{t("sign_up_already_acc")} <Link to="/login" className="link-primary">{t("btn_sign_in")}</Link></p>
				</fieldset>
			</div>
		</div>
	</div>
}