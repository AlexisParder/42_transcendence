import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Terms } from './pages/Terms'
import { Privacy } from './pages/Privacy'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { AccountSettings } from './pages/accounts/AccountSettings'
import { Verified } from './pages/Verified'
import { Play } from './pages/play/Play'
import { Tournaments } from './pages/Tournaments'
import { Leaderboard } from './pages/Leaderboard'
import { Friends } from './pages/Friends'
import { TwoFactor } from './pages/TwoFactor'
import { Profile } from './pages/Profile'
import { Notifications } from './pages/Notifications'
import { SocketProvider } from './provider/SocketProvider'
import { Notification } from './components/Notification'
import { ForgotPwd } from './pages/ForgotPwd'

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
				path: 'forgot-password',
				element: <ForgotPwd />
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
	},
	{
		path: '/notifications',
		element: <Notifications />,
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

function Root() {
	return (
		<div className="flex flex-col min-h-dvh">
			<Header />
			<main className='flex-1 flex flex-col'>
				<Outlet />
			</main>
			<Footer />
		</div>
	)
}

function App() {
	return (
		<SocketProvider>
			<Notification />
			<RouterProvider router={router} />
		</SocketProvider>
	)
}

export default App
