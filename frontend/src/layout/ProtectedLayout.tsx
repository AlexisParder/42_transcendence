import { useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { FullscreenLoader } from "../components/FullscreenLoader";
import { authClient } from "../lib/auth-client";

export function ProtectedLayout() {
	const { data: session, isPending } = authClient.useSession()
	// better-auth flips isPending back to true on every refetch (e.g. window focus) when
	// there is no session; only show the loader on the first load so children keep their state.
	const loaded = useRef(false)
	if (!isPending)
		loaded.current = true

	if (isPending && !loaded.current)
		return <FullscreenLoader />

	if (!session)
		return <Navigate to="/login" replace />

	return <Outlet />
}