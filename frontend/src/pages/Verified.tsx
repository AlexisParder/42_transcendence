import { Navigate, useLocation } from "react-router-dom";
import { SonarTitle } from "../components/SonarTitle";
import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { IoMailUnreadOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";

const COOLDOWN = 60

function formatMS(total: number) {
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

export function Verified() {
	useDocumentTitle("Verifed email")

	const location = useLocation()
	const email = (location.state as { email?: string } | null)?.email

	const [left, setLeft] = useState(COOLDOWN)
	const [sending, setSending] = useState(false)

	useEffect(() => {
		if (left <= 0) return
		const id = setTimeout(() => setLeft(left - 1), 1000)
		return () => clearTimeout(id)
	}, [left])

	// useEffect(() => {
	// 	const id = setInterval(async () => {
	// 		const {data} = await authClient.getSession({
	// 			query: { disableCookieCache: true }
	// 		})
	// 		if (data?.user.emailVerified)
	// 			return <Navigate to="/" replace />
	// 	}, 5000)
	// 	return () => clearTimeout(id)
	// }, [Navigate])

	async function resend() {
		if (!email) return
		setSending(true)
		await authClient.sendVerificationEmail({email, callbackURL: "/login"})
		setSending(false)
		setLeft(COOLDOWN)
	}

	if (!email)
		return <Navigate to="/register" replace />

	return <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
		<div className="card bg-base-200 max-w-md w-full shadow-xl border border-neutral">
			<div className="card-body">
				<fieldset className="fieldset p-0">
					<SonarTitle />

					<div className="flex flex-col text-center items-center justify-center gap-5">
						<div className="bg-info/10 border border-info/50 rounded-full">
							<IoMailUnreadOutline className="text-info size-10 m-6" />
						</div>
						<h2 className="font-bold text-neutral-content text-2xl">Check your inbox</h2>
						<p className="text-neutral-content/50 text-[0.9rem]">We've sent a confirmation link to your address. Click it to active your account - you can't sign in util it's verified.</p>
					</div>
					<div className="w-full mt-3 grid gap-3 pb-2 border-b-2 border-white/10">
						<div className="flex bg-info/10 border border-info/50 rounded-lg p-3 items-center gap-3">
							<IoMailUnreadOutline className="text-info size-5" />
							<div className="flex-1">
								<p className="font-bold text-sm">{email}</p>
								<p className="text-white/50 text-[0.8rem]">Sent 12 seconds ago</p>
							</div>
							<button className="text-info hover:link">Wrong address?</button>
						</div>
						<button onClick={resend} disabled={left > 0 || sending} className="btn btn-outline border-neutral text-neutral-content/50 hover:text-neutral-content hover:border-neutral-content/60">Resend the mail</button>
						{left > 0 && <p className="text-center text-white/50">Available again in {formatMS(left)}</p>}
					</div>
					<div className="text-white/50">
						<div className="flex items-center gap-2">
							<span className="flex h-6 shrink-0 items-center">
								<span className="size-1 rounded-full bg-info" />
							</span>
							<p>The link expires in 24 hours.</p>
						</div>
						<div className="flex items-center gap-2">
							<span className="flex h-6 shrink-0 items-center">
								<span className="size-1 rounded-full bg-info" />
							</span>
							<p>Nothing arrived? Check your spam folder, then try resending.</p>
						</div>
						<div className="flex items-center gap-2">
							<span className="flex h-6 shrink-0 items-center">
								<span className="size-1 rounded-full bg-info" />
							</span>
							<p>Changing your email in Settings starts this over - your old address stays active the new one is confirmed.</p>
						</div>
					</div>
				</fieldset>
			</div>
		</div>
	</div>
}