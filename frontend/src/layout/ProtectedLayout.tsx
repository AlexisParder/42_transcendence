import { Navigate, Outlet } from "react-router-dom";
import { FullscreenLoader } from "../components/FullscreenLoader";
import { authClient } from "../lib/auth-client";

export function ProtectedLayout() {
	const { data: session, isPending } = authClient.useSession()

	if (isPending)
		return <FullscreenLoader />

	if (!session)
		return <Navigate to="/login" replace />

	return <Outlet />
}