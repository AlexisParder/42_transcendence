import type React from "react"
import type { SessionRow } from "../../hooks/useSessions"
import { Input, InputWithText } from "../../components/Input"
import { PasswordBar } from "../../components/PasswordBar"
import { useEffect, useRef, useState } from "react"
import { authClient } from "../../lib/auth-client"
import { prettyUA } from "../../lib/prettyUA"
import { useSessions } from "../../hooks/useSessions"
import { HideModal, Modal, ShowModal } from "../../components/Modal"
import { useNavigate } from "react-router-dom"
import { Avatar } from "../../components/Avatar"
import { IoWarning } from "react-icons/io5"
import { setTranslationLanguage, t } from "../../lib/translate"
import { Enable2FA, RecoveryCodes, ReScan2FA } from "./Security"
import { apiGet, apiPost } from "../../lib/api"
import { PASSWORD_MESSAGES, validatePassword } from "../../lib/password"
import { AVATAR_INPUT_MAX_SIZE, AVATAR_INPUT_MAX_SIZE_MB, AVATAR_MAX_SIZE, AVATAR_MAX_SIZE_MB, AVATAR_TYPES, resizeAvatar } from "../../lib/avatar"

type Errors = {
	username?: string
	email?: string
	currPassword?: string
	password?: string
	password2?: string
	confirmPwd?: string
	pwdForm?: string
	picture?: string
	deleteAccount?: string
	exportData?: string
	lang?: string
	code?: string
}

function authErrorMessage(code: string, vars?: Record<string, string | number>) {
	const message = t(code, vars)
	return message === code ? t("txt_err_auth") : message
}

export function SettingsCat() {
	const { data: session } = authClient.useSession()

	const navigate = useNavigate()
	const { sessions, revokeSession, revokeOthers } = useSessions()
	const [errors, setErrors] = useState<Errors>({})
	const [isFocused, setIsFocused] = useState(false)
	const [currPassword, setCurrPassword] = useState('')
	const [password, setPassword] = useState('')
	const [password2, setPassword2] = useState('')
	const pictureInput = useRef<HTMLInputElement>(null)
	const [username, setUsername] = useState(session?.user.username ?? "")
	const [language, setLanguage] = useState(session?.user.language ?? "en")
	const [hasPwd, setHasPwd] = useState<boolean | null>()
	const isOTPEnabled = session?.user.twoFactorEnabled ? true : false
	const [prevUsername, setPrevUsername] = useState(session?.user.username)
	const [prevLanguage, setPrevLanguage] = useState(session?.user.language)
	const [code, setCode] = useState("")
	const [isExporting, setIsExporting] = useState(false)

	if (session?.user.username !== prevUsername) {
		setPrevUsername(session?.user.username)
		setUsername(session?.user.username ?? "")
	}

	if (session?.user.language !== prevLanguage) {
		setPrevLanguage(session?.user.language)
		setLanguage(session?.user.language ?? "en")
	}

	useEffect(() => {
		authClient.listAccounts().then(({ data }) => {
			setHasPwd(!!data?.some(acc => acc.providerId === "credential"))
		})
	}, [])

	const handleSubmitChangePwd: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		setErrors({})
		const newErrors: Errors = {}

		if (password.length === 0) {
			newErrors.password = t("txt_err_pwd_empty")
		} else {
			const pwdErr = validatePassword(password, [session?.user.email ?? ""])
			if (pwdErr)
				newErrors.password = PASSWORD_MESSAGES[pwdErr]
		}

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
				setErrors({ pwdForm: t("settings_err_updt_pwd") })
				return
			}

			setCurrPassword('')
			setPassword('')
			setPassword2('')
			// ajouter une notif de success

		} else {
			const { ok } = await apiPost("/api/set-pwd", { newPassword: password })

			if (!ok) {
				setErrors({ pwdForm: t("settings_err_updt_pwd") })
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

	const handleChangePicture = async (picture: File) => {
		setErrors({})
		if (!AVATAR_TYPES.includes(picture.type)) {
			setErrors({ picture: t("settings_err_picture_type") })
			return
		}

		if (picture.size > AVATAR_INPUT_MAX_SIZE) {
			setErrors({ picture: t("settings_err_picture_too_big", { AVATAR_MAX_SIZE_MB: AVATAR_INPUT_MAX_SIZE_MB }) })
			return
		}

		const resized = await resizeAvatar(picture)
		if ("error" in resized) {
			setErrors({ picture: t(resized.error) })
			return
		}

		if (resized.blob.size > AVATAR_MAX_SIZE) {
			setErrors({ picture: t("settings_err_picture_too_big", { AVATAR_MAX_SIZE_MB }) })
			return
		}

		let base64: string
		try {
			base64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader()
				reader.onloadend = () => resolve(reader.result as string)
				reader.onerror = reject
				reader.readAsDataURL(resized.blob)
			})
		} catch {
			setErrors({ picture: t("settings_err_updt_picture") })
			return
		}

		const { error } = await authClient.updateUser({
			image: base64,
		})

		if (error)
			setErrors({ picture: error.code ? authErrorMessage(error.code, { AVATAR_MAX_SIZE_MB }) : t("settings_err_updt_picture") })
	}

	const handleDisable2FA: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		setErrors({})
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
		HideModal("Disable2FAModal")
		// ajouter une notif
	}

	async function handleRemovePicture() {
		setErrors({})
		if (!session?.user.image)
			return

		const { error } = await authClient.updateUser({
			image: null,
		})

		if (error)
			setErrors({ picture: t("settings_err_rmv_picture") })
	}

	async function handleChangeUsername() {
		const newErrors: Errors = {}

		if (username === session?.user.username) {
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

	const handleChangeLanguage = async (lang: string) => {
		setErrors({})
		if (lang !== "en" && lang !== "fr" && lang !== "es") {
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

	async function handleExportData() {
		setErrors({})
		setIsExporting(true)
		const { ok, data } = await apiGet("/api/export-data")
		setIsExporting(false)

		if (!ok) {
			setErrors({ exportData: t(data.error ?? "settings_err_export") })
			return
		}

		const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
		const link = document.createElement("a")
		link.href = url
		link.download = `sonar-export-${session?.user.username ?? "user"}-${new Date().toISOString().slice(0, 10)}.json`
		link.click()
		URL.revokeObjectURL(url)
	}

	const handleDeleteAccount: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()

		setErrors({})
		const form = e.currentTarget
		const formElem = new FormData(form)
		const password = formElem.get("password")?.toString() ?? ""

		if (password.length <= 0) {
			setErrors({ confirmPwd: t("txt_err_pwd_empty") })
			return
		}

		const { ok } = await apiPost("/api/check-pwd", { password })

		if (!ok) {
			setErrors({ confirmPwd: t("txt_err_pwd_invalid") })
			return
		}

		if (session?.user.twoFactorEnabled) {
			if (code.length <= 0) {
				setErrors({ code: t("txt_err_2fa_empty") })
				return
			} else if (code.length !== 6) {
				setErrors({ code: t("txt_err_2fa_size") })
				return
			}
		}

		const { error } = await authClient.deleteUser({
			password,
			fetchOptions: { headers: { "x-2fa-code": code } },
		})

		if (error?.code === "txt_err_2fa_invalid" || error?.code === "txt_err_2fa_empty") {
			setErrors({ code: t(error.code) })
			return
		}

		HideModal("deleteModal")
		if (error) {
			setErrors({ deleteAccount: error.code ? authErrorMessage(error.code) : t("settings_err_rmv_user") })
			return
		}
		navigate('/')
		// Ajouter une notif
	}

	return <>
		<SectionSetting title={t("settings_profile_title")} description={`${t("settings_profile_desc")}.`} hasDividerBottom={true}>
			<div className="flex gap-4 md:gap-2 items-center">
				<Avatar username={session?.user.username} image={session?.user.image} size={64} />
				<div className="flex gap-2">
					<input type="file" ref={pictureInput} accept={AVATAR_TYPES.join(",")} className="hidden" onChange={e => {
						const file = e.target.files?.[0]
						e.target.value = ''
						if (file)
							handleChangePicture(file)
					}} />
					<button className="btn btn-outline border-neutral" onClick={() => {
						setErrors({})
						pictureInput.current?.click()
					}}>{t("btn_upload")}</button>
					<button className="btn btn-outline border-neutral" onClick={handleRemovePicture} disabled={!session?.user.image ? true : false}>{t("btn_remove")}</button>
				</div>
			</div>
			{errors.picture && <span className="text-error block pt-2 pl-2 text-xs">{errors.picture}</span>}
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
						<option value="es">{t("lg_es")}</option>
					</select>
					{errors.lang && <span className="text-error block pb-2 pl-2">{errors.lang}</span>}
				</InputWithText>
			</div>
		</SectionSetting>

		<SectionSetting title={t("txt_password")} description={`${t("settings_password_desc")}.`} hasDividerBottom={true}>
			<form onSubmit={handleSubmitChangePwd}>
				<input type="text" name="username" className="hidden" hidden={true} autoComplete="username" readOnly={true} />

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
				{errors.pwdForm && <span className="text-error block pb-2 pl-2">{errors.pwdForm}</span>}
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
					<button onClick={handleExportData} disabled={isExporting} className="btn btn-outline border-neutral btn-sm">
						{isExporting && <span className="loading loading-spinner loading-xs"></span>}
						{t("settings_danger_dl_btn")}
					</button>
					{errors.exportData && <span className="text-error block pt-0.5 pb-2 pl-2 text-xs">{errors.exportData}</span>}
				</div>
			</div>
			<div className="flex border border-error bg-error/10 rounded-md p-4 items-center my-2">
				<div className="flex-1">
					<p className="text-sm">{t("settings_danger_dlt_user")}</p>
					<p className="text-xs text-neutral-content/60">{t("settings_danger_dlt_desc")}.</p>
				</div>
				<div>
					<button disabled={!hasPwd} onClick={() => {
						setErrors({})
						ShowModal("deleteModal")
					}} className="btn btn-outline btn-error border-error btn-sm">{t("settings_danger_dlt_btn")}</button>
					{errors.deleteAccount && <span className="text-error block pt-0.5 pb-2 pl-2 text-xs">{errors.deleteAccount}</span>}
				</div>
			</div>
			{hasPwd !== true && <p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4"><IoWarning className="text-warning" /> <span className="text-xs text-neutral-content/60">{t("settings_danger_dlt_need_pwd")}.<br />{t("settings_2fa_need_pwd_2")}.</span></p>}
		</SectionSetting>

		<Modal id="deleteModal" onClose={() => setCode("")}>
			<p className="pb-2">{t("settings_modal_dlt_user")}</p>
			<form onSubmit={handleDeleteAccount}>
				<input type="text" name="username" className="hidden" hidden={true} autoComplete="username" readOnly={true} />

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
						<input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" />
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
				<input type="text" name="username" className="hidden" hidden={true} autoComplete="username" readOnly={true} />

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
	</>
}

function SectionSetting({ title, titleColor = "", description, hasDividerBottom = false, children }: { title: string, titleColor?: string, description: string, hasDividerBottom?: boolean, children: React.ReactNode }) {
	return <>
		<div className="flex flex-col sm:flex-row">
			<div className="flex-1/3 max-w-100">
				<h2 className={`text-sm font-semibold ${titleColor.length > 0 ? titleColor : ''}`}>{title}</h2>
				<p className="text-xs text-neutral-content/40 pb-4">{description}</p>
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
