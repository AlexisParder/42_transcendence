import { useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { FullscreenLoader } from "../components/FullscreenLoader";
import { authClient } from "../lib/auth-client";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function PublicLayout() {
	const { data: session, isPending } = authClient.useSession()
	// better-auth flips isPending back to true on every refetch (e.g. window focus) when
	// there is no session; only show the loader on the first load so children keep their state.
	const loaded = useRef(false)
	if (!isPending)
		loaded.current = true

	if (isPending && !loaded.current)
		return <FullscreenLoader />

	if (session)
		return <Navigate to="/play" replace />

	return <div className="flex flex-col min-h-dvh">
		<Header />
		<main className='flex-1 flex flex-col'>
			<Outlet />
		</main>
		<Footer />
	</div>
}