import type React from "react";
import { SonarTitle } from "../components/SonarTitle";
import { useState } from "react";
import { FaDiscord, FaGoogle } from "react-icons/fa6";
import { Input } from "../components/Input";

type Errors = {
	email?: string
	password?: string
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

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function handleLogin(email: string, password: string) {
	const res = await fetch("http://localhost:3000/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	})

	if (!res.ok) {
		const err = await res.json()
		throw new Error(err.error)
	}

	const { token } = await res.json()
	return token
}

export function Login() {
	const [errors, setErrors] = useState<Errors>({})

	const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = new FormData(e.currentTarget)
		const email = form.get('email')?.toString().trim() ?? ''
		const password = form.get('password')?.toString() ?? ''
		// const remember = form.get('remember') ? true : false

		const newErrors = validateLogin(email, password)
		setErrors(newErrors)

		if (Object.keys(newErrors).length > 0)
			return

		// BACK 
		try {
			const token = await handleLogin(email, password)
			localStorage.setItem("token", token) // a changer pour plus de secu (peut etre avec un cookie httpOnly)
		} catch (error) {
			console.log(error) // afficher une alerte (toast)
		}
	}

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<SonarTitle />

					<h2 className="card-title text-neutral-content text-xl mt-2">Immersion</h2>
					<p className="text-neutral-content/40 mb-2">Sign in to join the crew.</p>

					<button className="btn btn-info"><FaGoogle /> Continue with Google</button>
					<button className="btn btn-info"><FaDiscord /> Continue with Discord</button>

					<div className="divider text-neutral-content/40 m-0 mt-3 mb-1">OR</div>

					<form onSubmit={handleSubmit} className="min-w-full">

						<Input type="email" label="Email" name="email" errorMsg={errors.email} />
						<Input type="password" label="Password" name="password" errorMsg={errors.password} />

						<div className="flex items-center justify-between mt-3 mb-5">
							<label className="label">
								<input type="checkbox" name="remember" className="checkbox checkbox-sm checked:checkbox-info" />
								<span className="text-neutral-content/40">Keep me signed in</span>
							</label>
							<a href="forgot" className="link-primary">Forgot password?</a>
						</div>

						<button name="signBtn" className="btn btn-soft btn-info border-neutral hover:border-info w-full">Sign in</button>
					</form>

					<p className="text-neutral-content/40 mt-3 text-center">No account yet? <a href="register" className="link-primary">Create one</a></p>
				</fieldset>
			</div>
		</div>
	</div>
}