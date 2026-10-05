import type React from "react"
import { Input, InputWithText } from "../../components/Input"
import { useState } from "react"
import { authClient } from "../../lib/auth-client"
import { HideModal, Modal } from "../../components/Modal"
import { IoWarning } from "react-icons/io5"
import { QRCodeSVG } from "qrcode.react"
import { t } from "../../lib/translate"
import { apiPost } from "../../lib/api"

type Enable2FAStep = 'password' | 'verify'
export function Enable2FA({ hasPwd }: { hasPwd: boolean | null | undefined }) {
	const [step, setStep] = useState<Enable2FAStep>('password')
	const [totpURI, setTotpURI] = useState<string | null>(null)
	const [errors, setErrors] = useState<{ confirmPwd?: string, code?: string }>({})
	const [code, setCode] = useState("")

	const reset = () => {
		setStep('password')
		setTotpURI(null)
		setErrors({})
		setCode("")
	}

	const close = () => HideModal('Enable2FAModal')

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

	return <Modal id="Enable2FAModal" onClose={reset}>
		<div className="flex items-center justify-between pb-4">
			<p className="font-bold text-lg">{t("settings_2fa_enable")}</p>
			<p className="text-xs text-neutral-content/60">{t("txt_step")} {step === "password" ? '1' : '2'}/2</p>
		</div>
		{step === "password" && <form onSubmit={handleSubmitPwd}>
			<input type="text" name="username" className="hidden" hidden={true} autoComplete="username" readOnly={true} />

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
						<input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" />
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
export function RecoveryCodes() {
	const [step, setStep] = useState<RecoveryCodesStep>('password')
	const [backupCodes, setBackupCodes] = useState<string[]>([])
	const [errors, setErrors] = useState<{ confirmPwd?: string }>({})

	const reset = () => {
		setStep('password')
		setBackupCodes([])
		setErrors({})
	}

	const close = () => HideModal('ShowCodesModal')

	const handleSubmitPwd: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
		e.preventDefault()
		const formElem = e.currentTarget

		const password = new FormData(formElem).get("confirmPwd")?.toString() ?? ''

		if (password.length <= 0) {
			setErrors({ confirmPwd: t("txt_err_pwd_empty") })
			return
		}

		const { ok, data } = await apiPost("/api/view-codes", { password })


		if (!ok || !data.ok) {
			setErrors({ confirmPwd: t("txt_err_pwd_invalid") })
			return
		}

		if (data.backupCodes.length <= 0) {
			const { data: newData } = await authClient.twoFactor.generateBackupCodes({
				password
			})

			if (newData)
				setBackupCodes(newData.backupCodes)
		} else
			setBackupCodes(data.backupCodes)

		setErrors({})
		formElem.reset()
		setStep("show")
	}

	function handleCopyAll() {
		navigator.clipboard.writeText(backupCodes.join('\n'))
		close()
	}

	return <Modal id="ShowCodesModal" onClose={reset}>
		<div className="flex items-center justify-between pb-4">
			<p className="font-bold text-lg">{t("settings_modal_show_code_title")}</p>
			<p className="text-xs text-neutral-content/60">{t("txt_step")} {step === "password" ? '1' : '2'}/2</p>
		</div>

		{step === "show" && <p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4 mb-2"><IoWarning className="text-warning" /> <span className="text-xs text-neutral-content/60">{t("settings_modal_show_code_desc")}.</span></p>}

		{step === "password" && <form onSubmit={handleSubmitPwd}>
			<input type="text" name="username" className="hidden" hidden={true} autoComplete="username" readOnly={true} />


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

export function ReScan2FA() {
	const [step, setStep] = useState<RecoveryCodesStep>('password')
	const [totpURI, setTotpURI] = useState<string | null>(null)
	const [errors, setErrors] = useState<{ confirmPwd?: string }>({})

	const reset = () => {
		setStep('password')
		setTotpURI(null)
		setErrors({})
	}

	const close = () => HideModal('ReScan2FAModal')

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

	return <Modal id="ReScan2FAModal" onClose={reset}>
		<div className="flex items-center justify-between pb-4">
			<p className="font-bold text-lg">{t("settings_modal_rescan_title")}</p>
			<p className="text-xs text-neutral-content/60">{t("txt_step")} {step === "password" ? '1' : '2'}/2</p>
		</div>
		{step === "password" && <form onSubmit={handleSubmitPwd}>
			<input type="text" name="username" className="hidden" hidden={true} autoComplete="username" readOnly={true} />

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
