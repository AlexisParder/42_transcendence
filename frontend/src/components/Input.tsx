import type React from "react";

export function Input({ type, label, name, errorMsg, ...props }: { type: string, label: string, name: string, errorMsg?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
	return <div>
		<label className="floating-label mt-2">
			<span className="bg-base-200">{label}</span>
			<input type={type} name={name} placeholder={label} {...props} className={`input input-md outline-0 input-info ${errorMsg ? 'border-error' : 'border-neutral mb-2'} focus:border-info w-full bg-base-200`} />
		</label>
		{errorMsg && <span className="text-error block pb-2 pl-2">{errorMsg}</span>}
	</div>
}