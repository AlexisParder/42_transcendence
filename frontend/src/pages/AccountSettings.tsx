import type React from "react"
import type { SessionRow } from "../hooks/useSessions"
import { Input } from "../components/Input"
import { Sidebar } from "../components/Sidebar"
import { PasswordBar } from "../components/PasswordBar"
import { useEffect, useState } from "react"
import { MdWarning } from "react-icons/md"
import { authClient } from "../lib/auth-client"
import { getAvatar } from "../lib/getAvatar"
import { prettyUA } from "../lib/prettyUA"
import { useSessions } from "../hooks/useSessions"

type Errors = {
	username?: string
	email?: string
	currPassword?: string
	password?: string
	password2?: string
	form?: string
}

export function AccountSettings() {
	const { data: session } = authClient.useSession()
	const { sessions, revokeSession, revokeOthers } = useSessions()

	const [errors, setErrors] = useState<Errors>({})
	const [isFocused, setIsFocused] = useState(false)
	const [currPassword, setCurrPassword] = useState('')
	const [password, setPassword] = useState('')
	const [password2, setPassword2] = useState('')
	const [hasPwd, setHasPwd] = useState<boolean | null>()

	const isOTPEnabled = session?.user.twoFactorEnabled ? true : false

	useEffect(() => {
		authClient.listAccounts().then(({ data }) => {
			setHasPwd(!!data?.some(acc => acc.providerId === "credential"))
		})
	}, [])

	const handleSubmitChangePwd: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const newErrors: Errors = {}

		if (password.length === 0)
			newErrors.password = "Password is empty!"

		if (password2.length === 0)
			newErrors.password2 = "Password is empty!"

		if (password.length > 0 && password2.length > 0 && password !== password2) {
			newErrors.password = "Passwords do not match!"
			newErrors.password2 = "Passwords do not match!"
		}

		if (hasPwd === true) {
			if (currPassword.length === 0)
				newErrors.currPassword = "Password is empty!"
		}

		setErrors(newErrors)
		if (Object.keys(newErrors).length > 0)
			return

		if (hasPwd === true) {
			const { error } = await authClient.changePassword({
				currentPassword: currPassword,
				newPassword: password,
				revokeOtherSessions: true,
			})

			if (error)
				setErrors({ form: error.message ?? "Update password failed" })
			else {
				setCurrPassword('')
				setPassword('')
				setPassword2('')
				// ajouter une notif de success
			}

		} else {
			const res = await fetch("/api/set-pwd", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				body: JSON.stringify({ newPassword: password }),
			})

			if (res.ok) {
				setHasPwd(true);
				setCurrPassword('')
				setPassword('')
				setPassword2('')
				// ajouter une notif de success
			}
		}
	}

	return <Sidebar>
		<div className="p-4">
			<h1 className="text-xl font-bold">Settings</h1>
			<p className="text-sm text-neutral-content/40">Manage your identity, security, and how you appear to other palyers.</p>

			<div className="divider text-neutral-content/40 m-0 mt-3 mb-3"></div>

			<SectionSetting title="Profile" description="Your callsign and avatar are visible to every player." hasDividerBottom={true}>
				<div className="flex gap-2 items-center">
					<img src={getAvatar(session?.user.image)} width={64} height={64} alt="" className="rounded-md" />
					<button className="btn btn-outline border-neutral">Upload new</button>
					<button className="btn btn-outline border-neutral">Remove</button>
				</div>
				<div className="flex mt-2 items-center w-full gap-2">
					<InputWithText text="callsign">
						<Input type="text" name="username" label="Username" defaultValue={session?.user.username ? session?.user.username : ''} useLabel={false} />
					</InputWithText>
					<InputWithText text="display language">
						<select defaultValue="en" className="select outline-none focus:border-info w-full bg-abyss-700">
							<option value="fr">French</option>
							<option value="en">English</option>
						</select>
					</InputWithText>
				</div>
				<div>
					<InputWithText text="email">
						<Input type="email" name="email" label="Email" defaultValue={session?.user.email ? session?.user.email : ''} useLabel={false} />
					</InputWithText>
				</div>
			</SectionSetting>

			<SectionSetting title="Password" description="Changing it signs you ot of every other session." hasDividerBottom={true}>
				<form onSubmit={handleSubmitChangePwd}>
					{hasPwd === true && <div>
						<InputWithText>
							<Input type="password" name="currPassword" label="Current password" onChange={e => setCurrPassword(e.target.value)} value={currPassword} autoComplete="current-password" errorMsg={errors.currPassword} customLabelStyle="bg-base-100" />
						</InputWithText>
					</div>}
					<div className="flex gap-2">
						<InputWithText>
							<Input type="password" name="password" label="new password" onFocus={() => { setIsFocused(true) }} onBlur={() => { setIsFocused(false) }} onChange={e => setPassword(e.target.value)} value={password} autoComplete="new-password" errorMsg={errors.password} customLabelStyle="bg-base-100" />
						</InputWithText>
						<InputWithText>
							<Input type="password" name="password2" label="Confirm password" onChange={e => setPassword2(e.target.value)} value={password2} autoComplete="new-password" errorMsg={errors.password2} customLabelStyle="bg-base-100" />
						</InputWithText>
					</div>
					{isFocused && <PasswordBar password={password} />}
					<button className="btn btn-soft btn-info border-info/50 hover:border-info mt-2">Update password</button>
					{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
				</form>
			</SectionSetting>

			<SectionSetting title="Two-factor authentification" description="A six-digit code from your authentificator app, asked after your password." hasDividerBottom={true}>
				<SectionOTP isEnabled={isOTPEnabled} />
				<div className="flex gap-2 pt-3 pb-3">
					<button className="btn btn-outline border-neutral">Show recovery codes</button>
					<button className="btn btn-outline border-neutral">Re-scan QR code</button>
					<button className={`btn btn-outline btn-${isOTPEnabled ? 'error' : 'info'}`}>{isOTPEnabled ? 'Disabled' : 'Enable'}</button>
				</div>
				<p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4"><MdWarning className="text-warning" /> <span className="text-xs text-neutral-content/60">Disabling two-factor authentification requires your password and takes effect immediately.<br />Ranked tournament hosts may require it.</span></p>
			</SectionSetting>

			<SectionSetting title="Active sessions" description="Devices currently signed in to your account" hasDividerBottom={true}>
				<div className="max-h-37 overflow-y-auto scrollbar-thin">
					<SessionsDisplay sessions={sessions} onRevoke={revokeSession} />
				</div>
				<button onClick={revokeOthers} className="link-error text-xs font-bold cursor-pointer">Sign out everywhere else</button>
			</SectionSetting>

			<SectionSetting title="Danger zone" titleColor="text-error" description="These actions can't be undone">
				<div className="flex border border-neutral rounded-md p-4 items-center mt-2">
					<div className="flex-1">
						<p className="text-sm">Download my data</p>
						<p className="text-xs text-neutral-content/60">Profile, match history and messages as JSON.</p>
					</div>
					<div>
						<button className="btn btn-outline border-neutral btn-sm">Request export</button>
					</div>
				</div>
				<div className="flex border border-error bg-error/10 rounded-md p-4 items-center mt-2">
					<div className="flex-1">
						<p className="text-sm">Delete my account</p>
						<p className="text-xs text-neutral-content/60">Erased within 30 days; tournament result stay anonymised.</p>
					</div>
					<div>
						<button className="btn btn-outline btn-error border-error btn-sm">Delete account</button>
					</div>
				</div>
			</SectionSetting>
		</div>
	</Sidebar>
}

function InputWithText({ text = "", children }: { text?: string, children: React.ReactNode }) {
	return <div className="w-full">
		{text.length > 0 && <p className="tracking-brand text-xs">{text.toUpperCase()}</p>}
		{children}
	</div>
}

function SectionSetting({ title, titleColor = "", description, hasDividerBottom = false, children }: { title: string, titleColor?: string, description: string, hasDividerBottom?: boolean, children: React.ReactNode }) {
	return <>
		<div className="flex justify">
			<div className="flex-1/3 max-w-100">
				<h2 className={`text-sm font-semibold ${titleColor.length > 0 ? titleColor : ''}`}>{title}</h2>
				<p className="text-xs text-neutral-content/40">{description}</p>
			</div>
			<div className="flex-2/3 max-w-200">
				{children}
			</div>
		</div>
		{hasDividerBottom && <div className="divider text-neutral-content/40 m-0 mt-3 mb-3"></div>}
	</>
}

function SectionOTP({ isEnabled = false }: { isEnabled?: boolean }) {

	let color = "warning"
	if (isEnabled)
		color = "info"

	return <div className={`flex bg-${color}/10 border border-${color}/50 rounded-md p-4 items-center`}>
		<div className="flex-1">
			<p className="text-sm pb-1">Authentificator app <span className={`badge badge-xs badge-outline badge-${color} ml-1`}>{isEnabled ? "ENABLED" : "DISABLED"}</span></p>
			{isEnabled && <p className="text-xs text-neutral-content/60">Added 12 June 2026 - last used today</p>}
		</div>
	</div>
}

function SessionsDisplay({ sessions, onRevoke }: { sessions: SessionRow[], onRevoke: (token: string, id: string) => void }) {
	const { data: currentSession } = authClient.useSession()

	return <>
		{currentSession && sessions.map(s => {
			const isCurrent = s.id === currentSession?.session.id

			return (
				<div key={s.id} className={`flex border rounded-md p-4 items-center mt-2 mr-2 ${isCurrent ? "bg-info/10 border-info/50" : "border-neutral"}`}>
					<div className="flex-1">
						<p className="text-sm">{prettyUA(s.userAgent)}</p>
						<p className="text-xs text-neutral-content/60">{s.ipAddress || "Unknown IP Address"}</p>
					</div>
					<div>
						{isCurrent ? <p className="text-info text-xs font-semibold">THIS DEVICE</p> : <button className="btn btn-outline border-neutral btn-sm" onClick={() => onRevoke(s.token, s.id)}>Revoke</button>}
					</div>
				</div>
			)
		})}
	</>
}