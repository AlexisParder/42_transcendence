import { useEffect } from "react"

export function useDocumentTitle (title: string) {
	useEffect(() => {
		return () => {
			document.title = "Sonar"
		}
	}, [])
	
	useEffect(() => {
		document.title = title ? `Sonar - ${title}` : "Sonar"
	}, [title])
}