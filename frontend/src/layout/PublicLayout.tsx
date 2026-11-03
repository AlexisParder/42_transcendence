import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { FullscreenLoader } from "../components/FullscreenLoader";
import { authClient } from "../lib/auth-client";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function PublicLayout() {
	const { data: session, isPending } = authClient.useSession()
	const [loaded, setLoaded] = useState(false)
	if (!isPending && !loaded)
		setLoaded(true)

	if (isPending && !loaded)
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