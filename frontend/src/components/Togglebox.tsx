import type React from "react";

export function Togglebox({name, type, ...props}: {name: string, type: "info" | "warning" | "error" | "neutral"} & React.InputHTMLAttributes<HTMLInputElement>) {
	return <input type="checkbox" name={name} className={`toggle toggle-${type}`} {...props} />
}