import type React from "react"
import type { SessionRow } from "../hooks/useSessions"
import { Input } from "../components/Input"
import { Sidebar } from "../components/Sidebar"
import { PasswordBar } from "../components/PasswordBar"
import { useEffect, useState } from "react"
import { authClient } from "../lib/auth-client"
import { prettyUA } from "../lib/prettyUA"
import { useSessions } from "../hooks/useSessions"
import { HideModal, Modal, ShowModal } from "../components/Modal"
import { useNavigate } from "react-router-dom"
import { Avatar } from "../components/Avatar"
import { IoWarning } from "react-icons/io5"
import { QRCodeSVG } from "qrcode.react"
import { setTranslationLanguage, t } from "../lib/translate"
import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { isValidEmail } from "../lib/isValideEmail"

type Errors = {
	username?: string
	email?: string
	currPassword?: string
	password?: string
	password2?: string
	confirmPwd?: string
	form?: string
	lang?: string
	code?: string
}

export function AccountSettings() {
	useDocumentTitle(t("settings_title"))
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
	const [email, setEmail] = useState(session?.user.email ?? "")
	const [prevEmail, setPrevEmail] = useState(session?.user.email)
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

	if (session?.user.email !== prevEmail) {
		setPrevEmail(session?.user.email)
		setEmail(session?.user.email ?? "")
	}

	const handleSubmitChangePwd: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const newErrors: Errors = {}

		if (password.length === 0)
			newErrors.password = t("txt_err_pwd_empty")

		if (password2.length === 0)
			newErrors.password2 = t("txt_err_pwd_empty")

		if (password.length > 0 && password2.length > 0 && password !== password2) {
			newErrors.password = t("txt_err_pwd_not_match")
			newErrors.password2 = newErrors.password
		}

		if (hasPwd === true) {
			if (currPassword.length === 0)
				newErrors.currPassword = t("txt_err_pwd_empty")
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

			if (error) {
				setErrors({ form: t("settings_err_updt_pwd") })
				return
			}

			setCurrPassword('')
			setPassword('')
			setPassword2('')
			// ajouter une notif de success

		} else {
			const res = await fetch("/api/set-pwd", {
				method: "POST",
				headers: { "Content-type": "application/json" },
				body: JSON.stringify({ newPassword: password }),
			})

			if (!res.ok) {
				setErrors({ form: t("settings_err_updt_pwd") })
				return
			}

			setHasPwd(true);
			setCurrPassword('')
			setPassword('')
			setPassword2('')
			revokeOthers()
			// ajouter une notif de success
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

		// ajouter convertion base64
		if (picture.length > 0) {
			const { error } = await authClient.updateUser({
				image: picture,
			})

			if (error)
				setErrors({ form: t("settings_err_updt_picture") })
			else {
				setPicture('')
				HideModal('pictureModal')
			}
		}
	}

	const handleDisable2FA: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = e.currentTarget
		const password = new FormData(form).get('confirmPwd')?.toString() ?? ""

		if (password.length <= 0) {
			setErrors({ confirmPwd: t("txt_err_pwd_empty") })
			return
		}

		const { error } = await authClient.twoFactor.disable({
			password
		})

		if (error) {
			setErrors({ confirmPwd: t("txt_err_pwd_invalid") })
			return
		}
		setErrors({})
		HideModal("Disable2FAModal")
		// ajouter une notif
	}

	async function handleRemovePicture() {
		if (!session?.user.image)
			return

		const { error } = await authClient.updateUser({
			image: null,
		})

		if (error)
			setErrors({ form: t("settings_err_rmv_picture") })
	}

	async function handleChangeUsername() {
		const newErrors: Errors = {}

		if (username === session?.user.username)
		{
			setErrors({})
			return
		}

		if (username.length === 0)
			newErrors.username = t("txt_err_user_empty")
		else {
			const { data, error } = await authClient.isUsernameAvailable({
				username
			})

			if (!data?.available) {
				if (error?.code === "USERNAME_TOO_SHORT")
					newErrors.username = t("txt_err_user_short")
				else if (error?.code === "INVALID_USERNAME")
					newErrors.username = t("txt_err_user_invalid")
				else
					newErrors.username = t("txt_err_user_exist")
			}
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
			setErrors({ username: t("settings_err_updt_user") })
	}

	async function handleChangeEmail() {
		const newErrors: Errors = {}

		if (email === session?.user.email || !session?.user.emailVerified)
		{
			console.log("caca")
			setErrors({})
			return
		}

		if (email.length <= 0)
			newErrors.email = t("txt_err_email_empty")
		else if (!isValidEmail(email))
			newErrors.email = t("txt_err_email_invalid")
		// else {
		// 	const { data } = await authClient.isUsernameAvailable({
		// 		email,
		// 		callbackURL: "/settings"
		// 	})

		// 	if (!data?.available)
		// 		newErrors.email = t("txt_err_email_exist")
		// }

		setErrors(newErrors)

		if (Object.keys(newErrors).length > 0)
			return

		const { error } = await authClient.changeEmail({
			newEmail: email,
			callbackURL: "/settings"
		})

		if (error)
		{
			setErrors({ email: t("settings_err_updt_email") })
			return;
		}
		// setErrors({})
		// ajouter une notif avec t("settings_updt_email_wait", {email: session?.user.email ?? ""})
	}


	const handleChangeLanguage = async (lang: string) => {
		if (lang !== "en" && lang !== "fr") {
			setLanguage("en")
			return
		}

		if (lang === session?.user.language)
			return

		const newErrors: Errors = {}
		const { error } = await authClient.updateUser({
			language: lang
		})

		if (error) {
			newErrors.lang = t("settings_err_updt_lang")
			setErrors(newErrors)
			return
		}
		setTranslationLanguage(lang)
		location.reload()
		// ajouter une notif de success
	}

	const handleDeleteAccount: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		const form = e.currentTarget
		const formElem = new FormData(form)
		const password = formElem.get("password")?.toString() ?? ""

		if (password.length <= 0) {
			setErrors({ confirmPwd: t("txt_err_pwd_empty") })
			return
		}

		const res = await fetch("/api/check-pwd", {
			method: "POST",
			headers: { "Content-type": "application/json" },
			body: JSON.stringify({ password }),
		})

		if (!res.ok) {
			setErrors({ confirmPwd: t("txt_err_pwd_invalid") })
			return
		}

		if (session?.user.twoFactorEnabled) {
			const code = formElem.get("code")?.toString().trim() as string
			if (code.length <= 0) {
				setErrors({ code: t("txt_err_2fa_empty") })
				return
			} else if (code.length !== 6) {
				setErrors({ code: t("txt_err_2fa_size") })
				return
			}

			const { error } = await authClient.twoFactor.verifyTotp({ code })
			if (error) {
				setErrors({ code: t("txt_err_2fa_invalid") })
				return
			}
		}

		const { error } = await authClient.deleteUser();

		HideModal("deleteModal")
		if (error) {
			setErrors({ form: t("settings_err_rmv_user") })
			return
		}
		setErrors({})
		navigate('/')
		// Ajouter une notif
	}

	return <Sidebar>
		<div className="p-4">
			<h1 className="text-xl font-bold">{t("settings_title")}</h1>
			<p className="text-sm text-neutral-content/40">{t("settings_desc")}.</p>

			<div className="divider text-neutral-content/40 m-0 mt-3 mb-3"></div>

			<SectionSetting title={t("settings_profile_title")} description={`${t("settings_profile_desc")}.`} hasDividerBottom={true}>
				<div className="flex gap-4 md:gap-2 items-center">
					<Avatar username={session?.user.username} image={session?.user.image} size={64} />
					<div className="flex gap-2 flex-col md:flex-row">
						<button className="btn btn-outline border-neutral" onClick={() => {
							setErrors({})
							ShowModal('pictureModal')
						}}>{t("btn_upload")}</button>
						<button className="btn btn-outline border-neutral" onClick={handleRemovePicture} disabled={!session?.user.image ? true : false}>{t("btn_remove")}</button>
					</div>
				</div>
				<div className="flex mt-2 flex-col md:flex-row w-full gap-2">
					<InputWithText text={t("settings_profile_callsign")}>
						<Input type="text" name="username" label={t("txt_username")} defaultValue={session?.user.username ?? ''} useLabel={false} onChange={e => setUsername(e.target.value.trim())} onBlur={handleChangeUsername} errorMsg={errors.username} />
					</InputWithText>
					<InputWithText text={t("settings_ds_lg")}>
						<select className={`select outline-none focus:border-info ${errors.lang ? "border-error" : ""} w-full bg-abyss-700 mt-2 mb-2`} value={language ?? "en"} onChange={e => {
							const lang = e.target.value
							setLanguage(lang)
							handleChangeLanguage(lang)
						}}>
							<option value="fr">{t("lg_fr")}</option>
							<option value="en">{t("lg_en")}</option>
						</select>
						{errors.lang && <span className="text-error block pb-2 pl-2">{errors.lang}</span>}
					</InputWithText>
				</div>
				<div className="pt-3 md:pt-0">
					<InputWithText text={t("txt_email")}>
						<Input type="email" name="email" label={t("txt_email")} defaultValue={session?.user.email ?? ''} useLabel={false} onChange={e => setEmail(e.target.value.trim())} onBlur={handleChangeEmail} errorMsg={errors.email} />
					</InputWithText>
				</div>
			</SectionSetting>

			<SectionSetting title={t("txt_password")} description={`${t("settings_password_desc")}.`} hasDividerBottom={true}>
				<form onSubmit={handleSubmitChangePwd}>
					{hasPwd === true && <div>
						<InputWithText>
							<Input type="password" name="currPassword" label={t("settings_password_curr")} onChange={e => setCurrPassword(e.target.value)} value={currPassword} autoComplete="current-password" errorMsg={errors.currPassword} customLabelStyle="bg-base-100" />
						</InputWithText>
					</div>}
					<div className="flex flex-col md:flex-row md:gap-2">
						<InputWithText>
							<Input type="password" name="password" label={hasPwd === true ? t("settings_password_new") : t("txt_password")} onFocus={() => { setIsFocused(true) }} onBlur={() => { setIsFocused(false) }} onChange={e => setPassword(e.target.value)} value={password} autoComplete="new-password" errorMsg={errors.password} customLabelStyle="bg-base-100" />
						</InputWithText>
						<InputWithText>
							<Input type="password" name="password2" label={t("txt_password_confirm")} onChange={e => setPassword2(e.target.value)} value={password2} autoComplete="new-password" errorMsg={errors.password2} customLabelStyle="bg-base-100" />
						</InputWithText>
					</div>
					{isFocused && <PasswordBar password={password} />}
					<button className="btn btn-soft btn-info border-info/50 hover:border-info mt-2 w-full md:w-auto">{hasPwd === true ? t("settings_password_updt") : t("settings_password_add")}</button>
					{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
				</form>
			</SectionSetting>

			<SectionSetting title={t("settings_2fa_title")} description={`${t("settings_2fa_desc")}.`} hasDividerBottom={true}>
				<SectionOTP isEnabled={isOTPEnabled} />
				<div className="flex gap-2 pt-3 pb-3 flex-col lg:flex-row">
					{isOTPEnabled && <button className="btn btn-outline border-neutral" onClick={() => {
						setErrors({})
						ShowModal('ShowCodesModal')
					}}>{t("settings_2fa_show_code")}</button>}
					{isOTPEnabled && <button className="btn btn-outline border-neutral" onClick={() => {
						setErrors({})
						ShowModal('ReScan2FAModal')
					}}>{t("settings_2fa_qr_code")}</button>}
					{isOTPEnabled && <button className="btn btn-outline btn-error" onClick={() => {
						setErrors({})
						ShowModal('Disable2FAModal')
					}}>{t("settings_2fa_disable")}</button>}
					{!isOTPEnabled && <button className="btn btn-outline btn-info" onClick={() => {
						setErrors({})
						ShowModal('Enable2FAModal')
					}} disabled={hasPwd !== true}>{t("settings_2fa_enable")}</button>}
				</div>
				{!isOTPEnabled && hasPwd !== true && <p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4"><IoWarning className="text-warning" /> <span className="text-xs text-neutral-content/60">{t("settings_2fa_need_pwd_1")}.<br />{t("settings_2fa_need_pwd_2")}.</span></p>}
				{isOTPEnabled && <p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4"><IoWarning className="text-warning" /> <span className="text-xs text-neutral-content/60">{t("settings_2fa_warning_1_disabled")}.<br />{t("settings_2fa_warning_2_disabled")}.</span></p>}
			</SectionSetting>

			<SectionSetting title={t("settings_session_title")} description={`${t("settings_session_desc")}.`} hasDividerBottom={true}>
				<div className="max-h-40 overflow-y-auto scrollbar-thin">
					<SessionsDisplay sessions={sessions} onRevoke={revokeSession} />
				</div>
				<button onClick={revokeOthers} className="link-error text-xs font-bold cursor-pointer">{t("settings_session_revoke_others")}</button>
			</SectionSetting>

			<SectionSetting title={t("settings_danger_title")} titleColor="text-error" description={`${t("settings_danger_desc")}.`} >
				<div className="flex border border-neutral rounded-md p-4 items-center mt-2">
					<div className="flex-1">
						<p className="text-sm">{t("settings_danger_dl_data")}</p>
						<p className="text-xs text-neutral-content/60">{t("settings_danger_dl_desc")}.</p>
					</div>
					<div>
						<button className="btn btn-outline border-neutral btn-sm">{t("settings_danger_dl_btn")}</button>
					</div>
				</div>
				<div className="flex border border-error bg-error/10 rounded-md p-4 items-center mt-2">
					<div className="flex-1">
						<p className="text-sm">{t("settings_danger_dlt_user")}</p>
						<p className="text-xs text-neutral-content/60">{t("settings_danger_dlt_desc")}.</p>
					</div>
					<div>
						<button onClick={() => {
							setErrors({})
							ShowModal("deleteModal")
						}} className="btn btn-outline btn-error border-error btn-sm">{t("settings_danger_dlt_btn")}</button>
						{errors.form && <span className="text-error block pb-2 pl-2">{errors.form}</span>}
					</div>
				</div>
			</SectionSetting>
		</div>

		<Modal id="pictureModal">
			<p className="pb-2">{t("settings_modal_upl_pic")}</p>
			<form onSubmit={handleChangePicture}>
				<Input type="text" label={t("settings_modal_upl_pic_link")} name="picture" autoComplete="off" onChange={e => setPicture(e.target.value)} value={picture} autoFocus={true} />
				<div className="flex gap-2 pt-2 justify-end">
					<button onClick={() => HideModal("pictureModal")} className="btn btn-neutral">{t("btn_cancel")}</button>
					<button className="btn btn-info btn-outline">{t("btn_upload")}</button>
				</div>
			</form>
		</Modal>
		<Modal id="deleteModal">
			<p className="pb-2">{t("settings_modal_dlt_user")}</p>
			<form onSubmit={handleDeleteAccount}>
				<InputWithText>
					<Input type="password" name="password" label={t("txt_password")} autoComplete="current-password" errorMsg={errors.confirmPwd} customLabelStyle="bg-base-100" />
				</InputWithText>
				{session?.user.twoFactorEnabled && <div>
					<p className="text-neutral-content/40 text-xs mt-2">{t("otp_desc")}.</p>
					<label className="otp otp-info otp-lg mt-2">
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<input type="text" name="code" autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" />
					</label>
					{errors.code && <span className="text-error block">{errors.code}</span>}
				</div>}
				<div className="flex gap-2 pt-4">
					<button onClick={() => HideModal("deleteModal")} type="button" className="btn btn-success">{t("btn_cancel")}</button>
					<button className="btn btn-error btn-outline">{t("btn_confirm")}</button>
				</div>
			</form>
		</Modal>
		<Modal id="Disable2FAModal">
			<div className="flex items-center justify-between pb-4">
				<p className="font-bold text-lg">{t("settings_2fa_disable")}</p>
			</div>
			<form onSubmit={handleDisable2FA}>
				<p className="pb-2 text-sm text-neutral-content/60">{t("settings_modal_disabled_2fa")}</p>
				<InputWithText>
					<Input type="password" name="confirmPwd" label={t("txt_password")} autoComplete="current-password" errorMsg={errors.confirmPwd} customLabelStyle="bg-base-100" />
				</InputWithText>
				<div className="flex gap-2 justify-end">
					<button onClick={() => {
						setErrors({})
						HideModal('Disable2FAModal')
					}} type="button" className="btn btn-neutral">{t("btn_cancel")}</button>
					<button className="btn btn-info btn-outline">{t("btn_confirm")}</button>
				</div>
			</form>
		</Modal>
		<Enable2FA hasPwd={hasPwd} />
		<RecoveryCodes />
		<ReScan2FA />
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
			<p className="text-sm pb-1">{t("settings_2fa_app")} <span className={`badge badge-xs badge-outline badge-${color} ml-1`}>{isEnabled ? t("txt_enabled").toUpperCase() : t("txt_disabled").toUpperCase()}</span></p>
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
						<p className="text-xs text-neutral-content/60">{s.ipAddress || t("settings_session_unk_ip").toUpperCase()}</p>
					</div>
					<div>
						{isCurrent ? <p className="text-info text-xs font-semibold">{t("settings_session_this_device")}</p> : <button className="btn btn-outline border-neutral btn-sm" onClick={() => onRevoke(s.token, s.id)}>{t("settings_session_revoke")}</button>}
					</div>
				</div>
			)
		})}
	</>
}

type Enable2FAStep = 'password' | 'verify'
function Enable2FA({ hasPwd }: { hasPwd: boolean | null | undefined }) {
	const [step, setStep] = useState<Enable2FAStep>('password')
	const [totpURI, setTotpURI] = useState<string | null>(null)
	const [errors, setErrors] = useState<{ confirmPwd?: string, code?: string }>({})

	const reset = () => {
		setStep('password')
		setTotpURI(null)
		setErrors({})
	}

	const close = () => {
		HideModal('Enable2FAModal')
		reset()
	}

	const handleSubmitPwd: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
		const formElem = e.currentTarget

		if (hasPwd !== true) {
			formElem.reset()
			close()
			return
		}

		const password = new FormData(formElem).get("confirmPwd")?.toString() ?? ''

		if (password.length <= 0) {
			setErrors({ confirmPwd: t("txt_err_pwd_empty") })
			return
		}

		const { data, error } = await authClient.twoFactor.enable({
			password,
			method: "totp"
		})
		if (error) {
			setErrors({ confirmPwd: t("txt_err_pwd_invalid") })
			return
		}

		if (data.method === "totp") {
			setTotpURI(data.totpURI)
			setErrors({})
			formElem.reset()
			setStep("verify")
		}
	}

	const handleSubmitVerify: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
		const formElem = e.currentTarget

		if (hasPwd !== true) {
			formElem.reset()
			close()
			return
		}

		const code = new FormData(formElem).get("code")?.toString().trim() as string
		if (code.length <= 0) {
			setErrors({ code: t("txt_err_2fa_empty") })
			return
		} else if (code.length !== 6) {
			setErrors({ code: t("txt_err_2fa_size") })
			return
		}

		const { error } = await authClient.twoFactor.verifyTotp({ code })
		if (error) {
			setErrors({ code: t("txt_err_2fa_invalid") })
			return
		}
		close()
		// ajouter notif
	}

	return <Modal id="Enable2FAModal">
		<div className="flex items-center justify-between pb-4">
			<p className="font-bold text-lg">{t("settings_2fa_enable")}</p>
			<p className="text-xs text-neutral-content/60">{t("txt_step")} {step === "password" ? '1' : '2'}/2</p>
		</div>
		{step === "password" && <form onSubmit={handleSubmitPwd}>
			<p className="pb-2 text-sm text-neutral-content/60">{t("settings_modal_enabled_2fa")}</p>
			<InputWithText>
				<Input type="password" name="confirmPwd" label={t("txt_password")} autoComplete="current-password" errorMsg={errors.confirmPwd} customLabelStyle="bg-base-100" />
			</InputWithText>
			<div className="flex gap-2 justify-end">
				<button onClick={close} type="button" className="btn btn-neutral">{t("btn_cancel")}</button>
				<button className="btn btn-info btn-outline">{t("btn_confirm")}</button>
			</div>
		</form>}

		{step === "verify" && totpURI && <form onSubmit={handleSubmitVerify}>
			<div className="flex flex-col items-center">
				<p className="pb-2 text-sm text-neutral-content/60">{t("settings_modal_qrcode_enable_desc")}</p>

				<div className="p-2 opacity-75">
					<QRCodeSVG value={totpURI} size={200} />
				</div>
				<div>
					<label className="otp otp-info otp-lg mt-4">
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<span className={`border-${errors.code ? 'error' : 'info'} bg-${errors.code ? 'error' : 'info'}/10`}></span>
						<input type="text" name="code" autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" />
					</label>
					{errors.code && <span className="text-error block">{errors.code}</span>}
				</div>
				<div className="flex gap-2 mt-4">
					<button type="button" onClick={close} className="btn btn-neutral">{t("btn_cancel")}</button>
					<button className="btn btn-info btn-outline">{t("btn_confirm")}</button>
				</div>
			</div>
		</form>}
	</Modal>
}

type RecoveryCodesStep = "password" | "show"
function RecoveryCodes() {
	const [step, setStep] = useState<RecoveryCodesStep>('password')
	const [backupCodes, setBackupCodes] = useState<string[]>([])
	const [errors, setErrors] = useState<{ confirmPwd?: string }>({})

	const reset = () => {
		setStep('password')
		setBackupCodes([])
		setErrors({})
	}

	const close = () => {
		HideModal('ShowCodesModal')
		reset()
	}

	const handleSubmitPwd: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
		const formElem = e.currentTarget

		const password = new FormData(formElem).get("confirmPwd")?.toString() ?? ''

		if (password.length <= 0) {
			setErrors({ confirmPwd: t("txt_err_pwd_empty") })
			return
		}

		const res = await fetch("/api/view-codes", {
			method: "POST",
			headers: { "Content-type": "application/json" },
			body: JSON.stringify({ password }),
		})

		const body = await res.json()

		if (!res.ok || !body.ok) {
			setErrors({ confirmPwd: t("txt_err_pwd_invalid") })
			return
		}

		if (body.backupCodes.length <= 0) {
			const { data: newData } = await authClient.twoFactor.generateBackupCodes({
				password
			})

			if (newData)
				setBackupCodes(newData.backupCodes)
		} else
			setBackupCodes(body.backupCodes)

		setErrors({})
		formElem.reset()
		setStep("show")
	}

	function handleCopyAll() {
		navigator.clipboard.writeText(backupCodes.join('\n'))
		close()
	}

	return <Modal id="ShowCodesModal">
		<div className="flex items-center justify-between pb-4">
			<p className="font-bold text-lg">{t("settings_modal_show_code_title")}</p>
			<p className="text-xs text-neutral-content/60">{t("txt_step")} {step === "password" ? '1' : '2'}/2</p>
		</div>

		{step === "show" && <p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4 mb-2"><IoWarning className="text-warning" /> <span className="text-xs text-neutral-content/60">{t("settings_modal_show_code_desc")}.</span></p>}

		{step === "password" && <form onSubmit={handleSubmitPwd}>
			<p className="pb-2 text-sm text-neutral-content/60">{t("settings_modal_show_code_pwd")}</p>
			<InputWithText>
				<Input type="password" name="confirmPwd" label={t("txt_password")} autoComplete="current-password" errorMsg={errors.confirmPwd} customLabelStyle="bg-base-100" />
			</InputWithText>
			<div className="flex gap-2 justify-end">
				<button onClick={close} type="button" className="btn btn-neutral">{t("btn_cancel")}</button>
				<button className="btn btn-info btn-outline">{t("btn_confirm")}</button>
			</div>
		</form>}

		{step === "show" && <div className="flex flex-col">
			<div className="grid grid-cols-2">
				{backupCodes.map((code) => (
					<p key={code} className="p-2 m-2 bg-base-200 rounded text-center">
						{code}
					</p>
				))}
			</div>
			<div className="flex">
				<button onClick={close} type="button" className="m-2 btn btn-neutral flex-1/2">{t("btn_close")}</button>
				<button type="button" className="m-2 btn btn-outline btn-info flex-1/2" onClick={handleCopyAll}>{t("btn_copy_all")}</button>
			</div>
		</div>}
	</Modal>
}

function ReScan2FA() {
	const [step, setStep] = useState<RecoveryCodesStep>('password')
	const [totpURI, setTotpURI] = useState<string | null>(null)
	const [errors, setErrors] = useState<{ confirmPwd?: string }>({})

	const reset = () => {
		setStep('password')
		setTotpURI(null)
		setErrors({})
	}

	const close = () => {
		HideModal('ReScan2FAModal')
		reset()
	}

	const handleSubmitPwd: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
		const formElem = e.currentTarget

		const password = new FormData(formElem).get("confirmPwd")?.toString() ?? ''

		if (password.length <= 0) {
			setErrors({ confirmPwd: t("txt_err_pwd_empty") })
			return
		}

		const { data, error } = await authClient.twoFactor.getTotpUri({
			password
		})
		if (error) {
			setErrors({ confirmPwd: t("txt_err_pwd_invalid") })
			return
		}

		setTotpURI(data.totpURI)
		setErrors({})
		formElem.reset()
		setStep("show")
	}

	return <Modal id="ReScan2FAModal">
		<div className="flex items-center justify-between pb-4">
			<p className="font-bold text-lg">{t("settings_modal_rescan_title")}</p>
			<p className="text-xs text-neutral-content/60">{t("txt_step")} {step === "password" ? '1' : '2'}/2</p>
		</div>
		{step === "password" && <form onSubmit={handleSubmitPwd}>
			<p className="pb-2 text-sm text-neutral-content/60">{t("settings_modal_rescan_pwd")}</p>
			<InputWithText>
				<Input type="password" name="confirmPwd" label={t("txt_password")} autoComplete="current-password" errorMsg={errors.confirmPwd} customLabelStyle="bg-base-100" />
			</InputWithText>
			<div className="flex gap-2 justify-end">
				<button onClick={close} type="button" className="btn btn-neutral">{t("btn_cancel")}</button>
				<button className="btn btn-info btn-outline">{t("btn_close")}</button>
			</div>
		</form>}

		{step === "show" && totpURI && <div className="flex flex-col items-center">
			<div className="p-2 opacity-75">
				<QRCodeSVG value={totpURI} size={200} />
			</div>
			<div className="flex gap-2 mt-4">
				<button type="button" onClick={close} className="btn btn-neutral">{t("btn_close")}</button>
			</div>
		</div>}
	</Modal>
}