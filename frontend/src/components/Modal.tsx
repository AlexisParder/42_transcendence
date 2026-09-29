import type React from "react";
import { useState } from "react";

export function Modal({id, children, onClose}: {id: string, children: React.ReactNode, onClose?: () => void}) {
	const [resetKey, setResetKey] = useState(0)

	const handleClose = () => {
		setResetKey(k => k + 1)
		onClose?.()
	}
	return <dialog id={id} className="modal" onClose={handleClose}>
		<div key={resetKey} className="modal-box">
			{children}
		</div>
		<form method="dialog" className="modal-backdrop">
			<button>close</button>
		</form>
	</dialog>
}

export function ShowModal(id: string) {
	const modal = document.getElementById(id) as HTMLDialogElement | null

	if (modal)
		modal.showModal()
}

export function HideModal(id: string) {
	const modal = document.getElementById(id) as HTMLDialogElement | null

	if (modal)
		modal.close()
}
