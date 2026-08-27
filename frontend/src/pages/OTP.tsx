import { useState } from "react";
import { SonarTitle } from "../components/SonarTitle";
import { useNavigate } from "react-router-dom";

type Errors = {
	email?: string
	password?: string
	form?: string
}

export function OTP() {
	const [errors, setErrors] = useState<Errors>({})
	const navigate = useNavigate()

	const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
	}

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<SonarTitle />

					<h2 className="card-title text-neutral-content text-xl mt-2">Verify it's you</h2>
					<p className="text-neutral-content/40 mb-2">This account has two-factor authentification enabled. Enter the six-digit code from your authentificator app.</p>

					<form onSubmit={handleSubmit} className="min-w-full">
						
						<label className="otp otp-xl mt-2 mb-4">
							<span className="border-info bg-info/10"></span>
							<span className="border-info bg-info/10"></span>
							<span className="border-info bg-info/10"></span>
							<span className="border-info bg-info/10"></span>
							<span className="border-info bg-info/10"></span>
							<span className="border-info bg-info/10"></span>
							<input type="text" autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required />
						</label>

						<button className="btn btn-soft btn-info border-neutral hover:border-info w-full">Verify and sign in</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</form>

					<div className="divider text-neutral-content/40 m-0 mt-3 mb-1"></div>

					<a href="recovery_code" className="link-primary">Use a recovery code instead</a>
					<p className="text-neutral-content/40 mt-1">Lost your device? contact the crew at <a href="mailto:ft.sonar42@gmail.com" className="link-primary" target="_blank">ft.sonar42@gmail.com</a></p>
				</fieldset>
			</div>
		</div>
	</div>
	// return <div> 
	// <p> Two-factor authentification <span className="badge badge-sm badge-outline badge-warning ml-1">REQUIRED</span>
	// </p>
	// <label className="otp otp-xl mt-2 outline-none">
	// 	<span className="outline-none border-info bg-info/10"></span>
	// 	<span className="border-info bg-info/10"></span>
	// 	<span className="border-info bg-info/10"></span>
	// 	<span className="border-info bg-info/10"></span>
	// 	<span className="border-info bg-info/10"></span>
	// 	<span className="border-info bg-info/10"></span>
	// 	<input type="text" autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" className="outline-none" required />
	// </label>
	// <p className="text-neutral-content/40 mt-2 mb-4">Six-digit code from your authentificator app.</p>
	// </div>
}