export function isString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0
}

export function isOptionalString(value: unknown): value is string | undefined {
	return value === undefined || isString(value)
}

export function isOptionalOffset(value: unknown): value is number | undefined {
	return value === undefined || (Number.isInteger(value) && (value as number) >= 0)
}
