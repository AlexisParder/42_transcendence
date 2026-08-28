import type React from "react"
import { Input } from "../components/Input"
import { Sidebar } from "../components/Sidebar"
import { PasswordBar } from "../components/PasswordBar"
import { useState } from "react"
import { MdWarning } from "react-icons/md"

type Errors = {
	username?: string
	email?: string
	password?: string
	password2?: string
	form?: string
}

export function AccountSettings() {
	const [errors, setErrors] = useState<Errors>({})
	const [isFocused, setIsFocused] = useState(false)
	const [password, setPassword] = useState('')

	return <Sidebar>
		<div>
			<h1>Settings</h1>
			<p>Manage your identity, security, and how you appear to other palyers.</p>

			<div className="divider text-neutral-content/40 m-0 mt-3 mb-1"></div>

			<div className="flex">
				<div>
					<h2>Profile</h2>
					<p>Your callsign and avatar are visible to every player.</p>
				</div>
				<div className="flex-2/3">
					<div className="flex">
						<img src="https://placehold.co/40x40" alt="" className="rounded-md" />
						<button>Upload new</button>
						<button>Remove</button>
					</div>
					<div className="flex">
						<InputWithText text="callsign">
							<Input type="text" name="username" label="CALLSIGN" defaultValue="alexis" useLabel={false} />
						</InputWithText>
						<InputWithText text="display language">
							<select defaultValue="en" className="select outline-none focus:border-info">
								<option value="fr">French</option>
								<option value="en">English</option>
							</select>
						</InputWithText>
					</div>
					<div>
						<InputWithText text="email">
							<Input type="email" name="email" label="Email" defaultValue="ft.sonar42@gmail.com" useLabel={false} />
						</InputWithText>
					</div>
				</div>
			</div>

			<div className="divider text-neutral-content/40 m-0 mt-3 mb-1"></div>

			<div className="flex">
				<div>
					<h2>Password</h2>
					<p>Changing it signs you ot of every other session.</p>
				</div>
				<div className="flex-2/3">
					<div>
						<InputWithText>
							<Input type="password" name="currPwd" label="Current password" useLabel={false} />
						</InputWithText>
					</div>
					<div className="flex">
						<InputWithText>
							<Input type="password" name="password" label="new password" useLabel={false} onFocus={() => { setIsFocused(true) }} onBlur={() => { setIsFocused(false) }} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
						</InputWithText>
						<InputWithText>
							<Input type="password" name="password2" label="Confirm password" useLabel={false} />
						</InputWithText>
					</div>
					{isFocused && <PasswordBar password={password} />}
					<button className="btn">Update password</button>
				</div>
			</div>

			<div className="divider text-neutral-content/40 m-0 mt-3 mb-1"></div>

			<div className="flex">
				<div>
					<h2>Two-factor authentification</h2>
					<p>A six-digit code from your authentificator app, asked after your password.</p>
				</div>
				<div className="flex-2/3">
					<div className="flex bg-info/15 border border-info/50 rounded-md">
						<div>
							<p>Authentificaor app  <span className="badge badge-sm badge-outline badge-info ml-1">ENABLED</span></p>
							<p>Added 12 June 2026 - last used today</p>
						</div>
						<div>
							<Input type="checkbox" name="checkbox" label="" useLabel={false} customStyle="toggle checkbox-sm checked:toggle-info checked:border-info" />
						</div>
					</div>
					<div className="flex">
						<button className="btn">Show recovery codes</button>
						<button className="btn">Re-scan QR code</button>
					</div>
					<p className="border border-warning/50 bg-warning/15 rounded-md"><MdWarning /> Disabling two-factor authentification requires your password and takes effect immediately.<br />Ranked tournament hosts may require it.</p>
				</div>
			</div>
		</div>
	</Sidebar>
}

function InputWithText({ text = "", children }: { text?: string, children: React.ReactNode }) {
	return <div>
		{text.length > 0 && <p className="tracking-brand text-xs">{text.toUpperCase()}</p>}
		{children}
	</div>
}