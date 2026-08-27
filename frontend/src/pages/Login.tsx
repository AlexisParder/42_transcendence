import type React from "react";
import { SonarTitle } from "../components/SonarTitle";
import { useState } from "react";
import { FaDiscord, FaGoogle } from "react-icons/fa6";
import { Input } from "../components/Input";
import { authClient } from "../lib/auth-client";
import { useNavigate } from "react-router-dom";
import { isValidEmail } from "../lib/isValideEmail";
import { SignGoogle } from "../lib/SignGoogle";
import { SignDiscord } from "../lib/SignDiscord";

type Errors = {
	email?: string
	password?: string
	form?: string
}

function validateLogin(email: string, password: string): Errors {
	const errors: Errors = {}

	if (email.length === 0)
		errors.email = "Email is empty!"
	else if (!isValidEmail(email))
		errors.email = "Invalid email format!"

	if (password.length === 0)
		errors.password = "Password is empty!"

	return errors
}

export function Login() {
	const [errors, setErrors] = useState<Errors>({})
	const navigate = useNavigate()

	const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = new FormData(e.currentTarget)
		const email = form.get('email')?.toString().trim().toLowerCase() ?? ''
		const password = form.get('password')?.toString() ?? ''
		// const remember = form.get('remember') ? true : false

		const newErrors = validateLogin(email, password)
		setErrors(newErrors)

		if (Object.keys(newErrors).length > 0)
			return

		// BACK 
		const { error } = await authClient.signIn.email({
			email,
			password
		})

		if (error)
			setErrors({ form: error.message ?? "Login failed" })
		else
			navigate('/')
	}

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<SonarTitle />

					<h2 className="card-title text-neutral-content text-xl mt-2">Immersion</h2>
					<p className="text-neutral-content/40 mb-2">Sign in to join the crew.</p>

					<button onClick={SignGoogle} className="btn btn-info"><FaGoogle /> Continue with Google</button>
					<button onClick={SignDiscord} className="btn btn-info"><FaDiscord /> Continue with Discord</button>

					<div className="divider text-neutral-content/40 m-0 mt-3 mb-1">OR</div>

					<form onSubmit={handleSubmit} className="min-w-full">

						<Input type="email" label="Email" name="email" errorMsg={errors.email} />
						<Input type="password" label="Password" name="password" errorMsg={errors.password} autoComplete="current-password" />

						<div className="flex items-center justify-between mt-3 mb-5">
							<label className="label">
								<input type="checkbox" name="remember" className="checkbox checkbox-sm checked:checkbox-info" />
								<span className="text-neutral-content/40 select-none">Keep me signed in</span>
							</label>
							<a href="forgot" className="link-primary">Forgot password?</a>
						</div>

						<button className="btn btn-soft btn-info border-neutral hover:border-info w-full">Sign in</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</form>

					<p className="text-neutral-content/40 mt-3 text-center">No account yet? <a href="register" className="link-primary">Create one</a></p>
				</fieldset>
			</div>
		</div>
	</div>
}