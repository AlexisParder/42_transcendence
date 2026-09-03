import type React from "react";

export function Input({ type, label, name, errorMsg, useLabel = true, customStyle = "", customLabelStyle = "", ...props }: { type: string, label: string, name: string, errorMsg?: string, useLabel?: boolean, customStyle?: string, customLabelStyle?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
	return <div>
		<label className="floating-label mt-2">
			{useLabel && <span className={customLabelStyle.length > 0 ? `${customLabelStyle}` : "bg-base-200"}>{label}</span>}
			<input type={type} name={name} placeholder={label} {...props} className={customStyle.length > 0 ? `${customStyle} ${errorMsg ? 'border-error' : 'border-neutral mb-2'}` : `input input-md outline-0 input-info ${errorMsg ? 'border-error' : 'border-neutral mb-2'} focus:border-info w-full bg-base-200`} />
		</label>
		{errorMsg && <span className="text-error block pt-0.5 pb-2 pl-2 text-xs">{errorMsg}</span>}
	</div>
}