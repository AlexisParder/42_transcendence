import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { Terms } from './pages/legal/Terms'
import { Privacy } from './pages/legal/Privacy'
import { Home } from './pages/Home'
import { Settings } from './pages/settings/Settings'
import { Verified } from './pages/auth/Verified'
import { Play } from './pages/play/Play'
import { Leaderboard } from './pages/Leaderboard'
import { Friends } from './pages/Friends'
import { TwoFactor } from './pages/auth/TwoFactor'
import { Profile } from './pages/Profile'
import { Notifications } from './pages/Notifications'
import { SocketProvider } from './provider/SocketProvider'
import { Notification } from './components/Notification'
import { ForgotPwd } from './pages/auth/ForgotPwd'
import { Match } from './pages/match/Match'
import { ProtectedLayout } from './layout/ProtectedLayout'
import { PublicLayout } from './layout/PublicLayout'
import { MarketingLayout } from './layout/MarketingLayout'
import { t } from './lib/translate'

const router = createBrowserRouter([
	{
		path: '/',
		element: <Root />,
		errorElement: <PageError />,
		children: [
			{
				element: <ProtectedLayout />,
				children: [
					{
						path: '/settings',
						element: <Settings />,
						errorElement: <PageError />
					},
					{
						path: '/play',
						element: <Play />,
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
					},
					{
						path: '/match',
						element: <Match />,
						errorElement: <PageError />
					}
				]
			},
			{
				element: <PublicLayout />,
				children: [
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
				element: <MarketingLayout />,
				children: [
					{
						path: '',
						element: <Home />
					},
					{
						path: 'terms',
						element: <Terms />
					},
					{
						path: 'privacy',
						element: <Privacy />
					},
				]
			}
		]
	}
])

function PageError() {
	return <>
		<h1>{t("txt_error")}</h1>
	</>
}

function Root() {
	return <Outlet />
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