import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { authClient } from './lib/auth-client'
import { Terms } from './pages/Terms'
import { Privacy } from './pages/Privacy'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { AccountSettings } from './pages/AccountSettings'
import { Verified } from './pages/Verified'
import { Play } from './pages/Play'
import { Tournaments } from './pages/Tournaments'
import { Leaderboard } from './pages/Leaderboard'
import { Friends } from './pages/Friends'
import { TwoFactor } from './pages/TwoFactor'
import { Profile } from './pages/Profile'

const router = createBrowserRouter([
	{
		path: '/',
		element: <Root />,
		errorElement: <PageError />,
		children: [
			{
				path: '',
				element: <Home />
			},
			{
				path: 'register',
				element: <Register />
			},
			{
				path: 'login',
				element: <Login />
			},
			{
				path: 'terms',
				element: <Terms />
			},
			{
				path: 'privacy',
				element: <Privacy />
			},
			{
				path: 'two-factor',
				element: <TwoFactor />
			},
			{
				path: 'verified',
				element: <Verified />
			}
		]
	},
	{
		path: '/settings',
		element: <AccountSettings />,
		errorElement: <PageError />
	},
	{
		path: '/play',
		element: <Play />,
		errorElement: <PageError />
	},
	{
		path: '/tournaments',
		element: <Tournaments />,
		errorElement: <PageError />
	},
	{
		path: '/leaderboard',
		element: <Leaderboard />,
		errorElement: <PageError />
	},
	{
		path: '/friends',
		element: <Friends />,
		errorElement: <PageError />
	},
	{
		path: '/profile',
		element: <Profile />,
		errorElement: <PageError />
	}
])

function PageError() {
	// const error = useRouteError()

	return <>
		<h1>Error</h1>
		{/* <p>
      {error?.error?.toString() ?? error?.toString()}
    </p> */}
	</>
}

// Exemple pour la navbar
function Root() {
	const { data: session, isPending } = authClient.useSession()
	return (
		<div className="flex flex-col min-h-screen">
			<Header />
			<main className='flex-1 flex flex-col'>
				{isPending && <p>Chargement...</p>}
				{!isPending && session ? <p>Connecté en tant que {session.user.username}</p> : <p>Pas connecté</p>}
				<Outlet />
			</main>
			<Footer />
		</div>
	)
}

function App() {
	return <RouterProvider router={router} />
}

export default App
