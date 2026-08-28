import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { authClient } from './lib/auth-client'
import { Terms } from './pages/Terms'
import { Privacy } from './pages/Privacy'
import { OTP } from './pages/OTP'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { AccountSettings } from './pages/AccountSettings'

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
        path: 'otp',
        element: <OTP />
      }
    ]
  },
  {
    path: '/account_settings',
    element: <AccountSettings />,
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
