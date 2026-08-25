// Code à refaire (la maquette a changée)
export function OTP() {
	return <div> 
		<p> Two-factor authentification <span className="badge badge-sm badge-outline badge-warning ml-1">REQUIRED</span>
		</p>
		<label className="otp otp-xl mt-2">
			<span className="border-info bg-info/10"></span>
			<span className="border-info bg-info/10"></span>
			<span className="border-info bg-info/10"></span>
			<span className="border-info bg-info/10"></span>
			<span className="border-info bg-info/10"></span>
			<span className="border-info bg-info/10"></span>
			<input type="text" autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required />
		</label>
		<p className="text-neutral-content/40 mt-2 mb-4">Six-digit code from your authentificator app.</p>
	</div>
}