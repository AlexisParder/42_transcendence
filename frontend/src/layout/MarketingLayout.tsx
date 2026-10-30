import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function MarketingLayout() {
	return <div className="flex flex-col min-h-dvh">
		<Header />
		<main className='flex-1 flex flex-col'>
			<Outlet />
		</main>
		<Footer />
	</div>
}