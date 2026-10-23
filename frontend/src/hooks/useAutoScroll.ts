import { useEffect, useRef, type RefObject } from "react";

export function useAutoScroll(ref: RefObject<HTMLDivElement | null>, count: number, threshold = 40) {
	const isAtBottom = useRef(true)

	useEffect(() => {
		const el = ref.current
		if (!el)
			return

		const onScroll = () => {
			isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
		}

		el.addEventListener("scroll", onScroll)
		return () => {
			el.removeEventListener("scroll", onScroll)
		}
	}, [ref, threshold])

	useEffect(() => {
		const el = ref.current
		if (!el || !isAtBottom.current)
			return

		el.scrollTo({
			top: el.scrollHeight,
			behavior: "smooth"
		})
	}, [ref, count])
}