import type React from "react";
import { SonarTitle } from "../components/SonarTitle";
import { useState } from "react";
import { FaDiscord, FaGoogle } from "react-icons/fa6";
import { Input } from "../components/Input";
import { authClient } from "../lib/auth-client";
import { useNavigate } from "react-router-dom";
import { isValidEmail } from "../lib/isValideEmail";
import { PasswordBar } from "../components/PasswordBar";
import { SignGoogle } from "../lib/SignGoogle";
import { SignDiscord } from "../lib/SignDiscord";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

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

	if (username.length === 0)
		errors.username = "Username is empty!"
	else {
		const { data, error } = await authClient.isUsernameAvailable({
			username: username
		})

		if (!data?.available)
			errors.username = error?.message ?? "Username alredy use!"
	}

	if (email.length === 0)
		errors.email = "Email is empty!"
	else if (!isValidEmail(email))
		errors.email = "Invalid email format!"

	if (password.length === 0)
		errors.password = "Password is empty!"

	if (password2.length === 0)
		errors.password2 = "Password is empty!"

	if (password.length > 0 && password2.length > 0 && password !== password2) {
		errors.password = "Passwords do not match!"
		errors.password2 = "Passwords do not match!"
	}

	if (!agree)
		errors.agree = "You must accept the terms!"

	return errors
}

export function Register() {
	useDocumentTitle("Sign up")
	const [errors, setErrors] = useState<Errors>({})
	const [isFocused, setIsFocused] = useState(false)
	const [password, setPassword] = useState('')

	const navigate = useNavigate()

	const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = new FormData(e.currentTarget)
		const name = form.get('username')?.toString().trim() ?? ''
		const email = form.get('email')?.toString().trim().toLowerCase() ?? ''
		const password = form.get('password')?.toString() ?? ''
		const password2 = form.get('password2')?.toString() ?? ''
		const agree = form.get('agree') ? true : false

		const newErrors = await validateRegister(name, email, password, password2, agree)
		setErrors(newErrors)

		if (Object.keys(newErrors).length > 0)
			return

		// BACK
		const { error } = await authClient.signUp.email({
			email,
			password,
			name,
			username: name
		})

		if (error) {
			if (error.status === 422)
				setErrors({ email: error.message })
			else
				setErrors({ form: error.message ?? "Login failed" })
		} else {
			navigate('/verified')
		}
	}

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<SonarTitle />

					<h2 className="card-title text-neutral-content text-xl mt-2">Join the fleet</h2>
					<p className="text-neutral-content/40 mb-2">Pick a callsign and you're ready to dive.</p>

					<button onClick={SignGoogle} className="btn btn-info"><FaGoogle /> Sign up with Google</button>
					<button onClick={SignDiscord} className="btn btn-info"><FaDiscord /> Sign up with Discord</button>

					<div className="divider text-neutral-content/40 m-0 mt-3 mb-1">OR</div>

					<form onSubmit={handleSubmit} className="min-w-full">

						<Input type="text" label="Username" name="username" errorMsg={errors.username} autoComplete="off" />
						<Input type="email" label="Email" name="email" errorMsg={errors.email} />
						<Input type="password" label="Password" name="password" errorMsg={errors.password} value={password} onFocus={() => { setIsFocused(true) }} onBlur={() => { setIsFocused(false) }} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
						{isFocused && <PasswordBar password={password} />}

						<Input type="password" label="Confirm password" name="password2" errorMsg={errors.password2} autoComplete="new-password" />

						<div className="mt-3 mb-5">
							<label className="label">
								<input type="checkbox" name="agree" className="checkbox checkbox-sm checked:checkbox-info" />
								<span className="text-neutral-content/40 select-none">I agree of the <a href="/terms" className="link-primary">Terms of Service</a> and the <a href="/privacy" className="link-primary">Privacy Policy</a>.</span>
							</label>
							{errors.agree && <span className="text-error block pb-2 pl-2">{errors.agree}</span>}
						</div>

						<button className="btn btn-soft btn-info border-neutral hover:border-info w-full">Create account</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</form>

					<p className="text-neutral-content/40 mt-3 text-center">Already aboard? <a href="login" className="link-primary">Sign in</a></p>
				</fieldset>
			</div>
		</div>
	</div>
}