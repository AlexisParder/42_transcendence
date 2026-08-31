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
import { HideModal, Modal, ShowModal } from "../components/Modal"
import { useNavigate } from "react-router-dom"

type Errors = {
	username?: string
	email?: string
	currPassword?: string
	password?: string
	password2?: string
	form?: string
}

export function AccountSettings() {
	const navigate = useNavigate()
	const { data: session } = authClient.useSession()
	const { sessions, revokeSession, revokeOthers } = useSessions()

	const [errors, setErrors] = useState<Errors>({})
	const [isFocused, setIsFocused] = useState(false)
	const [currPassword, setCurrPassword] = useState('')
	const [password, setPassword] = useState('')
	const [password2, setPassword2] = useState('')
	const [picture, setPicture] = useState('')
	const [username, setUsername] = useState(session?.user.username ?? "")
	const [prevUsername, setPrevUsername] = useState(session?.user.username)
	const [language, setLanguage] = useState(session?.user.language ?? "en")
	const [prevLanguage, setPrevLanguage] = useState(session?.user.language)
	const [hasPwd, setHasPwd] = useState<boolean | null>()

	const isOTPEnabled = session?.user.twoFactorEnabled ? true : false

	useEffect(() => {
		authClient.listAccounts().then(({ data }) => {
			setHasPwd(!!data?.some(acc => acc.providerId === "credential"))
		})
	}, [])

	if (session?.user.username !== prevUsername) {
		setPrevUsername(session?.user.username)
		setUsername(session?.user.username ?? "")
	}

	if (session?.user.language !== prevLanguage) {
		setPrevLanguage(session?.user.language)
		setLanguage(session?.user.language ?? "en")
	}

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
				revokeOthers()
				// ajouter une notif de success
			}
		}
	}

	const handleChangePicture: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = new FormData(e.currentTarget)
		const pictureRaw = form.get('picture')?.toString().trim() ?? ''

		let picture = ''
		try {
			const url = new URL(pictureRaw)
			if (url.protocol === 'http:' || url.protocol === 'https:')
				picture = url.href
		} catch {
			return
		}

		if (picture.length > 0) {
			const { error } = await authClient.updateUser({
				image: picture,
			})

			if (error)
				setErrors({ form: error.message ?? "Update username failed" })
			else {
				setPicture('')
				HideModal('pictureModal')
			}
		}
	}

	async function handleRemovePicture() {
		if (!session?.user.image)
			return

		const { error } = await authClient.updateUser({
			image: null,
		})

		if (error)
			setErrors({ form: error.message ?? "Remove picture failed" })
	}

	async function handleChangeUsername() {
		const newErrors: Errors = {}

		if (username === session?.user.username)
			return

		if (username.length === 0)
			newErrors.username = "Username is empty!"
		else {
			const { data, error } = await authClient.isUsernameAvailable({
				username
			})

			if (!data?.available)
				newErrors.username = error?.message ?? "Username alredy use!"
		}

		setErrors(newErrors)

		if (Object.keys(newErrors).length > 0)
			return

		const { error } = await authClient.updateUser({
			username,
			displayUsername: username,
			name: username
		})

		if (error)
			setErrors({ username: error.message ?? "Update username failed" })
	}

	const handleChangeLanguage = async (lang: string) => {
		if (lang !== "en" && lang !== "fr")
		{
			setLanguage("en")
			return
		}

		if (lang === session?.user.language)
			return

		const { error } = await authClient.updateUser({
			language: lang
		})

		if (error)
			console.log("Error during language update")
			// ajouter une notif d'erreur
	}

	async function handleDeleteAccount() {
		const { error } = await authClient.deleteUser();

		HideModal("deleteModal")
		if (error)
			setErrors({ form: error.message ?? "delete account failed" })
		else
			navigate('/')
		// Ajouter une notif
	}

	return <Sidebar>
		<div className="p-4">
			<h1 className="text-xl font-bold">Settings</h1>
			<p className="text-sm text-neutral-content/40">Manage your identity, security, and how you appear to other palyers.</p>

			<div className="divider text-neutral-content/40 m-0 mt-3 mb-3"></div>

			<SectionSetting title="Profile" description="Your callsign and avatar are visible to every player." hasDividerBottom={true}>
				<div className="flex gap-4 md:gap-2 items-center">
					<img src={getAvatar(session?.user.image)} alt="" className="rounded-md w-16 h-16 object-cover shrink-0" />
					<div className="flex gap-2 flex-col md:flex-row">
						<button className="btn btn-outline border-neutral" onClick={() => ShowModal('pictureModal')}>Upload new</button>
						<button className="btn btn-outline border-neutral" onClick={handleRemovePicture} disabled={!session?.user.image ? true : false}>Remove</button>
					</div>
				</div>
				<div className="flex mt-2 flex-col md:flex-row items-center w-full gap-2">
					<InputWithText text="callsign">
						<Input type="text" name="username" label="Username" defaultValue={session?.user.username ?? ''} useLabel={false}
							onChange={e => setUsername(e.target.value.trim())} onBlur={handleChangeUsername} errorMsg={errors.username} />
					</InputWithText>
					<InputWithText text="display language">
						<select className="select outline-none focus:border-info w-full bg-abyss-700 mt-2 mb-2" value={language ?? "en"} onChange={e => {
							const lang = e.target.value
							setLanguage(lang)
							handleChangeLanguage(lang)
						}}>
							<option value="fr">French</option>
							<option value="en">English</option>
						</select>
					</InputWithText>
				</div>
				<div className="pt-3 md:pt-0">
					<InputWithText text="email">
						<Input type="email" name="email" label="Email" defaultValue={session?.user.email ?? ''} useLabel={false} />
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
					<div className="flex flex-col md:flex-row md:gap-2">
						<InputWithText>
							<Input type="password" name="password" label={hasPwd === true ? 'New password' : 'Password'} onFocus={() => { setIsFocused(true) }} onBlur={() => { setIsFocused(false) }} onChange={e => setPassword(e.target.value)} value={password} autoComplete="new-password" errorMsg={errors.password} customLabelStyle="bg-base-100" />
						</InputWithText>
						<InputWithText>
							<Input type="password" name="password2" label="Confirm password" onChange={e => setPassword2(e.target.value)} value={password2} autoComplete="new-password" errorMsg={errors.password2} customLabelStyle="bg-base-100" />
						</InputWithText>
					</div>
					{isFocused && <PasswordBar password={password} />}
					<button className="btn btn-soft btn-info border-info/50 hover:border-info mt-2 w-full md:w-auto">{hasPwd === true ? 'Update password' : 'Add password'}</button>
					{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
				</form>
			</SectionSetting>

			<SectionSetting title="Two-factor authentification" description="A six-digit code from your authentificator app, asked after your password." hasDividerBottom={true}>
				<SectionOTP isEnabled={isOTPEnabled} />
				<div className="flex gap-2 pt-3 pb-3 flex-col lg:flex-row">
					<button className="btn btn-outline border-neutral">Show recovery codes</button>
					<button className="btn btn-outline border-neutral">Re-scan QR code</button>
					<button className={`btn btn-outline btn-${isOTPEnabled ? 'error' : 'info'}`}>{isOTPEnabled ? 'Disabled' : 'Enable'} 2FA</button>
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
						<p className="text-xs text-neutral-content/60">Tournament result stay anonymised.</p>
					</div>
					<div>
						<button onClick={() => ShowModal("deleteModal")} className="btn btn-outline btn-error border-error btn-sm">Delete account</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</div>
				</div>
			</SectionSetting>
		</div>

		<Modal id="pictureModal">
			<p className="pb-2">Upload new profile picture</p>
			<form onSubmit={handleChangePicture}>
				<Input type="text" label="Image link" name="picture" autoComplete="off" onChange={e => setPicture(e.target.value)} value={picture} autoFocus={true} />
				<button className="btn btn-info btn-outline">Upload</button>
			</form>
		</Modal>
		<Modal id="deleteModal">
			<p className="pb-2">Are you sure you want to delete your account?</p>
			<div className="flex gap-2">
				<button onClick={() => HideModal("deleteModal")} className="btn btn-success">Cancel</button>
				<button onClick={handleDeleteAccount} className="btn btn-error btn-outline">Confirm</button>
			</div>
		</Modal>
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