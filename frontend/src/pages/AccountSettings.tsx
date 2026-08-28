import type React from "react"
import { Input } from "../components/Input"
import { Sidebar } from "../components/Sidebar"
import { PasswordBar } from "../components/PasswordBar"
import { useState } from "react"
import { MdWarning } from "react-icons/md"

// type Errors = {
// 	username?: string
// 	email?: string
// 	password?: string
// 	password2?: string
// 	form?: string
// }

export function AccountSettings() {
	// const [errors, setErrors] = useState<Errors>({})
	const [isFocused, setIsFocused] = useState(false)
	const [password, setPassword] = useState('')

	return <Sidebar>
		<div className="p-4">
			<h1 className="text-xl font-bold">Settings</h1>
			<p className="text-sm text-neutral-content/40">Manage your identity, security, and how you appear to other palyers.</p>

			<div className="divider text-neutral-content/40 m-0 mt-3 mb-3"></div>

			<SectionSetting title="Profile" description="Your callsign and avatar are visible to every player." hasDividerBottom={true}>
				<div className="flex gap-2 items-center">
					<img src="https://placehold.co/64x64" alt="" className="rounded-md" />
					<button className="btn btn-outline border-neutral">Upload new</button>
					<button className="btn btn-outline border-neutral">Remove</button>
				</div>
				<div className="flex mt-2 items-center w-full gap-2">
					<InputWithText text="callsign">
						<Input type="text" name="username" label="Username" defaultValue="alexis" useLabel={false} />
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
						<Input type="email" name="email" label="Email" defaultValue="ft.sonar42@gmail.com" useLabel={false} />
					</InputWithText>
				</div>
			</SectionSetting>

			<SectionSetting title="Password" description="Changing it signs you ot of every other session." hasDividerBottom={true}>
				<div>
					<InputWithText>
						<Input type="password" name="currPwd" label="Current password" useLabel={false} />
					</InputWithText>
				</div>
				<div className="flex gap-2">
					<InputWithText>
						<Input type="password" name="password" label="new password" useLabel={false} onFocus={() => { setIsFocused(true) }} onBlur={() => { setIsFocused(false) }} onChange={e => setPassword(e.target.value)} />
					</InputWithText>
					<InputWithText>
						<Input type="password" name="password2" label="Confirm password" useLabel={false} />
					</InputWithText>
				</div>
				{isFocused && <PasswordBar password={password} />}
				<button className="btn btn-soft btn-info border-info/50 hover:border-info mt-2">Update password</button>
			</SectionSetting>

			<SectionSetting title="Two-factor authentification" description="A six-digit code from your authentificator app, asked after your password." hasDividerBottom={true}>
				<div className="flex bg-info/10 border border-info/50 rounded-md p-4 items-center">
					<div className="flex-1">
						<p className="text-sm pb-1">Authentificator app <span className="badge badge-xs badge-outline badge-info ml-1">ENABLED</span></p>
						<p className="text-xs text-neutral-content/60">Added 12 June 2026 - last used today</p>
					</div>
					<div>
						<Input type="checkbox" name="checkbox" label="" useLabel={false} customStyle="toggle checkbox-sm checked:toggle-info checked:border-info checked:bg-info checked:text-neutral" />
					</div>
				</div>
				<div className="flex gap-2 pt-3 pb-3">
					<button className="btn btn-outline border-neutral">Show recovery codes</button>
					<button className="btn btn-outline border-neutral">Re-scan QR code</button>
				</div>
				<p className="border border-warning/50 bg-warning/10 rounded-md p-4 flex items-center gap-4"><MdWarning className="text-warning" /> <span className="text-xs text-neutral-content/60">Disabling two-factor authentification requires your password and takes effect immediately.<br />Ranked tournament hosts may require it.</span></p>
			</SectionSetting>

			<SectionSetting title="Active sessions" description="Devices currently signed in to your account" hasDividerBottom={true}>
				<div className="max-h-37 overflow-y-auto scrollbar-thin">
					<div className="flex bg-info/10 border border-info/50 rounded-md p-4 items-center mr-2">
						<div className="flex-1">
							<p className="text-sm">Firefox - Linux</p>
							<p className="text-xs text-neutral-content/60">42 Angoulême - 10.11.4.2</p>
						</div>
						<div>
							<p className="text-info text-xs font-semibold">THIS DEVICE</p>
						</div>
					</div>
					<div className="flex border border-neutral rounded-md p-4 items-center mt-2 mr-2">
						<div className="flex-1/2">
							<p className="text-sm">Chrome - iPhone</p>
							<p className="text-xs text-neutral-content/60">Angoulême - 88.174.21.9</p>
						</div>
						<div className="flex-1/2">
							<p className="text-xs text-neutral-content/60">2 days ago</p>
						</div>
						<div>
							<button className="btn btn-outline border-neutral btn-sm">Revoke</button>
						</div>
					</div>
				</div>
				<a href="/revoke_all" className="link-error text-xs font-bold">Sign out everywhere else</a>
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

function SectionSetting({ title, titleColor = "", description, hasDividerBottom = false, children }: { title: string, titleColor?:string, description: string, hasDividerBottom?: boolean, children: React.ReactNode }) {
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