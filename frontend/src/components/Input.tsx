import type React from "react";

export function Input({ type, label, name, errorMsg, useLabel = true, customStyle = "", ...props }: { type: string, label: string, name: string, errorMsg?: string, useLabel?: boolean, customStyle?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
	return <div>
		<label className="floating-label mt-2">
			{useLabel && <span className="bg-base-200">{label}</span>}
			<input type={type} name={name} placeholder={label} {...props} className={customStyle.length > 1 ? `${customStyle} ${errorMsg ? 'border-error' : 'border-neutral mb-2'}` : `input input-md outline-0 input-info ${errorMsg ? 'border-error' : 'border-neutral mb-2'} focus:border-info w-full bg-base-200`} />
		</label>
		{errorMsg && <span className="text-error block pb-2 pl-2">{errorMsg}</span>}
	</div>
}