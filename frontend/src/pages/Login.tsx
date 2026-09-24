import type React from "react";
import { SonarTitle } from "../components/SonarTitle";
import { useState } from "react";
import { FaDiscord, FaGoogle } from "react-icons/fa6";
import { Input } from "../components/Input";
import { authClient } from "../lib/auth-client";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { isValidEmail } from "../lib/isValideEmail";
import { SignGoogle } from "../lib/SignGoogle";
import { SignDiscord } from "../lib/SignDiscord";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { t } from "../lib/translate";

type Errors = {
	email?: string
	password?: string
	form?: string
}

function validateLogin(email: string, password: string): Errors {
	const errors: Errors = {}

	if (email.length <= 0)
		errors.email = t("txt_err_email_empty")
	else if (!isValidEmail(email))
		errors.email = t("txt_err_email_invalid")

	if (password.length <= 0)
		errors.password = t("txt_err_pwd_empty")

	return errors
}

export function Login() {
	useDocumentTitle(t("btn_sign_in"))
	const { data: session, isPending } = authClient.useSession()
	const [errors, setErrors] = useState<Errors>({})
	const navigate = useNavigate()
	const location = useLocation()

	if (session && !isPending)
		return <Navigate to="/" state={{ from: location }} replace />

	const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = e.currentTarget
		const formElem = new FormData(form)
		const email = formElem.get('email')?.toString().trim().toLowerCase() ?? ''
		const password = formElem.get('password')?.toString() ?? ''
		const rememberMe = formElem.get('remember') ? true : false

		const newErrors = validateLogin(email, password)
		setErrors(newErrors)

		if (Object.keys(newErrors).length > 0)
			return

		// BACK 
		const { error } = await authClient.signIn.email({
			email,
			password,
			rememberMe
		})

		if (error)
			setErrors({ form: t("sign_in_failed") })
		else
			navigate('/')
	}

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<SonarTitle />

					<h2 className="card-title text-neutral-content text-xl mt-2">{t("sign_in_title")}</h2>
					<p className="text-neutral-content/40 mb-2">{t("sign_in_desc")}.</p>

					<button onClick={SignGoogle} className="btn btn-info"><FaGoogle /> {t("sign_in_google")}</button>
					<button onClick={SignDiscord} className="btn btn-info"><FaDiscord /> {t("sign_in_discord")}</button>

					<div className="divider text-neutral-content/40 m-0 mt-3 mb-1">{t("txt_or").toUpperCase()}</div>

					<form onSubmit={handleSubmit} className="min-w-full">

						<Input type="email" label={t("txt_email")} name="email" errorMsg={errors.email} />
						<Input type="password" label={t("txt_password")} name="password" errorMsg={errors.password} autoComplete="current-password" />

						<div className="flex items-center justify-between mt-3 mb-5">
							<label className="label">
								<input type="checkbox" name="remember" className="checkbox checkbox-sm checked:checkbox-info" />
								<span className="text-neutral-content/40 select-none">{t("sign_in_keep")}</span>
							</label>
							<Link to="/forgot-password" className="link-primary">{t("sign_in_forgot_pwd")}</Link>
						</div>

						<button className="btn btn-soft btn-info border-neutral hover:border-info w-full">{t("btn_sign_in")}</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</form>

					<p className="text-neutral-content/40 mt-3 text-center">{t("sign_in_no_acc_1")} <Link to="/register" className="link-primary">{t("sign_in_no_acc_2")}</Link></p>
				</fieldset>
			</div>
		</div>
	</div>
}