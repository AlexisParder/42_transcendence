import type React from "react";

export function Modal({ id, children }: { id: string, children: React.ReactNode }) {
	return <dialog id={id} className="modal">
		<div className="modal-box">
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